"""
Business Admin Portal Service for Control Core
Comprehensive business administration including SOC2 compliance, customer management, and internal operations
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

class ComplianceStatus(str, Enum):
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    PARTIALLY_COMPLIANT = "partially_compliant"
    UNDER_REVIEW = "under_review"
    NOT_APPLICABLE = "not_applicable"

class CustomerDeploymentType(str, Enum):
    SELF_HOSTED = "self_hosted"
    HYBRID = "hybrid"
    CLOUD = "cloud"

class AuditType(str, Enum):
    SOC2_TYPE_I = "soc2_type_i"
    SOC2_TYPE_II = "soc2_type_ii"
    INTERNAL_AUDIT = "internal_audit"
    SECURITY_AUDIT = "security_audit"
    PRIVACY_AUDIT = "privacy_audit"
    OPERATIONAL_AUDIT = "operational_audit"

@dataclass
class CustomerDeployment:
    customer_id: str
    customer_name: str
    deployment_type: CustomerDeploymentType
    deployment_id: str
    region: str
    status: str
    compliance_score: float
    last_audit: Optional[datetime]
    next_audit: datetime
    components: List[str]
    security_incidents: int
    vulnerabilities: int
    created_at: datetime
    updated_at: datetime

@dataclass
class ComplianceAudit:
    audit_id: str
    customer_id: Optional[str]
    audit_type: AuditType
    status: ComplianceStatus
    start_date: datetime
    end_date: Optional[datetime]
    auditor: str
    findings: List[Dict[str, Any]]
    recommendations: List[str]
    compliance_score: float
    controls_assessed: int
    controls_passed: int
    created_at: datetime

@dataclass
class InternalCodebaseAudit:
    audit_id: str
    repository: str
    branch: str
    commit_hash: str
    security_score: float
    vulnerabilities_found: int
    code_quality_score: float
    compliance_issues: List[str]
    audit_date: datetime
    auditor: str

class BusinessAdminPortalService:
    """
    Comprehensive Business Admin Portal Service
    Manages SOC2 compliance, customer deployments, and internal operations
    """
    
    def __init__(self, db: Session):
        self.db = db
        
        # Customer deployment tracking
        self.customer_deployments: Dict[str, CustomerDeployment] = {}
        
        # Compliance audits
        self.compliance_audits: Dict[str, ComplianceAudit] = {}
        
        # Internal codebase audits
        self.codebase_audits: Dict[str, InternalCodebaseAudit] = {}
        
        # External service endpoints for monitoring
        self.monitoring_endpoints = {
            'customer_deployments': os.getenv('CUSTOMER_DEPLOYMENT_MONITOR_URL', ''),
            'github_api': os.getenv('GITHUB_API_URL', 'https://api.github.com'),
            'security_scanner': os.getenv('SECURITY_SCANNER_URL', ''),
            'compliance_database': os.getenv('COMPLIANCE_DB_URL', '')
        }
        
        # SOC2 compliance criteria
        self.soc2_criteria = {
            'security': {
                'controls': 40,
                'weight': 0.3
            },
            'availability': {
                'controls': 15,
                'weight': 0.2
            },
            'processing_integrity': {
                'controls': 10,
                'weight': 0.2
            },
            'confidentiality': {
                'controls': 20,
                'weight': 0.15
            },
            'privacy': {
                'controls': 15,
                'weight': 0.15
            }
        }
        
        # Initialize with sample data
        self._initialize_sample_data()
        
        logger.info("BusinessAdminPortalService initialized for comprehensive business administration")

    def _initialize_sample_data(self):
        """Initialize with sample customer deployments and audits"""
        
        # Sample customer deployments
        sample_deployments = [
            CustomerDeployment(
                customer_id="cust_001",
                customer_name="Acme Corporation",
                deployment_type=CustomerDeploymentType.SELF_HOSTED,
                deployment_id="deploy_001",
                region="us-east-1",
                status="active",
                compliance_score=94.5,
                last_audit=datetime.utcnow() - timedelta(days=30),
                next_audit=datetime.utcnow() + timedelta(days=335),
                components=["pap", "bouncer", "opal", "business_admin"],
                security_incidents=3,
                vulnerabilities=2,
                created_at=datetime.utcnow() - timedelta(days=365),
                updated_at=datetime.utcnow() - timedelta(days=1)
            ),
            CustomerDeployment(
                customer_id="cust_002",
                customer_name="TechStart Inc",
                deployment_type=CustomerDeploymentType.HYBRID,
                deployment_id="deploy_002",
                region="eu-west-1",
                status="active",
                compliance_score=87.2,
                last_audit=datetime.utcnow() - timedelta(days=60),
                next_audit=datetime.utcnow() + timedelta(days=305),
                components=["pap", "bouncer", "opal"],
                security_incidents=1,
                vulnerabilities=5,
                created_at=datetime.utcnow() - timedelta(days=200),
                updated_at=datetime.utcnow() - timedelta(days=2)
            ),
            CustomerDeployment(
                customer_id="cust_003",
                customer_name="Global Enterprise",
                deployment_type=CustomerDeploymentType.CLOUD,
                deployment_id="deploy_003",
                region="ap-southeast-1",
                status="active",
                compliance_score=96.8,
                last_audit=datetime.utcnow() - timedelta(days=15),
                next_audit=datetime.utcnow() + timedelta(days=350),
                components=["pap", "bouncer", "opal", "business_admin"],
                security_incidents=0,
                vulnerabilities=1,
                created_at=datetime.utcnow() - timedelta(days=500),
                updated_at=datetime.utcnow()
            )
        ]
        
        for deployment in sample_deployments:
            self.customer_deployments[deployment.customer_id] = deployment

    async def get_dashboard_overview(self) -> Dict[str, Any]:
        """Get comprehensive business admin dashboard overview"""
        
        total_customers = len(self.customer_deployments)
        active_deployments = len([d for d in self.customer_deployments.values() if d.status == "active"])
        
        # Calculate overall compliance metrics
        total_compliance_score = sum(d.compliance_score for d in self.customer_deployments.values()) / total_customers if total_customers > 0 else 0
        compliant_customers = len([d for d in self.customer_deployments.values() if d.compliance_score >= 90])
        
        # Security metrics
        total_security_incidents = sum(d.security_incidents for d in self.customer_deployments.values())
        total_vulnerabilities = sum(d.vulnerabilities for d in self.customer_deployments.values())
        
        # Deployment types breakdown
        deployment_types = {}
        for deployment in self.customer_deployments.values():
            deployment_types[deployment.deployment_type.value] = deployment_types.get(deployment.deployment_type.value, 0) + 1
        
        # Recent audits
        recent_audits = list(self.compliance_audits.values())[-5:] if self.compliance_audits else []
        
        return {
            "overview": {
                "total_customers": total_customers,
                "active_deployments": active_deployments,
                "overall_compliance_score": round(total_compliance_score, 2),
                "compliant_customers": compliant_customers,
                "compliance_percentage": round((compliant_customers / total_customers * 100) if total_customers > 0 else 0, 2)
            },
            "security_metrics": {
                "total_security_incidents": total_security_incidents,
                "total_vulnerabilities": total_vulnerabilities,
                "critical_incidents": 0,  # Would be calculated from actual incident data
                "resolved_incidents": total_security_incidents - 2  # Mock data
            },
            "deployment_breakdown": deployment_types,
            "recent_audits": [
                {
                    "audit_id": audit.audit_id,
                    "customer_id": audit.customer_id,
                    "audit_type": audit.audit_type.value,
                    "status": audit.status.value,
                    "compliance_score": audit.compliance_score,
                    "start_date": audit.start_date.isoformat()
                } for audit in recent_audits
            ],
            "upcoming_audits": [
                {
                    "customer_id": deployment.customer_id,
                    "customer_name": deployment.customer_name,
                    "next_audit": deployment.next_audit.isoformat(),
                    "days_until_audit": (deployment.next_audit - datetime.utcnow()).days
                } for deployment in self.customer_deployments.values()
                if deployment.next_audit > datetime.utcnow()
            ]
        }

    async def perform_soc2_compliance_audit(
        self,
        customer_id: Optional[str] = None,
        audit_type: AuditType = AuditType.SOC2_TYPE_II,
        auditor: str = "system"
    ) -> ComplianceAudit:
        """Perform SOC2 compliance audit for a customer or all customers"""
        
        audit_id = str(uuid.uuid4())
        start_date = datetime.utcnow()
        
        # Perform audit based on type
        if customer_id:
            deployment = self.customer_deployments.get(customer_id)
            if not deployment:
                raise ValueError(f"Customer deployment not found: {customer_id}")
            
            findings, recommendations, compliance_score = await self._audit_customer_deployment(deployment, audit_type)
        else:
            # System-wide audit
            findings, recommendations, compliance_score = await self._audit_all_deployments(audit_type)
        
        audit = ComplianceAudit(
            audit_id=audit_id,
            customer_id=customer_id,
            audit_type=audit_type,
            status=ComplianceStatus.COMPLIANT if compliance_score >= 90 else ComplianceStatus.NON_COMPLIANT,
            start_date=start_date,
            end_date=datetime.utcnow(),
            auditor=auditor,
            findings=findings,
            recommendations=recommendations,
            compliance_score=compliance_score,
            controls_assessed=sum(criteria['controls'] for criteria in self.soc2_criteria.values()),
            controls_passed=int(compliance_score / 100 * sum(criteria['controls'] for criteria in self.soc2_criteria.values())),
            created_at=start_date
        )
        
        self.compliance_audits[audit_id] = audit
        
        # Update customer deployment compliance score
        if customer_id and customer_id in self.customer_deployments:
            self.customer_deployments[customer_id].compliance_score = compliance_score
            self.customer_deployments[customer_id].last_audit = start_date
            self.customer_deployments[customer_id].updated_at = datetime.utcnow()
        
        logger.info(f"SOC2 compliance audit completed: {audit_id}, score: {compliance_score}")
        return audit

    async def _audit_customer_deployment(self, deployment: CustomerDeployment, audit_type: AuditType) -> Tuple[List[Dict[str, Any]], List[str], float]:
        """Audit a specific customer deployment"""
        
        findings = []
        recommendations = []
        
        # Security controls assessment
        security_score = await self._assess_security_controls(deployment)
        if security_score < 95:
            findings.append({
                "category": "security",
                "severity": "medium",
                "description": f"Security controls score below threshold: {security_score}%",
                "controls_affected": ["CC6.1", "CC6.2", "CC6.3"]
            })
            recommendations.append("Review and strengthen security controls implementation")
        
        # Availability assessment
        availability_score = await self._assess_availability_controls(deployment)
        if availability_score < 99:
            findings.append({
                "category": "availability",
                "severity": "high",
                "description": f"Availability controls score below threshold: {availability_score}%",
                "controls_affected": ["CC7.1", "CC7.2"]
            })
            recommendations.append("Implement additional availability monitoring and failover mechanisms")
        
        # Processing integrity assessment
        processing_score = await self._assess_processing_integrity_controls(deployment)
        if processing_score < 98:
            findings.append({
                "category": "processing_integrity",
                "severity": "medium",
                "description": f"Processing integrity controls need improvement: {processing_score}%",
                "controls_affected": ["CC8.1"]
            })
            recommendations.append("Enhance data processing validation and integrity checks")
        
        # Confidentiality assessment
        confidentiality_score = await self._assess_confidentiality_controls(deployment)
        if confidentiality_score < 95:
            findings.append({
                "category": "confidentiality",
                "severity": "high",
                "description": f"Confidentiality controls require attention: {confidentiality_score}%",
                "controls_affected": ["CC9.1"]
            })
            recommendations.append("Strengthen data encryption and access controls")
        
        # Privacy assessment
        privacy_score = await self._assess_privacy_controls(deployment)
        if privacy_score < 90:
            findings.append({
                "category": "privacy",
                "severity": "medium",
                "description": f"Privacy controls need enhancement: {privacy_score}%",
                "controls_affected": ["CC9.2"]
            })
            recommendations.append("Implement comprehensive privacy controls and data minimization")
        
        # Calculate overall compliance score
        overall_score = (
            security_score * self.soc2_criteria['security']['weight'] +
            availability_score * self.soc2_criteria['availability']['weight'] +
            processing_score * self.soc2_criteria['processing_integrity']['weight'] +
            confidentiality_score * self.soc2_criteria['confidentiality']['weight'] +
            privacy_score * self.soc2_criteria['privacy']['weight']
        )
        
        return findings, recommendations, round(overall_score, 2)

    async def _assess_security_controls(self, deployment: CustomerDeployment) -> float:
        """Assess security controls for a deployment"""
        
        # Mock assessment - in real implementation, this would check actual controls
        base_score = 95.0
        
        # Adjust based on security incidents
        if deployment.security_incidents > 0:
            base_score -= min(deployment.security_incidents * 2, 10)
        
        # Adjust based on vulnerabilities
        if deployment.vulnerabilities > 0:
            base_score -= min(deployment.vulnerabilities * 1.5, 8)
        
        return max(base_score, 70.0)  # Minimum score

    async def _assess_availability_controls(self, deployment: CustomerDeployment) -> float:
        """Assess availability controls"""
        
        # Mock assessment based on deployment type and status
        if deployment.deployment_type == CustomerDeploymentType.CLOUD:
            return 99.5
        elif deployment.deployment_type == CustomerDeploymentType.HYBRID:
            return 98.8
        else:
            return 97.2

    async def _assess_processing_integrity_controls(self, deployment: CustomerDeployment) -> float:
        """Assess processing integrity controls"""
        
        # Mock assessment
        return 98.5

    async def _assess_confidentiality_controls(self, deployment: CustomerDeployment) -> float:
        """Assess confidentiality controls"""
        
        # Mock assessment
        return 96.8

    async def _assess_privacy_controls(self, deployment: CustomerDeployment) -> float:
        """Assess privacy controls"""
        
        # Mock assessment
        return 92.3

    async def _audit_all_deployments(self, audit_type: AuditType) -> Tuple[List[Dict[str, Any]], List[str], float]:
        """Audit all customer deployments"""
        
        all_findings = []
        all_recommendations = []
        total_score = 0
        deployment_count = 0
        
        for deployment in self.customer_deployments.values():
            findings, recommendations, score = await self._audit_customer_deployment(deployment, audit_type)
            all_findings.extend(findings)
            all_recommendations.extend(recommendations)
            total_score += score
            deployment_count += 1
        
        average_score = total_score / deployment_count if deployment_count > 0 else 0
        
        return all_findings, list(set(all_recommendations)), round(average_score, 2)

    async def perform_internal_codebase_audit(
        self,
        repository: str,
        branch: str = "main",
        auditor: str = "system"
    ) -> InternalCodebaseAudit:
        """Perform internal codebase audit for SOC2 compliance"""
        
        audit_id = str(uuid.uuid4())
        audit_date = datetime.utcnow()
        
        # Mock codebase audit - in real implementation, this would integrate with security scanners
        security_score = 88.5
        vulnerabilities_found = 3
        code_quality_score = 92.1
        compliance_issues = [
            "Missing security headers in API responses",
            "Hardcoded secrets in configuration files",
            "Insufficient input validation in user endpoints"
        ]
        
        audit = InternalCodebaseAudit(
            audit_id=audit_id,
            repository=repository,
            branch=branch,
            commit_hash="abc123def456",  # Would be actual commit hash
            security_score=security_score,
            vulnerabilities_found=vulnerabilities_found,
            code_quality_score=code_quality_score,
            compliance_issues=compliance_issues,
            audit_date=audit_date,
            auditor=auditor
        )
        
        self.codebase_audits[audit_id] = audit
        
        logger.info(f"Internal codebase audit completed: {audit_id} for {repository}")
        return audit

    async def get_customer_deployments(self) -> List[CustomerDeployment]:
        """Get all customer deployments"""
        
        return list(self.customer_deployments.values())

    async def get_compliance_audits(self, customer_id: Optional[str] = None) -> List[ComplianceAudit]:
        """Get compliance audits, optionally filtered by customer"""
        
        audits = list(self.compliance_audits.values())
        
        if customer_id:
            audits = [audit for audit in audits if audit.customer_id == customer_id]
        
        return sorted(audits, key=lambda x: x.start_date, reverse=True)

    async def get_internal_audits(self) -> List[InternalCodebaseAudit]:
        """Get all internal codebase audits"""
        
        return sorted(list(self.codebase_audits.values()), key=lambda x: x.audit_date, reverse=True)

    async def generate_compliance_report(
        self,
        customer_id: Optional[str] = None,
        report_type: str = "comprehensive"
    ) -> Dict[str, Any]:
        """Generate comprehensive compliance report"""
        
        if customer_id:
            deployment = self.customer_deployments.get(customer_id)
            if not deployment:
                raise ValueError(f"Customer deployment not found: {customer_id}")
            
            # Customer-specific report
            audits = await self.get_compliance_audits(customer_id)
            
            return {
                "report_type": "customer_specific",
                "customer_id": customer_id,
                "customer_name": deployment.customer_name,
                "deployment_type": deployment.deployment_type.value,
                "current_compliance_score": deployment.compliance_score,
                "last_audit": deployment.last_audit.isoformat() if deployment.last_audit else None,
                "next_audit": deployment.next_audit.isoformat(),
                "audit_history": [
                    {
                        "audit_id": audit.audit_id,
                        "audit_type": audit.audit_type.value,
                        "status": audit.status.value,
                        "compliance_score": audit.compliance_score,
                        "start_date": audit.start_date.isoformat(),
                        "findings_count": len(audit.findings),
                        "recommendations_count": len(audit.recommendations)
                    } for audit in audits
                ],
                "security_metrics": {
                    "security_incidents": deployment.security_incidents,
                    "vulnerabilities": deployment.vulnerabilities,
                    "components": deployment.components
                },
                "generated_at": datetime.utcnow().isoformat()
            }
        else:
            # System-wide report
            all_audits = await self.get_compliance_audits()
            all_deployments = await self.get_customer_deployments()
            
            return {
                "report_type": "system_wide",
                "total_customers": len(all_deployments),
                "overall_compliance_score": sum(d.compliance_score for d in all_deployments) / len(all_deployments),
                "deployment_breakdown": {
                    "self_hosted": len([d for d in all_deployments if d.deployment_type == CustomerDeploymentType.SELF_HOSTED]),
                    "hybrid": len([d for d in all_deployments if d.deployment_type == CustomerDeploymentType.HYBRID]),
                    "cloud": len([d for d in all_deployments if d.deployment_type == CustomerDeploymentType.CLOUD])
                },
                "compliance_summary": {
                    "compliant_customers": len([d for d in all_deployments if d.compliance_score >= 90]),
                    "partially_compliant": len([d for d in all_deployments if 80 <= d.compliance_score < 90]),
                    "non_compliant": len([d for d in all_deployments if d.compliance_score < 80])
                },
                "recent_audits": len([a for a in all_audits if a.start_date >= datetime.utcnow() - timedelta(days=30)]),
                "total_audits": len(all_audits),
                "generated_at": datetime.utcnow().isoformat()
            }

    async def monitor_customer_deployment(self, customer_id: str) -> Dict[str, Any]:
        """Monitor real-time compliance status of a customer deployment"""
        
        deployment = self.customer_deployments.get(customer_id)
        if not deployment:
            raise ValueError(f"Customer deployment not found: {customer_id}")
        
        # Real-time monitoring data (mock)
        monitoring_data = {
            "customer_id": customer_id,
            "deployment_id": deployment.deployment_id,
            "status": deployment.status,
            "compliance_score": deployment.compliance_score,
            "last_updated": deployment.updated_at.isoformat(),
            "real_time_metrics": {
                "system_uptime": 99.9,
                "security_incidents_last_24h": 0,
                "vulnerabilities_detected": deployment.vulnerabilities,
                "active_alerts": 1,
                "data_encryption_status": "enabled",
                "access_controls_status": "active",
                "audit_logging_status": "enabled"
            },
            "component_status": {
                "pap": "healthy",
                "bouncer": "healthy",
                "opal": "warning",
                "business_admin": "healthy"
            },
            "compliance_alerts": [
                {
                    "type": "warning",
                    "message": "OPAL synchronization issues detected",
                    "timestamp": datetime.utcnow().isoformat()
                }
            ]
        }
        
        return monitoring_data

    def get_compliance_statistics(self) -> Dict[str, Any]:
        """Get comprehensive compliance statistics"""
        
        total_customers = len(self.customer_deployments)
        total_audits = len(self.compliance_audits)
        total_internal_audits = len(self.codebase_audits)
        
        # Compliance distribution
        compliance_distribution = {
            "90-100": len([d for d in self.customer_deployments.values() if d.compliance_score >= 90]),
            "80-89": len([d for d in self.customer_deployments.values() if 80 <= d.compliance_score < 90]),
            "70-79": len([d for d in self.customer_deployments.values() if 70 <= d.compliance_score < 80]),
            "below_70": len([d for d in self.customer_deployments.values() if d.compliance_score < 70])
        }
        
        # Audit trends (mock data)
        audit_trends = []
        for i in range(12):  # Last 12 months
            month = datetime.utcnow() - timedelta(days=30*i)
            audit_trends.append({
                "month": month.strftime("%Y-%m"),
                "audits_performed": max(0, 3 + (i % 3) - 1),  # Mock trend
                "average_score": 90 + (i % 10) - 5  # Mock trend
            })
        
        return {
            "overview": {
                "total_customers": total_customers,
                "total_audits": total_audits,
                "total_internal_audits": total_internal_audits,
                "average_compliance_score": sum(d.compliance_score for d in self.customer_deployments.values()) / total_customers if total_customers > 0 else 0
            },
            "compliance_distribution": compliance_distribution,
            "audit_trends": audit_trends,
            "deployment_types": {
                "self_hosted": len([d for d in self.customer_deployments.values() if d.deployment_type == CustomerDeploymentType.SELF_HOSTED]),
                "hybrid": len([d for d in self.customer_deployments.values() if d.deployment_type == CustomerDeploymentType.HYBRID]),
                "cloud": len([d for d in self.customer_deployments.values() if d.deployment_type == CustomerDeploymentType.CLOUD])
            },
            "security_metrics": {
                "total_security_incidents": sum(d.security_incidents for d in self.customer_deployments.values()),
                "total_vulnerabilities": sum(d.vulnerabilities for d in self.customer_deployments.values()),
                "critical_findings": 2,  # Mock data
                "resolved_findings": 15  # Mock data
            }
        }

# Global business admin portal service instance
business_admin_portal_service = None

def get_business_admin_portal_service(db: Session) -> BusinessAdminPortalService:
    """Get business admin portal service instance"""
    global business_admin_portal_service
    if business_admin_portal_service is None:
        business_admin_portal_service = BusinessAdminPortalService(db)
    return business_admin_portal_service
