# Context Engineering

Este repositorio contiene materiales, investigaciones y ejemplos prácticos sobre **Context Engineering**, una metodología para orquestar y refinar el contexto en sistemas interactivos con LLMs, mitigando problemas de ambigüedad y mejorando la calidad de las respuestas (reducción de entropía en el espacio semántico).

## Estructura del Proyecto

- `docs/`: Contiene toda la fundamentación teórica.
  - `papers/`: Artículos de investigación y papers referenciados.
  - `assets/`: Imágenes, esquemas y diagramas utilizados en la teoría y presentaciones.
  - `context.md`: Documento principal con la teoría, fórmulas y conceptos clave de Context Engineering.
- `demo/`: Laboratorio práctico interactivo.
  - `context_engineering_demo.ipynb`: Jupyter notebook demostrativo que aplica una política de clarificación para resolver ambigüedad ($Z$) utilizando `langchain` y `faiss`.
  - `main.py`: Punto de entrada de la demo de optimización de contexto y resiliencia multi-proveedor (OpenAI con fallback automático a AWS Bedrock).
  - `config.py`: Gestión centralizada de configuración, credenciales y SSL corporativo.
  - `data/`: Base de conocimiento de muestra y consultas.
  - `optimizers/`: Algoritmos de Context Engineering (filtrado coseno, reordenamiento, compresión, conteo de tokens).
  - `providers/`: Integraciones con OpenAI y AWS Bedrock, incluyendo fábricas resilientes con fallback.
  - `runner.py`: Orquestador de ejecución de los escenarios.
  - `requirements.txt`: Dependencias para ejecutar el laboratorio.
  - `.env`: Archivo para variables de entorno (OpenAI y AWS Bedrock).
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
   - Abre o edita el archivo `.env` en la carpeta `demo/`.
   - Configura `OPENAI_API_KEY` (proveedor principal) y/o las credenciales de AWS Bedrock (`AWS_REGION`, `AWS_ACCESS_KEY_ID`, etc., o perfil de AWS CLI).
4. Ejecuta el demo por consola o Jupyter:
   - Script de optimización de contexto con fallback:
     ```bash
     python main.py
     ```
   - Jupyter Notebook interactivo:
     ```bash
     jupyter notebook context_engineering_demo.ipynb
     ```
