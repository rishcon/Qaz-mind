import random
import uuid

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.time import utcnow
from app.models import PracticeAnswer, PracticeSession, Question, Subject
from app.schemas.practice import (
    OptionOut,
    PracticeQuestionOut,
    PracticeSubjectOut,
    ReviewOut,
    SessionOut,
    SessionQuestionOut,
    StatsOut,
)


def _question_out(q: Question) -> PracticeQuestionOut:
    return PracticeQuestionOut(
        id=q.id,
        difficulty=q.difficulty,
        text_ru=q.text_ru,
        text_kz=q.text_kz,
        options=[OptionOut(label=o["label"], text_ru=o["text_ru"], text_kz=o.get("text_kz", "")) for o in q.options],
    )


def _review_out(q: Question, answer: PracticeAnswer) -> ReviewOut:
    return ReviewOut(
        selected_label=answer.selected_label,
        correct_label=q.correct_label,
        is_correct=answer.is_correct,
        explanation_ru=q.explanation_ru,
        explanation_kz=q.explanation_kz,
    )


class PracticeService:
    """Practice runs on published questions only. The server picks the questions and checks every answer."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def subjects(self) -> list[PracticeSubjectOut]:
        rows = (
            await self.db.execute(
                select(Question.subject_id, func.count())
                .where(Question.status == "published")
                .group_by(Question.subject_id)
                .order_by(Question.subject_id)
            )
        ).all()
        return [PracticeSubjectOut(subject_id=s, available=n) for s, n in rows]

    async def start(self, user_id: uuid.UUID, subject_id: str, count: int) -> SessionOut:
        if await self.db.get(Subject, subject_id) is None:
            raise AppError(404, "SUBJECT_NOT_FOUND", "Предмет не найден")
        published = (
            await self.db.execute(
                select(Question.id).where(Question.subject_id == subject_id, Question.status == "published")
            )
        ).scalars().all()
        if not published:
            raise AppError(409, "NO_QUESTIONS", "По этому предмету пока нет опубликованных заданий")

        # Questions the student has not seen come first, then ones answered wrongly, then the rest.
        history = dict(
            (
                await self.db.execute(
                    select(PracticeAnswer.question_id, func.bool_and(PracticeAnswer.is_correct))
                    .join(PracticeSession, PracticeSession.id == PracticeAnswer.session_id)
                    .where(PracticeSession.user_id == user_id, PracticeAnswer.question_id.in_(published))
                    .group_by(PracticeAnswer.question_id)
                )
            ).all()
        )
        unseen = [q for q in published if q not in history]
        missed = [q for q in published if history.get(q) is False]
        known = [q for q in published if history.get(q) is True]
        for bucket in (unseen, missed, known):
            random.shuffle(bucket)
        picked = (unseen + missed + known)[:count]
        random.shuffle(picked)

        session = PracticeSession(
            user_id=user_id, subject_id=subject_id, question_ids=[str(q) for q in picked], created_at=utcnow()
        )
        self.db.add(session)
        await self.db.commit()
        return await self._out(session)

    async def _own(self, user_id: uuid.UUID, session_id: uuid.UUID) -> PracticeSession:
        session = await self.db.get(PracticeSession, session_id)
        # Someone else's session looks the same as a missing one.
        if session is None or session.user_id != user_id:
            raise AppError(404, "SESSION_NOT_FOUND", "Сессия практики не найдена")
        return session

    async def _out(self, session: PracticeSession) -> SessionOut:
        ids = [uuid.UUID(q) for q in session.question_ids]
        questions = {q.id: q for q in (await self.db.execute(select(Question).where(Question.id.in_(ids)))).scalars()}
        answers = {
            a.question_id: a
            for a in (
                await self.db.execute(select(PracticeAnswer).where(PracticeAnswer.session_id == session.id))
            ).scalars()
        }
        items = [
            SessionQuestionOut(
                question=_question_out(questions[qid]),
                review=_review_out(questions[qid], answers[qid]) if qid in answers else None,
            )
            for qid in ids
        ]
        return SessionOut(
            id=session.id,
            subject_id=session.subject_id,
            created_at=session.created_at,
            finished_at=session.finished_at,
            total=len(ids),
            answered=len(answers),
            correct=sum(1 for a in answers.values() if a.is_correct),
            items=items,
        )

    async def get(self, user_id: uuid.UUID, session_id: uuid.UUID) -> SessionOut:
        return await self._out(await self._own(user_id, session_id))

    async def answer(self, user_id: uuid.UUID, session_id: uuid.UUID, question_id: uuid.UUID, label: str) -> ReviewOut:
        session = await self._own(user_id, session_id)
        if session.finished_at is not None:
            raise AppError(409, "SESSION_FINISHED", "Сессия уже завершена")
        if str(question_id) not in session.question_ids:
            raise AppError(404, "QUESTION_NOT_IN_SESSION", "Этого задания нет в сессии")
        question = await self.db.get(Question, question_id)
        if question is None or label not in {o["label"] for o in question.options}:
            raise AppError(422, "INVALID_OPTION", "Такого варианта ответа нет")
        answer = PracticeAnswer(
            session_id=session.id,
            question_id=question.id,
            selected_label=label,
            is_correct=label == question.correct_label,
            answered_at=utcnow(),
        )
        self.db.add(answer)
        try:
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            raise AppError(409, "ALREADY_ANSWERED", "Ответ на это задание уже принят") from None
        return _review_out(question, answer)

    async def finish(self, user_id: uuid.UUID, session_id: uuid.UUID) -> SessionOut:
        session = await self._own(user_id, session_id)
        if session.finished_at is None:
            session.finished_at = utcnow()
            await self.db.commit()
        return await self._out(session)

    async def stats(self, user_id: uuid.UUID) -> StatsOut:
        answered, correct = (
            await self.db.execute(
                select(func.count(), func.count().filter(PracticeAnswer.is_correct))
                .select_from(PracticeAnswer)
                .join(PracticeSession, PracticeSession.id == PracticeAnswer.session_id)
                .where(PracticeSession.user_id == user_id)
            )
        ).one()
        return StatsOut(answered=answered, correct=correct)
