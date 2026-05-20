from pydantic import Field, model_validator
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

    GOOGLE_CLIENT_ID: str = Field(default="", description="Google OAuth client ID")
    GOOGLE_CLIENT_SECRET: str = Field(default="", description="Google OAuth client secret")
    JWT_SECRET: str = Field(default="", description="Segredo para assinar JWTs do fórum")
    BACKEND_URL: str = Field(
        default="http://localhost:8000",
        description="URL pública do backend (usado no redirect OAuth)",
    )
    FORUM_CORS_ORIGIN: str = Field(
        default="https://setlists-pj-ev.pages.dev",
        description="Origem do frontend do fórum (usado no redirect OAuth)",
    )
    SITE_ORIGINS: str = Field(
        default="https://setlists-pj-ev.pages.dev=pj",
        description="Mapeamento origem→site: 'https://a.com=pj,https://b.com=terra-gentil'",
    )

    @model_validator(mode="after")
    def validate_production_secrets(self) -> "Settings":
        if self.ENVIRONMENT == "production" and not self.JWT_SECRET:
            raise ValueError("JWT_SECRET nao pode ser vazio em producao. Configure a variavel de ambiente.")
        return self

    @property
    def site_origin_map(self) -> dict[str, str]:
        result = {}
        for pair in self.SITE_ORIGINS.split(","):
            pair = pair.strip()
            if "=" in pair:
                origin, site = pair.split("=", 1)
                result[origin.strip()] = site.strip()
        return result


settings = Settings()
