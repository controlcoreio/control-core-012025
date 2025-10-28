"""
PAP API Schemas - Re-export schemas from schemas.py file
"""

# Import all schemas from the sibling schemas.py file
import os
import importlib.util

# Get the directory containing this __init__.py file's parent (app directory)
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Import the schemas module
spec = importlib.util.spec_from_file_location("schemas_main", os.path.join(current_dir, "schemas.py"))
schemas_main = importlib.util.module_from_spec(spec)
spec.loader.exec_module(schemas_main)

# Dynamically export all public classes and constants from schemas_main
for attr_name in dir(schemas_main):
    if not attr_name.startswith('_'):
        attr = getattr(schemas_main, attr_name)
        # Export classes, enums, and uppercase constants
        if isinstance(attr, type) or (attr_name and attr_name[0].isupper()):
            globals()[attr_name] = attr

# Import from local security_incident module
from .security_incident import (
    SecurityIncidentCreate,
    SecurityIncidentUpdate,
    SecurityIncidentResponse,
    SecurityIncidentSummary,
    SecurityIncidentFilter,
    SecurityMetrics,
    ComponentHealth,
    IncidentStatistics,
    IncidentAssignment,
    IncidentComment,
    IncidentEscalation,
    SecurityAlertConfig,
    TimelineEvent,
    IncidentSeverity,
    IncidentStatus,
    IncidentComponent,
    IncidentType
)

# Add security incident schemas to globals
__all__ = [
    # Security Incident
    "SecurityIncidentCreate", "SecurityIncidentUpdate", "SecurityIncidentResponse",
    "SecurityIncidentSummary", "SecurityIncidentFilter",
    "SecurityMetrics", "ComponentHealth", "IncidentStatistics",
    "IncidentAssignment", "IncidentComment", "IncidentEscalation",
    "SecurityAlertConfig", "TimelineEvent",
    "IncidentSeverity", "IncidentStatus", "IncidentComponent", "IncidentType"
]
