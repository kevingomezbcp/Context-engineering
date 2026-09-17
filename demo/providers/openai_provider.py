"""
Proveedor de integración con OpenAI (Chat y Embeddings).
Incluye soporte para redes corporativas con inspección SSL y proxies.
"""

from __future__ import annotations

import httpx
from typing import Any
try:
    from demo.config import AppConfig
except ImportError:
    from config import AppConfig

try:
    from langchain_openai import OpenAIEmbeddings, ChatOpenAI
    HAS_OPENAI = True
except ImportError:
    OpenAIEmbeddings = None
    ChatOpenAI = None
    HAS_OPENAI = False


def create_openai_http_client(config: AppConfig) -> httpx.Client | None:
    """Crea un cliente HTTP de httpx configurando verificación SSL según el entorno."""
    if not config.openai_verify_ssl:
        return httpx.Client(verify=False)
    return None


def get_openai_embeddings(config: AppConfig) -> Any | None:
    """Instancia el modelo de embeddings de OpenAI si las credenciales existen."""
    if not HAS_OPENAI or not config.has_openai_configured():
        return None

    http_client = create_openai_http_client(config)
    kwargs: dict[str, Any] = {
        "model": config.openai_embedding_model,
        "api_key": config.openai_api_key,
    }
    if http_client:
        kwargs["http_client"] = http_client

    return OpenAIEmbeddings(**kwargs)


def get_openai_chat(config: AppConfig) -> Any | None:
    """Instancia el modelo LLM de Chat de OpenAI."""
    if not HAS_OPENAI or not config.has_openai_configured():
        return None

    http_client = create_openai_http_client(config)
    kwargs: dict[str, Any] = {
        "model": config.openai_model_name,
        "temperature": 0.0,
        "api_key": config.openai_api_key,
    }
    if http_client:
        kwargs["http_client"] = http_client

    return ChatOpenAI(**kwargs)
