"""
PAP API Models - Re-export models from models.py file
"""

# Import all models from the sibling models.py file
import os
import importlib.util

# Get the directory containing this __init__.py file's parent (app directory)
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Import the models module from the parent directory
spec = importlib.util.spec_from_file_location("models_main", os.path.join(current_dir, "models.py"))
models_main = importlib.util.module_from_spec(spec)
spec.loader.exec_module(models_main)

# Dynamically export all public classes and constants from models_main
for attr_name in dir(models_main):
    if not attr_name.startswith('_'):
        attr = getattr(models_main, attr_name)
        # Export classes and uppercase constants
        if isinstance(attr, type) or (attr_name and attr_name[0].isupper()):
            globals()[attr_name] = attr

# Import from local security_incident module
from .security_incident import SecurityIncident

# Add security incident model to exports
__all__ = ["SecurityIncident"]
