"""Server commands for staff access. They need direct access to the database, so they run on the server only.

    python -m app.admin.cli bootstrap-owner --email owner@example.com --name "Имя Фамилия"
    python -m app.admin.cli reset-mfa --email someone@example.com

bootstrap-owner works once: it refuses if an owner already exists. It creates an invitation, sends it by email
and prints the link. reset-mfa clears the second factor of an account (for example, a lost phone); the person
enrols a new authenticator at the next sign-in. Both commands are written to the audit log.
"""

import argparse
import asyncio
import sys

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.admin.service import StaffService, write_audit
from app.core.config import get_settings
from app.core.errors import AppError
from app.core.security import normalize_email
from app.models import StaffMember, StaffRole, StaffSession
from app.services.mail import build_mailer

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")


async def _run(work):
    settings = get_settings()
    engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    try:
        factory = async_sessionmaker(engine, expire_on_commit=False)
        async with factory() as session:
            return await work(session, settings)
    finally:
        await engine.dispose()


async def bootstrap_owner(email: str, name: str) -> int:
    async def work(db, settings):
        owners = (
            await db.execute(select(func.count()).select_from(StaffRole).where(StaffRole.role == "OWNER"))
        ).scalar_one()
        if owners:
            print("Владелец уже есть. Новых сотрудников приглашает владелец в QazMind Admin.", file=sys.stderr)
            return 1
        service = StaffService(db, settings, build_mailer(settings))
        try:
            raw = await service.create_invitation(email, name, ["OWNER"], None, None)
        except AppError as error:
            print(f"Не выполнено: {error.message}", file=sys.stderr)
            return 1
        print(f"Приглашение владельца создано для {normalize_email(email)}.")
        print(f"Ссылка (действует {settings.staff_invitation_hours} ч): {service.invitation_link(raw)}")
        return 0

    return await _run(work)


async def reset_mfa(email: str) -> int:
    async def work(db, settings):
        staff = (
            await db.execute(select(StaffMember).where(StaffMember.email == normalize_email(email)))
        ).scalar_one_or_none()
        if staff is None:
            print("Сотрудник не найден.", file=sys.stderr)
            return 1
        staff.totp_secret = None
        staff.totp_enabled = False
        staff.totp_last_step = None
        await db.execute(update(StaffSession).where(StaffSession.staff_id == staff.id).values(revoked_at=func.now()))
        await write_audit(db, None, "staff.mfa_reset", None, "staff", str(staff.id), actor_email="server-command")
        await db.commit()
        print(f"Второй фактор сброшен для {staff.email}. Все его сессии завершены.")
        return 0

    return await _run(work)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m app.admin.cli")
    sub = parser.add_subparsers(dest="command", required=True)
    owner = sub.add_parser("bootstrap-owner", help="создать приглашение первого владельца")
    owner.add_argument("--email", required=True)
    owner.add_argument("--name", required=True)
    reset = sub.add_parser("reset-mfa", help="сбросить второй фактор сотрудника")
    reset.add_argument("--email", required=True)
    args = parser.parse_args(argv)
    if args.command == "bootstrap-owner":
        return asyncio.run(bootstrap_owner(args.email, args.name))
    return asyncio.run(reset_mfa(args.email))


if __name__ == "__main__":
    raise SystemExit(main())
