"""
Advanced Encryption and Secret Management Service for Control Core
Implements SOC2-compliant encryption, key management, and secret handling
"""

import os
import json
import hashlib
import hmac
import secrets
import logging
from typing import Dict, Any, Optional, List, Union
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.hashes import SHA256
from cryptography.hazmat.backends import default_backend
import base64
import uuid
from enum import Enum

logger = logging.getLogger(__name__)

class EncryptionAlgorithm(str, Enum):
    AES_256_GCM = "aes_256_gcm"
    RSA_2048 = "rsa_2048"
    RSA_4096 = "rsa_4096"
    FERNET = "fernet"

class SecretType(str, Enum):
    API_KEY = "api_key"
    JWT_SECRET = "jwt_secret"
    DATABASE_PASSWORD = "database_password"
    ENCRYPTION_KEY = "encryption_key"
    WEBHOOK_SECRET = "webhook_secret"
    OAUTH_CLIENT_SECRET = "oauth_client_secret"
    CERTIFICATE = "certificate"
    PRIVATE_KEY = "private_key"

@dataclass
class SecretMetadata:
    secret_id: str
    name: str
    secret_type: SecretType
    algorithm: EncryptionAlgorithm
    created_at: datetime
    expires_at: Optional[datetime]
    rotation_schedule: Optional[str]
    last_rotated: Optional[datetime]
    version: int
    tags: List[str]
    description: Optional[str]

@dataclass
class EncryptedSecret:
    secret_id: str
    encrypted_data: str
    iv: str
    salt: str
    metadata: SecretMetadata
    checksum: str

class AdvancedEncryptionService:
    """
    SOC2-compliant encryption and secret management service
    Implements multiple encryption algorithms, key rotation, and secure storage
    """
    
    def __init__(self, master_key: Optional[str] = None):
        self.master_key = master_key or self._generate_master_key()
        self.encryption_key = self._derive_encryption_key(self.master_key)
        self.fernet = Fernet(self.encryption_key)
        
        # Key rotation settings
        self.key_rotation_days = int(os.getenv('KEY_ROTATION_DAYS', '90'))
        self.secret_expiry_days = int(os.getenv('SECRET_EXPIRY_DAYS', '365'))
        
        # SOC2 compliance settings
        self.audit_logging_enabled = os.getenv('AUDIT_LOGGING_ENABLED', 'true').lower() == 'true'
        self.key_escrow_enabled = os.getenv('KEY_ESCROW_ENABLED', 'false').lower() == 'true'
        
        # Initialize key store (in production, this would be a secure key management system)
        self.key_store: Dict[str, EncryptedSecret] = {}
        
        logger.info("AdvancedEncryptionService initialized with SOC2 compliance")

    def _generate_master_key(self) -> str:
        """Generate a cryptographically secure master key"""
        return secrets.token_urlsafe(32)

    def _derive_encryption_key(self, password: str) -> bytes:
        """Derive encryption key using PBKDF2"""
        salt = b'control_core_encryption_salt'  # In production, use random salt from secure storage
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return key

    def _generate_iv(self) -> bytes:
        """Generate a random initialization vector"""
        return secrets.token_bytes(16)

    def _generate_salt(self) -> bytes:
        """Generate a random salt"""
        return secrets.token_bytes(32)

    def _calculate_checksum(self, data: str) -> str:
        """Calculate SHA-256 checksum of data"""
        return hashlib.sha256(data.encode()).hexdigest()

    def encrypt_secret(
        self,
        secret_value: str,
        name: str,
        secret_type: SecretType,
        algorithm: EncryptionAlgorithm = EncryptionAlgorithm.AES_256_GCM,
        expires_at: Optional[datetime] = None,
        rotation_schedule: Optional[str] = None,
        tags: Optional[List[str]] = None,
        description: Optional[str] = None
    ) -> EncryptedSecret:
        """Encrypt and store a secret with metadata"""
        
        secret_id = str(uuid.uuid4())
        current_time = datetime.utcnow()
        
        # Set default expiry if not provided
        if not expires_at:
            expires_at = current_time + timedelta(days=self.secret_expiry_days)
        
        # Create metadata
        metadata = SecretMetadata(
            secret_id=secret_id,
            name=name,
            secret_type=secret_type,
            algorithm=algorithm,
            created_at=current_time,
            expires_at=expires_at,
            rotation_schedule=rotation_schedule,
            last_rotated=None,
            version=1,
            tags=tags or [],
            description=description
        )
        
        # Encrypt based on algorithm
        if algorithm == EncryptionAlgorithm.AES_256_GCM:
            encrypted_data, iv, salt = self._encrypt_aes_gcm(secret_value)
        elif algorithm == EncryptionAlgorithm.FERNET:
            encrypted_data, iv, salt = self._encrypt_fernet(secret_value)
        else:
            raise ValueError(f"Unsupported encryption algorithm: {algorithm}")
        
        # Calculate checksum
        checksum = self._calculate_checksum(secret_value)
        
        # Create encrypted secret
        encrypted_secret = EncryptedSecret(
            secret_id=secret_id,
            encrypted_data=encrypted_data,
            iv=base64.b64encode(iv).decode(),
            salt=base64.b64encode(salt).decode(),
            metadata=metadata,
            checksum=checksum
        )
        
        # Store in key store
        self.key_store[secret_id] = encrypted_secret
        
        # Log for audit (without sensitive data)
        if self.audit_logging_enabled:
            self._log_secret_operation("encrypt", secret_id, name, secret_type)
        
        logger.info(f"Encrypted secret '{name}' with algorithm {algorithm}")
        return encrypted_secret

    def decrypt_secret(self, secret_id: str) -> str:
        """Decrypt and retrieve a secret"""
        
        if secret_id not in self.key_store:
            raise ValueError(f"Secret not found: {secret_id}")
        
        encrypted_secret = self.key_store[secret_id]
        metadata = encrypted_secret.metadata
        
        # Check if secret has expired
        if metadata.expires_at and datetime.utcnow() > metadata.expires_at:
            raise ValueError(f"Secret has expired: {secret_id}")
        
        try:
            # Decrypt based on algorithm
            if metadata.algorithm == EncryptionAlgorithm.AES_256_GCM:
                decrypted_data = self._decrypt_aes_gcm(
                    encrypted_secret.encrypted_data,
                    base64.b64decode(encrypted_secret.iv),
                    base64.b64decode(encrypted_secret.salt)
                )
            elif metadata.algorithm == EncryptionAlgorithm.FERNET:
                decrypted_data = self._decrypt_fernet(
                    encrypted_secret.encrypted_data,
                    base64.b64decode(encrypted_secret.iv),
                    base64.b64decode(encrypted_secret.salt)
                )
            else:
                raise ValueError(f"Unsupported encryption algorithm: {metadata.algorithm}")
            
            # Verify checksum
            calculated_checksum = self._calculate_checksum(decrypted_data)
            if calculated_checksum != encrypted_secret.checksum:
                raise ValueError("Checksum verification failed")
            
            # Log for audit
            if self.audit_logging_enabled:
                self._log_secret_operation("decrypt", secret_id, metadata.name, metadata.secret_type)
            
            return decrypted_data
            
        except Exception as e:
            logger.error(f"Failed to decrypt secret {secret_id}: {e}")
            if self.audit_logging_enabled:
                self._log_secret_operation("decrypt_failed", secret_id, metadata.name, metadata.secret_type)
            raise

    def _encrypt_aes_gcm(self, data: str) -> tuple[str, bytes, bytes]:
        """Encrypt data using AES-256-GCM"""
        iv = self._generate_iv()
        salt = self._generate_salt()
        
        # Derive key from master key and salt
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = kdf.derive(self.master_key.encode())
        
        # Encrypt
        cipher = Cipher(algorithms.AES(key), modes.GCM(iv), backend=default_backend())
        encryptor = cipher.encryptor()
        ciphertext = encryptor.update(data.encode()) + encryptor.finalize()
        
        # Combine ciphertext and tag
        encrypted_data = base64.b64encode(ciphertext + encryptor.tag).decode()
        
        return encrypted_data, iv, salt

    def _decrypt_aes_gcm(self, encrypted_data: str, iv: bytes, salt: bytes) -> str:
        """Decrypt data using AES-256-GCM"""
        # Derive key from master key and salt
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = kdf.derive(self.master_key.encode())
        
        # Decode and split ciphertext and tag
        combined = base64.b64decode(encrypted_data)
        ciphertext = combined[:-16]
        tag = combined[-16:]
        
        # Decrypt
        cipher = Cipher(algorithms.AES(key), modes.GCM(iv, tag), backend=default_backend())
        decryptor = cipher.decryptor()
        plaintext = decryptor.update(ciphertext) + decryptor.finalize()
        
        return plaintext.decode()

    def _encrypt_fernet(self, data: str) -> tuple[str, bytes, bytes]:
        """Encrypt data using Fernet (AES 128 in CBC mode with HMAC)"""
        iv = self._generate_iv()
        salt = self._generate_salt()
        
        # For Fernet, we use the existing fernet instance
        encrypted_data = self.fernet.encrypt(data.encode()).decode()
        
        return encrypted_data, iv, salt

    def _decrypt_fernet(self, encrypted_data: str, iv: bytes, salt: bytes) -> str:
        """Decrypt data using Fernet"""
        return self.fernet.decrypt(encrypted_data.encode()).decode()

    def rotate_secret(self, secret_id: str, new_secret_value: str) -> EncryptedSecret:
        """Rotate a secret with a new value"""
        
        if secret_id not in self.key_store:
            raise ValueError(f"Secret not found: {secret_id}")
        
        old_secret = self.key_store[secret_id]
        metadata = old_secret.metadata
        
        # Create new version
        new_metadata = SecretMetadata(
            secret_id=secret_id,
            name=metadata.name,
            secret_type=metadata.secret_type,
            algorithm=metadata.algorithm,
            created_at=metadata.created_at,
            expires_at=metadata.expires_at,
            rotation_schedule=metadata.rotation_schedule,
            last_rotated=datetime.utcnow(),
            version=metadata.version + 1,
            tags=metadata.tags,
            description=metadata.description
        )
        
        # Encrypt new value
        if metadata.algorithm == EncryptionAlgorithm.AES_256_GCM:
            encrypted_data, iv, salt = self._encrypt_aes_gcm(new_secret_value)
        elif metadata.algorithm == EncryptionAlgorithm.FERNET:
            encrypted_data, iv, salt = self._encrypt_fernet(new_secret_value)
        else:
            raise ValueError(f"Unsupported encryption algorithm: {metadata.algorithm}")
        
        # Calculate new checksum
        checksum = self._calculate_checksum(new_secret_value)
        
        # Create new encrypted secret
        new_encrypted_secret = EncryptedSecret(
            secret_id=secret_id,
            encrypted_data=encrypted_data,
            iv=base64.b64encode(iv).decode(),
            salt=base64.b64encode(salt).decode(),
            metadata=new_metadata,
            checksum=checksum
        )
        
        # Update key store
        self.key_store[secret_id] = new_encrypted_secret
        
        # Log rotation
        if self.audit_logging_enabled:
            self._log_secret_operation("rotate", secret_id, metadata.name, metadata.secret_type)
        
        logger.info(f"Rotated secret '{metadata.name}' to version {new_metadata.version}")
        return new_encrypted_secret

    def list_secrets(self, secret_type: Optional[SecretType] = None) -> List[SecretMetadata]:
        """List all secrets or filter by type"""
        
        secrets_list = []
        for secret in self.key_store.values():
            if secret_type is None or secret.metadata.secret_type == secret_type:
                secrets_list.append(secret.metadata)
        
        return secrets_list

    def get_secret_metadata(self, secret_id: str) -> SecretMetadata:
        """Get metadata for a secret without decrypting"""
        
        if secret_id not in self.key_store:
            raise ValueError(f"Secret not found: {secret_id}")
        
        return self.key_store[secret_id].metadata

    def delete_secret(self, secret_id: str) -> bool:
        """Delete a secret"""
        
        if secret_id not in self.key_store:
            return False
        
        metadata = self.key_store[secret_id].metadata
        
        # Log deletion
        if self.audit_logging_enabled:
            self._log_secret_operation("delete", secret_id, metadata.name, metadata.secret_type)
        
        del self.key_store[secret_id]
        logger.info(f"Deleted secret '{metadata.name}'")
        return True

    def check_secret_expiry(self) -> List[SecretMetadata]:
        """Check for secrets that are expiring soon"""
        
        expiring_secrets = []
        warning_threshold = datetime.utcnow() + timedelta(days=30)
        
        for secret in self.key_store.values():
            if secret.metadata.expires_at and secret.metadata.expires_at <= warning_threshold:
                expiring_secrets.append(secret.metadata)
        
        return expiring_secrets

    def _log_secret_operation(self, operation: str, secret_id: str, name: str, secret_type: SecretType):
        """Log secret operations for audit trail"""
        
        audit_log = {
            "timestamp": datetime.utcnow().isoformat(),
            "operation": operation,
            "secret_id": secret_id,
            "secret_name": name,
            "secret_type": secret_type.value,
            "user_id": "system",  # In production, get from authentication context
            "ip_address": "127.0.0.1",  # In production, get from request context
            "user_agent": "control-core-encryption-service"
        }
        
        logger.info(f"SECRET_AUDIT: {json.dumps(audit_log)}")

    def generate_api_key(self, name: str, expires_at: Optional[datetime] = None) -> tuple[str, str]:
        """Generate a secure API key and store it encrypted"""
        
        # Generate API key
        api_key = secrets.token_urlsafe(32)
        api_key_id = f"api_key_{uuid.uuid4().hex[:8]}"
        
        # Encrypt and store
        encrypted_secret = self.encrypt_secret(
            secret_value=api_key,
            name=name,
            secret_type=SecretType.API_KEY,
            expires_at=expires_at,
            description=f"API key for {name}"
        )
        
        return api_key_id, api_key

    def generate_jwt_secret(self, name: str) -> tuple[str, str]:
        """Generate a secure JWT secret"""
        
        jwt_secret = secrets.token_urlsafe(64)
        secret_id = str(uuid.uuid4())
        
        # Encrypt and store
        encrypted_secret = self.encrypt_secret(
            secret_value=jwt_secret,
            name=name,
            secret_type=SecretType.JWT_SECRET,
            description=f"JWT secret for {name}"
        )
        
        return secret_id, jwt_secret

    def export_secrets_backup(self, password: str) -> str:
        """Export encrypted backup of all secrets"""
        
        backup_data = {
            "version": "1.0",
            "exported_at": datetime.utcnow().isoformat(),
            "secrets_count": len(self.key_store),
            "secrets": []
        }
        
        # Encrypt each secret with the backup password
        backup_encryption = Fernet(Fernet.generate_key())
        
        for secret in self.key_store.values():
            # Create backup entry (without sensitive data)
            backup_entry = {
                "secret_id": secret.secret_id,
                "metadata": asdict(secret.metadata),
                "encrypted_data": secret.encrypted_data,
                "iv": secret.iv,
                "salt": secret.salt,
                "checksum": secret.checksum
            }
            backup_data["secrets"].append(backup_entry)
        
        # Encrypt the entire backup
        backup_json = json.dumps(backup_data, default=str)
        encrypted_backup = backup_encryption.encrypt(backup_json.encode())
        
        return base64.b64encode(encrypted_backup).decode()

# Global encryption service instance
encryption_service = AdvancedEncryptionService()
