"""initial hub schema

Revision ID: 0001
Revises:
Create Date: 2026-06-10

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

user_role_enum = postgresql.ENUM(
    "superadmin", "coordinador", "vendedor",
    name="user_role",
    schema="hub",
)
crm_etapa_enum = postgresql.ENUM(
    "a_discovery", "discovery_agendada", "en_diagnostico",
    "presentacion_agendada", "en_cierre", "ganado", "descartado",
    name="crm_etapa",
    schema="hub",
)


def upgrade() -> None:
    user_role_enum.create(op.get_bind(), checkfirst=True)
    crm_etapa_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("role", postgresql.ENUM(name="user_role", schema="hub", create_type=False), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("email", name="uq_hub_users_email"),
        schema="hub",
    )

    op.create_table(
        "crm_oportunidades",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("nombre", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("telefono", sa.String(), nullable=True),
        sa.Column("empresa", sa.String(), nullable=True),
        sa.Column("tamano", sa.String(), nullable=True),
        sa.Column("ubicacion", sa.String(), nullable=True),
        sa.Column("fuente", sa.String(), nullable=True),
        sa.Column("etapa", postgresql.ENUM(name="crm_etapa", schema="hub", create_type=False), nullable=False),
        sa.Column("vendedor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hub.users.id"), nullable=True),
        sa.Column("producto_recomendado", sa.String(), nullable=True),
        sa.Column("observaciones", sa.Text(), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("hub.users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("etapa_changed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("eliminado", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("eliminado_razon", sa.Text(), nullable=True),
        sa.Column("eliminado_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("eliminado_por", postgresql.UUID(as_uuid=True), sa.ForeignKey("hub.users.id"), nullable=True),
        schema="hub",
    )

    op.create_table(
        "crm_actividad",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("oportunidad_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hub.crm_oportunidades.id"), nullable=False),
        sa.Column("autor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hub.users.id"), nullable=True),
        sa.Column("tipo", sa.String(), nullable=False),
        sa.Column("nota", sa.Text(), nullable=True),
        sa.Column("etapa_anterior", sa.String(), nullable=True),
        sa.Column("etapa_nueva", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        schema="hub",
    )

    op.create_table(
        "archivos_clientes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("oportunidad_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hub.crm_oportunidades.id"), nullable=False),
        sa.Column("nombre", sa.String(), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("tipo", sa.String(), nullable=False),
        sa.Column("storage_path", sa.String(), nullable=False),
        sa.Column("subido_por", postgresql.UUID(as_uuid=True), sa.ForeignKey("hub.users.id"), nullable=True),
        sa.Column("tamano_bytes", sa.BigInteger(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        schema="hub",
    )

    op.create_table(
        "temas_contenido",
        sa.Column("id", sa.Integer(), autoincrement=True, primary_key=True),
        sa.Column("tema", sa.String(), nullable=False),
        sa.Column("angulo", sa.Text(), nullable=True),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("orden", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        schema="hub",
    )

    # Índices para queries frecuentes del CRM
    op.create_index("ix_crm_oportunidades_etapa", "crm_oportunidades", ["etapa"], schema="hub")
    op.create_index("ix_crm_oportunidades_vendedor_id", "crm_oportunidades", ["vendedor_id"], schema="hub")
    op.create_index("ix_crm_oportunidades_eliminado", "crm_oportunidades", ["eliminado"], schema="hub")
    op.create_index("ix_crm_actividad_oportunidad_id", "crm_actividad", ["oportunidad_id"], schema="hub")


def downgrade() -> None:
    op.drop_index("ix_crm_actividad_oportunidad_id", table_name="crm_actividad", schema="hub")
    op.drop_index("ix_crm_oportunidades_eliminado", table_name="crm_oportunidades", schema="hub")
    op.drop_index("ix_crm_oportunidades_vendedor_id", table_name="crm_oportunidades", schema="hub")
    op.drop_index("ix_crm_oportunidades_etapa", table_name="crm_oportunidades", schema="hub")

    op.drop_table("temas_contenido", schema="hub")
    op.drop_table("archivos_clientes", schema="hub")
    op.drop_table("crm_actividad", schema="hub")
    op.drop_table("crm_oportunidades", schema="hub")
    op.drop_table("users", schema="hub")

    crm_etapa_enum.drop(op.get_bind(), checkfirst=True)
    user_role_enum.drop(op.get_bind(), checkfirst=True)
