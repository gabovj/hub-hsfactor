from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_superadmin
from app.models.tema_contenido import TemaContenido
from app.models.user import User
from app.schemas.admin import TemaCreate, TemaOut, TemaReorder, TemaUpdate

router = APIRouter(prefix="/contenidos", tags=["contenidos"])


@router.get("/temas", response_model=List[TemaOut])
def list_temas(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(TemaContenido).order_by(TemaContenido.orden, TemaContenido.id).all()


@router.post("/temas", response_model=TemaOut, status_code=status.HTTP_201_CREATED)
def create_tema(
    body: TemaCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_superadmin),
):
    tema = TemaContenido(**body.model_dump())
    db.add(tema)
    db.commit()
    db.refresh(tema)
    return tema


@router.patch("/temas/{tema_id}", response_model=TemaOut)
def update_tema(
    tema_id: int,
    body: TemaUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_superadmin),
):
    tema = _get_tema_or_404(tema_id, db)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(tema, field, value)
    db.commit()
    db.refresh(tema)
    return tema


@router.patch("/temas/{tema_id}/toggle", response_model=TemaOut)
def toggle_tema(
    tema_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_superadmin),
):
    tema = _get_tema_or_404(tema_id, db)
    tema.activo = not tema.activo
    db.commit()
    db.refresh(tema)
    return tema


@router.post("/temas/reorder", status_code=status.HTTP_204_NO_CONTENT)
def reorder_temas(
    body: TemaReorder,
    db: Session = Depends(get_db),
    _: User = Depends(require_superadmin),
):
    for orden, tema_id in enumerate(body.ids):
        db.query(TemaContenido).filter(TemaContenido.id == tema_id).update({"orden": orden})
    db.commit()
    return None


@router.delete("/temas/{tema_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tema(
    tema_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_superadmin),
):
    tema = _get_tema_or_404(tema_id, db)
    db.delete(tema)
    db.commit()
    return None


def _get_tema_or_404(tema_id: int, db: Session) -> TemaContenido:
    tema = db.query(TemaContenido).filter(TemaContenido.id == tema_id).first()
    if not tema:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tema no encontrado")
    return tema
