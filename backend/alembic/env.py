import os
from logging.config import fileConfig
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import engine_from_config, pool, text
from alembic import context

# Cargar .env desde la raíz del repo (hub/.env), sea cual sea el CWD
_root_env = Path(__file__).parent.parent.parent / ".env"
load_dotenv(_root_env)

config = context.config
fileConfig(config.config_file_name)

# Importar todos los modelos para que Alembic los detecte en autogenerate
from app.models import *  # noqa: F401, F403
from app.core.database import Base

target_metadata = Base.metadata

# Leer DATABASE_URL del entorno (no del alembic.ini)
database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise ValueError("DATABASE_URL no está definida en el entorno")
config.set_main_option("sqlalchemy.url", database_url)


def include_object(object, name, type_, reflected, compare_to):
    """Solo incluir objetos del schema hub en las migraciones autogeneradas."""
    if type_ == "table":
        return object.schema == "hub"
    return True


def run_migrations_offline() -> None:
    context.configure(
        url=database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        version_table="alembic_version",
        version_table_schema="hub",
        include_schemas=True,
        include_object=include_object,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        connection.execute(text("CREATE SCHEMA IF NOT EXISTS hub"))
        connection.commit()

        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            version_table="alembic_version",
            version_table_schema="hub",
            include_schemas=True,
            include_object=include_object,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
