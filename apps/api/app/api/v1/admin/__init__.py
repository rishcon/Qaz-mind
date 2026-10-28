from fastapi import APIRouter

from app.api.v1.admin import auth, content, data, licenses, questions, school_directory, schools, staff

router = APIRouter(prefix="/admin")
router.include_router(auth.router)
router.include_router(staff.router)
router.include_router(data.router)
router.include_router(content.router)
router.include_router(questions.router)
router.include_router(schools.router)
router.include_router(school_directory.router)
router.include_router(licenses.router)
