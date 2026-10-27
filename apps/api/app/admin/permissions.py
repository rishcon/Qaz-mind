"""Who may do what. This is the permission matrix of docs/ADMIN_ACCESS.md, checked on every admin request."""

PERMISSIONS = (
    "users.read",
    "users.suspend",
    "schools.read",
    "schools.approve",
    "content.create",
    "content.edit",
    "content.review",
    "content.publish",
    "exams.manage",
    "support.manage",
    "reports.resolve",
    "finance.manage",
    "monitoring.read",
    "audit.read",
    "staff.manage",
    "settings.manage",
)

ROLE_PERMISSIONS: dict[str, frozenset[str]] = {
    "OWNER": frozenset(PERMISSIONS),
    "PLATFORM_ADMIN": frozenset(
        {
            "users.read",
            "users.suspend",
            "schools.read",
            "schools.approve",
            "support.manage",
            "reports.resolve",
            "monitoring.read",
            "audit.read",
        }
    ),
    "CONTENT_MANAGER": frozenset({"content.create", "content.edit", "exams.manage"}),
    "CONTENT_REVIEWER": frozenset({"content.review", "content.publish", "reports.resolve"}),
    "SUPPORT_AGENT": frozenset({"support.manage", "users.read", "reports.resolve"}),
    "FINANCE_MANAGER": frozenset({"finance.manage", "schools.read"}),
    "ANALYST": frozenset({"users.read", "schools.read", "monitoring.read"}),
}


def permissions_for(roles: list[str] | tuple[str, ...] | set[str]) -> frozenset[str]:
    granted: set[str] = set()
    for role in roles:
        granted |= ROLE_PERMISSIONS.get(role, frozenset())
    return frozenset(granted)
