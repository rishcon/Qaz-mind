"""Curriculum content (subjects, topics, lessons, versions) and lesson progress.

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-27

"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Subject catalog: the nine prototype subjects plus the three subjects of the remaining profile pairs.
# Titles are taken from the existing UI data (src/types/auth.ts, src/content/questions.ts).
SUBJECTS = [
    ("history_kz", "01", "История Казахстана", "Қазақстан тарихы", "mandatory"),
    ("math_lit", "02", "Математическая грамотность", "Математикалық сауаттылық", "mandatory"),
    ("reading_lit", "03", "Грамотность чтения", "Оқу сауаттылығы", "mandatory"),
    ("math_prof", "04", "Математика (профильная)", "Математика (бейіндік)", "profile"),
    ("physics", "05", "Физика", "Физика", "profile"),
    ("biology", "06", "Биология", "Биология", "profile"),
    ("chemistry", "07", "Химия", "Химия", "profile"),
    ("geography", "08", "География", "География", "profile"),
    ("world_history", "09", "Всемирная история", "Дүниежүзі тарихы", "profile"),
    ("kaz_lang", "10", "Казахский язык", "Қазақ тілі", "profile"),
    ("kaz_lit", "11", "Казахская литература", "Қазақ әдебиеті", "profile"),
    ("english", "12", "Иностранный язык", "Шетел тілі", "profile"),
]


def upgrade() -> None:
    op.create_table(
        "subjects",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("code", sa.String(length=4), nullable=False),
        sa.Column("title_ru", sa.String(length=160), nullable=False),
        sa.Column("title_kz", sa.String(length=160), nullable=False),
        sa.Column("category", sa.String(length=16), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.CheckConstraint("category IN ('mandatory', 'profile')", name="ck_subjects_category_valid"),
        sa.PrimaryKeyConstraint("id", name="pk_subjects"),
        sa.UniqueConstraint("code", name="uq_subjects_code"),
    )

    op.create_table(
        "curriculum_topics",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("subject_id", sa.String(length=32), nullable=False),
        sa.Column("slug", sa.String(length=80), nullable=False),
        sa.Column("position", sa.SmallInteger(), nullable=False),
        sa.Column("title_ru", sa.String(length=200), nullable=False),
        sa.Column("title_kz", sa.String(length=200), nullable=False),
        sa.CheckConstraint("position >= 1", name="ck_curriculum_topics_position_positive"),
        sa.ForeignKeyConstraint(["subject_id"], ["subjects.id"], name="fk_curriculum_topics_subject_id_subjects"),
        sa.PrimaryKeyConstraint("id", name="pk_curriculum_topics"),
    )
    op.create_index(
        "uq_curriculum_topics_subject_slug", "curriculum_topics", ["subject_id", "slug"], unique=True
    )

    op.create_table(
        "lessons",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("topic_id", sa.Uuid(), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("position", sa.SmallInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("position >= 1", name="ck_lessons_position_positive"),
        sa.ForeignKeyConstraint(
            ["topic_id"], ["curriculum_topics.id"], name="fk_lessons_topic_id_curriculum_topics", ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name="pk_lessons"),
        sa.UniqueConstraint("slug", name="uq_lessons_slug"),
    )
    op.create_index("ix_lessons_topic_id", "lessons", ["topic_id"], unique=False)

    op.create_table(
        "lesson_versions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("lesson_id", sa.Uuid(), nullable=False),
        sa.Column("version", sa.SmallInteger(), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("title_ru", sa.String(length=200), nullable=False),
        sa.Column("title_kz", sa.String(length=200), nullable=False),
        sa.Column("estimated_minutes", sa.SmallInteger(), nullable=False),
        sa.Column("source_reference", sa.String(length=300), nullable=False),
        sa.Column("steps", postgresql.JSONB(), nullable=False),
        sa.Column("author", sa.String(length=120), nullable=False),
        sa.Column("reviewer", sa.String(length=120), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "status IN ('draft', 'in_review', 'approved', 'published', 'archived')",
            name="ck_lesson_versions_status_valid",
        ),
        sa.CheckConstraint("version >= 1", name="ck_lesson_versions_version_positive"),
        sa.CheckConstraint(
            "jsonb_typeof(steps) = 'array' AND jsonb_array_length(steps) >= 1",
            name="ck_lesson_versions_steps_nonempty",
        ),
        sa.CheckConstraint(
            "estimated_minutes BETWEEN 1 AND 180", name="ck_lesson_versions_estimated_minutes_range"
        ),
        sa.ForeignKeyConstraint(
            ["lesson_id"], ["lessons.id"], name="fk_lesson_versions_lesson_id_lessons", ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name="pk_lesson_versions"),
    )
    op.create_index("ix_lesson_versions_lesson_id", "lesson_versions", ["lesson_id"], unique=False)
    op.create_index(
        "uq_lesson_versions_lesson_version", "lesson_versions", ["lesson_id", "version"], unique=True
    )
    op.create_index(
        "uq_lesson_versions_one_published",
        "lesson_versions",
        ["lesson_id"],
        unique=True,
        postgresql_where=sa.text("status = 'published'"),
    )

    op.create_table(
        "lesson_progress",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("lesson_id", sa.Uuid(), nullable=False),
        sa.Column("version_id", sa.Uuid(), nullable=False),
        sa.Column("state", sa.String(length=16), nullable=False),
        sa.Column("last_step", sa.SmallInteger(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "state IN ('not_started', 'in_progress', 'completed')", name="ck_lesson_progress_state_valid"
        ),
        sa.CheckConstraint("last_step >= 0", name="ck_lesson_progress_last_step_non_negative"),
        sa.ForeignKeyConstraint(
            ["lesson_id"], ["lessons.id"], name="fk_lesson_progress_lesson_id_lessons", ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name="fk_lesson_progress_user_id_users", ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["version_id"], ["lesson_versions.id"], name="fk_lesson_progress_version_id_lesson_versions"
        ),
        sa.PrimaryKeyConstraint("user_id", "lesson_id", name="pk_lesson_progress"),
    )

    subjects = sa.table(
        "subjects",
        sa.column("id", sa.String),
        sa.column("code", sa.String),
        sa.column("title_ru", sa.String),
        sa.column("title_kz", sa.String),
        sa.column("category", sa.String),
        sa.column("active", sa.Boolean),
    )
    op.bulk_insert(
        subjects,
        [
            {
                "id": subject_id,
                "code": code,
                "title_ru": title_ru,
                "title_kz": title_kz,
                "category": category,
                "active": True,
            }
            for subject_id, code, title_ru, title_kz, category in SUBJECTS
        ],
    )


def downgrade() -> None:
    op.drop_table("lesson_progress")
    op.drop_index("uq_lesson_versions_one_published", table_name="lesson_versions")
    op.drop_index("uq_lesson_versions_lesson_version", table_name="lesson_versions")
    op.drop_index("ix_lesson_versions_lesson_id", table_name="lesson_versions")
    op.drop_table("lesson_versions")
    op.drop_index("ix_lessons_topic_id", table_name="lessons")
    op.drop_table("lessons")
    op.drop_index("uq_curriculum_topics_subject_slug", table_name="curriculum_topics")
    op.drop_table("curriculum_topics")
    op.drop_table("subjects")
