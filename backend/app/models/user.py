import enum
import uuid
from sqlalchemy import Boolean, Column, DateTime, Enum as SAEnum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base


class UserRole(str, enum.Enum):
    superadmin = "superadmin"
    coordinador = "coordinador"
    vendedor = "vendedor"


class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "hub"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(
        SAEnum(UserRole, name="user_role", schema="hub"),
        nullable=False,
    )
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
