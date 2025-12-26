from cryptography.fernet import Fernet
import os
from dotenv import load_dotenv

load_dotenv()

# Get encryption key from environment or generate new one
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
if not ENCRYPTION_KEY:
    # Generate new key (in production, store this securely!)
    ENCRYPTION_KEY = Fernet.generate_key().decode()
    print(f"⚠️ Generated new encryption key. Add to .env: ENCRYPTION_KEY={ENCRYPTION_KEY}")

cipher_suite = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)

def encrypt_field(plaintext: str) -> str:
    """Encrypt sensitive PII field"""
    if not plaintext:
        return plaintext
    return cipher_suite.encrypt(plaintext.encode()).decode()

def decrypt_field(ciphertext: str) -> str:
    """Decrypt sensitive PII field"""
    if not ciphertext:
        return ciphertext
    try:
        return cipher_suite.decrypt(ciphertext.encode()).decode()
    except:
        return ciphertext  # Return as-is if decryption fails (legacy data)

# Usage example:
# encrypted_ssn = encrypt_field("123-45-6789")
# decrypted_ssn = decrypt_field(encrypted_ssn)
