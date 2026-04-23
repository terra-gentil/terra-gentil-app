from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "Terra Gentil API"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = Field(
        default="development",
        description="Ambiente de execução: development, staging, production",
    )

    DATABASE_URL: str = Field(
        default="",
        description="URL de conexão do Supabase Postgres (preencher quando usar)",
    )

    GEMINI_API_KEY: str = Field(
        default="",
        description="API key do Google Gemini",
    )
    GEMINI_MODEL: str = Field(
        default="gemini-2.5-flash",
        description="Modelo do Gemini a usar: gemini-2.5-flash, gemini-2.5-pro, gemini-2.5-flash-lite",
    )


settings = Settings()
