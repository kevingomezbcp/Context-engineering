"""
Demo de Context Engineering y Optimización de Contexto con LangChain

Este script demuestra cómo aplicar técnicas de Context Engineering en LangChain:
1. Recuperación Vectorial (RAG) con FAISS.
2. Filtrado por Umbral de Similitud Coseno (reducción de ruido N(C)).
3. Reordenamiento de Contexto (prevención de 'Lost in the Middle').
4. Compresión y Extracción de Evidencia Relevante R(C).
5. Medición Cuantitativa de Reducción de Tokens e Inferencia con LLM.

Uso:
    python demo/context_optimization_demo.py
"""

import os
import numpy as np
import tiktoken
from dotenv import load_dotenv

from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import FAISS


def count_tokens(text: str, model_name: str = "gpt-4o-mini") -> int:
    """Calcula el número exacto de tokens de un texto."""
    try:
        encoding = tiktoken.encoding_for_model(model_name)
    except Exception:
        encoding = tiktoken.get_encoding("cl100k_base")
    return len(encoding.encode(text))


def long_context_reorder(documents: list[Document]) -> list[Document]:
    """
    Reordena los documentos para colocar los más relevantes al inicio y al final del contexto,
    evitando la degradación por atención en la zona central ('Lost in the Middle').
    """
    reordered = []
    for i, doc in enumerate(documents):
        if i % 2 == 0:
            reordered.append(doc)
        else:
            reordered.insert(0, doc)
    return reordered


def filter_by_cosine_similarity(results_with_scores: list[tuple[Document, float]], threshold: float = 0.45) -> list[Document]:
    """
    Filtra documentos convirtiendo la distancia L2 de FAISS a Similitud Coseno.
    Conserva únicamente chunks cuya similitud sea mayor o igual al umbral.
    """
    filtered_docs = []
    for doc, score in results_with_scores:
        # Conversión de distancia L2 al cuadrado a similitud coseno en vectores unitarios:
        cosine_sim = 1.0 - (score / 2.0)
        if cosine_sim >= threshold:
            filtered_docs.append(doc)
    return filtered_docs


def compress_context_to_evidence(documents: list[Document], query: str) -> str:
    """
    Extrae la evidencia relevante de los documentos eliminando encabezados y notas administrativas.
    """
    evidence_lines = []
    for doc in documents:
        lines = doc.page_content.strip().split("\n")
        for line in lines:
            line_str = line.strip()
            # Elimina ruido de encabezados o metadatos de relleno
            if line_str and not line_str.startswith("Nota administrativa:") and not line_str.startswith("["):
                evidence_lines.append(line_str)
    return "\n".join(evidence_lines)


def main():
    # 1. Cargar API Key
    load_dotenv()
    if not os.environ.get("OPENAI_API_KEY"):
        print("⚠️ ADVERTENCIA: No se encontró OPENAI_API_KEY. Por favor, configúrala en el archivo .env")
        return

    print("=" * 75)
    print("🚀 DEMO DE CONTEXT ENGINEERING: OPTIMIZACIÓN Y MEDICIÓN DE CONTEXTO")
    print("=" * 75)

    # 2. Construir Base de Conocimiento con Chunks Largos y Ruido
    raw_documents = [
        Document(
            page_content="""[POLÍTICA CORPORATIVA BCP 2026]
Sección 1: Términos y Normativas Internas.
Nota administrativa: Documento registrado bajo revisión legal 884-B en mayo de 2025.
Sección 4.2 - Garantía de Equipos Laptops: Los equipos portátiles asignados al personal cuentan con una garantía extendida oficial de 24 meses a partir de la fecha de entrega y activación en el sistema central.
Sección 4.3 - Excepciones: La garantía no cubre daños por derrame de líquidos o golpes accidentales.
Contacto de soporte técnico de TI: anexo 4500 o soporte_ti@bcp.com.pe. Horario de atención: 8:00 a 18:00 hrs.""",
            metadata={"topic": "laptops", "section": "4.2"}
        ),
        Document(
            page_content="""[GUÍA DE MANTENIMIENTO PREVENTIVO]
Información general sobre desinfección de teclados, soplado de ventiladores y parches del sistema operativo.
El mantenimiento preventivo debe programarse semestralmente con el equipo de TI.
Si el equipo presenta fallas operativas cubiertas por la póliza, refiérase al periodo oficial de garantía de 24 meses estipulado en la sección 4.2.""",
            metadata={"topic": "mantenimiento"}
        ),
        Document(
            page_content="""[CONTRATO MARCO DE ACCESORIOS E INFORMÁTICA]
Cláusula 12: Términos Generales de Adquisición de Periféricos.
Los periféricos menores como mouses, teclados USB y adaptadores de video cuentan únicamente con una garantía estándar de 6 meses.
Para estaciones de trabajo y laptops principales rige la garantía extendida de 24 meses.""",
            metadata={"topic": "perifericos"}
        )
    ]

    # 3. Almacén Vectorial FAISS
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    vector_store = FAISS.from_documents(raw_documents, embeddings)

    query = "¿Cuál es el tiempo de garantía para las laptops asignadas?"
    print(f"\n📌 CONSULTA (X): \"{query}\"\n")

    # --------------------------------------------------------------------------
    # ESCENARIO 1: RAG CRUDO (Sin Context Engineering)
    # --------------------------------------------------------------------------
    # Búsqueda vectorial directa sin filtrado ni compresión
    raw_results = vector_store.similarity_search_with_score(query, k=3)
    raw_docs = [doc for doc, _ in raw_results]
    raw_context = "\n\n".join([d.page_content for d in raw_docs])
    raw_tokens = count_tokens(raw_context)

    print("─── [ESCENARIO 1: RAG CRUDO (SIN OPTIMIZACIÓN)] ───")
    print(f"📦 Chunks recuperados: {len(raw_docs)}")
    print(f"📊 Tokens en el prompt |C_crudo|: {raw_tokens} tokens")
    print(f"📝 Muestra del contexto inyectado:\n{raw_context[:180]}...\n")

    # --------------------------------------------------------------------------
    # ESCENARIO 2: CONTEXT ENGINEERING OPTIMIZADO
    # --------------------------------------------------------------------------
    # Aplicamos Pipeline de Context Engineering:
    # 1. Filtrado por Umbral de Similitud Coseno (elimina ruido N(C))
    filtered_docs = filter_by_cosine_similarity(raw_results, threshold=0.45)
    
    # 2. Reordenamiento de Posición (Evita Lost in the Middle)
    reordered_docs = long_context_reorder(filtered_docs)
    
    # 3. Extracción/Compresión de Evidencia Relevante R(C)
    optimized_context = compress_context_to_evidence(reordered_docs, query)
    optimized_tokens = count_tokens(optimized_context)

    # Cálculo de métricas
    token_reduction = ((raw_tokens - optimized_tokens) / raw_tokens) * 100

    print("─── [ESCENARIO 2: CONTEXT ENGINEERING OPTIMIZADO] ───")
    print(f"🎯 Chunks retenidos tras filtrado: {len(reordered_docs)}")
    print(f"📊 Tokens en el prompt |C_optimizado|: {optimized_tokens} tokens")
    print(f"⚡ Reducción de ruido / Ahorro de tokens: {token_reduction:.1f}%")
    print(f"📝 Contexto optimizado inyectado:\n{optimized_context}\n")

    # --------------------------------------------------------------------------
    # 5. Generación con LLM usando LangChain
    # --------------------------------------------------------------------------
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.0)

    prompt_template = ChatPromptTemplate.from_messages([
        ("system", "Responde a la consulta del usuario de forma precisa basándote ÚNICAMENTE en el contexto de evidencia suministrado."),
        ("user", "EVIDENCIA DE CONTEXTO:\n{context}\n\nPREGUNTA: {query}")
    ])

    chain = prompt_template | llm | StrOutputParser()

    print("🤖 Generando respuesta final con LangChain...")
    response = chain.invoke({"context": optimized_context, "query": query})

    print(f"\n✅ RESPUETA FINAL DEL LLM (Y):\n{response}\n")

    print("=" * 75)
    print("MÉTRICAS Y EJECUCIÓN DE CONTEXT ENGINEERING COMPLETADAS.")
    print("=" * 75)


if __name__ == "__main__":
    main()
