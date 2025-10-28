from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import signup, pro_provisioning, downloads, stripe_webhooks
from app.database import engine, Base
import os

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Control Core Signup Service",
    description="Customer onboarding and download system for Control Core",
    version="1.0.0"
)

# Add CORS middleware
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,https://signup.controlcore.io").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(signup.router)
app.include_router(pro_provisioning.router)
app.include_router(downloads.router)
app.include_router(stripe_webhooks.router)

@app.get("/")
async def root():
    return {"message": "Control Core Signup Service"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "cc-signup-service", "version": "1.0.0"}

@app.get("/ready")
async def readiness_check():
    return {"status": "ready", "service": "cc-signup-service"}