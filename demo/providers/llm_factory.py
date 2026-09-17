"""
Factory para la construcción de LLMs con resiliencia y fallback nativo de LangChain.
Enlaza el modelo principal (OpenAI) con el modelo de respaldo (AWS Bedrock) mediante with_fallbacks.
"""

from __future__ import annotations

from typing import Any
from langchain_core.runnables import RunnableLambda

try:
    from demo.config import AppConfig
    from demo.providers.openai_provider import get_openai_chat
    from demo.providers.bedrock_provider import get_bedrock_chat
except ImportError:
    from config import AppConfig
    from providers.openai_provider import get_openai_chat
    from providers.bedrock_provider import get_bedrock_chat


def create_resilient_llm(config: AppConfig) -> Any:
    """Construye un modelo o cadena ejecutable de LLM aplicando fallbacks.

    Args:
        config: Configuración de la aplicación.

    Returns:
        Runnable de LangChain listo para recibir prompts y generar respuestas.

    Raises:
        RuntimeError: Si no hay ningún proveedor LLM disponible.
    """
    # 1. Configurar Proveedor Principal (OpenAI)
    primary_llm = None
    if config.has_openai_configured():
        if config.simulate_openai_failure:
            def simulate_failure(_input: Any) -> Any:
                raise RuntimeError("Simulación de fallo forzado en OpenAI (SIMULATE_OPENAI_FAILURE=true)")
            primary_llm = RunnableLambda(simulate_failure)
        else:
            primary_llm = get_openai_chat(config)

    # 2. Configurar Proveedor de Respaldo (AWS Bedrock)
    fallback_llm = get_bedrock_chat(config)

    # 3. Composición de Resiliencia con with_fallbacks
    if primary_llm is not None and fallback_llm is not None:
        print("🔗 Arquitectura de Resiliencia:")
        print(f"   ├── 🥇 Proveedor Principal: OpenAI ({config.openai_model_name})")
        print(f"   └── 🥈 Proveedor Fallback:  AWS Bedrock ({config.bedrock_model_id})")

        def on_fallback_triggered(prompt_input: Any) -> Any:
            print("\n⚠️  [FALLBACK ACTIVADO]: Fallo o indisponibilidad en OpenAI.")
            print(f"🔄 Redirigiendo consulta a AWS Bedrock ({config.bedrock_model_id})...\n")
            return prompt_input

        resilient_fallback = RunnableLambda(on_fallback_triggered) | fallback_llm
        return primary_llm.with_fallbacks([resilient_fallback])

    if primary_llm is not None:
        print(f"ℹ️  Operando únicamente con OpenAI ({config.openai_model_name}). AWS Bedrock no configurado.")
        return primary_llm

    if fallback_llm is not None:
        print(f"ℹ️  Operando directamente con AWS Bedrock ({config.bedrock_model_id}) como proveedor principal.")
        return fallback_llm

    raise RuntimeError(
        "No hay ningún proveedor LLM disponible (ni OpenAI ni AWS Bedrock). "
        "Verifica tu archivo .env con credenciales válidas."
    )
