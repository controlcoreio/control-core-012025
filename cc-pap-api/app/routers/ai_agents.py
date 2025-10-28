from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AIAgent, User, ContentInjection, ContextRule, RAGSystem
from app.schemas import (
    AIAgentCreate, AIAgentUpdate, AIAgentResponse,
    ContentInjectionCreate, ContentInjectionUpdate, ContentInjectionResponse,
    ContextRuleCreate, ContextRuleUpdate, ContextRuleResponse,
    RAGSystemCreate, RAGSystemUpdate, RAGSystemResponse,
    AIRequest, AIResponse, ContentInjectionRequest, ContentInjectionResult
)
from app.routers.auth import get_current_user
import time
import json

router = APIRouter(prefix="/ai-agents", tags=["ai-agents"])

# --- AI Agent Management ---
@router.get("/", response_model=List[AIAgentResponse])
async def get_ai_agents(
    skip: int = 0,
    limit: int = 100,
    agent_type: Optional[str] = None,
    provider: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all AI agents with optional filtering."""
    query = db.query(AIAgent)
    
    if agent_type:
        query = query.filter(AIAgent.type == agent_type)
    
    if provider:
        query = query.filter(AIAgent.provider == provider)
    
    agents = query.offset(skip).limit(limit).all()
    return agents

@router.get("/{agent_id}", response_model=AIAgentResponse)
async def get_ai_agent(
    agent_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific AI agent by ID."""
    agent = db.query(AIAgent).filter(AIAgent.id == agent_id).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI Agent not found"
        )
    return agent

@router.post("/", response_model=AIAgentResponse)
async def create_ai_agent(
    agent_data: AIAgentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new AI agent."""
    # Encrypt API key if provided
    api_key_encrypted = None
    if agent_data.api_key:
        # In production, use proper encryption
        api_key_encrypted = f"encrypted_{agent_data.api_key}"
    
    db_agent = AIAgent(
        name=agent_data.name,
        type=agent_data.type,
        provider=agent_data.provider,
        model=agent_data.model,
        endpoint=agent_data.endpoint,
        api_key_encrypted=api_key_encrypted,
        capabilities=agent_data.capabilities,
        context_window=agent_data.context_window,
        max_tokens=agent_data.max_tokens,
        temperature=agent_data.temperature,
        status=agent_data.status
    )
    
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    
    return db_agent

@router.put("/{agent_id}", response_model=AIAgentResponse)
async def update_ai_agent(
    agent_id: int,
    agent_data: AIAgentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing AI agent."""
    agent = db.query(AIAgent).filter(AIAgent.id == agent_id).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI Agent not found"
        )
    
    # Update fields if provided
    update_data = agent_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "api_key" and value:
            # Encrypt API key
            agent.api_key_encrypted = f"encrypted_{value}"
        elif field != "api_key":
            setattr(agent, field, value)
    
    db.commit()
    db.refresh(agent)
    
    return agent

@router.delete("/{agent_id}")
async def delete_ai_agent(
    agent_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an AI agent."""
    agent = db.query(AIAgent).filter(AIAgent.id == agent_id).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI Agent not found"
        )
    
    db.delete(agent)
    db.commit()
    
    return {"message": "AI Agent deleted successfully"}

# --- Content Injection Management ---
@router.get("/{agent_id}/injections", response_model=List[ContentInjectionResponse])
async def get_content_injections(
    agent_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get content injections for a specific AI agent."""
    injections = db.query(ContentInjection).filter(
        ContentInjection.target_agent_id == agent_id
    ).all()
    return injections

@router.post("/{agent_id}/injections", response_model=ContentInjectionResponse)
async def create_content_injection(
    agent_id: int,
    injection_data: ContentInjectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new content injection for an AI agent."""
    # Verify agent exists
    agent = db.query(AIAgent).filter(AIAgent.id == agent_id).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI Agent not found"
        )
    
    db_injection = ContentInjection(
        name=injection_data.name,
        type=injection_data.type,
        target_agent_id=agent_id,
        injection_point=injection_data.injection_point,
        content_template=injection_data.content_template,
        conditions=injection_data.conditions,
        priority=injection_data.priority,
        status=injection_data.status,
        created_by=current_user.username
    )
    
    db.add(db_injection)
    db.commit()
    db.refresh(db_injection)
    
    return db_injection

@router.put("/injections/{injection_id}", response_model=ContentInjectionResponse)
async def update_content_injection(
    injection_id: int,
    injection_data: ContentInjectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a content injection."""
    injection = db.query(ContentInjection).filter(ContentInjection.id == injection_id).first()
    if not injection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content injection not found"
        )
    
    # Update fields if provided
    update_data = injection_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(injection, field, value)
    
    db.commit()
    db.refresh(injection)
    
    return injection

@router.delete("/injections/{injection_id}")
async def delete_content_injection(
    injection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a content injection."""
    injection = db.query(ContentInjection).filter(ContentInjection.id == injection_id).first()
    if not injection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content injection not found"
        )
    
    db.delete(injection)
    db.commit()
    
    return {"message": "Content injection deleted successfully"}

# --- AI Content Processing ---
@router.post("/{agent_id}/process", response_model=AIResponse)
async def process_ai_request(
    agent_id: int,
    request: AIRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Process an AI request with content injection and context engineering."""
    start_time = time.time()
    
    # Get the AI agent
    agent = db.query(AIAgent).filter(AIAgent.id == agent_id).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI Agent not found"
        )
    
    # Get applicable content injections
    injections = db.query(ContentInjection).filter(
        ContentInjection.target_agent_id == agent_id,
        ContentInjection.status == "active"
    ).order_by(ContentInjection.priority).all()
    
    # Get applicable context rules
    context_rules = db.query(ContextRule).filter(
        ContextRule.agent_id == agent_id,
        ContextRule.status == "active"
    ).order_by(ContextRule.priority).all()
    
    # Apply content injections
    modified_prompt = request.prompt
    applied_injections = []
    
    for injection in injections:
        if injection.injection_point == "pre_prompt":
            # Apply pre-prompt injection
            modified_prompt = f"{injection.content_template}\n\n{modified_prompt}"
            applied_injections.append(injection.name)
        elif injection.injection_point == "post_prompt":
            # Apply post-prompt injection
            modified_prompt = f"{modified_prompt}\n\n{injection.content_template}"
            applied_injections.append(injection.name)
    
    # Apply context rules
    applied_context_rules = []
    enriched_context = request.context.copy()
    
    for rule in context_rules:
        if rule.rule_type == "data_enrichment":
            # Add additional context based on rule
            enriched_context.update(rule.actions.get("additional_context", {}))
            applied_context_rules.append(rule.name)
        elif rule.rule_type == "context_filtering":
            # Filter context based on rule conditions
            if rule.conditions.get("filter_sensitive_data", False):
                # Remove sensitive data from context
                sensitive_keys = rule.actions.get("sensitive_keys", [])
                for key in sensitive_keys:
                    enriched_context.pop(key, None)
                applied_context_rules.append(rule.name)
    
    # Simulate AI processing
    processing_time = (time.time() - start_time) * 1000
    
    # Generate response based on agent type
    if agent.type == "llm":
        response_text = f"AI Response from {agent.name} (Provider: {agent.provider}):\n\nProcessed prompt: {modified_prompt[:100]}...\n\nContext: {json.dumps(enriched_context, indent=2)}"
    elif agent.type == "rag":
        response_text = f"RAG Response from {agent.name}:\n\nRetrieved relevant documents and generated response based on knowledge base."
    else:
        response_text = f"Custom AI Response from {agent.name}:\n\nProcessed with custom logic."
    
    return AIResponse(
        response=response_text,
        agent_id=agent_id,
        processing_time=processing_time,
        tokens_used=len(modified_prompt) + len(response_text),
        content_injections_applied=applied_injections,
        context_rules_applied=applied_context_rules,
        metadata={
            "agent_name": agent.name,
            "agent_type": agent.type,
            "provider": agent.provider,
            "model": agent.model,
            "original_prompt_length": len(request.prompt),
            "modified_prompt_length": len(modified_prompt)
        }
    )

@router.post("/inject-content", response_model=ContentInjectionResult)
async def inject_content(
    injection_request: ContentInjectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Apply content injection to AI agent requests."""
    start_time = time.time()
    
    # Get applicable injections for the agent
    injections = db.query(ContentInjection).filter(
        ContentInjection.target_agent_id == injection_request.agent_id,
        ContentInjection.type == injection_request.injection_type,
        ContentInjection.status == "active"
    ).order_by(ContentInjection.priority).all()
    
    modified_content = injection_request.original_content
    applied_injections = []
    
    for injection in injections:
        # Check if conditions are met
        conditions_met = True
        for condition_key, condition_value in injection.conditions.items():
            if condition_key in injection_request.user_context:
                if injection_request.user_context[condition_key] != condition_value:
                    conditions_met = False
                    break
        
        if conditions_met:
            # Apply the injection
            if injection.injection_point == "pre_prompt":
                modified_content = f"{injection.content_template}\n\n{modified_content}"
            elif injection.injection_point == "post_prompt":
                modified_content = f"{modified_content}\n\n{injection.content_template}"
            
            applied_injections.append({
                "name": injection.name,
                "type": injection.type,
                "injection_point": injection.injection_point,
                "content_template": injection.content_template
            })
    
    processing_time = (time.time() - start_time) * 1000
    
    return ContentInjectionResult(
        modified_content=modified_content,
        injections_applied=applied_injections,
        confidence_score=0.95,  # Simulate confidence score
        processing_time=processing_time
    )

# --- RAG System Management ---
@router.get("/rag-systems/", response_model=List[RAGSystemResponse])
async def get_rag_systems(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all RAG systems."""
    rag_systems = db.query(RAGSystem).offset(skip).limit(limit).all()
    return rag_systems

@router.post("/rag-systems/", response_model=RAGSystemResponse)
async def create_rag_system(
    rag_data: RAGSystemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new RAG system."""
    # Encrypt API key if provided
    api_key_encrypted = None
    if rag_data.api_key:
        api_key_encrypted = f"encrypted_{rag_data.api_key}"
    
    db_rag = RAGSystem(
        name=rag_data.name,
        type=rag_data.type,
        provider=rag_data.provider,
        endpoint=rag_data.endpoint,
        api_key_encrypted=api_key_encrypted,
        collection_name=rag_data.collection_name,
        embedding_model=rag_data.embedding_model,
        chunk_size=rag_data.chunk_size,
        chunk_overlap=rag_data.chunk_overlap,
        retrieval_strategy=rag_data.retrieval_strategy,
        max_results=rag_data.max_results,
        similarity_threshold=rag_data.similarity_threshold,
        status=rag_data.status
    )
    
    db.add(db_rag)
    db.commit()
    db.refresh(db_rag)
    
    return db_rag

# --- Context Rules Management ---
@router.get("/{agent_id}/context-rules", response_model=List[ContextRuleResponse])
async def get_context_rules(
    agent_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get context rules for a specific AI agent."""
    rules = db.query(ContextRule).filter(ContextRule.agent_id == agent_id).all()
    return rules

@router.post("/{agent_id}/context-rules", response_model=ContextRuleResponse)
async def create_context_rule(
    agent_id: int,
    rule_data: ContextRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new context rule for an AI agent."""
    # Verify agent exists
    agent = db.query(AIAgent).filter(AIAgent.id == agent_id).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI Agent not found"
        )
    
    db_rule = ContextRule(
        name=rule_data.name,
        description=rule_data.description,
        agent_id=agent_id,
        rag_system_id=rule_data.rag_system_id,
        rule_type=rule_data.rule_type,
        conditions=rule_data.conditions,
        actions=rule_data.actions,
        priority=rule_data.priority,
        status=rule_data.status,
        created_by=current_user.username
    )
    
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    
    return db_rule
