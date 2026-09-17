# Context Engineering

Este repositorio contiene materiales, investigaciones y ejemplos prácticos sobre **Context Engineering**, una metodología para orquestar y refinar el contexto en sistemas interactivos con LLMs, mitigando problemas de ambigüedad y mejorando la calidad de las respuestas (reducción de entropía en el espacio semántico).

## Estructura del Proyecto

- `docs/`: Contiene toda la fundamentación teórica.
  - `papers/`: Artículos de investigación y papers referenciados.
  - `assets/`: Imágenes, esquemas y diagramas utilizados en la teoría y presentaciones.
  - `context.md`: Documento principal con la teoría, fórmulas y conceptos clave de Context Engineering.
- `demo/`: Laboratorio práctico interactivo.
  - `context_engineering_demo.ipynb`: Jupyter notebook demostrativo que aplica una política de clarificación para resolver ambigüedad ($Z$) utilizando `langchain` y `faiss`.
  - `requirements.txt`: Dependencias para ejecutar el laboratorio.
  - `.env`: (Debe crearse a partir del `.env.example` interno) Archivo para variables de entorno (como `OPENAI_API_KEY`).
- [`eval-context/`](eval-context/README.md): Demo con Ragas para comparar 28 contextos mockeados completos (instrucciones, historial, memoria, documentos y herramientas), con métricas de contradicción, salud y limpieza, juez LLM opcional y reporte HTML interactivo.
- `presentation/`: Presentaciones generadas (PowerPoint).
  - Contiene las diferentes versiones e iteraciones de la baraja ejecutiva sobre Context Engineering.
- `scripts/`: Código fuente en Python utilizado para generar recursos, como las presentaciones y la construcción programática del notebook.

## Instalación y Ejecución del Demo

1. Navega a la carpeta `demo/`:
   ```bash
   cd demo
   ```
2. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```
3. Configura tus credenciales:
   - Abre o crea el archivo `.env` en la carpeta `demo/`.
   - Añade tu clave de API: `OPENAI_API_KEY=tu_clave_aqui`
4. Ejecuta Jupyter:
   ```bash
   jupyter notebook context_engineering_demo.ipynb
   ```
