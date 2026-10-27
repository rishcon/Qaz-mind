from datetime import UTC, datetime


def utcnow() -> datetime:
    """Timezone-aware UTC timestamp. All stored times are UTC; the frontend converts them for display."""
    return datetime.now(UTC)
