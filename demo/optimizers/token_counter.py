"""
Módulo para el conteo y auditoría precisa de tokens en cadenas de texto.
"""

from __future__ import annotations

import tiktoken


def count_tokens(text: str, model_name: str = "gpt-4o-mini") -> int:
    """Calcula el número exacto de tokens de un texto usando tiktoken.

    Args:
        text: Texto a analizar.
        model_name: Nombre del modelo para resolver la codificación BPE.

    Returns:
        Cantidad entera de tokens.
    """
    try:
        encoding = tiktoken.encoding_for_model(model_name)
    except Exception:
        encoding = tiktoken.get_encoding("cl100k_base")
    return len(encoding.encode(text))
