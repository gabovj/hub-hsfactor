from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr

from app.models.oportunidad import CrmEtapa


class OportunidadCreate(BaseModel):
    nombre: str
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    empresa: Optional[str] = None
    tamano: Optional[str] = None
    ubicacion: Optional[str] = None
    fuente: Optional[str] = None
    etapa: CrmEtapa = CrmEtapa.a_discovery
    vendedor_id: Optional[UUID] = None
    producto_recomendado: Optional[str] = None
    observaciones: Optional[str] = None


class OportunidadUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    empresa: Optional[str] = None
    tamano: Optional[str] = None
    ubicacion: Optional[str] = None
    fuente: Optional[str] = None
    vendedor_id: Optional[UUID] = None
    producto_recomendado: Optional[str] = None
    observaciones: Optional[str] = None


class EtapaUpdate(BaseModel):
    etapa: CrmEtapa


class EliminarRequest(BaseModel):
    razon: str


class OportunidadOut(BaseModel):
    id: UUID
    nombre: str
    email: Optional[str] = None
    telefono: Optional[str] = None
    empresa: Optional[str] = None
    tamano: Optional[str] = None
    ubicacion: Optional[str] = None
    fuente: Optional[str] = None
    etapa: CrmEtapa
    vendedor_id: Optional[UUID] = None
    producto_recomendado: Optional[str] = None
    observaciones: Optional[str] = None
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    etapa_changed_at: Optional[datetime] = None
    eliminado: bool

    model_config = {"from_attributes": True}


class ActividadCreate(BaseModel):
    tipo: str  # nota | llamada | email
    nota: Optional[str] = None


class ActividadOut(BaseModel):
    id: UUID
    oportunidad_id: UUID
    autor_id: Optional[UUID] = None
    tipo: str
    nota: Optional[str] = None
    etapa_anterior: Optional[str] = None
    etapa_nueva: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ArchivoCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    tipo: str
    storage_path: str
    tamano_bytes: Optional[int] = None


class ArchivoOut(BaseModel):
    id: UUID
    oportunidad_id: UUID
    nombre: str
    descripcion: Optional[str] = None
    tipo: str
    storage_path: str
    subido_por: Optional[UUID] = None
    tamano_bytes: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class VendedorOut(BaseModel):
    id: UUID
    email: str
    role: str
    is_active: bool

    model_config = {"from_attributes": True}
