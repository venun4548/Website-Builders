"""
Website Builders — Two-Factor Authentication (2FA) Service
Provides standard RFC 6238 TOTP generation, QR code creation, and verification.
"""

import io
import base64
import pyotp
import qrcode

class TOTPService:
    @staticmethod
    def generate_secret() -> str:
        """Generate a secure Base32 TOTP secret."""
        return pyotp.random_base32()

    @staticmethod
    def get_provisioning_uri(secret: str, user_email: str, issuer_name: str = "Website Builders") -> str:
        """Get the otpauth:// URI for Google Authenticator / Authy."""
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(name=user_email, issuer_name=issuer_name)

    @staticmethod
    def generate_qr_code_base64(provisioning_uri: str) -> str:
        """Generate a Base64-encoded Data URI for displaying QR code directly in HTML img tag."""
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=8,
            border=2,
        )
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")
        
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{encoded}"

    @staticmethod
    def verify_token(secret: str, token: str, valid_window: int = 1) -> bool:
        """Verify a 6-digit TOTP token against secret with a 30s window allowance."""
        if not secret or not token:
            return False
        clean_token = str(token).strip().replace(" ", "")
        if len(clean_token) != 6 or not clean_token.isdigit():
            return False
        totp = pyotp.TOTP(secret)
        return bool(totp.verify(clean_token, valid_window=valid_window))
