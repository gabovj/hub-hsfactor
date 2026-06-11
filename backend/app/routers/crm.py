from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_coordinador_or_above, require_superadmin
from app.models.actividad import Actividad
from app.models.archivo import Archivo
from app.models.oportunidad import CrmEtapa, Oportunidad
from app.models.user import User, UserRole
from app.schemas.crm import (
    ActividadCreate,
    ActividadOut,
    ArchivoCreate,
    ArchivoOut,
    EliminarRequest,
    EtapaUpdate,
    OportunidadCreate,
    OportunidadOut,
    OportunidadUpdate,
    VendedorOut,
)

router = APIRouter(prefix="/crm", tags=["crm"])


# ---------------------------------------------------------------------------
# Oportunidades
# ---------------------------------------------------------------------------

@router.get("/oportunidades", response_model=List[OportunidadOut])
def list_oportunidades(
    etapa: Optional[CrmEtapa] = Query(None),
    vendedor_id: Optional[UUID] = Query(None),
    eliminado: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Oportunidad).filter(Oportunidad.eliminado.is_(eliminado))

    # Los vendedores solo ven sus propias oportunidades
    if current_user.role == UserRole.vendedor:
        q = q.filter(Oportunidad.vendedor_id == current_user.id)
    elif vendedor_id:
        q = q.filter(Oportunidad.vendedor_id == vendedor_id)

    if etapa:
        q = q.filter(Oportunidad.etapa == etapa)

    return q.order_by(Oportunidad.updated_at.desc()).all()


@router.post("/oportunidades", response_model=OportunidadOut, status_code=status.HTTP_201_CREATED)
def create_oportunidad(
    body: OportunidadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    op = Oportunidad(**body.model_dump(), created_by=current_user.id)
    db.add(op)
    db.commit()
    db.refresh(op)
    return op


@router.get("/oportunidades/{op_id}", response_model=OportunidadOut)
def get_oportunidad(
    op_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    op = _get_op_or_404(op_id, db)
    _check_vendedor_access(op, current_user)
    return op


@router.patch("/oportunidades/{op_id}", response_model=OportunidadOut)
def update_oportunidad(
    op_id: UUID,
    body: OportunidadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    op = _get_op_or_404(op_id, db)
    _check_vendedor_access(op, current_user)

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(op, field, value)

    db.commit()
    db.refresh(op)
    return op


@router.patch("/oportunidades/{op_id}/etapa", response_model=OportunidadOut)
def update_etapa(
    op_id: UUID,
    body: EtapaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    op = _get_op_or_404(op_id, db)
    _check_vendedor_access(op, current_user)

    etapa_anterior = op.etapa
    op.etapa = body.etapa
    op.etapa_changed_at = datetime.now(timezone.utc)
    db.flush()

    actividad = Actividad(
        oportunidad_id=op.id,
        autor_id=current_user.id,
        tipo="etapa_cambio",
        etapa_anterior=etapa_anterior.value,
        etapa_nueva=body.etapa.value,
    )
    db.add(actividad)
    db.commit()
    db.refresh(op)
    return op


@router.delete("/oportunidades/{op_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_oportunidad(
    op_id: UUID,
    body: EliminarRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coordinador_or_above),
):
    op = _get_op_or_404(op_id, db)
    op.eliminado = True
    op.eliminado_razon = body.razon
    op.eliminado_at = datetime.now(timezone.utc)
    op.eliminado_por = current_user.id
    db.commit()
    return None


# ---------------------------------------------------------------------------
# Actividad
# ---------------------------------------------------------------------------

@router.get("/oportunidades/{op_id}/actividad", response_model=List[ActividadOut])
def list_actividad(
    op_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    op = _get_op_or_404(op_id, db)
    _check_vendedor_access(op, current_user)
    return (
        db.query(Actividad)
        .filter(Actividad.oportunidad_id == op_id)
        .order_by(Actividad.created_at.desc())
        .all()
    )


@router.post("/oportunidades/{op_id}/actividad", response_model=ActividadOut, status_code=status.HTTP_201_CREATED)
def create_actividad(
    op_id: UUID,
    body: ActividadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    op = _get_op_or_404(op_id, db)
    _check_vendedor_access(op, current_user)

    actividad = Actividad(
        oportunidad_id=op_id,
        autor_id=current_user.id,
        tipo=body.tipo,
        nota=body.nota,
    )
    db.add(actividad)
    db.commit()
    db.refresh(actividad)
    return actividad


# ---------------------------------------------------------------------------
# Archivos
# ---------------------------------------------------------------------------

@router.get("/oportunidades/{op_id}/archivos", response_model=List[ArchivoOut])
def list_archivos(
    op_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    op = _get_op_or_404(op_id, db)
    _check_vendedor_access(op, current_user)
    return db.query(Archivo).filter(Archivo.oportunidad_id == op_id).order_by(Archivo.created_at.desc()).all()


@router.post("/oportunidades/{op_id}/archivos", response_model=ArchivoOut, status_code=status.HTTP_201_CREATED)
def register_archivo(
    op_id: UUID,
    body: ArchivoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    op = _get_op_or_404(op_id, db)
    _check_vendedor_access(op, current_user)

    archivo = Archivo(**body.model_dump(), oportunidad_id=op_id, subido_por=current_user.id)
    db.add(archivo)
    db.commit()
    db.refresh(archivo)
    return archivo


@router.delete("/oportunidades/{op_id}/archivos/{archivo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_archivo(
    op_id: UUID,
    archivo_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    archivo = db.query(Archivo).filter(Archivo.id == archivo_id, Archivo.oportunidad_id == op_id).first()
    if not archivo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Archivo no encontrado")
    db.delete(archivo)
    db.commit()
    return None


# ---------------------------------------------------------------------------
# Vendedores (lista para asignar a oportunidades)
# ---------------------------------------------------------------------------

@router.get("/vendedores", response_model=List[VendedorOut])
def list_vendedores(
    db: Session = Depends(get_db),
    _: User = Depends(require_coordinador_or_above),
):
    return (
        db.query(User)
        .filter(User.role == UserRole.vendedor, User.is_active.is_(True))
        .order_by(User.email)
        .all()
    )


# ---------------------------------------------------------------------------
# Helpers privados
# ---------------------------------------------------------------------------

def _get_op_or_404(op_id: UUID, db: Session) -> Oportunidad:
    op = db.query(Oportunidad).filter(Oportunidad.id == op_id).first()
    if not op:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Oportunidad no encontrada")
    return op


def _check_vendedor_access(op: Oportunidad, user: User) -> None:
    if user.role == UserRole.vendedor and op.vendedor_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso no permitido")
