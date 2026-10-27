"""Read models for QazMind Admin: overview, students, audit log and monitoring. Every number is counted from the database."""

import asyncio
import socket
import time
import uuid
from datetime import timedelta
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import Date, cast, func, or_, select, text, update

from app.admin.service import StaffContext, write_audit
from app.api.deps import SettingsDep, get_db
from app.api.v1.admin.deps import MetaDep, StaffDep, require
from app.core.errors import AppError
from app.core.time import utcnow
from app.models import (
    AuditEvent,
    AuthSession,
    Lesson,
    LessonProgress,
    LessonVersion,
    ProfilePair,
    Question,
    StaffInvitation,
    StaffMember,
    StaffSession,
    StudentProfile,
    User,
)

router = APIRouter(tags=["admin-data"])
DbDep = Annotated[object, Depends(get_db)]


# ----- overview ----------------------------------------------------------------------------------------------


@router.get("/overview")
async def overview(ctx: StaffDep, db=Depends(get_db)) -> dict:
    now = utcnow()
    scalar = lambda q: db.execute(q)  # noqa: E731

    users_total = (await scalar(select(func.count()).select_from(User))).scalar_one()
    users_verified = (
        await scalar(select(func.count()).select_from(User).where(User.email_verified_at.is_not(None)))
    ).scalar_one()
    onboarded = (
        await scalar(
            select(func.count()).select_from(StudentProfile).where(StudentProfile.onboarding_completed_at.is_not(None))
        )
    ).scalar_one()
    active_24h = (
        await scalar(
            select(func.count(func.distinct(AuthSession.user_id))).where(
                AuthSession.last_seen_at > now - timedelta(hours=24)
            )
        )
    ).scalar_one()
    new_7d = (await scalar(select(func.count()).select_from(User).where(User.created_at > now - timedelta(days=7)))).scalar_one()
    lessons_published = (
        await scalar(
            select(func.count(func.distinct(LessonVersion.lesson_id))).where(LessonVersion.status == "published")
        )
    ).scalar_one()
    lessons_in_review = (
        await scalar(select(func.count()).select_from(LessonVersion).where(LessonVersion.status == "in_review"))
    ).scalar_one()
    lessons_completed = (
        await scalar(select(func.count()).select_from(LessonProgress).where(LessonProgress.state == "completed"))
    ).scalar_one()
    question_rows = (await scalar(select(Question.status, func.count()).group_by(Question.status))).all()
    questions = {status: count for status, count in question_rows}
    pending_invitations = (
        await scalar(
            select(func.count())
            .select_from(StaffInvitation)
            .where(StaffInvitation.accepted_at.is_(None), StaffInvitation.expires_at > now)
        )
    ).scalar_one()

    since = (now - timedelta(days=13)).date()
    day = cast(User.created_at, Date)
    by_day = dict(
        (await scalar(select(day, func.count()).where(day >= since).group_by(day))).all()
    )
    registrations = [
        {"date": (since + timedelta(days=i)).isoformat(), "count": by_day.get(since + timedelta(days=i), 0)}
        for i in range(14)
    ]

    attention = []
    if questions.get("in_review"):
        attention.append({"id": "questions_in_review", "title": "Вопросы ждут рецензии",
                          "count": questions["in_review"], "action_url": "/admin/content/review"})
    if lessons_in_review:
        attention.append({"id": "lessons_in_review", "title": "Уроки ждут рецензии",
                          "count": lessons_in_review, "action_url": "/admin/content/lessons"})
    if pending_invitations and "staff.manage" in ctx.permissions:
        attention.append({"id": "pending_invitations", "title": "Приглашения сотрудников не приняты",
                          "count": pending_invitations, "action_url": "/admin/roles"})

    recent = []
    if "audit.read" in ctx.permissions:
        rows = (await scalar(select(AuditEvent).order_by(AuditEvent.id.desc()).limit(8))).scalars().all()
        recent = [audit_out(e) for e in rows]

    return {
        "users_total": users_total,
        "users_verified": users_verified,
        "onboarding_completed": onboarded,
        "active_24h": active_24h,
        "new_7d": new_7d,
        "lessons_published": lessons_published,
        "lessons_in_review": lessons_in_review,
        "lessons_completed": lessons_completed,
        "questions": {s: questions.get(s, 0) for s in ("draft", "in_review", "approved", "published", "archived")},
        "registrations_by_day": registrations,
        "attention": attention,
        "recent_audit": recent,
        "generated_at": now,
    }


# ----- students ----------------------------------------------------------------------------------------------


def _last_seen():
    return (
        select(AuthSession.user_id, func.max(AuthSession.last_seen_at).label("last_seen_at"))
        .group_by(AuthSession.user_id)
        .subquery()
    )


def _completed():
    return (
        select(LessonProgress.user_id, func.count().label("completed"))
        .where(LessonProgress.state == "completed")
        .group_by(LessonProgress.user_id)
        .subquery()
    )


def _user_row(user: User, profile: StudentProfile | None, last_seen, completed) -> dict:
    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "status": user.status,
        "email_verified": user.email_verified_at is not None,
        "created_at": user.created_at,
        "last_seen_at": last_seen,
        "onboarding_completed": profile is not None and profile.onboarding_completed_at is not None,
        "target_score": profile.target_score if profile else None,
        "profile_pair_id": profile.profile_pair_id if profile else None,
        "lessons_completed": completed or 0,
        "locked_until": user.locked_until,
    }


@router.get("/users")
async def list_users(
    ctx: Annotated[StaffContext, Depends(require("users.read"))],
    db=Depends(get_db),
    search: str = "",
    status: Literal["all", "active", "disabled", "unverified"] = "all",
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
) -> dict:
    last_seen = _last_seen()
    completed = _completed()
    query = (
        select(User, StudentProfile, last_seen.c.last_seen_at, completed.c.completed)
        .outerjoin(StudentProfile, StudentProfile.user_id == User.id)
        .outerjoin(last_seen, last_seen.c.user_id == User.id)
        .outerjoin(completed, completed.c.user_id == User.id)
    )
    if search.strip():
        pattern = f"%{search.strip().lower()}%"
        query = query.where(or_(func.lower(User.name).like(pattern), User.email.like(pattern)))
    if status in ("active", "disabled"):
        query = query.where(User.status == status)
    if status == "unverified":
        query = query.where(User.email_verified_at.is_(None))
    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
    rows = (
        await db.execute(query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size))
    ).all()
    return {
        "items": [_user_row(u, p, seen, done) for u, p, seen, done in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/users/{user_id}")
async def get_user(
    user_id: uuid.UUID,
    ctx: Annotated[StaffContext, Depends(require("users.read"))],
    db=Depends(get_db),
) -> dict:
    user = await db.get(User, user_id)
    if user is None:
        raise AppError(404, "USER_NOT_FOUND", "Пользователь не найден")
    profile = await db.get(StudentProfile, user.id)
    pair = await db.get(ProfilePair, profile.profile_pair_id) if profile else None
    now = utcnow()
    sessions = (
        await db.execute(
            select(AuthSession)
            .where(AuthSession.user_id == user.id)
            .order_by(AuthSession.last_seen_at.desc())
            .limit(20)
        )
    ).scalars().all()
    progress_rows = (
        await db.execute(
            select(LessonProgress, Lesson.slug, LessonVersion.title_ru)
            .join(Lesson, Lesson.id == LessonProgress.lesson_id)
            .join(LessonVersion, LessonVersion.id == LessonProgress.version_id)
            .where(LessonProgress.user_id == user.id)
            .order_by(LessonProgress.updated_at.desc())
        )
    ).all()
    completed = sum(1 for p, _, _ in progress_rows if p.state == "completed")
    row = _user_row(user, profile, sessions[0].last_seen_at if sessions else None, completed)
    row["profile"] = (
        {
            "exam_lang": profile.exam_lang,
            "interface_lang": profile.interface_lang,
            "target_score": profile.target_score,
            "exam_year": profile.exam_year,
            "exam_period": profile.exam_period,
            "daily_goal_minutes": profile.daily_goal_minutes,
            "profile_pair": pair.title_ru if pair else profile.profile_pair_id,
            "onboarding_completed_at": profile.onboarding_completed_at,
        }
        if profile
        else None
    )
    row["active_sessions"] = sum(1 for s in sessions if s.revoked_at is None and s.expires_at > now)
    row["sessions"] = [
        {
            "created_at": s.created_at,
            "last_seen_at": s.last_seen_at,
            "expires_at": s.expires_at,
            "revoked": s.revoked_at is not None,
        }
        for s in sessions
    ]
    row["progress"] = [
        {"lesson_slug": slug, "title": title, "state": p.state, "last_step": p.last_step,
         "completed_at": p.completed_at, "updated_at": p.updated_at}
        for p, slug, title in progress_rows
    ]
    return row


class UserStatusIn(BaseModel):
    status: Literal["active", "disabled"]
    reason: str = Field(min_length=3, max_length=500)


@router.post("/users/{user_id}/status")
async def set_user_status(
    user_id: uuid.UUID,
    body: UserStatusIn,
    meta: MetaDep,
    ctx: Annotated[StaffContext, Depends(require("users.suspend"))],
    db=Depends(get_db),
) -> dict:
    user = await db.get(User, user_id)
    if user is None:
        raise AppError(404, "USER_NOT_FOUND", "Пользователь не найден")
    before = user.status
    user.status = body.status
    if body.status == "disabled":
        await db.execute(
            update(AuthSession)
            .where(AuthSession.user_id == user.id, AuthSession.revoked_at.is_(None))
            .values(revoked_at=utcnow())
        )
    await write_audit(db, ctx, "user.status_changed", meta, "user", str(user.id),
                      details={"before": before, "after": body.status, "reason": body.reason})
    await db.commit()
    return {"status": user.status}


@router.post("/users/{user_id}/sessions/revoke")
async def revoke_user_sessions(
    user_id: uuid.UUID,
    meta: MetaDep,
    ctx: Annotated[StaffContext, Depends(require("users.suspend"))],
    db=Depends(get_db),
) -> dict:
    user = await db.get(User, user_id)
    if user is None:
        raise AppError(404, "USER_NOT_FOUND", "Пользователь не найден")
    result = await db.execute(
        update(AuthSession)
        .where(AuthSession.user_id == user.id, AuthSession.revoked_at.is_(None))
        .values(revoked_at=utcnow())
    )
    await write_audit(db, ctx, "user.sessions_revoked", meta, "user", str(user.id),
                      details={"revoked": result.rowcount})
    await db.commit()
    return {"revoked": result.rowcount}


# ----- audit -------------------------------------------------------------------------------------------------


def audit_out(event: AuditEvent) -> dict:
    return {
        "id": event.id,
        "created_at": event.created_at,
        "actor_email": event.actor_email,
        "actor_roles": event.actor_roles,
        "action": event.action,
        "target_type": event.target_type,
        "target_id": event.target_id,
        "result": event.result,
        "details": event.details,
        "request_id": event.request_id,
        "ip": event.ip,
    }


@router.get("/audit")
async def list_audit(
    ctx: Annotated[StaffContext, Depends(require("audit.read"))],
    db=Depends(get_db),
    action: str = "",
    actor: str = "",
    result: Literal["all", "success", "failure"] = "all",
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
) -> dict:
    query = select(AuditEvent)
    if action:
        query = query.where(AuditEvent.action.like(f"{action}%"))
    if actor:
        query = query.where(AuditEvent.actor_email.like(f"%{actor.lower()}%"))
    if result != "all":
        query = query.where(AuditEvent.result == result)
    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
    rows = (
        await db.execute(query.order_by(AuditEvent.id.desc()).offset((page - 1) * page_size).limit(page_size))
    ).scalars().all()
    return {"items": [audit_out(e) for e in rows], "total": total, "page": page, "page_size": page_size}


# ----- monitoring --------------------------------------------------------------------------------------------


def _tcp_check(host: str, port: int) -> tuple[bool, float]:
    started = time.perf_counter()
    try:
        with socket.create_connection((host, port), timeout=2):
            return True, (time.perf_counter() - started) * 1000
    except OSError:
        return False, (time.perf_counter() - started) * 1000


@router.get("/monitoring")
async def monitoring(
    settings: SettingsDep,
    ctx: Annotated[StaffContext, Depends(require("monitoring.read"))],
    db=Depends(get_db),
) -> dict:
    now = utcnow()
    started = time.perf_counter()
    await db.execute(text("SELECT 1"))
    db_ms = (time.perf_counter() - started) * 1000
    migration = (await db.execute(text("SELECT version_num FROM alembic_version"))).scalar_one_or_none()

    services = [
        {"id": "api", "name": "API (FastAPI)", "status": "ok", "latency_ms": None,
         "details": f"окружение {settings.app_env}"},
        {"id": "database", "name": "PostgreSQL", "status": "ok", "latency_ms": round(db_ms, 1),
         "details": f"миграция {migration}"},
    ]
    if settings.mail_mode == "smtp" and settings.smtp_host:
        ok, ms = await asyncio.to_thread(_tcp_check, settings.smtp_host, settings.smtp_port)
        services.append({"id": "mail", "name": "Почта (SMTP)", "status": "ok" if ok else "down",
                         "latency_ms": round(ms, 1), "details": f"{settings.smtp_host}:{settings.smtp_port}"})
    else:
        services.append({"id": "mail", "name": "Почта", "status": "not_configured", "latency_ms": None,
                         "details": "письма только пишутся в лог сервера"})

    student_sessions = (
        await db.execute(
            select(func.count()).select_from(AuthSession).where(
                AuthSession.revoked_at.is_(None), AuthSession.expires_at > now
            )
        )
    ).scalar_one()
    staff_sessions = (
        await db.execute(
            select(func.count()).select_from(StaffSession).where(
                StaffSession.revoked_at.is_(None), StaffSession.expires_at > now,
                StaffSession.mfa_verified_at.is_not(None),
            )
        )
    ).scalar_one()
    failures_24h = (
        await db.execute(
            select(func.count()).select_from(AuditEvent).where(
                AuditEvent.result == "failure", AuditEvent.created_at > now - timedelta(hours=24)
            )
        )
    ).scalar_one()
    staff_active = (
        await db.execute(select(func.count()).select_from(StaffMember).where(StaffMember.status == "active"))
    ).scalar_one()
    return {
        "services": services,
        "student_sessions_active": student_sessions,
        "staff_sessions_active": staff_sessions,
        "staff_active": staff_active,
        "admin_failures_24h": failures_24h,
        "checked_at": now,
    }
