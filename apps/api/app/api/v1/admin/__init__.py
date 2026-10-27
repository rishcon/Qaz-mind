from fastapi import APIRouter

from app.api.v1.admin import auth, content, data, questions, staff

router = APIRouter(prefix="/admin")
router.include_router(auth.router)
router.include_router(staff.router)
router.include_router(data.router)
router.include_router(content.router)
router.include_router(questions.router)
