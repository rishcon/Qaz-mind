from fastapi import APIRouter

from app.api.v1 import admin, assignments, auth, catalog, health, learning, me, practice, school, school_access

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(me.router)
api_router.include_router(catalog.router)
api_router.include_router(learning.router)
api_router.include_router(practice.router)
api_router.include_router(school.router)
api_router.include_router(school_access.router)
api_router.include_router(assignments.router)
api_router.include_router(admin.router)
