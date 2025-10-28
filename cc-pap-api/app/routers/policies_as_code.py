from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
import tempfile
import os
import subprocess
import json
from datetime import datetime

from app.database import get_db
from app.models import Policy, User, AuditLog
from app.schemas import PolicyCreate, PolicyUpdate, PolicyResponse, UserResponse, EventType, Outcome
from app.routers.auth import get_current_user

router = APIRouter(prefix="/policies-as-code", tags=["policies-as-code"])

# Pydantic models for policies-as-code
class PolicyValidationRequest(BaseModel):
    policy_content: str = Field(..., description="Rego policy content to validate")
    policy_name: Optional[str] = Field(None, description="Name of the policy for context")

class PolicyValidationResponse(BaseModel):
    is_valid: bool = Field(..., description="Whether the policy is valid")
    errors: List[str] = Field(default=[], description="List of validation errors")
    warnings: List[str] = Field(default=[], description="List of validation warnings")
    parsed_policy: Optional[Dict[str, Any]] = Field(None, description="Parsed policy structure")

class PolicyTestRequest(BaseModel):
    policy_content: str = Field(..., description="Rego policy content to test")
    test_cases: List[Dict[str, Any]] = Field(..., description="Test cases to run against the policy")
    policy_name: Optional[str] = Field(None, description="Name of the policy for context")

class PolicyTestResponse(BaseModel):
    passed: int = Field(..., description="Number of test cases that passed")
    failed: int = Field(..., description="Number of test cases that failed")
    total: int = Field(..., description="Total number of test cases")
    results: List[Dict[str, Any]] = Field(..., description="Detailed test results")

class PolicyDeployRequest(BaseModel):
    policy_content: str = Field(..., description="Rego policy content to deploy")
    policy_name: str = Field(..., description="Name of the policy")
    environment: str = Field("sandbox", description="Environment to deploy to (sandbox/production)")
    description: Optional[str] = Field(None, description="Deployment description")
    auto_promote: bool = Field(False, description="Whether to auto-promote to production")

class PolicyDeployResponse(BaseModel):
    deployment_id: str = Field(..., description="Unique deployment identifier")
    status: str = Field(..., description="Deployment status")
    policy_id: int = Field(..., description="Created/updated policy ID")
    environment: str = Field(..., description="Deployment environment")
    deployed_at: datetime = Field(..., description="Deployment timestamp")

class PolicyTemplate(BaseModel):
    name: str = Field(..., description="Template name")
    description: str = Field(..., description="Template description")
    category: str = Field(..., description="Template category")
    policy_content: str = Field(..., description="Template policy content")
    variables: List[Dict[str, str]] = Field(default=[], description="Template variables")

class PolicyImportRequest(BaseModel):
    source_type: str = Field(..., description="Import source type (git/url/file)")
    source_url: Optional[str] = Field(None, description="Source URL for git/url imports")
    file_content: Optional[str] = Field(None, description="File content for file imports")
    branch: Optional[str] = Field("main", description="Git branch to import from")
    path: Optional[str] = Field(None, description="Path to policy file in repository")

@router.post("/validate", response_model=PolicyValidationResponse)
async def validate_policy(
    request: PolicyValidationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Validate Rego policy syntax and structure.
    
    This endpoint validates Rego policy content for syntax errors, semantic issues,
    and provides detailed feedback for policy development.
    """
    try:
        # Create temporary file for policy validation
        with tempfile.NamedTemporaryFile(mode='w', suffix='.rego', delete=False) as f:
            f.write(request.policy_content)
            temp_file = f.name
        
        # Use OPA to validate the policy
        result = subprocess.run([
            'opa', 'check', temp_file
        ], capture_output=True, text=True, timeout=30)
        
        # Clean up temporary file
        os.unlink(temp_file)
        
        is_valid = result.returncode == 0
        errors = []
        warnings = []
        
        if not is_valid:
            errors = result.stderr.split('\n') if result.stderr else []
        
        # Try to parse policy structure (basic parsing)
        parsed_policy = None
        try:
            # Extract basic policy information
            lines = request.policy_content.split('\n')
            package_name = None
            rules = []
            
            for line in lines:
                line = line.strip()
                if line.startswith('package '):
                    package_name = line.replace('package ', '').strip()
                elif line.startswith(('allow', 'deny', 'violation')):
                    rules.append(line)
            
            parsed_policy = {
                'package': package_name,
                'rules': rules,
                'line_count': len(lines)
            }
        except Exception:
            pass
        
        # Log validation attempt
        audit_log = AuditLog(
            user_id=current_user.id,
            event_type=EventType.POLICY_VALIDATION,
            resource_type="policy",
            resource_id=None,
            outcome=Outcome.SUCCESS if is_valid else Outcome.FAILURE,
            details={
                "policy_name": request.policy_name,
                "is_valid": is_valid,
                "error_count": len(errors)
            }
        )
        db.add(audit_log)
        db.commit()
        
        return PolicyValidationResponse(
            is_valid=is_valid,
            errors=errors,
            warnings=warnings,
            parsed_policy=parsed_policy
        )
        
    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=status.HTTP_408_REQUEST_TIMEOUT,
            detail="Policy validation timed out"
        )
    except Exception as e:
        # Log validation error
        audit_log = AuditLog(
            user_id=current_user.id,
            event_type=EventType.POLICY_VALIDATION,
            resource_type="policy",
            resource_id=None,
            outcome=Outcome.FAILURE,
            details={"error": str(e)}
        )
        db.add(audit_log)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Policy validation failed: {str(e)}"
        )

@router.post("/test", response_model=PolicyTestResponse)
async def test_policy(
    request: PolicyTestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Test Rego policy with provided test cases.
    
    This endpoint runs test cases against a Rego policy to verify its behavior
    and ensure it produces expected results.
    """
    try:
        # Create temporary files for policy and test data
        with tempfile.NamedTemporaryFile(mode='w', suffix='.rego', delete=False) as f:
            f.write(request.policy_content)
            policy_file = f.name
        
        test_results = []
        passed = 0
        failed = 0
        
        for i, test_case in enumerate(request.test_cases):
            try:
                # Create temporary test data file
                with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                    json.dump(test_case.get('input', {}), f)
                    input_file = f.name
                
                # Run OPA test
                result = subprocess.run([
                    'opa', 'eval',
                    '--data', input_file,
                    '--format', 'json',
                    f'data.{test_case.get("rule", "allow")}'
                ], capture_output=True, text=True, timeout=10)
                
                # Parse result
                if result.returncode == 0:
                    try:
                        opa_result = json.loads(result.stdout)
                        actual_result = opa_result.get('result', [])
                        
                        # Compare with expected result
                        expected_result = test_case.get('expected', True)
                        test_passed = actual_result == expected_result
                        
                        test_results.append({
                            'test_case': i + 1,
                            'passed': test_passed,
                            'expected': expected_result,
                            'actual': actual_result,
                            'input': test_case.get('input', {})
                        })
                        
                        if test_passed:
                            passed += 1
                        else:
                            failed += 1
                            
                    except json.JSONDecodeError:
                        test_results.append({
                            'test_case': i + 1,
                            'passed': False,
                            'expected': test_case.get('expected'),
                            'actual': 'Parse error',
                            'input': test_case.get('input', {}),
                            'error': 'Failed to parse OPA result'
                        })
                        failed += 1
                else:
                    test_results.append({
                        'test_case': i + 1,
                        'passed': False,
                        'expected': test_case.get('expected'),
                        'actual': 'Error',
                        'input': test_case.get('input', {}),
                        'error': result.stderr
                    })
                    failed += 1
                
                # Clean up input file
                os.unlink(input_file)
                
            except Exception as e:
                test_results.append({
                    'test_case': i + 1,
                    'passed': False,
                    'expected': test_case.get('expected'),
                    'actual': 'Error',
                    'input': test_case.get('input', {}),
                    'error': str(e)
                })
                failed += 1
        
        # Clean up policy file
        os.unlink(policy_file)
        
        # Log test execution
        audit_log = AuditLog(
            user_id=current_user.id,
            event_type=EventType.POLICY_TESTING,
            resource_type="policy",
            resource_id=None,
            outcome=Outcome.SUCCESS if failed == 0 else Outcome.FAILURE,
            details={
                "policy_name": request.policy_name,
                "total_tests": len(request.test_cases),
                "passed": passed,
                "failed": failed
            }
        )
        db.add(audit_log)
        db.commit()
        
        return PolicyTestResponse(
            passed=passed,
            failed=failed,
            total=len(request.test_cases),
            results=test_results
        )
        
    except Exception as e:
        # Log test error
        audit_log = AuditLog(
            user_id=current_user.id,
            event_type=EventType.POLICY_TESTING,
            resource_type="policy",
            resource_id=None,
            outcome=Outcome.FAILURE,
            details={"error": str(e)}
        )
        db.add(audit_log)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Policy testing failed: {str(e)}"
        )

@router.post("/deploy", response_model=PolicyDeployResponse)
async def deploy_policy(
    request: PolicyDeployRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deploy Rego policy to specified environment.
    
    This endpoint deploys a validated policy to the specified environment,
    with optional auto-promotion to production.
    """
    try:
        # First validate the policy
        validation_request = PolicyValidationRequest(
            policy_content=request.policy_content,
            policy_name=request.policy_name
        )
        
        # Validate policy (reuse validation logic)
        with tempfile.NamedTemporaryFile(mode='w', suffix='.rego', delete=False) as f:
            f.write(request.policy_content)
            temp_file = f.name
        
        validation_result = subprocess.run([
            'opa', 'check', temp_file
        ], capture_output=True, text=True, timeout=30)
        
        os.unlink(temp_file)
        
        if validation_result.returncode != 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Policy validation failed: {validation_result.stderr}"
            )
        
        # Create or update policy in database
        existing_policy = db.query(Policy).filter(
            Policy.name == request.policy_name,
            Policy.user_id == current_user.id
        ).first()
        
        if existing_policy:
            # Update existing policy
            existing_policy.content = request.policy_content
            existing_policy.description = request.description or existing_policy.description
            existing_policy.updated_at = datetime.utcnow()
            
            if request.environment == "sandbox":
                existing_policy.sandbox_status = "active"
            elif request.environment == "production":
                existing_policy.production_status = "active"
            
            policy = existing_policy
        else:
            # Create new policy
            policy = Policy(
                name=request.policy_name,
                content=request.policy_content,
                description=request.description or "",
                user_id=current_user.id,
                status="active",
                sandbox_status="active" if request.environment == "sandbox" else "not-promoted",
                production_status="active" if request.environment == "production" else "not-promoted"
            )
            db.add(policy)
        
        db.commit()
        db.refresh(policy)
        
        # Generate deployment ID
        deployment_id = f"deploy_{policy.id}_{int(datetime.utcnow().timestamp())}"
        
        # Schedule background deployment to OPA
        background_tasks.add_task(
            deploy_to_opa,
            policy.id,
            request.policy_content,
            request.environment,
            deployment_id
        )
        
        # Log deployment
        audit_log = AuditLog(
            user_id=current_user.id,
            event_type=EventType.POLICY_DEPLOYMENT,
            resource_type="policy",
            resource_id=policy.id,
            outcome=Outcome.SUCCESS,
            details={
                "policy_name": request.policy_name,
                "environment": request.environment,
                "deployment_id": deployment_id,
                "auto_promote": request.auto_promote
            }
        )
        db.add(audit_log)
        db.commit()
        
        return PolicyDeployResponse(
            deployment_id=deployment_id,
            status="deploying",
            policy_id=policy.id,
            environment=request.environment,
            deployed_at=datetime.utcnow()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        # Log deployment error
        audit_log = AuditLog(
            user_id=current_user.id,
            event_type=EventType.POLICY_DEPLOYMENT,
            resource_type="policy",
            resource_id=None,
            outcome=Outcome.FAILURE,
            details={"error": str(e)}
        )
        db.add(audit_log)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Policy deployment failed: {str(e)}"
        )

@router.get("/templates", response_model=List[PolicyTemplate])
async def get_policy_templates(
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Get available policy templates.
    
    Returns a list of pre-built policy templates that can be used
    as starting points for policy development.
    """
    templates = [
        PolicyTemplate(
            name="Basic Allow Policy",
            description="Simple policy that allows access based on user role",
            category="access-control",
            policy_content="""package access_control

import rego.v1

# Allow access if user has required role
allow if {
    input.user.roles[_] == "admin"
}

# Allow access if user has specific permission
allow if {
    input.user.permissions[_] == input.required_permission
}""",
            variables=[
                {"name": "required_permission", "description": "Permission required for access", "type": "string"},
                {"name": "user_role", "description": "User role required", "type": "string"}
            ]
        ),
        PolicyTemplate(
            name="Time-based Access",
            description="Policy that enforces time-based access restrictions",
            category="access-control",
            policy_content="""package time_access

import rego.v1
import future.keywords.contains
import future.keywords.if

# Allow access only during business hours
allow if {
    time.now_ns() >= time.parse_rfc3339_ns("2023-01-01T09:00:00Z")
    time.now_ns() <= time.parse_rfc3339_ns("2023-01-01T17:00:00Z")
}

# Allow access on specific days
allow if {
    time.weekday(time.now_ns()) in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
}""",
            variables=[
                {"name": "start_time", "description": "Start time for access (HH:MM)", "type": "string"},
                {"name": "end_time", "description": "End time for access (HH:MM)", "type": "string"},
                {"name": "allowed_days", "description": "Allowed days of week", "type": "array"}
            ]
        ),
        PolicyTemplate(
            name="Resource-based Policy",
            description="Policy that controls access based on resource attributes",
            category="resource-control",
            policy_content="""package resource_access

import rego.v1
import future.keywords.contains

# Allow access to public resources
allow if {
    input.resource.public == true
}

# Allow access to own resources
allow if {
    input.resource.owner == input.user.id
}

# Allow access based on resource tags
allow if {
    input.resource.tags[_] in input.user.allowed_tags
}""",
            variables=[
                {"name": "public_resources", "description": "List of public resource types", "type": "array"},
                {"name": "allowed_tags", "description": "Tags user is allowed to access", "type": "array"}
            ]
        ),
        PolicyTemplate(
            name="AI Content Filter",
            description="Policy for filtering AI-generated content",
            category="ai-safety",
            policy_content="""package ai_content_filter

import rego.v1
import future.keywords.contains

# Block content with sensitive information
violation[msg] if {
    input.content contains "PII"
    msg := "Content contains personally identifiable information"
}

# Block content with inappropriate language
violation[msg] if {
    input.content contains "inappropriate"
    msg := "Content contains inappropriate language"
}

# Allow content that passes all checks
allow if {
    not violation
}""",
            variables=[
                {"name": "sensitive_keywords", "description": "Keywords to block", "type": "array"},
                {"name": "max_content_length", "description": "Maximum allowed content length", "type": "integer"}
            ]
        )
    ]
    
    if category:
        templates = [t for t in templates if t.category == category]
    
    return templates

@router.post("/import")
async def import_policy(
    request: PolicyImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Import policy from external source.
    
    Supports importing policies from Git repositories, URLs, or file uploads.
    """
    try:
        policy_content = None
        
        if request.source_type == "git":
            # Import from Git repository
            if not request.source_url:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Source URL is required for Git import"
                )
            
            # Clone repository and extract policy
            with tempfile.TemporaryDirectory() as temp_dir:
                clone_result = subprocess.run([
                    'git', 'clone', '--branch', request.branch,
                    '--depth', '1', request.source_url, temp_dir
                ], capture_output=True, text=True, timeout=60)
                
                if clone_result.returncode != 0:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Failed to clone repository: {clone_result.stderr}"
                    )
                
                # Read policy file
                policy_path = os.path.join(temp_dir, request.path or "policy.rego")
                if os.path.exists(policy_path):
                    with open(policy_path, 'r') as f:
                        policy_content = f.read()
                else:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Policy file not found: {request.path}"
                    )
        
        elif request.source_type == "url":
            # Import from URL
            import requests
            
            if not request.source_url:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Source URL is required for URL import"
                )
            
            response = requests.get(request.source_url, timeout=30)
            response.raise_for_status()
            policy_content = response.text
        
        elif request.source_type == "file":
            # Import from file content
            if not request.file_content:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File content is required for file import"
                )
            policy_content = request.file_content
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid source type. Must be 'git', 'url', or 'file'"
            )
        
        # Validate imported policy
        validation_request = PolicyValidationRequest(
            policy_content=policy_content,
            policy_name="imported_policy"
        )
        
        # Reuse validation logic
        with tempfile.NamedTemporaryFile(mode='w', suffix='.rego', delete=False) as f:
            f.write(policy_content)
            temp_file = f.name
        
        validation_result = subprocess.run([
            'opa', 'check', temp_file
        ], capture_output=True, text=True, timeout=30)
        
        os.unlink(temp_file)
        
        if validation_result.returncode != 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Imported policy validation failed: {validation_result.stderr}"
            )
        
        # Log import
        audit_log = AuditLog(
            user_id=current_user.id,
            event_type=EventType.POLICY_IMPORT,
            resource_type="policy",
            resource_id=None,
            outcome=Outcome.SUCCESS,
            details={
                "source_type": request.source_type,
                "source_url": request.source_url,
                "policy_size": len(policy_content)
            }
        )
        db.add(audit_log)
        db.commit()
        
        return {
            "success": True,
            "policy_content": policy_content,
            "message": "Policy imported successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        # Log import error
        audit_log = AuditLog(
            user_id=current_user.id,
            event_type=EventType.POLICY_IMPORT,
            resource_type="policy",
            resource_id=None,
            outcome=Outcome.FAILURE,
            details={"error": str(e)}
        )
        db.add(audit_log)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Policy import failed: {str(e)}"
        )

# Background task for OPA deployment
async def deploy_to_opa(policy_id: int, policy_content: str, environment: str, deployment_id: str):
    """
    Background task to deploy policy to OPA.
    
    This function runs in the background to deploy the policy to the OPA instance.
    """
    try:
        # Here you would implement the actual OPA deployment logic
        # For now, we'll simulate the deployment
        
        # Create temporary policy file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.rego', delete=False) as f:
            f.write(policy_content)
            temp_file = f.name
        
        # Deploy to OPA (this would be your actual OPA deployment logic)
        # For example, using OPA's REST API or file system deployment
        
        # Clean up
        os.unlink(temp_file)
        
        # Log successful deployment
        print(f"Policy {policy_id} deployed successfully to {environment}")
        
    except Exception as e:
        # Log deployment failure
        print(f"Failed to deploy policy {policy_id}: {str(e)}")
        # You might want to update the policy status in the database here
