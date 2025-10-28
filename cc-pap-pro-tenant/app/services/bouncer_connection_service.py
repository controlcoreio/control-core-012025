from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models import TenantBouncerConnection, TenantBouncerCertificate, TenantBouncerMetrics
from app.schemas import BouncerConnectionCreate, BouncerConnectionUpdate
from typing import List, Optional, Dict, Any
import uuid
import logging
from datetime import datetime
import requests
import ssl
import socket
import json

logger = logging.getLogger(__name__)

class BouncerConnectionService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_bouncer_connection(self, tenant_id: str, connection_data: BouncerConnectionCreate) -> TenantBouncerConnection:
        """Create a new bouncer connection"""
        try:
            connection = TenantBouncerConnection(
                id=str(uuid.uuid4()),
                tenant_id=tenant_id,
                name=connection_data.name,
                bouncer_host=connection_data.bouncer_host,
                bouncer_port=connection_data.bouncer_port,
                connection_type=connection_data.connection_type,
                status="pending",
                config=connection_data.config or {},
                security_config=connection_data.security_config or {},
                monitoring_config=connection_data.monitoring_config or {}
            )
            
            self.db.add(connection)
            self.db.commit()
            self.db.refresh(connection)
            
            logger.info(f"Created bouncer connection {connection.id} for tenant {tenant_id}")
            return connection
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating bouncer connection: {e}")
            raise
    
    def get_bouncer_connections(self, tenant_id: str, skip: int = 0, limit: int = 100, 
                               status: Optional[str] = None) -> List[TenantBouncerConnection]:
        """Get bouncer connections for tenant with filters"""
        try:
            query = self.db.query(TenantBouncerConnection).filter(TenantBouncerConnection.tenant_id == tenant_id)
            
            if status:
                query = query.filter(TenantBouncerConnection.status == status)
            
            connections = query.offset(skip).limit(limit).all()
            return connections
            
        except Exception as e:
            logger.error(f"Error getting bouncer connections: {e}")
            raise
    
    def get_bouncer_connection_by_id(self, connection_id: str, tenant_id: str) -> Optional[TenantBouncerConnection]:
        """Get bouncer connection by ID"""
        try:
            connection = self.db.query(TenantBouncerConnection).filter(
                and_(
                    TenantBouncerConnection.id == connection_id,
                    TenantBouncerConnection.tenant_id == tenant_id
                )
            ).first()
            
            return connection
            
        except Exception as e:
            logger.error(f"Error getting bouncer connection: {e}")
            raise
    
    def update_bouncer_connection(self, connection_id: str, tenant_id: str, 
                                connection_data: BouncerConnectionUpdate) -> Optional[TenantBouncerConnection]:
        """Update bouncer connection"""
        try:
            connection = self.get_bouncer_connection_by_id(connection_id, tenant_id)
            if not connection:
                return None
            
            update_data = connection_data.dict(exclude_unset=True)
            for field, value in update_data.items():
                setattr(connection, field, value)
            
            connection.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(connection)
            
            logger.info(f"Updated bouncer connection {connection_id}")
            return connection
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating bouncer connection: {e}")
            raise
    
    def delete_bouncer_connection(self, connection_id: str, tenant_id: str) -> bool:
        """Delete bouncer connection"""
        try:
            connection = self.get_bouncer_connection_by_id(connection_id, tenant_id)
            if not connection:
                return False
            
            self.db.delete(connection)
            self.db.commit()
            
            logger.info(f"Deleted bouncer connection {connection_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting bouncer connection: {e}")
            raise
    
    def test_bouncer_connection(self, connection_id: str, tenant_id: str) -> Dict[str, Any]:
        """Test bouncer connection"""
        try:
            connection = self.get_bouncer_connection_by_id(connection_id, tenant_id)
            if not connection:
                return {"success": False, "error": "Connection not found"}
            
            # Test connection based on type
            if connection.connection_type == "http":
                return self._test_http_connection(connection)
            elif connection.connection_type == "https":
                return self._test_https_connection(connection)
            elif connection.connection_type == "tcp":
                return self._test_tcp_connection(connection)
            elif connection.connection_type == "tls":
                return self._test_tls_connection(connection)
            else:
                return {"success": False, "error": f"Unsupported connection type: {connection.connection_type}"}
                
        except Exception as e:
            logger.error(f"Error testing bouncer connection: {e}")
            return {"success": False, "error": str(e)}
    
    def _test_http_connection(self, connection: TenantBouncerConnection) -> Dict[str, Any]:
        """Test HTTP connection"""
        try:
            url = f"http://{connection.bouncer_host}:{connection.bouncer_port}/health"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "status_code": response.status_code,
                    "response_time": response.elapsed.total_seconds(),
                    "message": "HTTP connection successful"
                }
            else:
                return {
                    "success": False,
                    "status_code": response.status_code,
                    "error": f"HTTP connection failed with status {response.status_code}"
                }
                
        except requests.exceptions.Timeout:
            return {"success": False, "error": "Connection timeout"}
        except requests.exceptions.ConnectionError:
            return {"success": False, "error": "Connection refused"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _test_https_connection(self, connection: TenantBouncerConnection) -> Dict[str, Any]:
        """Test HTTPS connection"""
        try:
            url = f"https://{connection.bouncer_host}:{connection.bouncer_port}/health"
            response = requests.get(url, timeout=10, verify=True)
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "status_code": response.status_code,
                    "response_time": response.elapsed.total_seconds(),
                    "message": "HTTPS connection successful"
                }
            else:
                return {
                    "success": False,
                    "status_code": response.status_code,
                    "error": f"HTTPS connection failed with status {response.status_code}"
                }
                
        except requests.exceptions.SSLError as e:
            return {"success": False, "error": f"SSL error: {str(e)}"}
        except requests.exceptions.Timeout:
            return {"success": False, "error": "Connection timeout"}
        except requests.exceptions.ConnectionError:
            return {"success": False, "error": "Connection refused"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _test_tcp_connection(self, connection: TenantBouncerConnection) -> Dict[str, Any]:
        """Test TCP connection"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(10)
            result = sock.connect_ex((connection.bouncer_host, connection.bouncer_port))
            sock.close()
            
            if result == 0:
                return {
                    "success": True,
                    "message": "TCP connection successful"
                }
            else:
                return {
                    "success": False,
                    "error": f"TCP connection failed with error code {result}"
                }
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _test_tls_connection(self, connection: TenantBouncerConnection) -> Dict[str, Any]:
        """Test TLS connection"""
        try:
            context = ssl.create_default_context()
            with socket.create_connection((connection.bouncer_host, connection.bouncer_port), timeout=10) as sock:
                with context.wrap_socket(sock, server_hostname=connection.bouncer_host) as ssock:
                    return {
                        "success": True,
                        "message": "TLS connection successful",
                        "certificate": {
                            "subject": ssock.getpeercert().get('subject', []),
                            "issuer": ssock.getpeercert().get('issuer', []),
                            "version": ssock.getpeercert().get('version', 0),
                            "serial_number": ssock.getpeercert().get('serialNumber', ''),
                            "not_before": ssock.getpeercert().get('notBefore', ''),
                            "not_after": ssock.getpeercert().get('notAfter', '')
                        }
                    }
                    
        except ssl.SSLError as e:
            return {"success": False, "error": f"SSL error: {str(e)}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def sync_bouncer_connection(self, connection_id: str, tenant_id: str) -> Dict[str, Any]:
        """Sync bouncer connection"""
        try:
            connection = self.get_bouncer_connection_by_id(connection_id, tenant_id)
            if not connection:
                return {"success": False, "error": "Connection not found"}
            
            # Test connection first
            test_result = self.test_bouncer_connection(connection_id, tenant_id)
            if not test_result["success"]:
                return test_result
            
            # Update connection status
            connection.status = "active"
            connection.last_sync = datetime.utcnow()
            self.db.commit()
            
            logger.info(f"Synced bouncer connection {connection_id}")
            return {
                "success": True,
                "message": "Bouncer connection synced successfully",
                "connection_id": connection_id,
                "status": connection.status,
                "last_sync": connection.last_sync
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error syncing bouncer connection: {e}")
            return {"success": False, "error": str(e)}
    
    def get_bouncer_certificates(self, connection_id: str, tenant_id: str) -> List[Dict[str, Any]]:
        """Get bouncer connection certificates"""
        try:
            connection = self.get_bouncer_connection_by_id(connection_id, tenant_id)
            if not connection:
                return []
            
            certificates = self.db.query(TenantBouncerCertificate).filter(
                TenantBouncerCertificate.connection_id == connection_id
            ).all()
            
            return [
                {
                    "id": cert.id,
                    "name": cert.name,
                    "type": cert.type,
                    "subject": cert.subject,
                    "issuer": cert.issuer,
                    "valid_from": cert.valid_from,
                    "valid_to": cert.valid_to,
                    "status": cert.status,
                    "created_at": cert.created_at
                }
                for cert in certificates
            ]
            
        except Exception as e:
            logger.error(f"Error getting bouncer certificates: {e}")
            return []
    
    def upload_bouncer_certificate(self, connection_id: str, tenant_id: str, 
                                 certificate_data: Dict[str, Any]) -> Dict[str, Any]:
        """Upload bouncer connection certificate"""
        try:
            connection = self.get_bouncer_connection_by_id(connection_id, tenant_id)
            if not connection:
                return {"success": False, "error": "Connection not found"}
            
            certificate = TenantBouncerCertificate(
                id=str(uuid.uuid4()),
                connection_id=connection_id,
                name=certificate_data.get("name", "Certificate"),
                type=certificate_data.get("type", "client"),
                subject=certificate_data.get("subject", ""),
                issuer=certificate_data.get("issuer", ""),
                valid_from=certificate_data.get("valid_from"),
                valid_to=certificate_data.get("valid_to"),
                status="active",
                certificate_data=certificate_data.get("certificate_data", {})
            )
            
            self.db.add(certificate)
            self.db.commit()
            self.db.refresh(certificate)
            
            logger.info(f"Uploaded certificate {certificate.id} for connection {connection_id}")
            return {
                "success": True,
                "message": "Certificate uploaded successfully",
                "certificate_id": certificate.id
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error uploading bouncer certificate: {e}")
            return {"success": False, "error": str(e)}
    
    def get_bouncer_metrics(self, connection_id: str, tenant_id: str, time_range: str) -> Dict[str, Any]:
        """Get bouncer connection metrics"""
        try:
            connection = self.get_bouncer_connection_by_id(connection_id, tenant_id)
            if not connection:
                return {"error": "Connection not found"}
            
            # Get metrics from database
            metrics = self.db.query(TenantBouncerMetrics).filter(
                TenantBouncerMetrics.connection_id == connection_id
            ).order_by(TenantBouncerMetrics.timestamp.desc()).limit(1000).all()
            
            # Process metrics
            processed_metrics = {
                "connection_id": connection_id,
                "time_range": time_range,
                "metrics": {
                    "requests_per_second": 0,
                    "average_response_time": 0,
                    "error_rate": 0,
                    "uptime": 0,
                    "throughput": 0
                },
                "data_points": []
            }
            
            for metric in metrics:
                processed_metrics["data_points"].append({
                    "timestamp": metric.timestamp.isoformat(),
                    "metric_name": metric.metric_name,
                    "metric_value": metric.metric_value,
                    "labels": metric.labels
                })
            
            return processed_metrics
            
        except Exception as e:
            logger.error(f"Error getting bouncer metrics: {e}")
            return {"error": str(e)}
    
    def get_bouncer_logs(self, connection_id: str, tenant_id: str, skip: int = 0, 
                        limit: int = 100, level: Optional[str] = None,
                        start_time: Optional[str] = None, end_time: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get bouncer connection logs"""
        try:
            connection = self.get_bouncer_connection_by_id(connection_id, tenant_id)
            if not connection:
                return []
            
            # In a real implementation, this would query a logs table
            # For now, return mock logs
            mock_logs = [
                {
                    "timestamp": datetime.utcnow().isoformat(),
                    "level": "info",
                    "message": "Bouncer connection established",
                    "connection_id": connection_id
                },
                {
                    "timestamp": datetime.utcnow().isoformat(),
                    "level": "debug",
                    "message": "Policy evaluation completed",
                    "connection_id": connection_id
                }
            ]
            
            return mock_logs
            
        except Exception as e:
            logger.error(f"Error getting bouncer logs: {e}")
            return []
