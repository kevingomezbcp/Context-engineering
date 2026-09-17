"""
Módulo de reordenamiento de documentos para mitigar el sesgo 'Lost in the Middle'.
"""

from __future__ import annotations

from langchain_core.documents import Document


def long_context_reorder(documents: list[Document]) -> list[Document]:
    """Reordena los documentos colocando los más relevantes al inicio y final.

    Los LLMs prestan mayor atención a los extremos del contexto (primacía y recencia).
    Este algoritmo intercala los documentos para evitar colocar la evidencia más crítica
    en la zona muerta de atención central.

    Args:
        documents: Lista ordenada de documentos según score de relevancia.

    Returns:
        Nueva lista de documentos reordenados estratégicamente.
    """
    reordered: list[Document] = []
    for i, doc in enumerate(documents):
        if i % 2 == 0:
            reordered.append(doc)
        else:
            reordered.insert(0, doc)
    return reordered
