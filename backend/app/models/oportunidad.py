import enum
import uuid
from sqlalchemy import Boolean, Column, DateTime, Enum as SAEnum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base


class CrmEtapa(str, enum.Enum):
    a_discovery = "a_discovery"
    discovery_agendada = "discovery_agendada"
    en_diagnostico = "en_diagnostico"
    presentacion_agendada = "presentacion_agendada"
    en_cierre = "en_cierre"
    ganado = "ganado"
    descartado = "descartado"


class Oportunidad(Base):
    __tablename__ = "crm_oportunidades"
    __table_args__ = {"schema": "hub"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String, nullable=False)
    email = Column(String, nullable=True)
    telefono = Column(String, nullable=True)
    empresa = Column(String, nullable=True)
    tamano = Column(String, nullable=True)
    ubicacion = Column(String, nullable=True)
    fuente = Column(String, nullable=True)
    etapa = Column(
        SAEnum(CrmEtapa, name="crm_etapa", schema="hub"),
        nullable=False,
        default=CrmEtapa.a_discovery,
    )
    vendedor_id = Column(UUID(as_uuid=True), ForeignKey("hub.users.id"), nullable=True)
    producto_recomendado = Column(String, nullable=True)
    observaciones = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("hub.users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    etapa_changed_at = Column(DateTime(timezone=True), nullable=True)
    eliminado = Column(Boolean, nullable=False, default=False)
    eliminado_razon = Column(Text, nullable=True)
    eliminado_at = Column(DateTime(timezone=True), nullable=True)
    eliminado_por = Column(UUID(as_uuid=True), ForeignKey("hub.users.id"), nullable=True)
