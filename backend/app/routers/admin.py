from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_superadmin
from app.models.user import User, UserRole
from app.schemas.admin import RoleUpdate, UserAdminOut

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=List[UserAdminOut])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_superadmin),
):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.patch("/users/{user_id}/toggle-active", response_model=UserAdminOut)
def toggle_active(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    user = _get_user_or_404(user_id, db)
    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No puedes desactivar tu propia cuenta")
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}/role", response_model=UserAdminOut)
def update_role(
    user_id: UUID,
    body: RoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_superadmin),
):
    user = _get_user_or_404(user_id, db)
    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No puedes cambiar tu propio rol")
    user.role = body.role
    db.commit()
    db.refresh(user)
    return user


def _get_user_or_404(user_id: UUID, db: Session) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return user
