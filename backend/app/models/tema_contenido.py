from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func
from app.core.database import Base


class TemaContenido(Base):
    __tablename__ = "temas_contenido"
    __table_args__ = {"schema": "hub"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    tema = Column(String, nullable=False)
    angulo = Column(Text, nullable=True)
    activo = Column(Boolean, nullable=False, default=False)
    orden = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
