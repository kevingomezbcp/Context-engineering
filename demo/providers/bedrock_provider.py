"""
Proveedor de integración con AWS Bedrock (Chat y Embeddings).
Soporta bypass SSL corporativo, perfiles de AWS CLI y APIs Converse / InvokeModel.
"""

from __future__ import annotations

import warnings
from typing import Any
try:
    from demo.config import AppConfig
except ImportError:
    from config import AppConfig

# Suprimir avisos de deprecación de LangChain al usar fallback community
warnings.filterwarnings("ignore", message=".*BedrockEmbeddings was deprecated.*")
warnings.filterwarnings("ignore", message=".*BedrockChat was deprecated.*")

try:
    import boto3
    HAS_BOTO3 = True
except ImportError:
    boto3 = None
    HAS_BOTO3 = False


def create_bedrock_client(config: AppConfig) -> Any | None:
    """Crea y retorna un cliente boto3 para Bedrock Runtime respetando la configuración SSL."""
    if not HAS_BOTO3:
        return None

    try:
        session_kwargs: dict[str, Any] = {"region_name": config.aws_region}

        if config.aws_profile:
            session_kwargs["profile_name"] = config.aws_profile
        if config.aws_access_key_id and config.aws_secret_access_key:
            session_kwargs["aws_access_key_id"] = config.aws_access_key_id
            session_kwargs["aws_secret_access_key"] = config.aws_secret_access_key
            if config.aws_session_token:
                session_kwargs["aws_session_token"] = config.aws_session_token

        session = boto3.Session(**session_kwargs)

        client_kwargs: dict[str, Any] = {}
        if config.aws_ca_bundle:
            client_kwargs["verify"] = config.aws_ca_bundle
        elif not config.aws_verify_ssl:
            client_kwargs["verify"] = False
            try:
                import urllib3
                urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
            except Exception:
                pass

        return session.client("bedrock-runtime", **client_kwargs)
    except Exception as e:
        print(f"⚠️ Advertencia al inicializar cliente Bedrock boto3: {e}")
        return None


def get_bedrock_embeddings(config: AppConfig) -> Any | None:
    """Instancia el modelo de embeddings de AWS Bedrock (ej. Amazon Titan Embeddings)."""
    if not HAS_BOTO3:
        return None

    client = create_bedrock_client(config)
    if client is None:
        return None

    model_id = config.bedrock_embedding_model_id
    region = config.aws_region

    # 1. Intentar con langchain_aws
    try:
        from langchain_aws import BedrockEmbeddings
        return BedrockEmbeddings(model_id=model_id, client=client, region_name=region)
    except (ImportError, Exception):
        pass

    # 2. Intentar con langchain_community como respaldo
    try:
        from langchain_community.embeddings import BedrockEmbeddings
        return BedrockEmbeddings(model_id=model_id, client=client, region_name=region)
    except (ImportError, Exception):
        pass

    return None


def get_bedrock_chat(config: AppConfig) -> Any | None:
    """Instancia el modelo LLM de Chat de AWS Bedrock."""
    if not HAS_BOTO3:
        return None

    client = create_bedrock_client(config)
    if client is None:
        return None

    model_id = config.bedrock_model_id
    region = config.aws_region

    # 1. Intentar con ChatBedrockConverse de langchain_aws (recomendada para inference profiles)
    try:
        from langchain_aws import ChatBedrockConverse
        return ChatBedrockConverse(
            model=model_id,
            client=client,
            region_name=region,
            temperature=0.0
        )
    except (ImportError, Exception):
        pass

    # 2. Intentar con ChatBedrock de langchain_aws
    try:
        from langchain_aws import ChatBedrock
        return ChatBedrock(
            model_id=model_id,
            client=client,
            region_name=region,
            model_kwargs={"temperature": 0.0}
        )
    except (ImportError, Exception):
        pass

    # 3. Intentar con BedrockChat de langchain_community como respaldo
    try:
        from langchain_community.chat_models import BedrockChat
        return BedrockChat(
            model_id=model_id,
            client=client,
            region_name=region,
            model_kwargs={"temperature": 0.0}
        )
    except (ImportError, Exception):
        pass

    return None
