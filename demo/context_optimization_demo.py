"""
Demo de Context Engineering y Optimización de Contexto con LangChain

Este script demuestra cómo aplicar técnicas de Context Engineering en LangChain:
1. Recuperación Vectorial (RAG) con FAISS.
2. Filtrado por Umbral de Similitud Coseno (reducción de ruido N(C)).
3. Reordenamiento de Contexto (prevención de 'Lost in the Middle').
4. Compresión y Extracción de Evidencia Relevante R(C).
5. Medición Cuantitativa de Reducción de Tokens e Inferencia con LLM.
6. Estrategia de Resiliencia: OpenAI como proveedor principal y AWS Bedrock como fallback.

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
from langchain_community.vectorstores import FAISS

# Proveedor OpenAI
try:
    from langchain_openai import OpenAIEmbeddings, ChatOpenAI
    HAS_OPENAI = True
except ImportError:
    OpenAIEmbeddings = None
    ChatOpenAI = None
    HAS_OPENAI = False

# Proveedor AWS Bedrock (soporte para boto3)
try:
    import boto3
    HAS_BOTO3 = True
except ImportError:
    boto3 = None
    HAS_BOTO3 = False

# Soporte opcional para certificados de Windows en entornos corporativos
try:
    import truststore
    truststore.inject_into_ssl()
except Exception:
    pass


def create_bedrock_client():
    """
    Crea un cliente boto3 para AWS Bedrock Runtime respetando variables de entorno,
    perfiles configurados, roles IAM y configuración SSL corporativa.
    """
    if not HAS_BOTO3:
        return None
    try:
        region = os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or "us-east-1"
        session_kwargs = {"region_name": region}

        if os.environ.get("AWS_PROFILE"):
            session_kwargs["profile_name"] = os.environ.get("AWS_PROFILE")
        if os.environ.get("AWS_ACCESS_KEY_ID") and os.environ.get("AWS_SECRET_ACCESS_KEY"):
            session_kwargs["aws_access_key_id"] = os.environ.get("AWS_ACCESS_KEY_ID")
            session_kwargs["aws_secret_access_key"] = os.environ.get("AWS_SECRET_ACCESS_KEY")
            if os.environ.get("AWS_SESSION_TOKEN"):
                session_kwargs["aws_session_token"] = os.environ.get("AWS_SESSION_TOKEN")

        session = boto3.Session(**session_kwargs)

        # Configuración de SSL para entornos corporativos (Zscaler, proxies bancarios, etc.)
        verify_ssl = os.environ.get("AWS_VERIFY_SSL", "true").strip().lower() not in ("false", "0", "no")
        ca_bundle = os.environ.get("AWS_CA_BUNDLE")

        client_kwargs = {}
        if ca_bundle:
            client_kwargs["verify"] = ca_bundle
        elif not verify_ssl:
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


def get_bedrock_llm():
    """
    Inicializa el modelo de chat de AWS Bedrock utilizando langchain-aws o langchain-community.
    """
    if not HAS_BOTO3:
        return None

    model_id = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0")
    region = os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or "us-east-1"
    client = create_bedrock_client()

    # 1. Intentar con ChatBedrock de langchain_aws
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

    # 2. Intentar con ChatBedrockConverse de langchain_aws (API Converse unificada)
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


def get_bedrock_embeddings():
    """
    Inicializa el modelo de embeddings de AWS Bedrock (ej. Amazon Titan Embeddings).
    """
    if not HAS_BOTO3:
        return None

    model_id = os.environ.get("BEDROCK_EMBEDDING_MODEL_ID", "amazon.titan-embed-text-v1")
    region = os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or "us-east-1"
    client = create_bedrock_client()

    # 1. langchain_aws
    try:
        from langchain_aws import BedrockEmbeddings
        return BedrockEmbeddings(
            model_id=model_id,
            client=client,
            region_name=region
        )
    except (ImportError, Exception):
        pass

    # 2. langchain_community
    try:
        from langchain_community.embeddings import BedrockEmbeddings
        return BedrockEmbeddings(
            model_id=model_id,
            client=client,
            region_name=region
        )
    except (ImportError, Exception):
        pass

    return None


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
    # 1. Cargar variables de entorno y validar proveedores
    load_dotenv()
    openai_api_key = os.environ.get("OPENAI_API_KEY")
    simulate_failure = os.environ.get("SIMULATE_OPENAI_FAILURE", "false").strip().lower() in ("true", "1", "yes")

    has_aws_config = bool(
        os.environ.get("AWS_ACCESS_KEY_ID") or
        os.environ.get("AWS_PROFILE") or
        os.environ.get("AWS_DEFAULT_REGION") or
        os.environ.get("AWS_REGION")
    )

    if not openai_api_key and not has_aws_config:
        print("⚠️ ADVERTENCIA: No se encontró configuración ni de OPENAI_API_KEY ni de AWS Bedrock.")
        print("Por favor, configura al menos uno de los proveedores en el archivo demo/.env")
        return

    print("=" * 75)
    print("🚀 DEMO DE CONTEXT ENGINEERING: OPTIMIZACIÓN, RESILIENCIA Y FALLBACK")
    print("=" * 75)

    if simulate_failure:
        print("🧪 [MODO PRUEBA ACTIVADO]: 'SIMULATE_OPENAI_FAILURE=true'")
        print("   Se forzará un error en OpenAI para verificar el fallback automático a AWS Bedrock.\n")

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

    # 3. Almacén Vectorial FAISS con Resiliencia y Fallback (OpenAI -> AWS Bedrock)
    print("📦 Inicializando Almacén Vectorial (FAISS)...")
    vector_store = None
    embedding_provider_used = None

    # Configuración de cliente HTTP para OpenAI en entornos corporativos
    openai_verify_ssl = os.environ.get("OPENAI_VERIFY_SSL", os.environ.get("AWS_VERIFY_SSL", "true")).strip().lower() not in ("false", "0", "no")
    openai_http_client = None
    if not openai_verify_ssl:
        try:
            import httpx
            openai_http_client = httpx.Client(verify=False)
        except Exception:
            pass

    # Intentar OpenAI Embeddings si está disponible y no se simula falla
    if openai_api_key and HAS_OPENAI and not simulate_failure:
        try:
            openai_embed_model = os.environ.get("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
            embeddings_kwargs = {"model": openai_embed_model}
            if openai_http_client:
                embeddings_kwargs["http_client"] = openai_http_client
            embeddings = OpenAIEmbeddings(**embeddings_kwargs)
            vector_store = FAISS.from_documents(raw_documents, embeddings)
            embedding_provider_used = f"OpenAI ({openai_embed_model})"
            print(f"   ✅ Embeddings calculados con: {embedding_provider_used}")
        except Exception as e:
            print(f"   ⚠️ Falló la generación de embeddings con OpenAI: {e}")
            print("   🔄 Activando fallback para embeddings con AWS Bedrock...")

    # Si OpenAI falló o no estaba configurado, intentar AWS Bedrock Embeddings
    if vector_store is None:
        bedrock_embeddings = get_bedrock_embeddings()
        if bedrock_embeddings is not None:
            try:
                bedrock_embed_model = os.environ.get("BEDROCK_EMBEDDING_MODEL_ID", "amazon.titan-embed-text-v1")
                vector_store = FAISS.from_documents(raw_documents, bedrock_embeddings)
                embedding_provider_used = f"AWS Bedrock ({bedrock_embed_model})"
                print(f"   ✅ Embeddings calculados con fallback: {embedding_provider_used}")
            except Exception as e:
                print(f"   ❌ Error al calcular embeddings con AWS Bedrock: {e}")
        else:
            print("   ⚠️ No se pudo inicializar AWS Bedrock Embeddings (verificar boto3 o credenciales).")

    if vector_store is None:
        print("\n❌ ERROR CRÍTICO: No se pudo generar el almacén vectorial ni con OpenAI ni con AWS Bedrock.")
        print("Por favor, verifica tus claves en demo/.env o credenciales de AWS.")
        return

    query = "¿Cuál es el tiempo de garantía para las laptops asignadas?"
    print(f"\n📌 CONSULTA (X): \"{query}\"\n")

    # --------------------------------------------------------------------------
    # ESCENARIO 1: RAG CRUDO (Sin Context Engineering)
    # --------------------------------------------------------------------------
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
    # 5. Generación con LLM usando LangChain y Fallback a AWS Bedrock
    # --------------------------------------------------------------------------
    print("─── [ESCENARIO 3: GENERACIÓN CON LLM Y FALLBACK RESILIENTE] ───")

    openai_model_name = os.environ.get("OPENAI_MODEL_NAME", "gpt-4o-mini")
    bedrock_model_id = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0")

    # Proveedor Principal: OpenAI
    primary_llm = None
    if openai_api_key and HAS_OPENAI:
        if simulate_failure:
            def simulate_failing_call(prompt_input):
                raise RuntimeError("Simulación forzada de error en API de OpenAI (SIMULATE_OPENAI_FAILURE=true)")
            primary_llm = RunnableLambda(simulate_failing_call)
        else:
            chat_kwargs = {"model": openai_model_name, "temperature": 0.0}
            if openai_http_client:
                chat_kwargs["http_client"] = openai_http_client
            primary_llm = ChatOpenAI(**chat_kwargs)

    # Proveedor Fallback: AWS Bedrock
    fallback_llm = get_bedrock_llm()

    # Construcción de la cadena con soporte nativo de with_fallbacks en LangChain
    if primary_llm is not None and fallback_llm is not None:
        print("🔗 Arquitectura de Resiliencia:")
        print(f"   ├── 🥇 Proveedor Principal: OpenAI ({openai_model_name})")
        print(f"   └── 🥈 Proveedor Fallback:  AWS Bedrock ({bedrock_model_id})")

        def on_fallback_triggered(prompt_input):
            print(f"\n⚠️  [FALLBACK ACTIVADO]: Fallo o indisponibilidad en la llamada a OpenAI.")
            print(f"🔄 Redirigiendo petición a AWS Bedrock (Modelo: {bedrock_model_id})...\n")
            return prompt_input

        resilient_fallback = RunnableLambda(on_fallback_triggered) | fallback_llm
        llm = primary_llm.with_fallbacks([resilient_fallback])

    elif primary_llm is not None:
        print(f"ℹ️  Operando únicamente con OpenAI ({openai_model_name}). AWS Bedrock no configurado.")
        llm = primary_llm
    elif fallback_llm is not None:
        print(f"ℹ️  Operando directamente con AWS Bedrock ({bedrock_model_id}) como proveedor principal.")
        llm = fallback_llm
    else:
        print("❌ ERROR: No hay ningún proveedor LLM disponible (ni OpenAI ni AWS Bedrock).")
        return

    prompt_template = ChatPromptTemplate.from_messages([
        ("system", "Responde a la consulta del usuario de forma precisa basándote ÚNICAMENTE en el contexto de evidencia suministrado."),
        ("user", "EVIDENCIA DE CONTEXTO:\n{context}\n\nPREGUNTA: {query}")
    ])

    chain = prompt_template | llm | StrOutputParser()

    print("\n🤖 Generando respuesta final con LangChain...")
    try:
        response = chain.invoke({"context": optimized_context, "query": query})
        print(f"\n✅ RESPUESTA FINAL DEL LLM (Y):\n{response}\n")
    except Exception as e:
        print(f"\n❌ Error durante la generación del LLM: {e}")

    print("=" * 75)
    print("MÉTRICAS Y EJECUCIÓN DE CONTEXT ENGINEERING COMPLETADAS.")
    print("=" * 75)


if __name__ == "__main__":
    main()

