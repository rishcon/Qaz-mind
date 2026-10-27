"""Initial schema: users, sessions, auth tokens, profile pairs, student profiles.

Revision ID: 0001
Revises:
Create Date: 2026-10-27

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

PROFILE_PAIRS = [
    ("math_phys", "01", "Математика + Физика", "Математика + Физика",
     "Инженерия, IT, архитектура и строительство", "Инженерия, IT, сәулет және құрылыс",
     "math_prof", "physics"),
    ("chem_bio", "02", "Биология + Химия", "Биология + Химия",
     "Медицина, фармация, биотехнологии и ветеринария", "Медицина, фармация, биотехнология және ветеринария",
     "biology", "chemistry"),
    ("geo_math", "03", "Математика + География", "Математика + География",
     "Экономика, аудит, менеджмент, финансы и логистика", "Экономика, аудит, менеджмент, қаржы және логистика",
     "math_prof", "geography"),
    ("hist_geo", "04", "Всемирная история + География", "Дүниежүзі тарихы + География",
     "Юриспруденция, право, регионоведение и международные отношения",
     "Заңтану, құқық, аймақтану және халықаралық қатынастар",
     "world_history", "geography"),
    ("kaz_lang_lit", "05", "Казахский язык + Казахская литература", "Қазақ тілі + Қазақ әдебиеті",
     "Филология, журналистика, педагогика и издательское дело",
     "Филология, журналистика, педагогика және баспа ісі",
     "kaz_lang", "kaz_lit"),
    ("foreign_hist", "06", "Иностранный язык + Всемирная история", "Шетел тілі + Дүниежүзі тарихы",
     "Лингвистика, переводческое дело, туризм и востоковедение",
     "Лингвистика, аударма ісі, туризм және шығыстану",
     "english", "world_history"),
]


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("email_verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("failed_login_count", sa.Integer(), nullable=False),
        sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("email = lower(email)", name="ck_users_email_normalized"),
        sa.CheckConstraint("status IN ('active', 'disabled')", name="ck_users_status_valid"),
        sa.CheckConstraint("failed_login_count >= 0", name="ck_users_failed_login_count_non_negative"),
        sa.PrimaryKeyConstraint("id", name="pk_users"),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )

    op.create_table(
        "sessions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name="fk_sessions_user_id_users", ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name="pk_sessions"),
        sa.UniqueConstraint("token_hash", name="uq_sessions_token_hash"),
    )
    op.create_index("ix_sessions_user_id", "sessions", ["user_id"], unique=False)

    op.create_table(
        "auth_tokens",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("purpose", sa.String(length=32), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "purpose IN ('verify_email', 'reset_password')", name="ck_auth_tokens_purpose_valid"
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name="fk_auth_tokens_user_id_users", ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name="pk_auth_tokens"),
        sa.UniqueConstraint("token_hash", name="uq_auth_tokens_token_hash"),
    )
    op.create_index("ix_auth_tokens_user_id_purpose", "auth_tokens", ["user_id", "purpose"], unique=False)

    op.create_table(
        "profile_pairs",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("code", sa.String(length=4), nullable=False),
        sa.Column("title_ru", sa.String(length=160), nullable=False),
        sa.Column("title_kz", sa.String(length=160), nullable=False),
        sa.Column("cluster_ru", sa.String(length=255), nullable=False),
        sa.Column("cluster_kz", sa.String(length=255), nullable=False),
        sa.Column("subject_1_code", sa.String(length=32), nullable=False),
        sa.Column("subject_2_code", sa.String(length=32), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_profile_pairs"),
        sa.UniqueConstraint("code", name="uq_profile_pairs_code"),
    )

    op.create_table(
        "student_profiles",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("interface_lang", sa.String(length=2), nullable=False),
        sa.Column("exam_lang", sa.String(length=2), nullable=False),
        sa.Column("profile_pair_id", sa.String(length=32), nullable=False),
        sa.Column("target_score", sa.SmallInteger(), nullable=False),
        sa.Column("exam_year", sa.SmallInteger(), nullable=False),
        sa.Column("exam_period", sa.String(length=16), nullable=False),
        sa.Column("daily_goal_minutes", sa.SmallInteger(), nullable=False),
        sa.Column("onboarding_completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("interface_lang IN ('ru', 'kz')", name="ck_student_profiles_interface_lang_valid"),
        sa.CheckConstraint("exam_lang IN ('ru', 'kz')", name="ck_student_profiles_exam_lang_valid"),
        sa.CheckConstraint("target_score BETWEEN 60 AND 140", name="ck_student_profiles_target_score_range"),
        sa.CheckConstraint("exam_year BETWEEN 2026 AND 2030", name="ck_student_profiles_exam_year_range"),
        sa.CheckConstraint(
            "exam_period IN ('june_main', 'march_paid', 'ent_2027')",
            name="ck_student_profiles_exam_period_valid",
        ),
        sa.CheckConstraint("daily_goal_minutes BETWEEN 10 AND 240", name="ck_student_profiles_daily_goal_range"),
        sa.ForeignKeyConstraint(
            ["profile_pair_id"], ["profile_pairs.id"], name="fk_student_profiles_profile_pair_id_profile_pairs"
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name="fk_student_profiles_user_id_users", ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("user_id", name="pk_student_profiles"),
    )

    profile_pairs = sa.table(
        "profile_pairs",
        sa.column("id", sa.String),
        sa.column("code", sa.String),
        sa.column("title_ru", sa.String),
        sa.column("title_kz", sa.String),
        sa.column("cluster_ru", sa.String),
        sa.column("cluster_kz", sa.String),
        sa.column("subject_1_code", sa.String),
        sa.column("subject_2_code", sa.String),
        sa.column("active", sa.Boolean),
    )
    op.bulk_insert(
        profile_pairs,
        [
            {
                "id": pair_id,
                "code": code,
                "title_ru": title_ru,
                "title_kz": title_kz,
                "cluster_ru": cluster_ru,
                "cluster_kz": cluster_kz,
                "subject_1_code": subject_1,
                "subject_2_code": subject_2,
                "active": True,
            }
            for pair_id, code, title_ru, title_kz, cluster_ru, cluster_kz, subject_1, subject_2 in PROFILE_PAIRS
        ],
    )


def downgrade() -> None:
    op.drop_table("student_profiles")
    op.drop_table("profile_pairs")
    op.drop_index("ix_auth_tokens_user_id_purpose", table_name="auth_tokens")
    op.drop_table("auth_tokens")
    op.drop_index("ix_sessions_user_id", table_name="sessions")
    op.drop_table("sessions")
    op.drop_table("users")
