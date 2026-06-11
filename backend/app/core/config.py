from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    RESEND_API_KEY: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    ENVIRONMENT: str = "development"
    FRONTEND_URL: str = "http://localhost:3000"

    # Busca .env en el directorio actual y en el padre (raíz del repo)
    model_config = {"env_file": ("../.env", ".env"), "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
