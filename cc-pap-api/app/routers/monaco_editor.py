from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.routers.auth import get_current_user
from app.services.monaco_editor import monaco_service
from pydantic import BaseModel

router = APIRouter(prefix="/monaco", tags=["monaco-editor"])

class CodeValidationRequest(BaseModel):
    code: str

class CodeFormatRequest(BaseModel):
    code: str

class CodeCompletionRequest(BaseModel):
    code: str
    position: int

@router.get("/rego/language-config")
async def get_rego_language_config(
    current_user: User = Depends(get_current_user)
):
    """Get Monaco Editor language configuration for Rego."""
    return monaco_service.get_rego_language_config()

@router.get("/rego/completions")
async def get_rego_completions(
    current_user: User = Depends(get_current_user)
):
    """Get Rego code completions."""
    return monaco_service.get_rego_completions("")

@router.post("/rego/validate")
async def validate_rego_code(
    validation_request: CodeValidationRequest,
    current_user: User = Depends(get_current_user)
):
    """Validate Rego code syntax."""
    errors = monaco_service.validate_rego_syntax(validation_request.code)
    return {
        "errors": [e for e in errors if e["severity"] == "error"],
        "warnings": [w for w in errors if w["severity"] == "warning"]
    }

@router.post("/rego/format")
async def format_rego_code(
    format_request: CodeFormatRequest,
    current_user: User = Depends(get_current_user)
):
    """Format Rego code for better readability."""
    formatted_code = monaco_service.format_rego_code(format_request.code)
    return {
        "formatted_code": formatted_code,
        "original_code": format_request.code
    }

@router.get("/rego/snippets")
async def get_rego_snippets(
    current_user: User = Depends(get_current_user)
):
    """Get Rego code snippets for common patterns."""
    return monaco_service.get_rego_snippets()

@router.get("/rego/keywords")
async def get_rego_keywords(
    current_user: User = Depends(get_current_user)
):
    """Get Rego keywords for autocomplete."""
    return {
        "keywords": monaco_service.rego_keywords,
        "functions": monaco_service.rego_functions,
        "operators": monaco_service.rego_operators
    }
