"""
Punto de entrada principal para la Demo de Context Engineering.

Uso:
    python main.py
    # o desde la raíz del proyecto:
    python demo/main.py
"""

from __future__ import annotations

import sys
from pathlib import Path

# Garantizar resolución de módulos tanto desde demo/ como desde la raíz del proyecto
DEMO_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = DEMO_DIR.parent

for p in (str(DEMO_DIR), str(PROJECT_ROOT)):
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from demo.config import AppConfig
    from demo.runner import ContextEngineeringDemo
except ImportError:
    from config import AppConfig
    from runner import ContextEngineeringDemo


def main() -> None:
    """Función de entrada principal."""
    config = AppConfig.load()

    if not config.is_executable():
        print("⚠️ ADVERTENCIA: No se encontró configuración ni de OPENAI_API_KEY ni de AWS Bedrock.")
        print("Por favor, configura al menos uno de los proveedores en el archivo .env")
        return

    demo = ContextEngineeringDemo(config)
    demo.run()


if __name__ == "__main__":
    main()
