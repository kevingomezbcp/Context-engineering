#!/usr/bin/env python3
"""
Genera la versión profesional del deck de Context Engineering.

Este archivo es un lanzador liviano. La edición de PowerPoint se implementa en
``mejorar_formulas_context_engineering.mjs`` con ``@oai/artifact-tool`` para:

- conservar maestros, layouts y elementos heredados;
- corregir geometrías inválidas antes de exportar;
- evitar mutaciones directas de XML y APIs privadas de ``python-pptx``;
- añadir una conclusión ejecutiva y ocho anexos de derivación simbólica;
- renderizar las 35 diapositivas como parte del control de calidad.

La implementación anterior se conserva en
``mejorar_formulas_context_engineering_legacy.py`` solo como referencia.
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import posixpath
import shutil
import subprocess
import sys
import xml.etree.ElementTree as ET
import zipfile


SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
JS_GENERATOR = SCRIPT_DIR / "mejorar_formulas_context_engineering.mjs"
ANNEX_MODULE = SCRIPT_DIR / "conclusiones_anexos_context_engineering.mjs"
FORMULA_LAYOUT_MODULE = SCRIPT_DIR / "organizar_slides_6_7_context_engineering.mjs"

DEFAULT_INPUT = (
    REPO_ROOT
    / "presentation"
    / "Context_Engineering_y_Ambiguedad_final_matematica.pptx"
)
DEFAULT_OUTPUT = (
    REPO_ROOT
    / "presentation"
    / "Context_Engineering_y_Ambiguedad_profesional_con_anexos.pptx"
)
DEFAULT_WORKSPACE = REPO_ROOT / ".codex-tmp" / "context-engineering-ppt-runtime"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Corrige la integridad OOXML y genera una versión profesional, "
            "ordenada y visualmente validada del deck."
        )
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=DEFAULT_INPUT,
        help=f"PPTX fuente. Por defecto: {DEFAULT_INPUT}",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"PPTX final. Por defecto: {DEFAULT_OUTPUT}",
    )
    parser.add_argument(
        "--workspace",
        type=Path,
        default=DEFAULT_WORKSPACE,
        help="Directorio temporal para @oai/artifact-tool y los renders de QA.",
    )
    parser.add_argument(
        "--node",
        type=Path,
        help="Ruta opcional a node.exe.",
    )
    parser.add_argument(
        "--skip-setup",
        action="store_true",
        help="No vuelve a preparar el workspace si ya contiene artifact-tool.",
    )
    return parser.parse_args()


def resolve_node(explicit: Path | None) -> Path:
    candidates: list[Path] = []
    if explicit:
        candidates.append(explicit.expanduser())

    if env_node := os.environ.get("CODEX_NODE"):
        candidates.append(Path(env_node).expanduser())

    candidates.append(
        Path.home()
        / ".cache"
        / "codex-runtimes"
        / "codex-primary-runtime"
        / "dependencies"
        / "node"
        / "bin"
        / "node.exe"
    )

    if system_node := shutil.which("node"):
        candidates.append(Path(system_node))

    for candidate in candidates:
        resolved = candidate.resolve()
        if resolved.is_file():
            return resolved

    raise FileNotFoundError(
        "No se encontró Node.js. Usa --node o define CODEX_NODE con la ruta "
        "a node.exe."
    )


def resolve_setup_script() -> Path:
    root = (
        Path.home()
        / ".codex"
        / "plugins"
        / "cache"
        / "openai-primary-runtime"
        / "presentations"
    )
    matches = sorted(
        root.glob(
            "*/skills/presentations/container_tools/"
            "setup_artifact_tool_workspace.mjs"
        ),
        reverse=True,
    )
    if not matches:
        raise FileNotFoundError(
            "No se encontró setup_artifact_tool_workspace.mjs. "
            "Ejecuta este script desde Codex con la habilidad de presentaciones "
            "instalada."
        )
    return matches[0].resolve()


def run(command: list[str], *, cwd: Path) -> None:
    print("+", subprocess.list2cmdline(command), flush=True)
    subprocess.run(command, cwd=cwd, check=True)


def validate_openxml_package(pptx_path: Path, expected_slides: int = 35) -> None:
    """Valida los fallos de paquete que provocaban la reparación de PowerPoint."""

    required_parts = {
        "[Content_Types].xml",
        "_rels/.rels",
        "ppt/presentation.xml",
    }
    relationship_ns = "http://schemas.openxmlformats.org/package/2006/relationships"
    drawing_ns = "http://schemas.openxmlformats.org/drawingml/2006/main"

    with zipfile.ZipFile(pptx_path) as package:
        names = set(package.namelist())
        missing = sorted(required_parts - names)
        if missing:
            raise RuntimeError(
                "El paquete PPTX no contiene partes obligatorias: "
                + ", ".join(missing)
            )

        if corrupt_member := package.testzip():
            raise RuntimeError(f"Miembro ZIP corrupto: {corrupt_member}")

        xml_parts = [
            name
            for name in names
            if name.endswith((".xml", ".rels"))
        ]
        parsed: dict[str, ET.Element] = {}
        for name in xml_parts:
            try:
                parsed[name] = ET.fromstring(package.read(name))
            except ET.ParseError as exc:
                raise RuntimeError(f"XML inválido en {name}: {exc}") from exc

        negative_extents: list[str] = []
        extent_tag = f"{{{drawing_ns}}}ext"
        for name, root in parsed.items():
            if not name.startswith("ppt/"):
                continue
            for element in root.iter(extent_tag):
                for attribute in ("cx", "cy"):
                    raw_value = element.get(attribute)
                    if raw_value is None:
                        continue
                    try:
                        value = int(raw_value)
                    except ValueError as exc:
                        raise RuntimeError(
                            f"Extensión no numérica en {name}: {attribute}={raw_value}"
                        ) from exc
                    if value < 0:
                        negative_extents.append(
                            f"{name}: {attribute}={value}"
                        )

        if negative_extents:
            raise RuntimeError(
                "Se detectaron extensiones geométricas negativas:\n- "
                + "\n- ".join(negative_extents)
            )

        broken_relationships: list[str] = []
        relationship_tag = f"{{{relationship_ns}}}Relationship"
        for rels_name, root in parsed.items():
            if not rels_name.endswith(".rels"):
                continue

            if rels_name == "_rels/.rels":
                source_dir = ""
            else:
                marker = "/_rels/"
                if marker not in rels_name:
                    continue
                prefix, leaf = rels_name.split(marker, 1)
                source_part = posixpath.join(prefix, leaf.removesuffix(".rels"))
                source_dir = posixpath.dirname(source_part)

            for relationship in root.iter(relationship_tag):
                if relationship.get("TargetMode") == "External":
                    continue
                target = relationship.get("Target")
                if not target:
                    broken_relationships.append(
                        f"{rels_name}: relación sin Target"
                    )
                    continue
                if target.startswith("/"):
                    normalized = posixpath.normpath(target.lstrip("/"))
                else:
                    normalized = posixpath.normpath(
                        posixpath.join(source_dir, target)
                    )
                if normalized not in names:
                    broken_relationships.append(
                        f"{rels_name}: {target} -> {normalized}"
                    )

        if broken_relationships:
            raise RuntimeError(
                "Relaciones internas rotas:\n- "
                + "\n- ".join(broken_relationships)
            )

        slide_parts = [
            name
            for name in names
            if name.startswith("ppt/slides/slide")
            and name.endswith(".xml")
            and "/_rels/" not in name
        ]
        if len(slide_parts) != expected_slides:
            raise RuntimeError(
                f"Se esperaban {expected_slides} diapositivas y se encontraron "
                f"{len(slide_parts)}."
            )

    print(
        "Validación Open XML: paquete íntegro, relaciones resueltas, "
        f"{expected_slides} diapositivas y 0 extensiones negativas."
    )


def main() -> int:
    args = parse_args()
    input_pptx = args.input.expanduser().resolve()
    output_pptx = args.output.expanduser().resolve()
    workspace = args.workspace.expanduser().resolve()

    if not input_pptx.is_file():
        raise FileNotFoundError(f"No existe el PPTX fuente: {input_pptx}")
    if not JS_GENERATOR.is_file():
        raise FileNotFoundError(f"No existe el generador JS: {JS_GENERATOR}")
    if not ANNEX_MODULE.is_file():
        raise FileNotFoundError(f"No existe el módulo de anexos: {ANNEX_MODULE}")
    if not FORMULA_LAYOUT_MODULE.is_file():
        raise FileNotFoundError(
            f"No existe el módulo de organización matemática: {FORMULA_LAYOUT_MODULE}"
        )

    node = resolve_node(args.node)
    workspace.mkdir(parents=True, exist_ok=True)

    if not args.skip_setup:
        setup_script = resolve_setup_script()
        run(
            [
                str(node),
                str(setup_script),
                "--workspace",
                str(workspace),
            ],
            cwd=Path.home(),
        )

    workspace_generator = workspace / JS_GENERATOR.name
    shutil.copy2(JS_GENERATOR, workspace_generator)
    workspace_annex_module = workspace / ANNEX_MODULE.name
    shutil.copy2(ANNEX_MODULE, workspace_annex_module)
    workspace_formula_layout_module = workspace / FORMULA_LAYOUT_MODULE.name
    shutil.copy2(FORMULA_LAYOUT_MODULE, workspace_formula_layout_module)

    qa_dir = workspace / "final-qa"
    output_pptx.parent.mkdir(parents=True, exist_ok=True)
    run(
        [
            str(node),
            str(workspace_generator),
            "--input",
            str(input_pptx),
            "--output",
            str(output_pptx),
            "--qa-dir",
            str(qa_dir),
        ],
        cwd=workspace,
    )

    if not output_pptx.is_file() or output_pptx.stat().st_size == 0:
        raise RuntimeError(f"La exportación no produjo un archivo válido: {output_pptx}")

    validate_openxml_package(output_pptx)

    print(f"\nPPTX generado: {output_pptx}")
    print(f"Renders y layouts de QA: {qa_dir}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except subprocess.CalledProcessError as exc:
        print(
            f"\nError: el proceso externo terminó con código {exc.returncode}.",
            file=sys.stderr,
        )
        raise SystemExit(exc.returncode) from exc
    except Exception as exc:  # Mensaje de CLI limpio sin ocultar el tipo de error.
        print(f"\nError: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
