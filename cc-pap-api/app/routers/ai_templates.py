from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AIPolicyTemplate, User
from app.schemas import AIPolicyTemplateCreate, AIPolicyTemplateUpdate, AIPolicyTemplateResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/ai-templates", tags=["ai-templates"])

@router.get("/", response_model=List[AIPolicyTemplateResponse])
async def get_ai_templates(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    use_case: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get AI policy templates with optional filtering."""
    query = db.query(AIPolicyTemplate)
    
    if category:
        query = query.filter(AIPolicyTemplate.category == category)
    
    if subcategory:
        query = query.filter(AIPolicyTemplate.subcategory == subcategory)
    
    if use_case:
        query = query.filter(AIPolicyTemplate.use_case == use_case)
    
    templates = query.offset(skip).limit(limit).all()
    return templates

@router.get("/{template_id}", response_model=AIPolicyTemplateResponse)
async def get_ai_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific AI policy template by ID."""
    template = db.query(AIPolicyTemplate).filter(AIPolicyTemplate.id == template_id).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI Policy Template not found"
        )
    return template

@router.post("/", response_model=AIPolicyTemplateResponse)
async def create_ai_template(
    template_data: AIPolicyTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new AI policy template."""
    db_template = AIPolicyTemplate(
        name=template_data.name,
        description=template_data.description,
        category=template_data.category,
        subcategory=template_data.subcategory,
        use_case=template_data.use_case,
        template_content=template_data.template_content,
        injection_templates=template_data.injection_templates,
        context_rules=template_data.context_rules,
        variables=template_data.variables,
        created_by=current_user.username
    )
    
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    
    return db_template

@router.put("/{template_id}", response_model=AIPolicyTemplateResponse)
async def update_ai_template(
    template_id: int,
    template_data: AIPolicyTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing AI policy template."""
    template = db.query(AIPolicyTemplate).filter(AIPolicyTemplate.id == template_id).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI Policy Template not found"
        )
    
    # Update fields if provided
    update_data = template_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)
    
    db.commit()
    db.refresh(template)
    
    return template

@router.delete("/{template_id}")
async def delete_ai_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an AI policy template."""
    template = db.query(AIPolicyTemplate).filter(AIPolicyTemplate.id == template_id).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI Policy Template not found"
        )
    
    db.delete(template)
    db.commit()
    
    return {"message": "AI Policy Template deleted successfully"}

@router.get("/categories/", response_model=List[dict])
async def get_template_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get available template categories and subcategories."""
    categories = db.query(
        AIPolicyTemplate.category,
        AIPolicyTemplate.subcategory,
        AIPolicyTemplate.use_case
    ).distinct().all()
    
    category_dict = {}
    for cat, subcat, use_case in categories:
        if cat not in category_dict:
            category_dict[cat] = {"subcategories": [], "use_cases": []}
        
        if subcat and subcat not in category_dict[cat]["subcategories"]:
            category_dict[cat]["subcategories"].append(subcat)
        
        if use_case and use_case not in category_dict[cat]["use_cases"]:
            category_dict[cat]["use_cases"].append(use_case)
    
    return [
        {
            "category": cat,
            "subcategories": data["subcategories"],
            "use_cases": data["use_cases"]
        }
        for cat, data in category_dict.items()
    ]

@router.post("/{template_id}/instantiate")
async def instantiate_template(
    template_id: int,
    variables: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Instantiate an AI policy template with specific variables."""
    template = db.query(AIPolicyTemplate).filter(AIPolicyTemplate.id == template_id).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI Policy Template not found"
        )
    
    # Replace variables in template content
    instantiated_content = template.template_content
    for var_name, var_value in variables.items():
        instantiated_content = instantiated_content.replace(f"{{{var_name}}}", str(var_value))
    
    # Apply injection templates
    instantiated_injections = []
    for injection_template in template.injection_templates:
        instantiated_injection = injection_template.copy()
        for var_name, var_value in variables.items():
            if "content_template" in instantiated_injection:
                instantiated_injection["content_template"] = instantiated_injection["content_template"].replace(
                    f"{{{var_name}}}", str(var_value)
                )
        instantiated_injections.append(instantiated_injection)
    
    # Apply context rules
    instantiated_context_rules = []
    for context_rule in template.context_rules:
        instantiated_rule = context_rule.copy()
        for var_name, var_value in variables.items():
            if "conditions" in instantiated_rule:
                for condition_key, condition_value in instantiated_rule["conditions"].items():
                    if isinstance(condition_value, str):
                        instantiated_rule["conditions"][condition_key] = condition_value.replace(
                            f"{{{var_name}}}", str(var_value)
                        )
        instantiated_context_rules.append(instantiated_rule)
    
    return {
        "template_id": template_id,
        "template_name": template.name,
        "instantiated_content": instantiated_content,
        "instantiated_injections": instantiated_injections,
        "instantiated_context_rules": instantiated_context_rules,
        "variables_used": variables,
        "created_by": current_user.username
    }

@router.get("/{template_id}/preview")
async def preview_template(
    template_id: int,
    sample_variables: Optional[dict] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Preview how a template would look with sample variables."""
    template = db.query(AIPolicyTemplate).filter(AIPolicyTemplate.id == template_id).first()
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI Policy Template not found"
        )
    
    # Use sample variables or default ones
    if not sample_variables:
        sample_variables = {
            "user_role": "admin",
            "department": "finance",
            "sensitivity_level": "high",
            "compliance_requirement": "GDPR"
        }
    
    # Replace variables in template content
    preview_content = template.template_content
    for var_name, var_value in sample_variables.items():
        preview_content = preview_content.replace(f"{{{var_name}}}", str(var_value))
    
    return {
        "template_id": template_id,
        "template_name": template.name,
        "preview_content": preview_content,
        "sample_variables": sample_variables,
        "original_variables": template.variables
    }
