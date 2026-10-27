import hashlib
import secrets

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

# Argon2id with argon2-cffi defaults (the library default type is Argon2id).
_hasher = PasswordHasher()

# Used to spend the same time on unknown emails as on real ones, so response timing does not reveal accounts.
_DUMMY_HASH = _hasher.hash(secrets.token_urlsafe(16))


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    try:
        return _hasher.verify(password_hash, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def burn_password_time(password: str) -> None:
    """Run one Argon2 verification for an unknown account; the result is ignored."""
    try:
        _hasher.verify(_DUMMY_HASH, password)
    except VerificationError:
        pass


def generate_token() -> str:
    """Opaque random token for cookies and email links. Only its SHA-256 hash is stored."""
    return secrets.token_urlsafe(32)


def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def normalize_email(email: str) -> str:
    return email.strip().lower()
