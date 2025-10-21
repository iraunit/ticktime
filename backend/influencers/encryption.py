import base64
import hashlib

from django.conf import settings


class BankDetailsEncryption:
    """Utility class for encrypting and decrypting bank details"""

    @staticmethod
    def get_encryption_key():
        """Get encryption key from settings"""
        key = getattr(settings, 'BANK_ENCRYPTION_KEY', 'default-secret-key-change-in-production')
        # Hash the key to ensure it's 32 bytes
        return hashlib.sha256(key.encode()).digest()

    @staticmethod
    def simple_encrypt(data):
        """Simple encryption using base64 and XOR"""
        if not data:
            return None

        key = BankDetailsEncryption.get_encryption_key()
        data_bytes = data.encode()
        key_bytes = key

        # XOR encryption
        encrypted = bytearray()
        for i, byte in enumerate(data_bytes):
            encrypted.append(byte ^ key_bytes[i % len(key_bytes)])

        return base64.b64encode(encrypted).decode()

    @staticmethod
    def simple_decrypt(encrypted_data):
        """Simple decryption using base64 and XOR"""
        if not encrypted_data:
            return None

        try:
            key = BankDetailsEncryption.get_encryption_key()
            encrypted_bytes = base64.b64decode(encrypted_data.encode())

            # XOR decryption
            decrypted = bytearray()
            for i, byte in enumerate(encrypted_bytes):
                decrypted.append(byte ^ key[i % len(key)])

            return decrypted.decode()
        except Exception:
            return None

    @staticmethod
    def encrypt_bank_data(data):
        """Encrypt bank data"""
        return BankDetailsEncryption.simple_encrypt(data)

    @staticmethod
    def decrypt_bank_data(encrypted_data):
        """Decrypt bank data"""
        return BankDetailsEncryption.simple_decrypt(encrypted_data)

    @staticmethod
    def redact_account_number(account_number):
        """Redact account number for display"""
        if not account_number:
            return None

        if len(account_number) <= 4:
            return '*' * len(account_number)

        return '*' * (len(account_number) - 4) + account_number[-4:]
