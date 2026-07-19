"""Refina la presentación de Context Engineering con python-pptx.

Objetivos:
1. Hacer más limpia la secuencia narrativa.
2. Unificar títulos, cuerpo, ecuaciones, tamaños y colores.
3. Preservar imágenes, diagramas, fórmulas y fuentes del archivo original.

Uso:
    python refinar_context_engineering_ppt.py
    python refinar_context_engineering_ppt.py --input archivo.pptx --output refinado.pptx
"""

from __future__ import annotations

import argparse
import re
from collections import Counter
from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.util import Pt


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_INPUT = ROOT / "outputs" / "Context_Engineering_y_Ambiguedad.pptx"
DEFAULT_OUTPUT = ROOT / "outputs" / "Context_Engineering_y_Ambiguedad_refinada_python.pptx"


# Paleta reducida. Los grises casi idénticos del archivo original convergen
# en un solo neutral para fondos claros y otro para fondos oscuros.
PALETTE = {
    "ink": "101526",
    "white": "F7F8FC",
    "body_light": "60687C",
    "body_dark": "C7CEDF",
    "footer_light": "8E96AA",
    "footer_dark": "AAB3C8",
    "violet": "7065E8",
    "cyan": "3DD6C6",
    "orange": "F2A65A",
    "red": "F26674",
    "green": "52C97F",
}

COLOR_NORMALIZATION = {
    "0B1020": PALETTE["ink"],
    "5C6478": PALETTE["body_light"],
    "8C93A5": PALETTE["footer_light"],
    "AEB7CE": PALETTE["footer_dark"],
    "CDD4E7": PALETTE["body_dark"],
    "BFC7DA": PALETTE["body_dark"],
    "C3CBE0": PALETTE["body_dark"],
    "C8CFE1": PALETTE["body_dark"],
    "BEC6DB": PALETTE["body_dark"],
    "B8C0D8": PALETTE["body_dark"],
    "7769F4": PALETTE["violet"],
    "45E0D0": PALETTE["cyan"],
    "FFB66E": PALETTE["orange"],
    "FF6F7D": PALETTE["red"],
    "62D590": PALETTE["green"],
}

# El único cambio de orden es RAG antes de atención/recuperación interna.
# Así la historia respeta: contexto -> RAG -> ambigüedad.
STORY = [
    {
        "anchor": "Context Engineering",
        "title": "Context Engineering",
        "kicker": "ESTRATEGIA · RAG · DECISIONES",
    },
    {
        "anchor": "Una pregunta simple puede esconder cinco preguntas",
        "title": "Una pregunta puede tener varias respuestas correctas",
        "kicker": "EL PROBLEMA",
    },
    {
        "anchor": "Context Engineering diseña el entorno de decisión del modelo",
        "title": "Context Engineering decide qué información entra al modelo",
        "kicker": "QUÉ ES CONTEXT ENGINEERING",
    },
    {
        "anchor": "Más contexto no implica una mejor respuesta",
        "title": "La unidad de valor es la señal útil por token",
        "kicker": "TESIS CENTRAL",
    },
    {
        "anchor": "El contexto cambia la distribución de los próximos tokens",
        "title": "El contexto redistribuye la probabilidad de cada token",
        "kicker": "MODELO PROBABILÍSTICO",
    },
    {
        "anchor": "El valor del contexto es la incertidumbre que logra eliminar",
        "title": "El contexto vale por la incertidumbre que elimina",
        "kicker": "VALOR DE LA INFORMACIÓN",
    },
    {
        "anchor": "En un LLM real, el contexto también puede degradar la respuesta",
        "title": "En un LLM real, más contexto también añade fricción",
        "kicker": "LÍMITES DEL MODELO",
    },
    {
        "anchor": "La calidad end-to-end multiplica dos probabilidades",
        "title": "RAG multiplica recuperación y generación",
        "kicker": "RAG END-TO-END",
    },
    {
        "anchor": "La evidencia puede estar en el prompt y aun así no ser utilizada",
        "title": "Antes de generar, el modelo debe encontrar la evidencia",
        "kicker": "RECUPERACIÓN INTERNA",
    },
    {
        "anchor": "Hasta aquí, asumimos que X tenía un solo significado.",
        "title": "La ambigüedad cambia el problema.",
        "kicker": "PARTE II · AMBIGÜEDAD",
    },
    {
        "anchor": "La respuesta se convierte en una mezcla de interpretaciones",
        "title": "La respuesta se vuelve una mezcla de intenciones",
        "kicker": "INTENCIÓN LATENTE",
    },
    {
        "anchor": "La ambigüedad de intención contamina la respuesta",
        "title": "La incertidumbre sobre Z se propaga hasta Y",
        "kicker": "PROPAGACIÓN DEL ERROR",
    },
    {
        "anchor": "Una query ambigua queda entre clústeres y reduce el margen",
        "title": "La query ambigua cae entre clústeres semánticos",
        "kicker": "RETRIEVAL",
    },
    {
        "anchor": "Dos documentos casi empatados pueden representar intenciones opuestas",
        "title": "El reranker casi no puede separar intenciones",
        "kicker": "RERANKING",
    },
    {
        "anchor": "Incluso documentos correctos pueden producir una respuesta incorrecta",
        "title": "Contexto correcto no equivale a intención correcta",
        "kicker": "GENERACIÓN",
    },
    {
        "anchor": "Cuando X no distingue Z, existe un error irreducible",
        "title": "Sin nueva información, existe un error irreducible",
        "kicker": "LÍMITE TEÓRICO",
    },
    {
        "anchor": "Preguntar es una operación de reducción de entropía",
        "title": "Aclarar reduce entropía sobre la intención",
        "kicker": "CLARIFICACIÓN",
    },
    {
        "anchor": "Aclarar solo cuando el valor de la información supera su costo",
        "title": "Conviene preguntar cuando el error cuesta más que interactuar",
        "kicker": "POLÍTICA DE INTERACCIÓN",
    },
    {
        "anchor": "El contexto mejora la exactitud, pero no resuelve por sí solo la intención",
        "title": "La evidencia confirma la brecha: saber no implica preguntar",
        "kicker": "EVIDENCIA",
    },
    {
        "anchor": "El sistema fiable gestiona incertidumbre, no solo contexto",
        "title": "Diseña el sistema alrededor de la incertidumbre",
        "kicker": "DISEÑO OPERATIVO",
    },
]

DARK_SLIDES = {1, 4, 9, 10, 12, 15, 18, 20}
SIZE_SCALE = (10.5, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 44, 48, 54)


def iter_text_shapes(slide):
    for shape in slide.shapes:
        if getattr(shape, "has_text_frame", False) and shape.text.strip():
            yield shape


def iter_runs(shape):
    for paragraph in shape.text_frame.paragraphs:
        for run in paragraph.runs:
            if run.text:
                yield run


def normalized_text(value: str) -> str:
    return " ".join(value.split())


def find_shape(slide, exact_text: str):
    for shape in iter_text_shapes(slide):
        if normalized_text(shape.text) == normalized_text(exact_text):
            return shape
    raise ValueError(f"No se encontró el texto: {exact_text!r}")


def replace_text(shape, new_text: str):
    """Reemplaza un texto simple sin modificar posición ni caja de texto."""
    tf = shape.text_frame
    alignment = tf.paragraphs[0].alignment if tf.paragraphs else None
    tf.clear()
    paragraph = tf.paragraphs[0]
    paragraph.alignment = alignment
    run = paragraph.add_run()
    run.text = new_text
    return run


def rgb_value(run):
    try:
        rgb = run.font.color.rgb
        return str(rgb) if rgb else None
    except (AttributeError, TypeError, ValueError):
        return None


def set_rgb(run, value: str):
    run.font.color.rgb = RGBColor.from_string(value)


def nearest_size(value: float) -> float:
    return min(SIZE_SCALE, key=lambda candidate: abs(candidate - value))


def reorder_slides(prs: Presentation, slides_in_order):
    """Reordena conservando relaciones, imágenes y objetos de cada slide."""
    id_list = prs.slides._sldIdLst  # python-pptx todavía no expone API pública.
    by_id = {int(element.id): element for element in list(id_list)}
    ordered_elements = [by_id[slide.slide_id] for slide in slides_in_order]
    for element in ordered_elements:
        id_list.remove(element)
    for element in ordered_elements:
        id_list.append(element)


def locate_story_slides(prs: Presentation):
    slides = []
    for item in STORY:
        matching = [
            slide for slide in prs.slides
            if any(
                normalized_text(shape.text) == normalized_text(item["anchor"])
                for shape in iter_text_shapes(slide)
            )
        ]
        if len(matching) != 1:
            raise ValueError(f"Anchor no único: {item['anchor']!r}; coincidencias={len(matching)}")
        slides.append(matching[0])
    return slides


def update_kicker_and_page_number(slide, slide_number: int, kicker: str):
    shapes = list(iter_text_shapes(slide))
    # El kicker siempre ocupa la zona superior izquierda.
    top_candidates = [
        shape for shape in shapes
        if shape.top < Pt(80) and len(shape.text.strip()) < 80
    ]
    if not top_candidates:
        raise ValueError(f"Slide {slide_number}: no se encontró kicker")
    kicker_shape = min(top_candidates, key=lambda shape: (shape.top, shape.left))
    kicker_text = kicker if slide_number in {1, 10} else f"{slide_number:02d}  /  {kicker}"
    kicker_run = replace_text(kicker_shape, kicker_text)
    kicker_run.font.name = "Aptos"
    kicker_run.font.size = Pt(12)
    kicker_run.font.bold = True
    set_rgb(kicker_run, PALETTE["cyan"] if slide_number in DARK_SLIDES else PALETTE["violet"])

    # Número de página: texto de dos dígitos en la esquina inferior derecha.
    page_candidates = [
        shape for shape in shapes
        if shape.top > Pt(470) and re.fullmatch(r"\d{2}", shape.text.strip())
    ]
    if page_candidates:
        page_run = replace_text(page_candidates[0], f"{slide_number:02d}")
        page_run.font.name = "Aptos"
        page_run.font.size = Pt(11)
        page_run.font.bold = True
        set_rgb(page_run, PALETTE["footer_dark"] if slide_number in DARK_SLIDES else PALETTE["footer_light"])


def format_title(shape, dark: bool, size: float = 36):
    for run in iter_runs(shape):
        run.font.name = "Aptos Display"
        run.font.size = Pt(size)
        run.font.bold = True
        set_rgb(run, PALETTE["white"] if dark else PALETTE["ink"])


def normalize_typography(slide, slide_number: int, title_shape):
    dark = slide_number in DARK_SLIDES
    title_text = title_shape.text.strip()

    for shape in iter_text_shapes(slide):
        is_footer = shape.top > Pt(470)
        is_kicker = shape.top < Pt(80) and shape is not title_shape
        is_title = shape is title_shape
        is_equation = any((run.font.name or "") == "Cambria Math" for run in iter_runs(shape))

        for run in iter_runs(shape):
            if is_title:
                continue

            original_size = run.font.size.pt if run.font.size else None
            if original_size:
                run.font.size = Pt(nearest_size(original_size))

            if is_equation:
                run.font.name = "Cambria Math"
            elif original_size and original_size >= 24:
                run.font.name = "Aptos Display"
            else:
                run.font.name = "Aptos"

            color = rgb_value(run)
            if color in COLOR_NORMALIZATION:
                set_rgb(run, COLOR_NORMALIZATION[color])

            if is_kicker:
                run.font.name = "Aptos"
                run.font.size = Pt(12)
                run.font.bold = True
                set_rgb(run, PALETTE["cyan"] if dark else PALETTE["violet"])
            elif is_footer:
                run.font.name = "Aptos"
                run.font.size = Pt(10.5)
                set_rgb(run, PALETTE["footer_dark"] if dark else PALETTE["footer_light"])

    # Los títulos se formatean al final para que no hereden reglas generales.
    title_size = 54 if slide_number == 1 else 36
    format_title(title_shape, dark, title_size)


def apply_story_copy(slide, slide_number: int, item):
    original_title = find_shape(slide, item["anchor"])
    replace_text(original_title, item["title"])

    # Dos slides reciben copy adicional para hacer explícito el puente narrativo.
    if slide_number == 2:
        replacements = {
            "Una respuesta puede ser correcta… y aun así responder a la intención equivocada.":
                "Una respuesta puede ser correcta y, aun así, interpretar mal la intención.",
            "La ambigüedad no es ruido lingüístico: es una decisión oculta que el sistema debe gestionar.":
                "Antes de responder, el sistema debe decidir qué significa realmente X.",
        }
        for old, new in replacements.items():
            shape = find_shape(slide, old)
            replace_text(shape, new)

    if slide_number == 10:
        replacements = {
            "Con una query ambigua, el sistema debe inferir primero qué quiso decir el usuario.":
                "X ya no determina una única intención Z.",
            "Ahora aparece una variable latente: Z = intención real.":
                "Recuperar mejor no basta: primero hay que desambiguar.",
        }
        for old, new in replacements.items():
            shape = find_shape(slide, old)
            replace_text(shape, new)

    if slide_number == 20:
        old = "Context Engineering = diseñar qué debe saber el modelo, cuándo y con qué confianza."
        new = "Context Engineering = seleccionar evidencia y decidir cuándo preguntar."
        shape = find_shape(slide, old)
        replace_text(shape, new)

    return original_title


def special_formatting(slide, slide_number: int):
    """Ajustes puntuales donde el rol del texto no se infiere solo por tamaño."""
    if slide_number == 1:
        subtitle = find_shape(slide, "y manejo de ambigüedad")
        for run in iter_runs(subtitle):
            run.font.name = "Aptos Display"
            run.font.size = Pt(34)
            run.font.bold = True
            set_rgb(run, PALETTE["cyan"])

    if slide_number == 10:
        second = find_shape(slide, "X ya no determina una única intención Z.")
        third = find_shape(slide, "Recuperar mejor no basta: primero hay que desambiguar.")
        for run in iter_runs(second):
            run.font.name = "Aptos Display"
            run.font.size = Pt(30)
            run.font.bold = True
            set_rgb(run, PALETTE["cyan"])
        for run in iter_runs(third):
            run.font.name = "Aptos"
            run.font.size = Pt(20)
            set_rgb(run, PALETTE["body_dark"])

    if slide_number == 20:
        closing = find_shape(slide, "Context Engineering = seleccionar evidencia y decidir cuándo preguntar.")
        for run in iter_runs(closing):
            run.font.name = "Aptos Display"
            run.font.size = Pt(24)
            run.font.bold = True
            set_rgb(run, PALETTE["white"])


def collect_stats(prs: Presentation):
    fonts = Counter()
    sizes = Counter()
    colors = Counter()
    for slide in prs.slides:
        for shape in iter_text_shapes(slide):
            for run in iter_runs(shape):
                fonts[run.font.name or "(inherit)"] += 1
                if run.font.size:
                    sizes[round(run.font.size.pt, 1)] += 1
                color = rgb_value(run)
                if color:
                    colors[color] += 1
    return fonts, sizes, colors


def refine(input_path: Path, output_path: Path):
    prs = Presentation(str(input_path))
    if len(prs.slides) != 20:
        raise ValueError(f"Se esperaban 20 slides; se encontraron {len(prs.slides)}")

    story_slides = locate_story_slides(prs)
    reorder_slides(prs, story_slides)

    for slide_number, (slide, item) in enumerate(zip(prs.slides, STORY), start=1):
        title_shape = apply_story_copy(slide, slide_number, item)
        update_kicker_and_page_number(slide, slide_number, item["kicker"])
        normalize_typography(slide, slide_number, title_shape)
        special_formatting(slide, slide_number)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    prs.save(str(output_path))

    fonts, sizes, colors = collect_stats(prs)
    print(f"Presentación refinada: {output_path}")
    print(f"Slides: {len(prs.slides)}")
    print(f"Fuentes: {dict(fonts)}")
    print(f"Tamaños: {sorted(sizes)}")
    print(f"Colores de texto: {len(colors)} tonos")


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    refine(args.input.resolve(), args.output.resolve())
