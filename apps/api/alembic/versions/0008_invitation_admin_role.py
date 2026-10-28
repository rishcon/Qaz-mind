"""Invitations may carry the SCHOOL_ADMIN role.

Revision ID: 0008
Revises: 0007
Create Date: 2026-10-28 18:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = '0008'
down_revision: str | None = '0007'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_constraint('role_valid', 'invitations', type_='check')
    op.alter_column('invitations', 'role', existing_type=sa.String(length=8), type_=sa.String(length=12), existing_nullable=False)
    op.create_check_constraint('role_valid', 'invitations', "role IN ('SCHOOL_ADMIN', 'TEACHER', 'STUDENT')")


def downgrade() -> None:
    op.drop_constraint('role_valid', 'invitations', type_='check')
    op.alter_column('invitations', 'role', existing_type=sa.String(length=12), type_=sa.String(length=8), existing_nullable=False)
    op.create_check_constraint('role_valid', 'invitations', "role IN ('TEACHER', 'STUDENT')")
