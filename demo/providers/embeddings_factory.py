"""
Factory para la creación de almacenes vectoriales FAISS con estrategia de Fallback.
Intenta OpenAI Embeddings como opción primaria y conmuta a AWS Bedrock Embeddings ante fallos.
"""

from __future__ import annotations

from typing import Tuple
from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS

try:
    from demo.config import AppConfig
    from demo.providers.openai_provider import get_openai_embeddings
    from demo.providers.bedrock_provider import get_bedrock_embeddings
except ImportError:
    from config import AppConfig
    from providers.openai_provider import get_openai_embeddings
    from providers.bedrock_provider import get_bedrock_embeddings


def create_vector_store_with_fallback(
    documents: list[Document],
    config: AppConfig
) -> Tuple[FAISS, str]:
    """Crea y puebla un vector store FAISS intentando OpenAI primero y AWS Bedrock como fallback.

    Args:
        documents: Lista de documentos a indexar.
        config: Configuración de la aplicación con credenciales y modelos.

    Returns:
        Tupla conteniendo (vector_store, provider_description).

    Raises:
        RuntimeError: Si ningún proveedor de embeddings pudo generar el almacén vectorial.
    """
    # 1. Intento primario con OpenAI Embeddings
    if config.has_openai_configured() and not config.simulate_openai_failure:
        try:
            openai_embeddings = get_openai_embeddings(config)
            if openai_embeddings is not None:
                store = FAISS.from_documents(documents, openai_embeddings)
                description = f"OpenAI ({config.openai_embedding_model})"
                return store, description
        except Exception as err:
            print(f"   ⚠️ Falló la generación de embeddings con OpenAI: {err}")
            print("   🔄 Activando fallback para embeddings con AWS Bedrock...")

    # 2. Fallback con AWS Bedrock Embeddings
    bedrock_embeddings = get_bedrock_embeddings(config)
    if bedrock_embeddings is not None:
        try:
            store = FAISS.from_documents(documents, bedrock_embeddings)
            description = f"AWS Bedrock ({config.bedrock_embedding_model_id})"
            return store, description
        except Exception as err:
            print(f"   ❌ Error al calcular embeddings con AWS Bedrock: {err}")

    raise RuntimeError(
        "No se pudo inicializar ningún almacén vectorial (fallaron tanto OpenAI como AWS Bedrock). "
        "Verifica tus credenciales en el archivo .env."
    )
