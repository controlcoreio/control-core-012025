#!/usr/bin/env python3
"""
Development server for cc-signup-service
"""
import os
import sys
import uvicorn
from pathlib import Path

# Add the app directory to Python path
app_dir = Path(__file__).parent / "app"
sys.path.insert(0, str(app_dir))

# Set default environment variables for development
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("SECRET_KEY", "dev-secret-key-change-in-production")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173")

def main():
    """Run the development server"""
    print("🚀 Starting cc-signup-service development server...")
    print("📍 Server will be available at: http://localhost:8001")
    print("📚 API docs will be available at: http://localhost:8001/docs")
    print("🔧 Health check: http://localhost:8001/health")
    print("-" * 50)
    
    try:
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8001,
            reload=True,
            reload_dirs=["app"],
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Server failed to start: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
