"""
Orquestador de ejecución para los escenarios de Context Engineering.
Coordina el pipeline de optimización, cálculo de métricas y generación LLM.
"""

from __future__ import annotations

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

try:
    from demo.config import AppConfig
    from demo.data.documents import get_sample_documents, DEFAULT_QUERY
    from demo.providers.embeddings_factory import create_vector_store_with_fallback
    from demo.providers.llm_factory import create_resilient_llm
    from demo.optimizers import (
        count_tokens,
        long_context_reorder,
        filter_by_cosine_similarity,
        compress_context_to_evidence,
    )
except ImportError:
    from config import AppConfig
    from data.documents import get_sample_documents, DEFAULT_QUERY
    from providers.embeddings_factory import create_vector_store_with_fallback
    from providers.llm_factory import create_resilient_llm
    from optimizers import (
        count_tokens,
        long_context_reorder,
        filter_by_cosine_similarity,
        compress_context_to_evidence,
    )


class ContextEngineeringDemo:
    """Clase principal que orquesta la ejecución didáctica de la demo."""

    def __init__(self, config: AppConfig) -> None:
        self.config = config
        self.documents = get_sample_documents()
        self.query = DEFAULT_QUERY

    def run(self) -> None:
        """Ejecuta los escenarios de Context Engineering."""
        print("=" * 75)
        print("🚀 DEMO DE CONTEXT ENGINEERING: OPTIMIZACIÓN, RESILIENCIA Y CLEAN CODE")
        print("=" * 75)

        if self.config.simulate_openai_failure:
            print("🧪 [MODO PRUEBA ACTIVADO]: 'SIMULATE_OPENAI_FAILURE=true'")
            print("   Se forzará un error en OpenAI para verificar el fallback automático a AWS Bedrock.\n")

        # 1. Almacén Vectorial con Fallback
        print("📦 Inicializando Almacén Vectorial (FAISS)...")
        vector_store, embedding_provider = create_vector_store_with_fallback(
            self.documents, self.config
        )
        print(f"   ✅ Vector store indexado con: {embedding_provider}")

        print(f"\n📌 CONSULTA (X): \"{self.query}\"\n")

        # ----------------------------------------------------------------------
        # ESCENARIO 1: RAG CRUDO (Sin Context Engineering)
        # ----------------------------------------------------------------------
        raw_results = vector_store.similarity_search_with_score(self.query, k=3)
        raw_docs = [doc for doc, _ in raw_results]
        raw_context = "\n\n".join([d.page_content for d in raw_docs])
        raw_tokens = count_tokens(raw_context)

        print("─── [ESCENARIO 1: RAG CRUDO (SIN OPTIMIZACIÓN)] ───")
        print(f"📦 Chunks recuperados: {len(raw_docs)}")
        print(f"📊 Tokens en el prompt |C_crudo|: {raw_tokens} tokens")
        print(f"📝 Muestra del contexto inyectado:\n{raw_context[:180]}...\n")

        # ----------------------------------------------------------------------
        # ESCENARIO 2: CONTEXT ENGINEERING OPTIMIZADO
        # ----------------------------------------------------------------------
        # Paso 1: Filtrado de ruido por similitud coseno
        filtered_docs = filter_by_cosine_similarity(raw_results, threshold=0.45)

        # Paso 2: Reordenamiento posicional (Lost in the Middle)
        reordered_docs = long_context_reorder(filtered_docs)

        # Paso 3: Compresión sintáctica a evidencia relevante R(C)
        optimized_context = compress_context_to_evidence(reordered_docs, self.query)
        optimized_tokens = count_tokens(optimized_context)

        # Métricas de reducción
        token_reduction = ((raw_tokens - optimized_tokens) / raw_tokens) * 100

        print("─── [ESCENARIO 2: CONTEXT ENGINEERING OPTIMIZADO] ───")
        print(f"🎯 Chunks retenidos tras filtrado: {len(reordered_docs)}")
        print(f"📊 Tokens en el prompt |C_optimizado|: {optimized_tokens} tokens")
        print(f"⚡ Reducción de ruido / Ahorro de tokens: {token_reduction:.1f}%")
        print(f"📝 Contexto optimizado inyectado:\n{optimized_context}\n")

        # ----------------------------------------------------------------------
        # ESCENARIO 3: GENERACIÓN CON LLM Y FALLBACK RESILIENTE
        # ----------------------------------------------------------------------
        print("─── [ESCENARIO 3: GENERACIÓN CON LLM Y FALLBACK RESILIENTE] ───")
        llm = create_resilient_llm(self.config)

        prompt_template = ChatPromptTemplate.from_messages([
            ("system", "Responde a la consulta del usuario de forma precisa basándote ÚNICAMENTE en el contexto de evidencia suministrado."),
            ("user", "EVIDENCIA DE CONTEXTO:\n{context}\n\nPREGUNTA: {query}")
        ])

        chain = prompt_template | llm | StrOutputParser()

        print("\n🤖 Generando respuesta final con LangChain...")
        try:
            response = chain.invoke({"context": optimized_context, "query": self.query})
            print(f"\n✅ RESPUESTA FINAL DEL LLM (Y):\n{response}\n")
        except Exception as e:
            print(f"\n❌ Error durante la generación del LLM: {e}")

        print("=" * 75)
        print("MÉTRICAS Y EJECUCIÓN DE CONTEXT ENGINEERING COMPLETADAS.")
        print("=" * 75)
