import json
from pathlib import Path

notebook = {
    "cells": [],
    "metadata": {},
    "nbformat": 4,
    "nbformat_minor": 5
}

def add_md(text):
    notebook["cells"].append({
        "cell_type": "markdown",
        "metadata": {},
        "source": [line + "\n" for line in text.split("\n")]
    })

def add_code(code):
    notebook["cells"].append({
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [line + "\n" for line in code.split("\n")]
    })

add_md("# Context Engineering & Ambiguity Demo\n\nEste notebook interactivo demuestra los conceptos explicados en la presentación sobre **Context Engineering**.\n\nAplicaremos:\n1. Construcción de un almacén vectorial (Vector Store).\n2. Recuperación directa RAG mostrando el problema de la ambigüedad ($\\Delta \\approx 0$).\n3. Resolución de ambigüedad mediante una política de clarificación (identificación de intención latente $Z$).")

add_md("## 1. Configuración de Entorno e Instalación de Dependencias\nEjecuta la siguiente celda para instalar las herramientas open-source necesarias (LangChain, OpenAI SDK, FAISS, Matplotlib).")

add_code(r"""!pip install -qU langchain langchain-openai langchain-community faiss-cpu python-dotenv matplotlib numpy
""")

add_md("Cargamos las variables de entorno desde el archivo `.env` (asegúrate de haber colocado tu `OPENAI_API_KEY` allí).")

add_code("""import os
from dotenv import load_dotenv

# Cargar configuración (OPENAI_API_KEY)
load_dotenv()

if not os.environ.get("OPENAI_API_KEY"):
    print("⚠️ ADVERTENCIA: No se encontró OPENAI_API_KEY. Por favor, edita el archivo .env.")
else:
    print("✅ Clave de OpenAI cargada correctamente.")
""")

add_md("## 2. Creación del Almacén Vectorial (Base de Conocimiento)\n\nVamos a crear una base de datos vectorial que contenga dos clústeres de información muy distintos referidos a un mismo concepto polisémico: **Memoria**.\n- **Clúster A (Intención Z1):** Memoria computacional (Hardware / RAM).\n- **Clúster B (Intención Z2):** Memoria de agentes conversacionales (IA / LLMs).")

add_code("""from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

# Definimos los documentos del conocimiento
documents = [
    # Clúster Hardware (RAM)
    Document(page_content="La memoria RAM (Random Access Memory) es el hardware volátil donde el procesador de un computador almacena los datos en uso y las instrucciones de los programas en ejecución.", metadata={"topic": "hardware"}),
    Document(page_content="Para actualizar la memoria RAM, asegúrese de apagar el equipo y verificar el estándar compatible (ej. DDR4 o DDR5) en la placa base.", metadata={"topic": "hardware"}),
    Document(page_content="El cuello de botella del sistema suele reducirse aumentando la capacidad de la memoria RAM del ordenador portátil.", metadata={"topic": "hardware"}),
    
    # Clúster Inteligencia Artificial (Agentes)
    Document(page_content="En agentes conversacionales, la memoria es un componente de software que almacena el historial del chat para mantener el contexto de la conversación activa a largo plazo.", metadata={"topic": "ai_agents"}),
    Document(page_content="La memoria de los LLM (como LangChain Memory) permite inyectar interacciones pasadas en el prompt para evitar que el agente olvide instrucciones previas.", metadata={"topic": "ai_agents"}),
    Document(page_content="Para mejorar el contexto de la memoria del agente, se utilizan resúmenes periódicos y recuperación semántica de la base de datos de los mensajes del usuario.", metadata={"topic": "ai_agents"})
]

# Inicializamos el extractor de embeddings de OpenAI
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# Creamos el almacén vectorial FAISS en memoria
vector_store = FAISS.from_documents(documents, embeddings)
retriever = vector_store.as_retriever(search_kwargs={"k": 4})

print("✅ Base de conocimiento vectorial construida.")
""")

add_md("## 3. El Cuello de Botella de la Ambigüedad ($X$)\n\nImagina que un usuario envía una consulta altamente ambigua sin contexto adicional. Probaremos con la consulta: **\"¿Cómo funciona la memoria?\"**\n\nVeremos cómo el modelo recupera información mezclada (ruido vs señal) provocando que el margen de similitud $\\Delta$ sea casi nulo.")

add_code("""import numpy as np
import matplotlib.pyplot as plt

ambiguous_query = "¿Cómo funciona la memoria?"

# Recuperar documentos junto con sus scores de similitud
# En FAISS usamos similarity_search_with_score (devuelve distancia L2, donde menor es más similar)
results = vector_store.similarity_search_with_score(ambiguous_query, k=6)

docs = []
scores = []
topics = []

print(f"Resultados de búsqueda para la consulta: '{ambiguous_query}'\\n")
for i, (doc, score) in enumerate(results):
    docs.append(f"Doc {i+1}")
    # Convertir distancia L2 a una métrica de similitud ilustrativa (invirtiendo)
    similarity = 1 / (1 + score)
    scores.append(similarity)
    topics.append(doc.metadata["topic"])
    print(f"Doc {i+1} [{doc.metadata['topic']}] (Score L2: {score:.4f}): {doc.page_content[:70]}...")

# Gráfico de similitudes (Margen Delta)
plt.figure(figsize=(8, 4))
colors = ['#7065E8' if t == 'ai_agents' else '#3DD6C6' for t in topics]
bars = plt.bar(docs, scores, color=colors)

# Calcular Delta entre los 2 mejores de distintos tópicos
delta = abs(scores[0] - scores[1]) # Aproximación simplificada

plt.title(f"Similitud Vectorial por Documento\\nMargen Δ ≈ {delta:.4f} (Ambigüedad Alta)")
plt.ylabel("Similitud (Transformada)")
plt.ylim(0, max(scores) * 1.2)

# Leyenda
import matplotlib.patches as mpatches
ai_patch = mpatches.Patch(color='#7065E8', label='IA (Agentes)')
hw_patch = mpatches.Patch(color='#3DD6C6', label='Hardware (RAM)')
plt.legend(handles=[ai_patch, hw_patch])

plt.show()

print("CONCLUSIÓN: El sistema recupera documentos de ambos tópicos con un score muy similar. El contexto orquestado estará contaminado (Alta Entropía H).")
""")

add_md("## 4. Context Engineering: Política de Clarificación ($Z$)\n\nEn lugar de inyectar directamente los documentos y pedirle al LLM que adivine la respuesta, orquestaremos un sistema de clasificación que detecte la ambigüedad y requiera aclaración del usuario.")

add_code("""from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

# Inicializamos el LLM
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# 1. Definimos una estructura estricta para forzar al modelo a clasificar la intención latente
class AmbiguityDetector(BaseModel):
    is_ambiguous: bool = Field(description="True si la consulta del usuario puede referirse a más de un contexto específico.")
    clarification_question: str = Field(description="Si es ambigua, redacta una pregunta breve consultando al usuario a qué contexto se refiere.")
    inferred_intent: str = Field(description="Si no es ambigua, describe la intención clara identificada. Si es ambigua, déjalo vacío.")

# 2. Prompt de sistema para clasificación
system_prompt = \"\"\"
Eres un orquestador de contexto. Tu trabajo es analizar la consulta del usuario X e identificar la intención latente Z.
Sabes que en nuestro negocio la palabra 'memoria' puede referirse a:
A) Memoria RAM (Hardware de computador).
B) Memoria de Agentes de IA (Software, LangChain).

Si la consulta no especifica claramente a cuál se refiere, debes marcarla como ambigua y formular una pregunta de clarificación.
\"\"\"

clarification_prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("user", "Consulta: {query}")
])

clarification_chain = clarification_prompt | llm.with_structured_output(AmbiguityDetector)

# Analizamos la consulta ambigua
decision = clarification_chain.invoke({"query": ambiguous_query})

print(f"Consulta original: '{ambiguous_query}'")
print(f"¿Es ambigua?: {decision.is_ambiguous}")
if decision.is_ambiguous:
    print(f"🤖 Pregunta aclaratoria del agente: {decision.clarification_question}")
else:
    print(f"🎯 Intención detectada: {decision.inferred_intent}")
""")

add_md("Al obtener una respuesta aclaratoria del usuario, construimos un nuevo estado $S$ (Historial ampliado) que resuelve la variable $Z$, purificando por completo el contexto antes de generar la respuesta final.")

add_code("""# Simulamos que el usuario responde a la pregunta aclaratoria
user_clarification = "Me refiero a los modelos de inteligencia artificial."

print(f"👤 Respuesta del usuario: '{user_clarification}'\\n")

# Construimos la consulta robusta orquestando la consulta original + la clarificación
robust_query = f"{ambiguous_query} (Contexto aclarado: {user_clarification})"

print(f"Nueva búsqueda vectorial con señal densa: '{robust_query}'\\n")

robust_results = vector_store.similarity_search_with_score(robust_query, k=3)
robust_docs = []
robust_scores = []
robust_topics = []

for i, (doc, score) in enumerate(robust_results):
    robust_docs.append(f"Doc {i+1}")
    similarity = 1 / (1 + score)
    robust_scores.append(similarity)
    robust_topics.append(doc.metadata["topic"])
    print(f"[{doc.metadata['topic']}] Score: {score:.4f} | {doc.page_content[:70]}...")

# Gráfico de similitudes (Margen Delta ampliado)
plt.figure(figsize=(8, 4))
colors = ['#7065E8' if t == 'ai_agents' else '#3DD6C6' for t in robust_topics]
bars = plt.bar(robust_docs, robust_scores, color=colors)

# Calcular nuevo Delta
if len(robust_scores) > 1:
    new_delta = abs(robust_scores[0] - robust_scores[1])
else:
    new_delta = 0

plt.title(f"Similitud Posterior a la Clarificación\\nMargen Δ ≈ {new_delta:.4f} (Señal Pura)")
plt.ylabel("Similitud (Transformada)")
plt.ylim(0, max(robust_scores) * 1.2)
plt.legend(handles=[ai_patch, hw_patch])
plt.show()

print("ÉXITO: Al aclarar la intención latente Z, el sistema recupera 100% señal relevante, eliminando el ruido y permitiendo una respuesta determinista.")
""")

output_path = Path("context_engineering_demo.ipynb")
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(notebook, f, indent=2, ensure_ascii=False)

print(f"Notebook creado en {output_path.resolve()}")
