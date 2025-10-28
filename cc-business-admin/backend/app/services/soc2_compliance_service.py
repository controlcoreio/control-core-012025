"""
SOC2 Compliance Monitoring Service for Control Core
Central compliance monitoring and management system in cc-business-admin
"""

import os
import json
import logging
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import uuid
import asyncio
import requests
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class ComplianceCriteria(str, Enum):
    SECURITY = "security"
    AVAILABILITY = "availability"
    PROCESSING_INTEGRITY = "processing_integrity"
    CONFIDENTIALITY = "confidentiality"
    PRIVACY = "privacy"

class ComplianceStatus(str, Enum):
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    PARTIALLY_COMPLIANT = "partially_compliant"
    UNDER_REVIEW = "under_review"
    NOT_APPLICABLE = "not_applicable"

class ControlCategory(str, Enum):
    ACCESS_CONTROLS = "access_controls"
    SYSTEM_OPERATIONS = "system_operations"
    CHANGE_MANAGEMENT = "change_management"
    RISK_MANAGEMENT = "risk_management"
    DATA_PROTECTION = "data_protection"
    MONITORING = "monitoring"
    INCIDENT_RESPONSE = "incident_response"
    VENDOR_MANAGEMENT = "vendor_management"

@dataclass
class ComplianceControl:
    control_id: str
    name: str
    description: str
    category: ControlCategory
    criteria: ComplianceCriteria
    status: ComplianceStatus
    evidence: List[str]
    last_verified: Optional[datetime]
    next_review: datetime
    owner: str
    automated: bool
    risk_level: str
    remediation_required: bool
    remediation_notes: Optional[str]
    created_at: datetime
    updated_at: datetime

@dataclass
class ComplianceMetric:
    metric_id: str
    name: str
    description: str
    criteria: ComplianceCriteria
    current_value: float
    target_value: float
    unit: str
    trend: str  # "improving", "stable", "declining"
    last_measured: datetime
    measurement_source: str

@dataclass
class ComplianceReport:
    report_id: str
    tenant_id: str
    report_type: str
    period_start: datetime
    period_end: datetime
    overall_score: float
    criteria_scores: Dict[str, float]
    control_status: Dict[str, ComplianceStatus]
    findings: List[str]
    recommendations: List[str]
    generated_at: datetime
    generated_by: str

class SOC2ComplianceService:
    """
    Comprehensive SOC2 compliance monitoring and management service for Control Core
    Internal business administration portal for SOC2 compliance auditing and monitoring
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.compliance_controls: Dict[str, ComplianceControl] = {}
        self.compliance_metrics: Dict[str, ComplianceMetric] = {}
        self.compliance_reports: Dict[str, ComplianceReport] = {}
        
        # Customer deployment tracking
        self.customer_deployments: Dict[str, Dict[str, Any]] = {}
        self.compliance_audits: Dict[str, Dict[str, Any]] = {}
        self.internal_codebase_audits: Dict[str, Dict[str, Any]] = {}
        
        # CRM Integration settings
        self.crm_enabled = os.getenv('CRM_INTEGRATION_ENABLED', 'true').lower() == 'true'
        self.crm_api_url = os.getenv('CRM_API_URL', '')
        self.crm_api_key = os.getenv('CRM_API_KEY', '')
        self.crm_webhook_url = os.getenv('CRM_WEBHOOK_URL', '')
        
        # Compliance thresholds
        self.compliance_thresholds = {
            ComplianceCriteria.SECURITY: 95.0,
            ComplianceCriteria.AVAILABILITY: 99.9,
            ComplianceCriteria.PROCESSING_INTEGRITY: 98.0,
            ComplianceCriteria.CONFIDENTIALITY: 95.0,
            ComplianceCriteria.PRIVACY: 90.0
        }
        
        # External service endpoints for data collection
        self.service_endpoints = {
            'cc_pap': os.getenv('CC_PAP_URL', 'http://localhost:3000'),
            'cc_bouncer': os.getenv('CC_BOUNCER_URL', 'http://localhost:8080'),
            'cc_opal': os.getenv('CC_OPAL_URL', 'http://localhost:7000'),
            'cc_pap_api': os.getenv('CC_PAP_API_URL', 'http://localhost:8000')
        }
        
        # Initialize compliance controls
        self._initialize_compliance_controls()
        self._initialize_compliance_metrics()
        self._initialize_sample_customer_data()
        
        logger.info("SOC2ComplianceService initialized for comprehensive business administration")

    def _initialize_compliance_controls(self):
        """Initialize SOC2 compliance controls"""
        
        controls = [
            # Security Controls (CC6)
            ComplianceControl(
                control_id="CC6.1",
                name="Logical Access Controls",
                description="Controls to prevent unauthorized access to systems and data",
                category=ControlCategory.ACCESS_CONTROLS,
                criteria=ComplianceCriteria.SECURITY,
                status=ComplianceStatus.COMPLIANT,
                evidence=[],
                last_verified=datetime.utcnow(),
                next_review=datetime.utcnow() + timedelta(days=30),
                owner="Security Team",
                automated=True,
                risk_level="medium",
                remediation_required=False,
                remediation_notes=None,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            ),
            ComplianceControl(
                control_id="CC6.2",
                name="Authentication and Authorization",
                description="Controls for user authentication and authorization",
                category=ControlCategory.ACCESS_CONTROLS,
                criteria=ComplianceCriteria.SECURITY,
                status=ComplianceStatus.COMPLIANT,
                evidence=[],
                last_verified=datetime.utcnow(),
                next_review=datetime.utcnow() + timedelta(days=30),
                owner="Security Team",
                automated=True,
                risk_level="high",
                remediation_required=False,
                remediation_notes=None,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            ),
            ComplianceControl(
                control_id="CC6.3",
                name="System Access Logging",
                description="Comprehensive logging of system access and activities",
                category=ControlCategory.MONITORING,
                criteria=ComplianceCriteria.SECURITY,
                status=ComplianceStatus.COMPLIANT,
                evidence=[],
                last_verified=datetime.utcnow(),
                next_review=datetime.utcnow() + timedelta(days=30),
                owner="Security Team",
                automated=True,
                risk_level="medium",
                remediation_required=False,
                remediation_notes=None,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            ),
            
            # Availability Controls (CC7)
            ComplianceControl(
                control_id="CC7.1",
                name="System Availability",
                description="Controls to ensure system availability and performance",
                category=ControlCategory.SYSTEM_OPERATIONS,
                criteria=ComplianceCriteria.AVAILABILITY,
                status=ComplianceStatus.COMPLIANT,
                evidence=[],
                last_verified=datetime.utcnow(),
                next_review=datetime.utcnow() + timedelta(days=30),
                owner="Operations Team",
                automated=True,
                risk_level="high",
                remediation_required=False,
                remediation_notes=None,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            ),
            
            # Processing Integrity Controls (CC8)
            ComplianceControl(
                control_id="CC8.1",
                name="Change Management",
                description="Controls for managing system changes and updates",
                category=ControlCategory.CHANGE_MANAGEMENT,
                criteria=ComplianceCriteria.PROCESSING_INTEGRITY,
                status=ComplianceStatus.COMPLIANT,
                evidence=[],
                last_verified=datetime.utcnow(),
                next_review=datetime.utcnow() + timedelta(days=30),
                owner="Development Team",
                automated=True,
                risk_level="medium",
                remediation_required=False,
                remediation_notes=None,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            ),
            
            # Confidentiality Controls (CC9)
            ComplianceControl(
                control_id="CC9.1",
                name="Data Classification and Protection",
                description="Controls for data classification and protection",
                category=ControlCategory.DATA_PROTECTION,
                criteria=ComplianceCriteria.CONFIDENTIALITY,
                status=ComplianceStatus.COMPLIANT,
                evidence=[],
                last_verified=datetime.utcnow(),
                next_review=datetime.utcnow() + timedelta(days=30),
                owner="Security Team",
                automated=True,
                risk_level="high",
                remediation_required=False,
                remediation_notes=None,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            ),
            ComplianceControl(
                control_id="CC9.2",
                name="Privacy Controls",
                description="Controls for privacy protection and data minimization",
                category=ControlCategory.DATA_PROTECTION,
                criteria=ComplianceCriteria.PRIVACY,
                status=ComplianceStatus.COMPLIANT,
                evidence=[],
                last_verified=datetime.utcnow(),
                next_review=datetime.utcnow() + timedelta(days=30),
                owner="Privacy Team",
                automated=True,
                risk_level="medium",
                remediation_required=False,
                remediation_notes=None,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
        ]
        
        for control in controls:
            self.compliance_controls[control.control_id] = control

    def _initialize_compliance_metrics(self):
        """Initialize compliance metrics for monitoring"""
        
        metrics = [
            ComplianceMetric(
                metric_id="M001",
                name="Authentication Success Rate",
                description="Percentage of successful authentication attempts",
                criteria=ComplianceCriteria.SECURITY,
                current_value=99.5,
                target_value=99.0,
                unit="percentage",
                trend="stable",
                last_measured=datetime.utcnow(),
                measurement_source="auth_service"
            ),
            ComplianceMetric(
                metric_id="M002",
                name="System Uptime",
                description="System availability percentage",
                criteria=ComplianceCriteria.AVAILABILITY,
                current_value=99.9,
                target_value=99.5,
                unit="percentage",
                trend="stable",
                last_measured=datetime.utcnow(),
                measurement_source="monitoring_system"
            ),
            ComplianceMetric(
                metric_id="M003",
                name="Data Encryption Coverage",
                description="Percentage of data encrypted at rest and in transit",
                criteria=ComplianceCriteria.CONFIDENTIALITY,
                current_value=100.0,
                target_value=100.0,
                unit="percentage",
                trend="stable",
                last_measured=datetime.utcnow(),
                measurement_source="encryption_service"
            ),
            ComplianceMetric(
                metric_id="M004",
                name="Audit Log Coverage",
                description="Percentage of system events logged for audit",
                criteria=ComplianceCriteria.SECURITY,
                current_value=98.5,
                target_value=95.0,
                unit="percentage",
                trend="improving",
                last_measured=datetime.utcnow(),
                measurement_source="audit_service"
            ),
            ComplianceMetric(
                metric_id="M005",
                name="Incident Response Time",
                description="Average time to respond to security incidents",
                criteria=ComplianceCriteria.SECURITY,
                current_value=15.0,
                target_value=30.0,
                unit="minutes",
                trend="improving",
                last_measured=datetime.utcnow(),
                measurement_source="incident_response_service"
            )
        ]
        
        for metric in metrics:
            self.compliance_metrics[metric.metric_id] = metric

    async def collect_compliance_data(self, tenant_id: str) -> Dict[str, Any]:
        """Collect compliance data from all Control Core components"""
        
        compliance_data = {
            "tenant_id": tenant_id,
            "collection_time": datetime.utcnow().isoformat(),
            "components": {},
            "overall_score": 0.0,
            "criteria_scores": {},
            "issues": [],
            "recommendations": []
        }
        
        # Collect data from each component
        for component_name, endpoint in self.service_endpoints.items():
            try:
                component_data = await self._collect_component_data(endpoint, component_name)
                compliance_data["components"][component_name] = component_data
            except Exception as e:
                logger.error(f"Failed to collect data from {component_name}: {e}")
                compliance_data["issues"].append(f"Failed to collect data from {component_name}: {str(e)}")
        
        # Calculate overall compliance scores
        compliance_data["criteria_scores"] = await self._calculate_criteria_scores(compliance_data)
        compliance_data["overall_score"] = sum(compliance_data["criteria_scores"].values()) / len(compliance_data["criteria_scores"])
        
        # Generate recommendations
        compliance_data["recommendations"] = await self._generate_recommendations(compliance_data)
        
        # Send to CRM if enabled
        if self.crm_enabled:
            await self._send_to_crm(compliance_data)
        
        return compliance_data

    async def _collect_component_data(self, endpoint: str, component_name: str) -> Dict[str, Any]:
        """Collect compliance data from a specific component"""
        
        try:
            # Health check endpoint
            health_url = f"{endpoint}/health"
            response = requests.get(health_url, timeout=10)
            
            if response.status_code == 200:
                health_data = response.json()
            else:
                health_data = {"status": "unhealthy", "error": f"HTTP {response.status_code}"}
            
            # Compliance endpoint (if available)
            compliance_url = f"{endpoint}/compliance"
            compliance_data = {}
            
            try:
                compliance_response = requests.get(compliance_url, timeout=10)
                if compliance_response.status_code == 200:
                    compliance_data = compliance_response.json()
            except:
                # Component may not have compliance endpoint yet
                pass
            
            return {
                "health": health_data,
                "compliance": compliance_data,
                "last_checked": datetime.utcnow().isoformat(),
                "status": "healthy" if health_data.get("status") == "healthy" else "unhealthy"
            }
            
        except Exception as e:
            return {
                "health": {"status": "error", "error": str(e)},
                "compliance": {},
                "last_checked": datetime.utcnow().isoformat(),
                "status": "error"
            }

    async def _calculate_criteria_scores(self, compliance_data: Dict[str, Any]) -> Dict[str, float]:
        """Calculate compliance scores for each SOC2 criteria"""
        
        scores = {}
        
        # Security (CC6) - Based on access controls, authentication, logging
        security_score = 0.0
        security_components = 0
        
        for component_name, component_data in compliance_data["components"].items():
            if component_data["status"] == "healthy":
                security_score += 100.0
            else:
                security_score += 50.0
            security_components += 1
        
        if security_components > 0:
            scores[ComplianceCriteria.SECURITY.value] = security_score / security_components
        else:
            scores[ComplianceCriteria.SECURITY.value] = 0.0
        
        # Availability (CC7) - Based on system uptime and health
        availability_score = 0.0
        availability_components = 0
        
        for component_name, component_data in compliance_data["components"].items():
            health = component_data.get("health", {})
            if health.get("status") == "healthy":
                uptime = health.get("uptime", 99.9)
                availability_score += uptime
            else:
                availability_score += 50.0
            availability_components += 1
        
        if availability_components > 0:
            scores[ComplianceCriteria.AVAILABILITY.value] = availability_score / availability_components
        else:
            scores[ComplianceCriteria.AVAILABILITY.value] = 0.0
        
        # Processing Integrity (CC8) - Based on data integrity and change management
        processing_score = 95.0  # Default high score, would be calculated from actual data
        scores[ComplianceCriteria.PROCESSING_INTEGRITY.value] = processing_score
        
        # Confidentiality (CC9.1) - Based on encryption and data protection
        confidentiality_score = 98.0  # Default high score, would be calculated from actual data
        scores[ComplianceCriteria.CONFIDENTIALITY.value] = confidentiality_score
        
        # Privacy (CC9.2) - Based on privacy controls and data minimization
        privacy_score = 92.0  # Default score, would be calculated from actual data
        scores[ComplianceCriteria.PRIVACY.value] = privacy_score
        
        return scores

    async def _generate_recommendations(self, compliance_data: Dict[str, Any]) -> List[str]:
        """Generate compliance recommendations based on collected data"""
        
        recommendations = []
        
        # Check overall score
        overall_score = compliance_data["overall_score"]
        if overall_score < 90.0:
            recommendations.append("Overall compliance score is below 90%. Review and address identified issues.")
        
        # Check individual criteria scores
        for criteria, score in compliance_data["criteria_scores"].items():
            threshold = self.compliance_thresholds.get(criteria, 90.0)
            if score < threshold:
                recommendations.append(f"{criteria} score ({score:.1f}%) is below threshold ({threshold}%). Review related controls.")
        
        # Check component health
        unhealthy_components = []
        for component_name, component_data in compliance_data["components"].items():
            if component_data["status"] != "healthy":
                unhealthy_components.append(component_name)
        
        if unhealthy_components:
            recommendations.append(f"Unhealthy components detected: {', '.join(unhealthy_components)}. Investigate and resolve issues.")
        
        # Check for issues
        if compliance_data["issues"]:
            recommendations.append(f"Found {len(compliance_data['issues'])} compliance issues that require attention.")
        
        return recommendations

    async def _send_to_crm(self, compliance_data: Dict[str, Any]):
        """Send compliance data to CRM system for quick communication"""
        
        if not self.crm_enabled or not self.crm_api_url:
            return
        
        try:
            # Prepare CRM payload
            crm_payload = {
                "type": "compliance_report",
                "tenant_id": compliance_data["tenant_id"],
                "timestamp": compliance_data["collection_time"],
                "overall_score": compliance_data["overall_score"],
                "criteria_scores": compliance_data["criteria_scores"],
                "status": "healthy" if compliance_data["overall_score"] >= 90.0 else "attention_required",
                "issues_count": len(compliance_data["issues"]),
                "recommendations_count": len(compliance_data["recommendations"]),
                "components_status": {
                    name: data["status"] for name, data in compliance_data["components"].items()
                }
            }
            
            # Send to CRM API
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.crm_api_key}"
            }
            
            response = requests.post(
                self.crm_api_url,
                json=crm_payload,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                logger.info(f"Compliance data sent to CRM for tenant {compliance_data['tenant_id']}")
            else:
                logger.error(f"Failed to send compliance data to CRM: {response.status_code}")
        
        except Exception as e:
            logger.error(f"Error sending compliance data to CRM: {e}")

    def update_control_status(self, control_id: str, status: ComplianceStatus, evidence: List[str] = None):
        """Update compliance control status"""
        
        if control_id not in self.compliance_controls:
            logger.error(f"Compliance control not found: {control_id}")
            return
        
        control = self.compliance_controls[control_id]
        control.status = status
        control.last_verified = datetime.utcnow()
        control.updated_at = datetime.utcnow()
        
        if evidence:
            control.evidence.extend(evidence)
        
        logger.info(f"Compliance control {control_id} status updated to {status.value}")

    def create_compliance_report(self, tenant_id: str, report_type: str = "monthly") -> ComplianceReport:
        """Create a comprehensive compliance report"""
        
        report_id = str(uuid.uuid4())
        current_time = datetime.utcnow()
        
        # Determine report period
        if report_type == "monthly":
            period_start = current_time.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            period_end = current_time
        elif report_type == "quarterly":
            quarter_start_month = ((current_time.month - 1) // 3) * 3 + 1
            period_start = current_time.replace(month=quarter_start_month, day=1, hour=0, minute=0, second=0, microsecond=0)
            period_end = current_time
        else:
            period_start = current_time - timedelta(days=30)
            period_end = current_time
        
        # Collect current compliance data
        compliance_data = asyncio.run(self.collect_compliance_data(tenant_id))
        
        # Create report
        report = ComplianceReport(
            report_id=report_id,
            tenant_id=tenant_id,
            report_type=report_type,
            period_start=period_start,
            period_end=period_end,
            overall_score=compliance_data["overall_score"],
            criteria_scores=compliance_data["criteria_scores"],
            control_status={control_id: control.status for control_id, control in self.compliance_controls.items()},
            findings=compliance_data["issues"],
            recommendations=compliance_data["recommendations"],
            generated_at=current_time,
            generated_by="system"
        )
        
        self.compliance_reports[report_id] = report
        
        logger.info(f"Compliance report created: {report_id} for tenant {tenant_id}")
        return report

    def get_compliance_dashboard_data(self, tenant_id: str) -> Dict[str, Any]:
        """Get data for compliance dashboard"""
        
        # Collect current compliance data
        compliance_data = asyncio.run(self.collect_compliance_data(tenant_id))
        
        dashboard_data = {
            "tenant_id": tenant_id,
            "timestamp": datetime.utcnow().isoformat(),
            "overall_score": compliance_data["overall_score"],
            "criteria_scores": compliance_data["criteria_scores"],
            "controls": {},
            "metrics": {},
            "components": compliance_data["components"],
            "issues": compliance_data["issues"],
            "recommendations": compliance_data["recommendations"],
            "status": "healthy" if compliance_data["overall_score"] >= 90.0 else "attention_required"
        }
        
        # Add control information
        for control_id, control in self.compliance_controls.items():
            dashboard_data["controls"][control_id] = {
                "name": control.name,
                "status": control.status.value,
                "category": control.category.value,
                "criteria": control.criteria.value,
                "risk_level": control.risk_level,
                "last_verified": control.last_verified.isoformat() if control.last_verified else None,
                "next_review": control.next_review.isoformat(),
                "owner": control.owner,
                "automated": control.automated,
                "remediation_required": control.remediation_required
            }
        
        # Add metrics information
        for metric_id, metric in self.compliance_metrics.items():
            dashboard_data["metrics"][metric_id] = {
                "name": metric.name,
                "current_value": metric.current_value,
                "target_value": metric.target_value,
                "unit": metric.unit,
                "trend": metric.trend,
                "criteria": metric.criteria.value,
                "last_measured": metric.last_measured.isoformat()
            }
        
        return dashboard_data

    def get_compliance_summary(self) -> Dict[str, Any]:
        """Get overall compliance summary"""
        
        total_controls = len(self.compliance_controls)
        compliant_controls = len([c for c in self.compliance_controls.values() if c.status == ComplianceStatus.COMPLIANT])
        non_compliant_controls = len([c for c in self.compliance_controls.values() if c.status == ComplianceStatus.NON_COMPLIANT])
        
        summary = {
            "total_controls": total_controls,
            "compliant_controls": compliant_controls,
            "non_compliant_controls": non_compliant_controls,
            "compliance_percentage": (compliant_controls / total_controls * 100) if total_controls > 0 else 0,
            "total_reports": len(self.compliance_reports),
            "criteria_coverage": len(set(c.criteria for c in self.compliance_controls.values())),
            "automated_controls": len([c for c in self.compliance_controls.values() if c.automated]),
            "controls_needing_review": len([c for c in self.compliance_controls.values() if c.next_review <= datetime.utcnow()]),
            "high_risk_controls": len([c for c in self.compliance_controls.values() if c.risk_level == "high"]),
            "remediation_required": len([c for c in self.compliance_controls.values() if c.remediation_required])
        }
        
        return summary

# Global SOC2 compliance service instance
# This would be initialized with a database session in the actual application
soc2_compliance_service = None

def get_soc2_compliance_service(db: Session) -> SOC2ComplianceService:
    """Get SOC2 compliance service instance"""
    global soc2_compliance_service
    if soc2_compliance_service is None:
        soc2_compliance_service = SOC2ComplianceService(db)
    return soc2_compliance_service
