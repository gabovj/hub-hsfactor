from sqlalchemy.orm import Session


def seed_database(db: Session) -> None:
    """Crea datos iniciales si no existen. Se llama en el startup de FastAPI."""
    # Los seeds reales se agregan en Fase 3 cuando existan los modelos de User.
    pass
