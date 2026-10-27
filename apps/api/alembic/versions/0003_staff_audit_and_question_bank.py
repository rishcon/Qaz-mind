"""Staff accounts, roles, sessions and invitations; append-only audit log; question bank.

Revision ID: 0003
Revises: 0002
Create Date: 2026-10-27 17:34:44.713161

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = '0003'
down_revision: str | None = '0002'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table('staff_members',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('email', sa.String(length=254), nullable=False),
    sa.Column('name', sa.String(length=120), nullable=False),
    sa.Column('password_hash', sa.String(length=255), nullable=True),
    sa.Column('status', sa.String(length=16), nullable=False),
    sa.Column('totp_secret', sa.String(length=64), nullable=True),
    sa.Column('totp_enabled', sa.Boolean(), nullable=False),
    sa.Column('totp_last_step', sa.BigInteger(), nullable=True),
    sa.Column('failed_login_count', sa.Integer(), nullable=False),
    sa.Column('locked_until', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_by', sa.Uuid(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('last_sign_in_at', sa.DateTime(timezone=True), nullable=True),
    sa.CheckConstraint("status IN ('invited', 'active', 'disabled')", name=op.f('ck_staff_members_status_valid')),
    sa.CheckConstraint('email = lower(email)', name=op.f('ck_staff_members_email_normalized')),
    sa.CheckConstraint('failed_login_count >= 0', name=op.f('ck_staff_members_failed_login_count_non_negative')),
    sa.ForeignKeyConstraint(['created_by'], ['staff_members.id'], name=op.f('fk_staff_members_created_by_staff_members')),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_staff_members')),
    sa.UniqueConstraint('email', name=op.f('uq_staff_members_email'))
    )
    op.create_table('audit_events',
    sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('actor_staff_id', sa.Uuid(), nullable=True),
    sa.Column('actor_email', sa.String(length=254), nullable=True),
    sa.Column('actor_roles', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('action', sa.String(length=64), nullable=False),
    sa.Column('target_type', sa.String(length=32), nullable=True),
    sa.Column('target_id', sa.String(length=80), nullable=True),
    sa.Column('result', sa.String(length=16), nullable=False),
    sa.Column('details', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('request_id', sa.String(length=64), nullable=True),
    sa.Column('ip', sa.String(length=64), nullable=True),
    sa.ForeignKeyConstraint(['actor_staff_id'], ['staff_members.id'], name=op.f('fk_audit_events_actor_staff_id_staff_members')),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_audit_events'))
    )
    op.create_index(op.f('ix_audit_events_action'), 'audit_events', ['action'], unique=False)
    op.create_index('ix_audit_events_created_at', 'audit_events', ['created_at'], unique=False)
    op.create_table('staff_invitations',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('staff_id', sa.Uuid(), nullable=False),
    sa.Column('token_hash', sa.String(length=64), nullable=False),
    sa.Column('invited_by', sa.Uuid(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('accepted_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['invited_by'], ['staff_members.id'], name=op.f('fk_staff_invitations_invited_by_staff_members')),
    sa.ForeignKeyConstraint(['staff_id'], ['staff_members.id'], name=op.f('fk_staff_invitations_staff_id_staff_members'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_staff_invitations')),
    sa.UniqueConstraint('token_hash', name=op.f('uq_staff_invitations_token_hash'))
    )
    op.create_index(op.f('ix_staff_invitations_staff_id'), 'staff_invitations', ['staff_id'], unique=False)
    op.create_table('staff_roles',
    sa.Column('staff_id', sa.Uuid(), nullable=False),
    sa.Column('role', sa.String(length=32), nullable=False),
    sa.Column('granted_by', sa.Uuid(), nullable=True),
    sa.Column('granted_at', sa.DateTime(timezone=True), nullable=False),
    sa.CheckConstraint("role IN ('OWNER', 'PLATFORM_ADMIN', 'CONTENT_MANAGER', 'CONTENT_REVIEWER', 'SUPPORT_AGENT', 'FINANCE_MANAGER', 'ANALYST')", name=op.f('ck_staff_roles_role_valid')),
    sa.ForeignKeyConstraint(['granted_by'], ['staff_members.id'], name=op.f('fk_staff_roles_granted_by_staff_members')),
    sa.ForeignKeyConstraint(['staff_id'], ['staff_members.id'], name=op.f('fk_staff_roles_staff_id_staff_members'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('staff_id', 'role', name=op.f('pk_staff_roles'))
    )
    op.create_table('staff_sessions',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('staff_id', sa.Uuid(), nullable=False),
    sa.Column('token_hash', sa.String(length=64), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('last_seen_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('mfa_verified_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['staff_id'], ['staff_members.id'], name=op.f('fk_staff_sessions_staff_id_staff_members'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_staff_sessions')),
    sa.UniqueConstraint('token_hash', name=op.f('uq_staff_sessions_token_hash'))
    )
    op.create_index(op.f('ix_staff_sessions_staff_id'), 'staff_sessions', ['staff_id'], unique=False)
    op.create_table('questions',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('subject_id', sa.String(length=32), nullable=False),
    sa.Column('topic_id', sa.Uuid(), nullable=True),
    sa.Column('type', sa.String(length=24), nullable=False),
    sa.Column('difficulty', sa.String(length=8), nullable=False),
    sa.Column('points', sa.SmallInteger(), nullable=False),
    sa.Column('text_ru', sa.Text(), nullable=False),
    sa.Column('text_kz', sa.Text(), nullable=False),
    sa.Column('options', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('correct_label', sa.String(length=2), nullable=False),
    sa.Column('explanation_ru', sa.Text(), nullable=False),
    sa.Column('explanation_kz', sa.Text(), nullable=False),
    sa.Column('source_reference', sa.String(length=300), nullable=False),
    sa.Column('external_id', sa.String(length=80), nullable=True),
    sa.Column('status', sa.String(length=16), nullable=False),
    sa.Column('review_notes', sa.Text(), nullable=False),
    sa.Column('author_staff_id', sa.Uuid(), nullable=False),
    sa.Column('reviewer_staff_id', sa.Uuid(), nullable=True),
    sa.Column('version', sa.SmallInteger(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('published_at', sa.DateTime(timezone=True), nullable=True),
    sa.CheckConstraint("difficulty IN ('easy', 'medium', 'hard')", name=op.f('ck_questions_difficulty_valid')),
    sa.CheckConstraint("jsonb_typeof(options) = 'array' AND jsonb_array_length(options) >= 2", name=op.f('ck_questions_options_valid')),
    sa.CheckConstraint("status IN ('draft', 'in_review', 'approved', 'published', 'archived')", name=op.f('ck_questions_status_valid')),
    sa.CheckConstraint("type IN ('single_choice')", name=op.f('ck_questions_type_valid')),
    sa.CheckConstraint('points BETWEEN 1 AND 5', name=op.f('ck_questions_points_range')),
    sa.ForeignKeyConstraint(['author_staff_id'], ['staff_members.id'], name=op.f('fk_questions_author_staff_id_staff_members')),
    sa.ForeignKeyConstraint(['reviewer_staff_id'], ['staff_members.id'], name=op.f('fk_questions_reviewer_staff_id_staff_members')),
    sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], name=op.f('fk_questions_subject_id_subjects')),
    sa.ForeignKeyConstraint(['topic_id'], ['curriculum_topics.id'], name=op.f('fk_questions_topic_id_curriculum_topics')),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_questions'))
    )
    op.create_index('ix_questions_subject_status', 'questions', ['subject_id', 'status'], unique=False)

    # The audit log is append-only: the database itself refuses UPDATE and DELETE on it.
    op.execute(
        """
        CREATE FUNCTION audit_events_append_only() RETURNS trigger AS $$
        BEGIN
            RAISE EXCEPTION 'audit_events is append-only';
        END;
        $$ LANGUAGE plpgsql;
        """
    )
    op.execute(
        "CREATE TRIGGER audit_events_no_change BEFORE UPDATE OR DELETE ON audit_events "
        "FOR EACH ROW EXECUTE FUNCTION audit_events_append_only();"
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS audit_events_no_change ON audit_events;")
    op.execute("DROP FUNCTION IF EXISTS audit_events_append_only();")
    op.drop_index('ix_questions_subject_status', table_name='questions')
    op.drop_table('questions')
    op.drop_index(op.f('ix_staff_sessions_staff_id'), table_name='staff_sessions')
    op.drop_table('staff_sessions')
    op.drop_table('staff_roles')
    op.drop_index(op.f('ix_staff_invitations_staff_id'), table_name='staff_invitations')
    op.drop_table('staff_invitations')
    op.drop_index('ix_audit_events_created_at', table_name='audit_events')
    op.drop_index(op.f('ix_audit_events_action'), table_name='audit_events')
    op.drop_table('audit_events')
    op.drop_table('staff_members')
