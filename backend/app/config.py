from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Park City Site API"
    database_url: str
    allowed_admin_user: str = "admin"

    model_config = SettingsConfigDict(extra="ignore")


settings = Settings()

