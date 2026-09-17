"""
Módulo para el filtrado semántico por umbral de similitud coseno.
"""

from __future__ import annotations

from langchain_core.documents import Document


def filter_by_cosine_similarity(
    results_with_scores: list[tuple[Document, float]],
    threshold: float = 0.45
) -> list[Document]:
    """Filtra documentos convirtiendo la distancia L2 de FAISS a Similitud Coseno.

    Conserva únicamente chunks cuya similitud estimada sea mayor o igual al umbral especificado,
    eliminando el ruido N(C).

    Args:
        results_with_scores: Lista de tuplas (Document, distancia_l2) provenientes de FAISS.
        threshold: Umbral mínimo de similitud coseno requerido (0.0 a 1.0).

    Returns:
        Lista de documentos filtrados que superan el umbral.
    """
    filtered_docs: list[Document] = []
    for doc, score in results_with_scores:
        # Conversión de distancia L2 al cuadrado a similitud coseno en vectores unitarios:
        cosine_sim = 1.0 - (score / 2.0)
        if cosine_sim >= threshold:
            filtered_docs.append(doc)
    return filtered_docs
