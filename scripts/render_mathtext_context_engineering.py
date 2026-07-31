#!/usr/bin/env python3
"""Renderiza las ecuaciones del deck con Matplotlib MathText.

Replica el enfoque de ``mejorar_formulas_context_engineering_legacy.py``:
fuente STIX, PNG transparente, alta resolución y recorte ajustado. El PPTX no
se modifica aquí; las imágenes resultantes se incrustan después con
``@oai/artifact-tool``.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path


def _conda_base() -> Path | None:
    current = Path(sys.prefix).resolve()
    for candidate in (current, *current.parents):
        if candidate.name.lower() in {"anaconda3", "miniconda3", "miniforge3"}:
            return candidate
    for fallback in (
        Path.home() / "anaconda3",
        Path.home() / "miniconda3",
    ):
        if fallback.exists():
            return fallback
    return None


def _bootstrap_matplotlib() -> None:
    """Usa el Python base de Conda cuando el entorno actual no tiene Matplotlib."""

    try:
        import matplotlib  # noqa: F401
        import PIL  # noqa: F401
    except ImportError:
        base = _conda_base()
        if "--_mathtext-reexec" in sys.argv or base is None:
            raise RuntimeError(
                "Matplotlib y Pillow no están disponibles para renderizar MathText."
            )
        base_python = base / "python.exe"
        if not base_python.is_file():
            raise RuntimeError(f"No se encontró el Python base de Conda: {base_python}")
        command = [
            str(base_python),
            str(Path(__file__).resolve()),
            *sys.argv[1:],
            "--_mathtext-reexec",
        ]
        raise SystemExit(subprocess.run(command, check=False).returncode)


_bootstrap_matplotlib()

import matplotlib

matplotlib.use("Agg")

import matplotlib as mpl
from matplotlib.backends.backend_agg import FigureCanvasAgg
from matplotlib.figure import Figure
from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Renderiza el manifiesto de ecuaciones como PNG MathText."
    )
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--_mathtext-reexec", action="store_true", help=argparse.SUPPRESS)
    return parser.parse_args()


def render_equation(
    output_path: Path,
    latex_lines: list[str],
    color: str,
    fontsize: float,
) -> tuple[int, int]:
    """Renderiza una o más líneas MathText sobre fondo transparente."""

    mpl.rcParams.update(
        {
            "mathtext.fontset": "stix",
            "font.family": "STIXGeneral",
            "savefig.transparent": True,
        }
    )

    line_count = max(1, len(latex_lines))
    figure = Figure(figsize=(15, 1.35 * line_count), dpi=320)
    FigureCanvasAgg(figure)
    figure.patch.set_alpha(0)

    for index, latex in enumerate(latex_lines):
        y = 1 - (index + 0.5) / line_count
        figure.text(
            0.5,
            y,
            f"${latex}$",
            fontsize=fontsize,
            color=color,
            ha="center",
            va="center",
        )

    figure.savefig(
        output_path,
        format="png",
        dpi=320,
        transparent=True,
        bbox_inches="tight",
        pad_inches=0.035,
    )

    with Image.open(output_path) as rendered:
        return rendered.size


def main() -> int:
    args = parse_args()
    manifest_path = args.manifest.expanduser().resolve()
    output_dir = args.output_dir.expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    formulas = json.loads(manifest_path.read_text(encoding="utf-8"))
    if not isinstance(formulas, list) or not formulas:
        raise ValueError("El manifiesto debe contener una lista no vacía.")

    seen_ids: set[str] = set()
    seen_texts: set[str] = set()
    index: list[dict[str, object]] = []

    for formula in formulas:
        formula_id = str(formula["id"])
        text = str(formula["text"])
        latex_lines = [str(line) for line in formula["latexLines"]]
        color = str(formula["color"])
        fontsize = float(formula.get("fontsize", 34))

        if formula_id in seen_ids:
            raise ValueError(f"ID de fórmula duplicado: {formula_id}")
        if text in seen_texts:
            raise ValueError(f"Texto de fórmula duplicado: {text}")
        if not latex_lines:
            raise ValueError(f"La fórmula {formula_id} no contiene líneas LaTeX.")
        seen_ids.add(formula_id)
        seen_texts.add(text)

        filename = f"{formula_id}.png"
        output_path = output_dir / filename
        try:
            width, height = render_equation(
                output_path,
                latex_lines,
                color,
                fontsize,
            )
        except Exception as exc:
            raise RuntimeError(
                f"No se pudo renderizar MathText para {formula_id}: {exc}"
            ) from exc

        index.append(
            {
                "id": formula_id,
                "text": text,
                "file": filename,
                "width": width,
                "height": height,
                "latexLines": latex_lines,
                "color": color,
            }
        )

    index_path = output_dir / "mathtext-index.json"
    index_path.write_text(
        json.dumps(index, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(
        f"MathText: {len(index)} ecuaciones renderizadas en {output_dir}",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
