import uuid
from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base


class Actividad(Base):
    __tablename__ = "crm_actividad"
    __table_args__ = {"schema": "hub"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    oportunidad_id = Column(UUID(as_uuid=True), ForeignKey("hub.crm_oportunidades.id"), nullable=False)
    autor_id = Column(UUID(as_uuid=True), ForeignKey("hub.users.id"), nullable=True)
    tipo = Column(String, nullable=False)  # nota | llamada | email | etapa_cambio
    nota = Column(Text, nullable=True)
    etapa_anterior = Column(String, nullable=True)
    etapa_nueva = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
