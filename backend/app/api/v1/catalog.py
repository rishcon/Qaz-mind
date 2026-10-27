from fastapi import APIRouter

from app.api.deps import ProfileDep
from app.schemas.profile import ProfilePairOut

router = APIRouter(prefix="/catalog", tags=["catalog"])


@router.get("/profile-pairs", response_model=list[ProfilePairOut])
async def profile_pairs(profiles: ProfileDep) -> list[ProfilePairOut]:
    # Public reference data: the onboarding screen shows it before a user is logged in.
    return await profiles.list_pairs()
