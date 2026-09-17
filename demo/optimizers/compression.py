"""
Módulo de compresión de contexto y extracción de evidencia relevante R(C).
"""

from __future__ import annotations

from langchain_core.documents import Document


def compress_context_to_evidence(documents: list[Document], query: str = "") -> str:
    """Extrae la evidencia relevante de los documentos eliminando encabezados y notas administrativas.

    Filtra líneas de metadatos o encabezados que aportan entropía pero no valor fáctico
    para responder a la consulta del usuario.

    Args:
        documents: Lista de documentos a procesar.
        query: Consulta original del usuario (opcional para compresión dirigida).

    Returns:
        Cadena de texto con las líneas de evidencia concatenadas.
    """
    evidence_lines: list[str] = []
    for doc in documents:
        lines = doc.page_content.strip().split("\n")
        for line in lines:
            line_str = line.strip()
            # Elimina ruido de encabezados o metadatos administrativos
            if line_str and not line_str.startswith("Nota administrativa:") and not line_str.startswith("["):
                evidence_lines.append(line_str)
    return "\n".join(evidence_lines)
