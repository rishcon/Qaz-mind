"""Accounts created by a school administrator: logins and passwords for teachers and students.

Such an account belongs to the school that created it. It has a login instead of a mailbox, gets a temporary
password that the administrator hands over, and the person must replace that password at the first sign-in.
A school administrator can reset the password of the accounts of their own school only.
"""

import asyncio
import re
import secrets
import uuid

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.security import hash_password
from app.core.time import utcnow
from app.models import ClassMember, Organization, OrganizationMember, SchoolClass, User
from app.services.school_access import SchoolAccessService

USERNAME_RE = re.compile(r"^[a-z0-9][a-z0-9._-]{2,39}$")
PASSWORD_ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
MAX_BULK = 60

_CYRILLIC = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "e", "ж": "zh", "з": "z", "и": "i",
    "й": "i", "к": "k", "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t",
    "у": "u", "ф": "f", "х": "h", "ц": "c", "ч": "ch", "ш": "sh", "щ": "sch", "ъ": "", "ы": "y", "ь": "",
    "э": "e", "ю": "iu", "я": "ia", "ә": "a", "і": "i", "ң": "n", "ғ": "g", "ү": "u", "ұ": "u", "қ": "k",
    "ө": "o", "һ": "h",
}


def transliterate(text: str) -> str:
    return "".join(_CYRILLIC.get(ch, ch) for ch in text.lower())


def login_base(name: str) -> str:
    """'Иванов Пётр Сергеевич' -> 'ivanov.p'. The surname first, then the initial of the first name."""
    words = [re.sub(r"[^a-z0-9]", "", transliterate(w)) for w in name.split()]
    words = [w for w in words if w]
    if not words:
        return "user"
    base = words[0] if len(words) == 1 else f"{words[0]}.{words[1][0]}"
    return base[:30]


def new_password() -> str:
    return "".join(secrets.choice(PASSWORD_ALPHABET) for _ in range(10))


class SchoolAccountService:
    def __init__(self, db: AsyncSession, access: SchoolAccessService) -> None:
        self.db = db
        self.access = access

    async def _free_username(self, name: str, wanted: str | None) -> str:
        if wanted:
            wanted = wanted.strip().lower()
            if not USERNAME_RE.match(wanted):
                raise AppError(422, "USERNAME_INVALID", "Логин: 3–40 символов, латинские буквы, цифры, точка, дефис или подчёркивание")
            if await self.db.scalar(select(User.id).where(User.username == wanted)):
                raise AppError(409, "USERNAME_TAKEN", "Такой логин уже занят")
            return wanted
        base = login_base(name)
        for _ in range(30):
            candidate = f"{base}{secrets.randbelow(900) + 100}"
            if not await self.db.scalar(select(User.id).where(User.username == candidate)):
                return candidate
        raise AppError(503, "USERNAME_FAILED", "Не удалось подобрать логин, укажите его вручную")

    async def _create_user(self, organization: Organization, name: str, kind: str, username: str | None, password: str | None) -> tuple[User, str, str]:
        login = await self._free_username(name, username)
        raw = password or new_password()
        if len(raw) < 8:
            raise AppError(422, "PASSWORD_TOO_SHORT", "Пароль не короче 8 символов")
        hashed = await asyncio.to_thread(hash_password, raw)
        user = User(
            name=name,
            email=f"{login}@managed.invalid",  # never deliverable: the account is used with its login
            username=login,
            password_hash=hashed,
            email_verified_at=utcnow(),
            account_type=kind,
            must_change_password=True,
            managed_by_organization_id=organization.id,
        )
        self.db.add(user)
        await self.db.flush()
        return user, login, raw

    async def _class_of(self, org_id: uuid.UUID, class_id: uuid.UUID) -> SchoolClass:
        school_class = await self.db.get(SchoolClass, class_id)
        if school_class is None or school_class.organization_id != org_id:
            raise AppError(404, "NOT_FOUND", "Класс не найден")
        if school_class.status != "active":
            raise AppError(409, "CLASS_ARCHIVED", "Класс в архиве")
        return school_class

    async def create(
        self,
        organization: Organization,
        role: str,
        name: str,
        class_ids: list[uuid.UUID],
        username: str | None,
        password: str | None,
    ) -> dict:
        if role == "STUDENT":
            if len(class_ids) != 1:
                raise AppError(422, "CLASS_REQUIRED", "Для ученика выберите один класс")
            await self._class_of(organization.id, class_ids[0])
        else:
            for class_id in class_ids:
                await self._class_of(organization.id, class_id)
        kind = "managed" if role == "STUDENT" else "school"
        try:
            user, login, raw = await self._create_user(organization, name, kind, username, password)
            if role == "STUDENT":
                await self.access.add_student(organization.id, class_ids[0], user.id)  # takes a licence seat or refuses
            else:
                self.db.add(OrganizationMember(organization_id=organization.id, user_id=user.id, role=role))
                for class_id in class_ids if role == "TEACHER" else []:
                    self.db.add(ClassMember(class_id=class_id, user_id=user.id, role="teacher"))
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            raise AppError(409, "USERNAME_TAKEN", "Такой логин уже занят") from None
        except AppError:
            await self.db.rollback()
            raise
        return {"user_id": str(user.id), "name": name, "username": login, "password": raw, "role": role}

    async def bulk_students(self, organization: Organization, class_id: uuid.UUID, names: list[str]) -> list[dict]:
        """Creates one account per name, all in one transaction: if the seats run out, nobody is created."""
        cleaned = [" ".join(n.split()) for n in names]
        cleaned = [n for n in cleaned if n]
        if not cleaned:
            raise AppError(422, "NAMES_REQUIRED", "Укажите хотя бы одно имя")
        if len(cleaned) > MAX_BULK:
            raise AppError(422, "TOO_MANY", f"За один раз можно создать не больше {MAX_BULK} учеников")
        await self._class_of(organization.id, class_id)
        results: list[dict] = []
        try:
            for name in cleaned:
                user, login, raw = await self._create_user(organization, name[:80], "managed", None, None)
                await self.access.add_student(organization.id, class_id, user.id)
                results.append({"user_id": str(user.id), "name": user.name, "username": login, "password": raw, "role": "STUDENT"})
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            raise AppError(409, "USERNAME_TAKEN", "Не удалось подобрать уникальные логины, повторите") from None
        except AppError:
            await self.db.rollback()
            raise
        return results

    async def reset_password(self, org_id: uuid.UUID, user_id: uuid.UUID) -> dict:
        user = await self.db.get(User, user_id)
        if user is None or user.managed_by_organization_id != org_id or user.username is None:
            raise AppError(404, "NOT_FOUND", "Аккаунт не найден")
        raw = new_password()
        user.password_hash = await asyncio.to_thread(hash_password, raw)
        user.must_change_password = True
        user.failed_login_count = 0
        user.locked_until = None
        from sqlalchemy import update

        from app.models import AuthSession

        await self.db.execute(update(AuthSession).where(AuthSession.user_id == user.id, AuthSession.revoked_at.is_(None)).values(revoked_at=utcnow()))
        await self.db.commit()
        return {"user_id": str(user.id), "name": user.name, "username": user.username, "password": raw}
