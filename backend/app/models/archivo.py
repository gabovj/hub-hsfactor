import uuid
from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base


class Archivo(Base):
    __tablename__ = "archivos_clientes"
    __table_args__ = {"schema": "hub"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    oportunidad_id = Column(UUID(as_uuid=True), ForeignKey("hub.crm_oportunidades.id"), nullable=False)
    nombre = Column(String, nullable=False)
    descripcion = Column(Text, nullable=True)
    tipo = Column(String, nullable=False)  # diagnostico | propuesta | contrato | presentacion | reporte | otro
    storage_path = Column(String, nullable=False)
    subido_por = Column(UUID(as_uuid=True), ForeignKey("hub.users.id"), nullable=True)
    tamano_bytes = Column(BigInteger, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
