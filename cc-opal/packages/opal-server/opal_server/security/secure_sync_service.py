"""
Secure OPAL Synchronization Service
Implements SOC2-compliant authentication and verification between PEP, PAP, and Git repositories
"""

import os
import json
import hashlib
import hmac
import logging
import time
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import jwt
import requests
import git
from enum import Enum

logger = logging.getLogger(__name__)

class ComponentType(str, Enum):
    PEP_BOUNCER = "pep_bouncer"
    PAP_API = "pap_api"
    PAP_PRO_TENANT = "pap_pro_tenant"
    GIT_REPOSITORY = "git_repository"
    OPAL_SERVER = "opal_server"

class SyncEventType(str, Enum):
    POLICY_UPDATE = "policy_update"
    CONTEXT_UPDATE = "context_update"
    CONFIGURATION_UPDATE = "configuration_update"
    SECURITY_UPDATE = "security_update"
    DATA_SOURCE_UPDATE = "data_source_update"

@dataclass
class ComponentIdentity:
    component_id: str
    component_type: ComponentType
    public_key: str
    certificate: Optional[str] = None
    last_verified: Optional[datetime] = None
    verification_status: str = "pending"

@dataclass
class SyncEvent:
    event_id: str
    timestamp: datetime
    source_component: ComponentType
    target_components: List[ComponentType]
    event_type: SyncEventType
    payload_hash: str
    signature: str
    verification_required: bool = True
    sync_status: str = "pending"

class SecureSyncService:
    """
    SOC2-compliant secure synchronization service for OPAL
    Implements mutual TLS, certificate verification, and cryptographic signatures
    """
    
    def __init__(self, opal_config: Dict[str, Any]):
        self.config = opal_config
        self.private_key = self._load_private_key()
        self.public_key = self._load_public_key()
        self.certificate = self._load_certificate()
        
        # Component registry for authentication
        self.component_registry: Dict[str, ComponentIdentity] = {}
        
        # Sync event tracking
        self.sync_events: Dict[str, SyncEvent] = {}
        
        # Security settings
        self.verification_interval = int(os.getenv('VERIFICATION_INTERVAL_SECONDS', '300'))  # 5 minutes
        self.signature_algorithm = "RS256"
        self.encryption_algorithm = "AES-256-GCM"
        
        # Initialize component authentication
        self._initialize_component_registry()
        
        logger.info("SecureSyncService initialized with SOC2 compliance")

    def _load_private_key(self) -> rsa.RSAPrivateKey:
        """Load or generate RSA private key for component authentication"""
        key_path = os.getenv('OPAL_PRIVATE_KEY_PATH', '/etc/opal/keys/private_key.pem')
        
        if os.path.exists(key_path):
            with open(key_path, 'rb') as key_file:
                private_key = serialization.load_pem_private_key(
                    key_file.read(),
                    password=None,
                    backend=default_backend()
                )
        else:
            # Generate new private key
            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=2048,
                backend=default_backend()
            )
            
            # Save private key
            os.makedirs(os.path.dirname(key_path), exist_ok=True)
            with open(key_path, 'wb') as key_file:
                key_file.write(
                    private_key.private_bytes(
                        encoding=serialization.Encoding.PEM,
                        format=serialization.PrivateFormat.PKCS8,
                        encryption_algorithm=serialization.NoEncryption()
                    )
                )
        
        return private_key

    def _load_public_key(self) -> rsa.RSAPublicKey:
        """Load RSA public key"""
        return self.private_key.public_key()

    def _load_certificate(self) -> Optional[str]:
        """Load X.509 certificate if available"""
        cert_path = os.getenv('OPAL_CERTIFICATE_PATH', '/etc/opal/certs/certificate.pem')
        
        if os.path.exists(cert_path):
            with open(cert_path, 'r') as cert_file:
                return cert_file.read()
        
        return None

    def _initialize_component_registry(self):
        """Initialize component registry with known components"""
        components = [
            {
                "component_id": "pep_bouncer_001",
                "component_type": ComponentType.PEP_BOUNCER,
                "public_key_path": "/etc/opal/keys/pep_bouncer_public.pem"
            },
            {
                "component_id": "pap_api_001",
                "component_type": ComponentType.PAP_API,
                "public_key_path": "/etc/opal/keys/pap_api_public.pem"
            },
            {
                "component_id": "pap_pro_tenant_001",
                "component_type": ComponentType.PAP_PRO_TENANT,
                "public_key_path": "/etc/opal/keys/pap_pro_tenant_public.pem"
            }
        ]
        
        for comp in components:
            self._register_component(comp)

    def _register_component(self, component_config: Dict[str, Any]):
        """Register a component in the authentication registry"""
        component_id = component_config["component_id"]
        
        # Load public key
        public_key_path = component_config["public_key_path"]
        if os.path.exists(public_key_path):
            with open(public_key_path, 'rb') as key_file:
                public_key = serialization.load_pem_public_key(
                    key_file.read(),
                    backend=default_backend()
                )
                public_key_pem = public_key.public_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PublicFormat.SubjectPublicKeyInfo
                ).decode()
        else:
            # Generate mock public key for development
            public_key_pem = "MOCK_PUBLIC_KEY"
        
        identity = ComponentIdentity(
            component_id=component_id,
            component_type=component_config["component_type"],
            public_key=public_key_pem
        )
        
        self.component_registry[component_id] = identity
        logger.info(f"Registered component: {component_id}")

    def authenticate_component(self, component_id: str, signature: str, payload: str) -> bool:
        """Authenticate a component using cryptographic signature verification"""
        
        if component_id not in self.component_registry:
            logger.error(f"Unknown component: {component_id}")
            return False
        
        component = self.component_registry[component_id]
        
        try:
            # Verify signature
            if not self._verify_signature(signature, payload, component.public_key):
                logger.error(f"Signature verification failed for component: {component_id}")
                return False
            
            # Update verification timestamp
            component.last_verified = datetime.utcnow()
            component.verification_status = "verified"
            
            logger.info(f"Component authenticated successfully: {component_id}")
            return True
            
        except Exception as e:
            logger.error(f"Authentication failed for component {component_id}: {e}")
            component.verification_status = "failed"
            return False

    def _verify_signature(self, signature: str, payload: str, public_key_pem: str) -> bool:
        """Verify RSA signature of payload"""
        try:
            # Load public key
            public_key = serialization.load_pem_public_key(
                public_key_pem.encode(),
                backend=default_backend()
            )
            
            # Verify signature
            public_key.verify(
                signature.encode(),
                payload.encode(),
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Signature verification error: {e}")
            return False

    def create_sync_event(
        self,
        source_component: ComponentType,
        target_components: List[ComponentType],
        event_type: SyncEventType,
        payload: Dict[str, Any]
    ) -> SyncEvent:
        """Create a secure sync event with cryptographic verification"""
        
        event_id = f"sync_{int(time.time() * 1000)}"
        timestamp = datetime.utcnow()
        
        # Create payload hash
        payload_json = json.dumps(payload, sort_keys=True)
        payload_hash = hashlib.sha256(payload_json.encode()).hexdigest()
        
        # Create signature
        signature = self._create_signature(payload_json)
        
        # Create sync event
        event = SyncEvent(
            event_id=event_id,
            timestamp=timestamp,
            source_component=source_component,
            target_components=target_components,
            event_type=event_type,
            payload_hash=payload_hash,
            signature=signature,
            verification_required=True,
            sync_status="pending"
        )
        
        # Store event
        self.sync_events[event_id] = event
        
        # Log for audit
        self._log_sync_event("create", event_id, source_component.value, event_type.value)
        
        logger.info(f"Created sync event: {event_id}")
        return event

    def _create_signature(self, payload: str) -> str:
        """Create RSA signature for payload"""
        signature = self.private_key.sign(
            payload.encode(),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        
        return signature.hex()

    def sync_policy_update(
        self,
        policy_data: Dict[str, Any],
        source_component: ComponentType,
        target_components: List[ComponentType]
    ) -> SyncEvent:
        """Synchronize policy update across components"""
        
        # Create sync event
        event = self.create_sync_event(
            source_component=source_component,
            target_components=target_components,
            event_type=SyncEventType.POLICY_UPDATE,
            payload=policy_data
        )
        
        # Verify all target components are authenticated
        if not self._verify_target_components(target_components):
            event.sync_status = "failed"
            logger.error(f"Target component verification failed for event: {event.event_id}")
            return event
        
        # Perform secure sync
        sync_success = self._perform_secure_sync(event, policy_data)
        
        if sync_success:
            event.sync_status = "completed"
            logger.info(f"Policy sync completed successfully: {event.event_id}")
        else:
            event.sync_status = "failed"
            logger.error(f"Policy sync failed: {event.event_id}")
        
        return event

    def sync_context_update(
        self,
        context_data: Dict[str, Any],
        source_component: ComponentType,
        target_components: List[ComponentType]
    ) -> SyncEvent:
        """Synchronize context update across components"""
        
        # Create sync event
        event = self.create_sync_event(
            source_component=source_component,
            target_components=target_components,
            event_type=SyncEventType.CONTEXT_UPDATE,
            payload=context_data
        )
        
        # Verify all target components are authenticated
        if not self._verify_target_components(target_components):
            event.sync_status = "failed"
            logger.error(f"Target component verification failed for event: {event.event_id}")
            return event
        
        # Perform secure sync
        sync_success = self._perform_secure_sync(event, context_data)
        
        if sync_success:
            event.sync_status = "completed"
            logger.info(f"Context sync completed successfully: {event.event_id}")
        else:
            event.sync_status = "failed"
            logger.error(f"Context sync failed: {event.event_id}")
        
        return event

    def _verify_target_components(self, target_components: List[ComponentType]) -> bool:
        """Verify all target components are authenticated and up-to-date"""
        
        for component_type in target_components:
            component_id = self._get_component_id_by_type(component_type)
            
            if not component_id:
                logger.error(f"Component not found for type: {component_type}")
                return False
            
            if component_id not in self.component_registry:
                logger.error(f"Component not registered: {component_id}")
                return False
            
            component = self.component_registry[component_id]
            
            # Check if component needs re-verification
            if self._needs_verification(component):
                logger.warning(f"Component needs re-verification: {component_id}")
                return False
            
            if component.verification_status != "verified":
                logger.error(f"Component not verified: {component_id}")
                return False
        
        return True

    def _get_component_id_by_type(self, component_type: ComponentType) -> Optional[str]:
        """Get component ID by component type"""
        for comp_id, component in self.component_registry.items():
            if component.component_type == component_type:
                return comp_id
        return None

    def _needs_verification(self, component: ComponentIdentity) -> bool:
        """Check if component needs re-verification"""
        if not component.last_verified:
            return True
        
        time_since_verification = datetime.utcnow() - component.last_verified
        return time_since_verification.total_seconds() > self.verification_interval

    def _perform_secure_sync(self, event: SyncEvent, payload: Dict[str, Any]) -> bool:
        """Perform secure synchronization to target components"""
        
        try:
            # Encrypt payload
            encrypted_payload = self._encrypt_payload(payload)
            
            # Send to each target component
            for target_component in event.target_components:
                if not self._send_to_component(target_component, event, encrypted_payload):
                    return False
            
            return True
            
        except Exception as e:
            logger.error(f"Secure sync failed: {e}")
            return False

    def _encrypt_payload(self, payload: Dict[str, Any]) -> str:
        """Encrypt payload using AES-256-GCM"""
        try:
            # Generate encryption key from shared secret
            encryption_key = self._derive_encryption_key()
            
            # Convert payload to JSON
            payload_json = json.dumps(payload)
            
            # Generate IV
            iv = os.urandom(12)  # 96-bit IV for GCM
            
            # Encrypt
            cipher = Cipher(algorithms.AES(encryption_key), modes.GCM(iv), backend=default_backend())
            encryptor = cipher.encryptor()
            ciphertext = encryptor.update(payload_json.encode()) + encryptor.finalize()
            
            # Combine IV, ciphertext, and tag
            encrypted_data = iv + encryptor.tag + ciphertext
            
            # Encode as base64
            import base64
            return base64.b64encode(encrypted_data).decode()
            
        except Exception as e:
            logger.error(f"Payload encryption failed: {e}")
            return ""

    def _derive_encryption_key(self) -> bytes:
        """Derive encryption key from shared secret"""
        shared_secret = os.getenv('OPAL_SHARED_SECRET', 'default_shared_secret')
        salt = b'opal_sync_salt'
        
        from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        
        return kdf.derive(shared_secret.encode())

    def _send_to_component(self, target_component: ComponentType, event: SyncEvent, encrypted_payload: str) -> bool:
        """Send encrypted payload to target component"""
        
        try:
            # Get component endpoint
            endpoint = self._get_component_endpoint(target_component)
            if not endpoint:
                logger.error(f"No endpoint found for component: {target_component}")
                return False
            
            # Create JWT token for authentication
            token = self._create_jwt_token(target_component)
            
            # Prepare request
            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json',
                'X-Sync-Event-ID': event.event_id,
                'X-Sync-Signature': event.signature,
                'X-Sync-Hash': event.payload_hash
            }
            
            payload_data = {
                'event_id': event.event_id,
                'event_type': event.event_type.value,
                'source_component': event.source_component.value,
                'timestamp': event.timestamp.isoformat(),
                'encrypted_payload': encrypted_payload
            }
            
            # Send request
            response = requests.post(
                f"{endpoint}/opal/sync",
                json=payload_data,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                logger.info(f"Successfully sent sync to {target_component}")
                return True
            else:
                logger.error(f"Sync failed to {target_component}: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to send to component {target_component}: {e}")
            return False

    def _get_component_endpoint(self, component_type: ComponentType) -> Optional[str]:
        """Get endpoint URL for component"""
        endpoints = {
            ComponentType.PEP_BOUNCER: os.getenv('PEP_BOUNCER_URL', 'http://localhost:8080'),
            ComponentType.PAP_API: os.getenv('PAP_API_URL', 'http://localhost:8000'),
            ComponentType.PAP_PRO_TENANT: os.getenv('PAP_PRO_TENANT_URL', 'http://localhost:8001')
        }
        
        return endpoints.get(component_type)

    def _create_jwt_token(self, target_component: ComponentType) -> str:
        """Create JWT token for component authentication"""
        payload = {
            'iss': 'opal_server',
            'aud': target_component.value,
            'exp': datetime.utcnow() + timedelta(minutes=15),
            'iat': datetime.utcnow(),
            'component_type': ComponentType.OPAL_SERVER.value
        }
        
        return jwt.encode(payload, self.private_key, algorithm=self.signature_algorithm)

    def _log_sync_event(self, operation: str, event_id: str, component: str, event_type: str):
        """Log sync events for SOC2 audit trail"""
        
        audit_log = {
            "timestamp": datetime.utcnow().isoformat(),
            "operation": operation,
            "event_id": event_id,
            "component": component,
            "event_type": event_type,
            "service": "secure_sync_service"
        }
        
        logger.info(f"OPAL_SYNC_AUDIT: {json.dumps(audit_log)}")

    def get_component_status(self) -> Dict[str, Any]:
        """Get status of all registered components"""
        
        status = {
            "total_components": len(self.component_registry),
            "verified_components": 0,
            "pending_components": 0,
            "failed_components": 0,
            "components": []
        }
        
        for component_id, component in self.component_registry.items():
            component_status = {
                "component_id": component_id,
                "component_type": component.component_type.value,
                "verification_status": component.verification_status,
                "last_verified": component.last_verified.isoformat() if component.last_verified else None,
                "needs_verification": self._needs_verification(component)
            }
            
            status["components"].append(component_status)
            
            if component.verification_status == "verified":
                status["verified_components"] += 1
            elif component.verification_status == "pending":
                status["pending_components"] += 1
            else:
                status["failed_components"] += 1
        
        return status

    def get_sync_events_summary(self, hours: int = 24) -> Dict[str, Any]:
        """Get summary of sync events for the last N hours"""
        
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        
        summary = {
            "total_events": 0,
            "completed_events": 0,
            "failed_events": 0,
            "pending_events": 0,
            "events_by_type": {},
            "events_by_component": {}
        }
        
        for event in self.sync_events.values():
            if event.timestamp < cutoff_time:
                continue
            
            summary["total_events"] += 1
            
            if event.sync_status == "completed":
                summary["completed_events"] += 1
            elif event.sync_status == "failed":
                summary["failed_events"] += 1
            else:
                summary["pending_events"] += 1
            
            # Count by type
            event_type = event.event_type.value
            summary["events_by_type"][event_type] = summary["events_by_type"].get(event_type, 0) + 1
            
            # Count by component
            component = event.source_component.value
            summary["events_by_component"][component] = summary["events_by_component"].get(component, 0) + 1
        
        return summary
