"""A question's source may be a long citation of an official specification.

Revision ID: 0012
Revises: 0011
Create Date: 2026-10-28 22:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = '0012'
down_revision: str | None = '0011'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column('questions', 'source_reference', existing_type=sa.String(length=300), type_=sa.String(length=1000), existing_nullable=False)


def downgrade() -> None:
    op.execute("UPDATE questions SET source_reference = left(source_reference, 300)")
    op.alter_column('questions', 'source_reference', existing_type=sa.String(length=1000), type_=sa.String(length=300), existing_nullable=False)
