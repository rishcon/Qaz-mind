"""Operator commands for curriculum content.

    python -m app.content.cli import content/history.json
    python -m app.content.cli status
    python -m app.content.cli transition khanate-foundation 1 submit --by "Имя"
    python -m app.content.cli transition khanate-foundation 1 approve --by "Имя ревьюера"
    python -m app.content.cli transition khanate-foundation 1 publish --by "Имя ревьюера"

Import never publishes: every lesson enters as a draft. Publication needs a reviewer who is not the author.
"""

import argparse
import asyncio
import json
import sys
from pathlib import Path

from pydantic import ValidationError
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.content.schemas import ContentFile
from app.content.service import TRANSITIONS, ContentError, apply_transition, content_status, import_content
from app.core.config import get_settings


async def _with_session(run):
    engine = create_async_engine(get_settings().database_url, pool_pre_ping=True)
    try:
        factory = async_sessionmaker(engine, expire_on_commit=False)
        async with factory() as session:
            return await run(session)
    finally:
        await engine.dispose()


def _cmd_import(path: str) -> int:
    try:
        raw = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        print(f"Не удалось прочитать файл: {error}", file=sys.stderr)
        return 2
    try:
        content = ContentFile.model_validate(raw)
    except ValidationError as error:
        print("Файл не прошёл проверку формата, ничего не записано:", file=sys.stderr)
        for item in error.errors():
            location = ".".join(str(part) for part in item["loc"])
            print(f"  {location}: {item['msg']}", file=sys.stderr)
        return 1

    async def run(session):
        return await import_content(session, content)

    try:
        result = asyncio.run(_with_session(run))
    except ContentError as error:
        print(f"Импорт отменён: {error}", file=sys.stderr)
        return 1
    for slug, version in result.created:
        print(f"черновик: {slug} версия {version}")
    print(f"Готово: создано черновиков: {len(result.created)}. Ученики их не видят до публикации.")
    return 0


def _cmd_status() -> int:
    async def run(session):
        return await content_status(session)

    rows = asyncio.run(_with_session(run))
    if not rows:
        print("Контента пока нет.")
        return 0
    for row in rows:
        reviewer = row["reviewer"] or "-"
        print(f"{row['subject']:<16} {row['lesson']:<40} v{row['version']:<3} {row['status']:<10} автор: {row['author']}, проверил: {reviewer}")
    return 0


def _cmd_transition(slug: str, version: int, action: str, actor: str) -> int:
    async def run(session):
        return await apply_transition(session, slug, version, action, actor)

    try:
        result = asyncio.run(_with_session(run))
    except ContentError as error:
        print(f"Не выполнено: {error}", file=sys.stderr)
        return 1
    print(f"{slug} версия {version}: статус теперь «{result.status}»")
    return 0


def main(argv: list[str] | None = None) -> int:
    # Windows consoles default to a legacy code page; the messages are Russian and Kazakh.
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(prog="qazmind-content", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)

    importer = sub.add_parser("import", help="загрузить файл с уроками как черновики")
    importer.add_argument("path")

    sub.add_parser("status", help="показать уроки, версии и статусы")

    transition = sub.add_parser("transition", help="сменить статус версии урока")
    transition.add_argument("slug")
    transition.add_argument("version", type=int)
    transition.add_argument("action", choices=sorted(TRANSITIONS))
    transition.add_argument("--by", required=True, dest="actor", help="кто выполняет действие")

    args = parser.parse_args(argv)
    if args.command == "import":
        return _cmd_import(args.path)
    if args.command == "status":
        return _cmd_status()
    return _cmd_transition(args.slug, args.version, args.action, args.actor)


if __name__ == "__main__":
    raise SystemExit(main())
