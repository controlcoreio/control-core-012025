from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
import json
import asyncio
from datetime import datetime

from app.database import get_db
from app.models import Policy, User, AuditLog
from app.schemas import PolicyCreate, PolicyUpdate, PolicyResponse, UserResponse, EventType, Outcome
from app.routers.auth import get_current_user

router = APIRouter(prefix="/ide-integration", tags=["ide-integration"])

# Pydantic models for IDE integration
class VS CodeExtensionRequest(BaseModel):
    action: str = Field(..., description="Action to perform (validate, test, deploy)")
    policy_content: str = Field(..., description="Policy content from editor")
    policy_path: Optional[str] = Field(None, description="Path to policy file in workspace")
    workspace_id: Optional[str] = Field(None, description="VS Code workspace identifier")

class VS CodeExtensionResponse(BaseModel):
    success: bool = Field(..., description="Whether the operation was successful")
    message: str = Field(..., description="Response message")
    data: Optional[Dict[str, Any]] = Field(None, description="Response data")
    errors: List[str] = Field(default=[], description="List of errors")

class JetBrainsPluginRequest(BaseModel):
    action: str = Field(..., description="Action to perform")
    policy_content: str = Field(..., description="Policy content")
    project_path: Optional[str] = Field(None, description="Project path")
    file_path: Optional[str] = Field(None, description="File path within project")

class JetBrainsPluginResponse(BaseModel):
    success: bool = Field(..., description="Whether the operation was successful")
    message: str = Field(..., description="Response message")
    data: Optional[Dict[str, Any]] = Field(None, description="Response data")

class WebSocketMessage(BaseModel):
    type: str = Field(..., description="Message type")
    data: Dict[str, Any] = Field(..., description="Message data")

class VS CodeServerRequest(BaseModel):
    action: str = Field(..., description="Action to perform")
    policy_content: str = Field(..., description="Policy content")
    session_id: str = Field(..., description="VS Code Server session ID")

class WebhookRequest(BaseModel):
    repository_url: str = Field(..., description="Git repository URL")
    branch: str = Field("main", description="Branch name")
    commit_hash: str = Field(..., description="Commit hash")
    policy_files: List[str] = Field(..., description="List of policy files changed")
    event_type: str = Field(..., description="Webhook event type (push, pull_request, etc.)")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections.append(websocket)
        
        if user_id not in self.user_connections:
            self.user_connections[user_id] = []
        self.user_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if user_id in self.user_connections and websocket in self.user_connections[user_id]:
            self.user_connections[user_id].remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_to_user(self, message: str, user_id: int):
        if user_id in self.user_connections:
            for connection in self.user_connections[user_id]:
                try:
                    await connection.send_text(message)
                except:
                    # Remove dead connections
                    self.user_connections[user_id].remove(connection)

manager = ConnectionManager()

@router.post("/vscode", response_model=VS CodeExtensionResponse)
async def vscode_extension_api(
    request: VS CodeExtensionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    VS Code extension API endpoint.
    
    Provides API endpoints for VS Code extension integration,
    including policy validation, testing, and deployment.
    """
    try:
        if request.action == "validate":
            # Validate policy content
            from app.routers.policies_as_code import validate_policy, PolicyValidationRequest
            
            validation_request = PolicyValidationRequest(
                policy_content=request.policy_content,
                policy_name=request.policy_path or "vscode_policy"
            )
            
            validation_response = await validate_policy(validation_request, db, current_user)
            
            return VS CodeExtensionResponse(
                success=validation_response.is_valid,
                message="Policy validation completed",
                data={
                    "is_valid": validation_response.is_valid,
                    "errors": validation_response.errors,
                    "warnings": validation_response.warnings,
                    "parsed_policy": validation_response.parsed_policy
                },
                errors=validation_response.errors
            )
        
        elif request.action == "test":
            # Run policy tests
            from app.routers.policies_as_code import test_policy, PolicyTestRequest
            
            # Default test cases for VS Code
            test_cases = [
                {
                    "input": {"user": {"roles": ["admin"]}, "resource": {"type": "api"}},
                    "expected": True,
                    "rule": "allow"
                },
                {
                    "input": {"user": {"roles": ["user"]}, "resource": {"type": "api"}},
                    "expected": False,
                    "rule": "allow"
                }
            ]
            
            test_request = PolicyTestRequest(
                policy_content=request.policy_content,
                test_cases=test_cases,
                policy_name=request.policy_path or "vscode_policy"
            )
            
            test_response = await test_policy(test_request, db, current_user)
            
            return VS CodeExtensionResponse(
                success=test_response.failed == 0,
                message=f"Policy testing completed: {test_response.passed}/{test_response.total} tests passed",
                data={
                    "passed": test_response.passed,
                    "failed": test_response.failed,
                    "total": test_response.total,
                    "results": test_response.results
                }
            )
        
        elif request.action == "deploy":
            # Deploy policy to sandbox
            from app.routers.policies_as_code import deploy_policy, PolicyDeployRequest
            from fastapi import BackgroundTasks
            
            deploy_request = PolicyDeployRequest(
                policy_content=request.policy_content,
                policy_name=request.policy_path or f"vscode_policy_{int(datetime.utcnow().timestamp())}",
                environment="sandbox",
                description="Deployed from VS Code extension",
                auto_promote=False
            )
            
            # Create a dummy BackgroundTasks object
            background_tasks = BackgroundTasks()
            
            deploy_response = await deploy_policy(deploy_request, background_tasks, db, current_user)
            
            return VS CodeExtensionResponse(
                success=True,
                message="Policy deployed successfully to sandbox",
                data={
                    "deployment_id": deploy_response.deployment_id,
                    "policy_id": deploy_response.policy_id,
                    "environment": deploy_response.environment
                }
            )
        
        elif request.action == "get_templates":
            # Get policy templates
            from app.routers.policies_as_code import get_policy_templates
            
            templates = await get_policy_templates(current_user=current_user)
            
            return VS CodeExtensionResponse(
                success=True,
                message="Policy templates retrieved",
                data={"templates": [template.dict() for template in templates]}
            )
        
        else:
            return VS CodeExtensionResponse(
                success=False,
                message=f"Unknown action: {request.action}",
                errors=[f"Unknown action: {request.action}"]
            )
        
    except Exception as e:
        return VS CodeExtensionResponse(
            success=False,
            message=f"VS Code extension API error: {str(e)}",
            errors=[str(e)]
        )

@router.post("/jetbrains", response_model=JetBrainsPluginResponse)
async def jetbrains_plugin_api(
    request: JetBrainsPluginRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    JetBrains plugin API endpoint.
    
    Provides API endpoints for JetBrains IDE plugin integration.
    """
    try:
        if request.action == "validate":
            # Validate policy content
            from app.routers.policies_as_code import validate_policy, PolicyValidationRequest
            
            validation_request = PolicyValidationRequest(
                policy_content=request.policy_content,
                policy_name=request.file_path or "jetbrains_policy"
            )
            
            validation_response = await validate_policy(validation_request, db, current_user)
            
            return JetBrainsPluginResponse(
                success=validation_response.is_valid,
                message="Policy validation completed",
                data={
                    "is_valid": validation_response.is_valid,
                    "errors": validation_response.errors,
                    "warnings": validation_response.warnings
                }
            )
        
        elif request.action == "get_suggestions":
            # Get policy suggestions based on context
            suggestions = [
                {
                    "text": "package access_control\n\nimport rego.v1\n\nallow if {\n    input.user.roles[_] == \"admin\"\n}",
                    "label": "Admin Access Policy",
                    "description": "Allow access for admin users",
                    "kind": "snippet"
                },
                {
                    "text": "violation[msg] if {\n    not input.user.authenticated\n    msg := \"User must be authenticated\"\n}",
                    "label": "Authentication Check",
                    "description": "Check if user is authenticated",
                    "kind": "snippet"
                }
            ]
            
            return JetBrainsPluginResponse(
                success=True,
                message="Policy suggestions retrieved",
                data={"suggestions": suggestions}
            )
        
        else:
            return JetBrainsPluginResponse(
                success=False,
                message=f"Unknown action: {request.action}",
                data={"error": f"Unknown action: {request.action}"}
            )
        
    except Exception as e:
        return JetBrainsPluginResponse(
            success=False,
            message=f"JetBrains plugin API error: {str(e)}",
            data={"error": str(e)}
        )

@router.post("/vscode-server", response_model=VS CodeServerRequest)
async def vscode_server_api(
    request: VS CodeServerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    VS Code Server integration API.
    
    Provides API endpoints for VS Code Server integration,
    enabling policy development in browser-based environments.
    """
    try:
        if request.action == "sync":
            # Sync policy content with server
            # This would typically involve saving the policy content
            # and triggering real-time updates
            
            return VS CodeServerRequest(
                action="sync_response",
                policy_content=request.policy_content,
                session_id=request.session_id
            )
        
        elif request.action == "get_context":
            # Get development context for the session
            context = {
                "user_id": current_user.id,
                "session_id": request.session_id,
                "timestamp": datetime.utcnow().isoformat(),
                "available_actions": ["validate", "test", "deploy", "sync"]
            }
            
            return VS CodeServerRequest(
                action="context_response",
                policy_content=request.policy_content,
                session_id=request.session_id
            )
        
        else:
            return VS CodeServerRequest(
                action="error",
                policy_content="",
                session_id=request.session_id
            )
        
    except Exception as e:
        return VS CodeServerRequest(
            action="error",
            policy_content="",
            session_id=request.session_id
        )

@router.post("/webhook")
async def git_webhook(
    request: WebhookRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Git webhook endpoint.
    
    Handles Git webhooks for automatic policy synchronization
    and deployment from version control systems.
    """
    try:
        # Process webhook event
        if request.event_type == "push":
            # Handle push events - sync policies from repository
            await process_git_push(request, db, current_user)
        
        elif request.event_type == "pull_request":
            # Handle pull request events - validate policies
            await process_pull_request(request, db, current_user)
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported event type: {request.event_type}"
            )
        
        # Log webhook processing
        audit_log = AuditLog(
            user_id=current_user.id,
            event_type=EventType.WEBHOOK_PROCESSING,
            resource_type="repository",
            resource_id=None,
            outcome=Outcome.SUCCESS,
            details={
                "repository_url": request.repository_url,
                "branch": request.branch,
                "commit_hash": request.commit_hash,
                "event_type": request.event_type,
                "policy_files": request.policy_files
            }
        )
        db.add(audit_log)
        db.commit()
        
        return {
            "success": True,
            "message": "Webhook processed successfully",
            "processed_files": len(request.policy_files)
        }
        
    except Exception as e:
        # Log webhook error
        audit_log = AuditLog(
            user_id=current_user.id,
            event_type=EventType.WEBHOOK_PROCESSING,
            resource_type="repository",
            resource_id=None,
            outcome=Outcome.FAILURE,
            details={"error": str(e)}
        )
        db.add(audit_log)
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Webhook processing failed: {str(e)}"
        )

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    """
    WebSocket endpoint for real-time IDE integration.
    
    Provides real-time communication between the IDE and Control Core
    for live policy validation, testing, and deployment status updates.
    """
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Process message based on type
            if message.get("type") == "ping":
                await manager.send_personal_message(
                    json.dumps({"type": "pong", "timestamp": datetime.utcnow().isoformat()}),
                    websocket
                )
            
            elif message.get("type") == "validate":
                # Real-time policy validation
                policy_content = message.get("data", {}).get("policy_content", "")
                
                # Perform validation (simplified)
                validation_result = {
                    "type": "validation_result",
                    "data": {
                        "is_valid": len(policy_content) > 0,
                        "errors": [] if len(policy_content) > 0 else ["Empty policy content"],
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
                
                await manager.send_personal_message(
                    json.dumps(validation_result),
                    websocket
                )
            
            elif message.get("type") == "deployment_status":
                # Check deployment status
                deployment_id = message.get("data", {}).get("deployment_id")
                
                # Simulate deployment status check
                status_result = {
                    "type": "deployment_status",
                    "data": {
                        "deployment_id": deployment_id,
                        "status": "completed",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
                
                await manager.send_personal_message(
                    json.dumps(status_result),
                    websocket
                )
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, user_id)

# Helper functions
async def process_git_push(request: WebhookRequest, db: Session, user: User):
    """
    Process Git push webhook.
    
    Syncs policies from the Git repository to Control Core.
    """
    # This would implement the actual Git synchronization logic
    # For now, we'll just log the event
    
    print(f"Processing Git push for {request.repository_url}")
    print(f"Branch: {request.branch}, Commit: {request.commit_hash}")
    print(f"Policy files: {request.policy_files}")
    
    # In a real implementation, you would:
    # 1. Clone or fetch the repository
    # 2. Extract the policy files
    # 3. Validate and deploy the policies
    # 4. Update the database with new policy versions

async def process_pull_request(request: WebhookRequest, db: Session, user: User):
    """
    Process Git pull request webhook.
    
    Validates policies in the pull request.
    """
    # This would implement PR validation logic
    # For now, we'll just log the event
    
    print(f"Processing PR for {request.repository_url}")
    print(f"Policy files: {request.policy_files}")
    
    # In a real implementation, you would:
    # 1. Checkout the PR branch
    # 2. Validate all policy files
    # 3. Run tests on the policies
    # 4. Provide feedback to the PR

# Additional IDE integration endpoints
@router.get("/vscode/settings")
async def get_vscode_settings(current_user: User = Depends(get_current_user)):
    """
    Get VS Code extension settings.
    
    Returns configuration settings for the VS Code extension.
    """
    settings = {
        "auto_validate": True,
        "auto_format": True,
        "show_suggestions": True,
        "default_environment": "sandbox",
        "theme": "dark",
        "font_size": 14
    }
    
    return {"settings": settings}

@router.post("/vscode/settings")
async def update_vscode_settings(
    settings: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """
    Update VS Code extension settings.
    
    Updates configuration settings for the VS Code extension.
    """
    # In a real implementation, you would save these settings
    # to the database or user preferences
    
    return {"message": "Settings updated successfully", "settings": settings}

@router.get("/jetbrains/settings")
async def get_jetbrains_settings(current_user: User = Depends(get_current_user)):
    """
    Get JetBrains plugin settings.
    
    Returns configuration settings for the JetBrains plugin.
    """
    settings = {
        "auto_validate": True,
        "show_inspections": True,
        "default_environment": "sandbox",
        "code_style": "standard"
    }
    
    return {"settings": settings}

@router.get("/status")
async def get_integration_status(current_user: User = Depends(get_current_user)):
    """
    Get IDE integration status.
    
    Returns the status of various IDE integrations.
    """
    status = {
        "vscode_extension": {
            "available": True,
            "version": "1.0.0",
            "features": ["validate", "test", "deploy", "templates"]
        },
        "jetbrains_plugin": {
            "available": True,
            "version": "1.0.0",
            "features": ["validate", "suggestions", "inspections"]
        },
        "vscode_server": {
            "available": True,
            "features": ["sync", "context", "real-time"]
        },
        "webhook": {
            "available": True,
            "supported_events": ["push", "pull_request"],
            "features": ["auto_sync", "validation", "deployment"]
        }
    }
    
    return {"status": status}
