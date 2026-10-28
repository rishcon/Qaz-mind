"""Practice sessions and answers.

Revision ID: 0004
Revises: 0003
Create Date: 2026-10-28 12:00:00.000000

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = '0004'
down_revision: str | None = '0003'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table('practice_sessions',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('subject_id', sa.String(length=32), nullable=False),
    sa.Column('question_ids', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], name=op.f('fk_practice_sessions_subject_id_subjects')),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_practice_sessions_user_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_practice_sessions'))
    )
    op.create_index('ix_practice_sessions_user', 'practice_sessions', ['user_id', 'created_at'], unique=False)
    op.create_table('practice_answers',
    sa.Column('session_id', sa.Uuid(), nullable=False),
    sa.Column('question_id', sa.Uuid(), nullable=False),
    sa.Column('selected_label', sa.String(length=2), nullable=False),
    sa.Column('is_correct', sa.Boolean(), nullable=False),
    sa.Column('answered_at', sa.DateTime(timezone=True), nullable=False),
    sa.CheckConstraint("selected_label IN ('A', 'B', 'C', 'D', 'E')", name=op.f('ck_practice_answers_label_valid')),
    sa.ForeignKeyConstraint(['question_id'], ['questions.id'], name=op.f('fk_practice_answers_question_id_questions')),
    sa.ForeignKeyConstraint(['session_id'], ['practice_sessions.id'], name=op.f('fk_practice_answers_session_id_practice_sessions'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('session_id', 'question_id', name=op.f('pk_practice_answers'))
    )
    op.create_index('ix_practice_answers_question', 'practice_answers', ['question_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_practice_answers_question', table_name='practice_answers')
    op.drop_table('practice_answers')
    op.drop_index('ix_practice_sessions_user', table_name='practice_sessions')
    op.drop_table('practice_sessions')
