"""
Downloads Router for Control Core Signup
Handles deployment package downloads and management
"""

from fastapi import APIRouter, HTTPException, status, Depends, Request
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, DeploymentPackage
from app.schemas import DownloadPackageRequest, DownloadPackageResponse, PackageType, PackageFormat
from app.services.package_generator import PackageGenerator
from app.services.telemetry_service import TelemetryService
import logging
import uuid
from datetime import datetime, timedelta
from pathlib import Path

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["downloads"])

# Initialize services
package_generator = PackageGenerator()
telemetry_service = TelemetryService()

@router.get("/downloads/{user_id}")
async def get_user_downloads(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Get all available downloads for a user"""
    try:
        # Verify user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Get all packages for user
        packages = db.query(DeploymentPackage).filter(
            DeploymentPackage.user_id == user_id,
            DeploymentPackage.expires_at > datetime.utcnow()
        ).all()
        
        # If no packages exist, generate them
        if not packages:
            await package_generator.generate_packages(user_id, user.subscription_tier)
            
            # Refresh packages
            packages = db.query(DeploymentPackage).filter(
                DeploymentPackage.user_id == user_id,
                DeploymentPackage.expires_at > datetime.utcnow()
            ).all()
        
        return {
            "user_id": user_id,
            "tier": user.subscription_tier,
            "packages": [
                {
                    "package_id": pkg.package_id,
                    "package_type": pkg.package_type,
                    "package_format": pkg.package_format,
                    "file_size": pkg.file_size,
                    "expires_at": pkg.expires_at,
                    "download_count": pkg.download_count,
                    "is_downloaded": pkg.is_downloaded
                }
                for pkg in packages
            ]
        }
        
    except Exception as e:
        logger.error(f"Failed to get downloads for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve downloads"
        )

@router.post("/downloads/{user_id}/generate")
async def generate_download_package(
    user_id: str,
    request: DownloadPackageRequest,
    db: Session = Depends(get_db)
):
    """Generate a new download package for a user"""
    try:
        # Verify user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Generate package
        packages = await package_generator.generate_packages(user_id, user.subscription_tier)
        
        # Find the requested package type
        requested_package = None
        for pkg in packages:
            if (pkg["package_type"] == request.package_type.value and 
                pkg["package_format"] == request.package_format.value):
                requested_package = pkg
                break
        
        if not requested_package:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Package type/format combination not available"
            )
        
        # Store in database
        db_package = DeploymentPackage(
            id=str(uuid.uuid4()),
            user_id=user_id,
            package_id=requested_package["package_id"],
            package_type=requested_package["package_type"],
            package_format=requested_package["package_format"],
            download_url=requested_package["download_url"],
            file_size=requested_package["file_size"],
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        
        db.add(db_package)
        db.commit()
        
        return DownloadPackageResponse(
            package_id=requested_package["package_id"],
            download_url=requested_package["download_url"],
            file_size=requested_package["file_size"],
            expires_at=db_package.expires_at,
            deployment_instructions=requested_package.get("deployment_instructions", {}),
            components=requested_package["components"],
            requirements=requested_package["requirements"]
        )
        
    except Exception as e:
        logger.error(f"Failed to generate package for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate package"
        )

@router.get("/downloads/{user_id}/{package_id}")
async def download_package(
    user_id: str,
    package_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """Download a specific package"""
    try:
        # Verify user and package
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        package = db.query(DeploymentPackage).filter(
            DeploymentPackage.user_id == user_id,
            DeploymentPackage.package_id == package_id,
            DeploymentPackage.expires_at > datetime.utcnow()
        ).first()
        
        if not package:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Package not found or expired"
            )
        
        # Update download statistics
        package.download_count += 1
        package.is_downloaded = True
        package.downloaded_at = datetime.utcnow()
        db.commit()
        
        # Log download event
        await telemetry_service.log_download_event(
            user_id=user_id,
            package_type=package.package_type,
            package_format=package.package_format,
            file_size=package.file_size,
            tier=user.subscription_tier
        )
        
        # If it's a local file, serve it directly
        if package.download_url.startswith("file://"):
            file_path = Path(package.download_url.replace("file://", ""))
            if file_path.exists():
                return FileResponse(
                    path=file_path,
                    filename=f"controlcore-{package.package_type}-{package.package_format}.zip",
                    media_type="application/zip"
                )
        
        # Otherwise, redirect to the download URL
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=package.download_url)
        
    except Exception as e:
        logger.error(f"Failed to download package {package_id} for user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to download package"
        )

@router.get("/downloads/{user_id}/{package_id}/instructions")
async def get_deployment_instructions(
    user_id: str,
    package_id: str,
    db: Session = Depends(get_db)
):
    """Get deployment instructions for a package"""
    try:
        # Verify user and package
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        package = db.query(DeploymentPackage).filter(
            DeploymentPackage.user_id == user_id,
            DeploymentPackage.package_id == package_id
        ).first()
        
        if not package:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Package not found"
            )
        
        # Generate instructions based on package type
        instructions = await _generate_deployment_instructions(package, user)
        
        return {
            "package_id": package_id,
            "package_type": package.package_type,
            "package_format": package.package_format,
            "instructions": instructions,
            "support_links": {
                "documentation": "https://docs.controlcore.io",
                "support": "support@controlcore.io",
                "community": "https://community.controlcore.io"
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get instructions for package {package_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get deployment instructions"
        )

@router.delete("/downloads/{user_id}/{package_id}")
async def delete_package(
    user_id: str,
    package_id: str,
    db: Session = Depends(get_db)
):
    """Delete a package (admin only)"""
    try:
        # Verify user and package
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        package = db.query(DeploymentPackage).filter(
            DeploymentPackage.user_id == user_id,
            DeploymentPackage.package_id == package_id
        ).first()
        
        if not package:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Package not found"
            )
        
        # Delete from database
        db.delete(package)
        db.commit()
        
        return {"message": "Package deleted successfully"}
        
    except Exception as e:
        logger.error(f"Failed to delete package {package_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete package"
        )

async def _generate_deployment_instructions(package: DeploymentPackage, user: User) -> dict:
    """Generate deployment instructions based on package type"""
    base_instructions = {
        "prerequisites": [],
        "steps": [],
        "verification": [],
        "troubleshooting": []
    }
    
    if package.package_type == "helm":
        base_instructions["prerequisites"] = [
            "Kubernetes cluster (version 1.20 or higher)",
            "Helm 3.8 or higher",
            "kubectl configured to access your cluster",
            "At least 4GB RAM and 2 CPU cores available",
            "10GB of persistent storage"
        ]
        
        base_instructions["steps"] = [
            "Extract the downloaded package",
            "Navigate to the extracted directory",
            "Run: ./deploy.sh",
            "Wait for all pods to be ready",
            "Access Control Core at http://localhost:3000"
        ]
        
        base_instructions["verification"] = [
            "Check pod status: kubectl get pods -n controlcore",
            "Check service status: kubectl get svc -n controlcore",
            "Verify ingress: kubectl get ingress -n controlcore"
        ]
        
    elif package.package_type == "docker-compose":
        base_instructions["prerequisites"] = [
            "Docker 20.10 or higher",
            "Docker Compose 2.0 or higher",
            "At least 4GB RAM and 2 CPU cores available",
            "10GB of free disk space"
        ]
        
        base_instructions["steps"] = [
            "Extract the downloaded package",
            "Navigate to the extracted directory",
            "Run: ./deploy.sh",
            "Wait for all containers to start",
            "Access Control Core at http://localhost:3000"
        ]
        
        base_instructions["verification"] = [
            "Check container status: docker-compose ps",
            "Check logs: docker-compose logs",
            "Verify services: curl http://localhost:3000/health"
        ]
        
    elif package.package_type == "binary":
        base_instructions["prerequisites"] = [
            f"Compatible operating system ({package.package_format})",
            "At least 2GB RAM and 1 CPU core available",
            "5GB of free disk space"
        ]
        
        base_instructions["steps"] = [
            "Extract the downloaded package",
            "Navigate to the extracted directory",
            "Run: ./deploy.sh (or deploy.bat on Windows)",
            "Wait for the service to start",
            "Access Control Core at http://localhost:3000"
        ]
        
        base_instructions["verification"] = [
            "Check process status",
            "Check logs in the data directory",
            "Verify service: curl http://localhost:3000/health"
        ]
    
    base_instructions["troubleshooting"] = [
        "Check system requirements",
        "Verify network connectivity",
        "Check firewall settings",
        "Review application logs",
        "Contact support if issues persist"
    ]
    
    return base_instructions
