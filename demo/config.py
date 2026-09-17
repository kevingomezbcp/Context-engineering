"""
Configuración centralizada y tipada para la Demo de Context Engineering.
Carga y valida variables de entorno para OpenAI y AWS Bedrock.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from dotenv import load_dotenv


@dataclass(frozen=True)
class AppConfig:
    """Clase inmutable de configuración de la aplicación."""

    # OpenAI
    openai_api_key: str | None
    openai_model_name: str
    openai_embedding_model: str
    openai_verify_ssl: bool

    # AWS Bedrock
    aws_region: str
    aws_access_key_id: str | None
    aws_secret_access_key: str | None
    aws_session_token: str | None
    aws_profile: str | None
    bedrock_model_id: str
    bedrock_embedding_model_id: str
    aws_verify_ssl: bool
    aws_ca_bundle: str | None

    # Flags de prueba
    simulate_openai_failure: bool

    @classmethod
    def load(cls) -> AppConfig:
        """Carga la configuración buscando archivos .env en orden de prioridad."""
        current_dir = Path.cwd()
        potential_env_paths = [
            current_dir / ".env",
            current_dir / "demo" / ".env",
            Path(__file__).resolve().parent / ".env",
        ]

        for env_path in potential_env_paths:
            if env_path.is_file():
                load_dotenv(dotenv_path=env_path, override=False)
                break
        else:
            load_dotenv()

        # SSL defaults
        aws_verify_ssl_raw = os.environ.get("AWS_VERIFY_SSL", "false").strip().lower()
        aws_verify_ssl = aws_verify_ssl_raw not in ("false", "0", "no")

        openai_verify_ssl_raw = os.environ.get("OPENAI_VERIFY_SSL", os.environ.get("AWS_VERIFY_SSL", "false")).strip().lower()
        openai_verify_ssl = openai_verify_ssl_raw not in ("false", "0", "no")

        simulate_failure_raw = os.environ.get("SIMULATE_OPENAI_FAILURE", "false").strip().lower()
        simulate_failure = simulate_failure_raw in ("true", "1", "yes")

        return cls(
            openai_api_key=os.environ.get("OPENAI_API_KEY"),
            openai_model_name=os.environ.get("OPENAI_MODEL_NAME", "gpt-4o-mini"),
            openai_embedding_model=os.environ.get("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"),
            openai_verify_ssl=openai_verify_ssl,
            aws_region=os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or "us-east-1",
            aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
            aws_session_token=os.environ.get("AWS_SESSION_TOKEN"),
            aws_profile=os.environ.get("AWS_PROFILE"),
            bedrock_model_id=os.environ.get("BEDROCK_MODEL_ID", "us.anthropic.claude-haiku-4-5-20251001-v1:0"),
            bedrock_embedding_model_id=os.environ.get("BEDROCK_EMBEDDING_MODEL_ID", "amazon.titan-embed-text-v1"),
            aws_verify_ssl=aws_verify_ssl,
            aws_ca_bundle=os.environ.get("AWS_CA_BUNDLE"),
            simulate_openai_failure=simulate_failure,
        )

    def has_openai_configured(self) -> bool:
        """Indica si existen credenciales válidas para OpenAI."""
        return bool(self.openai_api_key and self.openai_api_key.strip())

    def has_bedrock_configured(self) -> bool:
        """Indica si AWS Bedrock tiene configuración disponible."""
        return bool(
            self.aws_access_key_id or
            self.aws_profile or
            self.aws_region or
            os.environ.get("AWS_DEFAULT_REGION")
        )

    def is_executable(self) -> bool:
        """Valida que al menos un proveedor esté disponible."""
        return self.has_openai_configured() or self.has_bedrock_configured()
