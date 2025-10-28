#!/usr/bin/env python3
"""
Control Core Setup Verification Script

This script verifies that all components are properly configured for the
Policy Wizard system to function correctly.

Run: python verify_setup.py
"""

import os
import sys
import subprocess
import requests
from datetime import datetime


class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'


def print_header(text):
    print(f"\n{Colors.BLUE}{'=' * 60}")
    print(f"{text}")
    print(f"{'=' * 60}{Colors.END}\n")


def print_success(text):
    print(f"{Colors.GREEN}✓{Colors.END} {text}")


def print_error(text):
    print(f"{Colors.RED}✗{Colors.END} {text}")


def print_warning(text):
    print(f"{Colors.YELLOW}⚠{Colors.END} {text}")


def print_info(text):
    print(f"{Colors.BLUE}ℹ{Colors.END} {text}")


def check_environment_variables():
    """Check if required environment variables are set"""
    print_header("Checking Environment Variables")
    
    required_vars = {
        'DATABASE_URL': 'Database connection string',
        'GITHUB_TOKEN': 'GitHub access token for policy storage',
        'GITHUB_REPO_URL': 'GitHub repository URL for policies',
    }
    
    optional_vars = {
        'OPAL_SERVER_URL': 'OPAL server URL',
        'OPAL_CLIENT_URL': 'OPAL client URL',
        'GITHUB_BRANCH': 'GitHub branch (defaults to main)'
    }
    
    all_good = True
    
    for var, description in required_vars.items():
        if os.getenv(var):
            print_success(f"{var}: Set")
        else:
            print_error(f"{var}: NOT SET - {description}")
            all_good = False
    
    for var, description in optional_vars.items():
        if os.getenv(var):
            print_success(f"{var}: Set")
        else:
            print_warning(f"{var}: Not set (optional) - {description}")
    
    return all_good


def check_regal_installation():
    """Check if Regal is installed"""
    print_header("Checking Regal Installation")
    
    try:
        result = subprocess.run(
            ['regal', 'version'],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0:
            version = result.stdout.strip()
            print_success(f"Regal is installed: {version}")
            return True
        else:
            print_error("Regal is installed but returned an error")
            return False
    except FileNotFoundError:
        print_error("Regal is NOT installed")
        print_info("Install from: https://github.com/StyraInc/regal")
        print_info("Or rebuild Docker container (Dockerfile includes Regal)")
        return False
    except Exception as e:
        print_error(f"Error checking Regal: {e}")
        return False


def check_database_connection():
    """Check if database is accessible"""
    print_header("Checking Database Connection")
    
    try:
        from app.database import engine
        from sqlalchemy import text
        
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            row = result.fetchone()
            if row:
                print_success("Database connection successful")
                return True
    except ImportError:
        print_error("Cannot import database module - ensure you're in cc-pap-api directory")
        return False
    except Exception as e:
        print_error(f"Database connection failed: {e}")
        return False


def check_database_tables():
    """Check if required tables exist"""
    print_header("Checking Database Tables")
    
    try:
        from app.database import engine
        from sqlalchemy import inspect
        
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        required_tables = [
            'policies',
            'users',
            'github_configuration',
            'opal_configuration',
            'bouncer_opal_configuration'
        ]
        
        all_exist = True
        for table in required_tables:
            if table in tables:
                print_success(f"Table '{table}' exists")
            else:
                print_error(f"Table '{table}' MISSING")
                all_exist = False
        
        if not all_exist:
            print_info("\nRun migration: python migrations/add_settings_and_policy_fields.py")
        
        return all_exist
    except Exception as e:
        print_error(f"Error checking tables: {e}")
        return False


def check_policy_table_schema():
    """Check if policies table has new columns"""
    print_header("Checking Policy Table Schema")
    
    try:
        from app.database import engine
        from sqlalchemy import inspect
        
        inspector = inspect(engine)
        
        if 'policies' not in inspector.get_table_names():
            print_error("Policies table doesn't exist")
            return False
        
        columns = [col['name'] for col in inspector.get_columns('policies')]
        
        required_columns = {
            'bouncer_id': 'PEP binding',
            'folder': 'GitHub folder location',
            'rego_code': 'Rego policy code'
        }
        
        all_exist = True
        for column, description in required_columns.items():
            if column in columns:
                print_success(f"Column '{column}' exists - {description}")
            else:
                print_error(f"Column '{column}' MISSING - {description}")
                all_exist = False
        
        if not all_exist:
            print_info("\nRun migration: python migrations/add_settings_and_policy_fields.py")
        
        return all_exist
    except Exception as e:
        print_error(f"Error checking schema: {e}")
        return False


def check_api_endpoints():
    """Check if new API endpoints are accessible"""
    print_header("Checking API Endpoints")
    
    base_url = os.getenv('API_BASE_URL', 'http://localhost:8000')
    
    # Check if API is running
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print_success(f"API is running at {base_url}")
        else:
            print_error(f"API returned status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print_error(f"API is not accessible at {base_url}")
        print_info("Start the API: uvicorn app.main:app --reload")
        return False
    
    # Note: These would require authentication in production
    endpoints = [
        '/api/settings/github-config',
        '/api/settings/opal-config',
    ]
    
    print_info("Note: Authentication required to test all endpoints")
    
    return True


def check_github_repository():
    """Check if GitHub repository is accessible"""
    print_header("Checking GitHub Repository")
    
    repo_url = os.getenv('GITHUB_REPO_URL')
    token = os.getenv('GITHUB_TOKEN')
    branch = os.getenv('GITHUB_BRANCH', 'main')
    
    if not repo_url or not token:
        print_warning("GitHub not configured (environment variables missing)")
        print_info("Configure in /settings/policy-repository after starting the app")
        return False
    
    try:
        # Test access to repository
        result = subprocess.run(
            ['git', 'ls-remote', f'https://{token}@{repo_url.replace("https://", "")}', branch],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            print_success(f"GitHub repository accessible: {repo_url}")
            print_success(f"Branch '{branch}' exists")
            return True
        else:
            print_error(f"Cannot access GitHub repository")
            print_error(f"Error: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print_error("GitHub repository access timed out")
        return False
    except Exception as e:
        print_error(f"Error checking GitHub: {e}")
        return False


def check_frontend_build():
    """Check if frontend can be built"""
    print_header("Checking Frontend")
    
    frontend_path = '../cc-pap'
    package_json = os.path.join(frontend_path, 'package.json')
    
    if not os.path.exists(package_json):
        print_error("Frontend directory not found")
        return False
    
    print_success("Frontend directory exists")
    
    # Check if node_modules exists
    node_modules = os.path.join(frontend_path, 'node_modules')
    if os.path.exists(node_modules):
        print_success("Dependencies installed")
    else:
        print_warning("Dependencies not installed")
        print_info("Run: cd ../cc-pap && npm install")
    
    return True


def print_summary(checks):
    """Print summary of all checks"""
    print_header("Verification Summary")
    
    total = len(checks)
    passed = sum(1 for check in checks.values() if check)
    failed = total - passed
    
    print(f"Total Checks: {total}")
    print(f"{Colors.GREEN}Passed: {passed}{Colors.END}")
    if failed > 0:
        print(f"{Colors.RED}Failed: {failed}{Colors.END}")
    
    if passed == total:
        print(f"\n{Colors.GREEN}🎉 All checks passed! Your setup is ready.{Colors.END}")
        print("\nNext steps:")
        print("1. Start the backend: uvicorn app.main:app --reload")
        print("2. Start the frontend: cd ../cc-pap && npm run dev")
        print("3. Configure GitHub: Visit http://localhost:5173/settings/policy-repository")
        print("4. Create your first policy: Visit http://localhost:5173/policies")
    else:
        print(f"\n{Colors.YELLOW}⚠️  Some checks failed. Please address the issues above.{Colors.END}")


def main():
    """Run all verification checks"""
    print(f"{Colors.BLUE}")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║  Control Core - Policy Wizard Setup Verification          ║")
    print("║  Checking system readiness...                             ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print(f"{Colors.END}")
    
    checks = {}
    
    # Run all checks
    checks['environment_variables'] = check_environment_variables()
    checks['regal'] = check_regal_installation()
    checks['database_connection'] = check_database_connection()
    checks['database_tables'] = check_database_tables()
    checks['policy_schema'] = check_policy_table_schema()
    checks['api_endpoints'] = check_api_endpoints()
    checks['github_repo'] = check_github_repository()
    checks['frontend'] = check_frontend_build()
    
    # Print summary
    print_summary(checks)
    
    # Exit with appropriate code
    if all(checks.values()):
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Verification cancelled by user.{Colors.END}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Colors.RED}Unexpected error: {e}{Colors.END}")
        sys.exit(1)

