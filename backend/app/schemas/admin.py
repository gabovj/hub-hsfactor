from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.models.user import UserRole


class UserAdminOut(BaseModel):
    id: UUID
    email: str
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class RoleUpdate(BaseModel):
    role: UserRole


class TemaCreate(BaseModel):
    tema: str
    angulo: Optional[str] = None
    activo: bool = False
    orden: int = 0


class TemaUpdate(BaseModel):
    tema: Optional[str] = None
    angulo: Optional[str] = None
    activo: Optional[bool] = None
    orden: Optional[int] = None


class TemaReorder(BaseModel):
    ids: list[int]


class TemaOut(BaseModel):
    id: int
    tema: str
    angulo: Optional[str] = None
    activo: bool
    orden: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
