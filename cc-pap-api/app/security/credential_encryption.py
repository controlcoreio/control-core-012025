"""
Credential Encryption Service
Encrypts sensitive credentials like GitHub tokens for SOC2 compliance.
"""

import os
import logging
from cryptography.fernet import Fernet
from typing import Optional

logger = logging.getLogger(__name__)


class CredentialEncryption:
    """Service for encrypting and decrypting sensitive credentials.
    
    Uses Fernet (symmetric encryption) for secure storage of:
    - GitHub access tokens
    - OPAL secrets
    - Webhook secrets
    - API keys
    """
    
    def __init__(self):
        """Initialize encryption with key from environment."""
        # Get encryption key from environment variable
        key = os.getenv('CREDENTIAL_ENCRYPTION_KEY')
        
        if not key:
            # Generate a key if not provided (for development only)
            logger.warning("CREDENTIAL_ENCRYPTION_KEY not set, generating temporary key")
            logger.warning("This key will be lost on restart - set CREDENTIAL_ENCRYPTION_KEY in production!")
            key = Fernet.generate_key().decode()
        
        # Ensure key is bytes
        if isinstance(key, str):
            key = key.encode()
        
        self.cipher = Fernet(key)
        logger.info("Credential encryption initialized")
    
    def encrypt(self, plaintext: str) -> str:
        """Encrypt a credential string.
        
        Args:
            plaintext: The credential to encrypt (e.g., GitHub token)
            
        Returns:
            Encrypted string (base64 encoded)
        """
        if not plaintext:
            return ""
        
        try:
            encrypted = self.cipher.encrypt(plaintext.encode())
            return encrypted.decode()
        except Exception as e:
            logger.error(f"Failed to encrypt credential: {e}")
            raise
    
    def decrypt(self, ciphertext: str) -> str:
        """Decrypt a credential string.
        
        Args:
            ciphertext: The encrypted credential
            
        Returns:
            Decrypted plaintext string
        """
        if not ciphertext:
            return ""
        
        try:
            decrypted = self.cipher.decrypt(ciphertext.encode())
            return decrypted.decode()
        except Exception as e:
            logger.error(f"Failed to decrypt credential: {e}")
            raise
    
    def is_encrypted(self, value: str) -> bool:
        """Check if a value is encrypted.
        
        Args:
            value: String to check
            
        Returns:
            True if encrypted, False otherwise
        """
        if not value:
            return False
        
        try:
            # Try to decrypt - if it works, it was encrypted
            self.decrypt(value)
            return True
        except:
            return False


# Global instance
_encryptor: Optional[CredentialEncryption] = None


def get_credential_encryptor() -> CredentialEncryption:
    """Get global credential encryptor instance.
    
    Returns:
        CredentialEncryption instance (singleton)
    """
    global _encryptor
    if _encryptor is None:
        _encryptor = CredentialEncryption()
    return _encryptor


def encrypt_credential(plaintext: str) -> str:
    """Helper function to encrypt a credential.
    
    Args:
        plaintext: Credential to encrypt
        
    Returns:
        Encrypted credential
    """
    encryptor = get_credential_encryptor()
    return encryptor.encrypt(plaintext)


def decrypt_credential(ciphertext: str) -> str:
    """Helper function to decrypt a credential.
    
    Args:
        ciphertext: Encrypted credential
        
    Returns:
        Decrypted credential
    """
    encryptor = get_credential_encryptor()
    return encryptor.decrypt(ciphertext)

