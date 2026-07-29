import re

with open('scripts/mejorar_formulas_context_engineering.py', 'r', encoding='utf-8') as f:
    code = f.read()

replacements = {
    'slide = prs.slides[1]\n': 'slide = find_slide_by_text(prs, "02 / EL PROBLEMA")\n    if not slide: return\n',
    'slide = prs.slides[2]\n': 'slide = find_slide_by_text(prs, "QUÉ ES CONTEXT ENGINEERING")\n    if not slide: return\n',
    'slide = prs.slides[3]\n': 'slide = find_slide_by_text(prs, "TESIS CENTRAL")\n    if not slide: return\n',
    'slide = prs.slides[4]\n': 'slide = find_slide_by_text(prs, "MODELO PROBABILÍSTICO")\n    if not slide: return\n',
    'slide = prs.slides[5]\n': 'slide = find_slide_by_text(prs, "VALOR DE LA INFORMACIÓN")\n    if not slide: return\n',
    'slide = prs.slides[6]\n': 'slide = find_slide_by_text(prs, "LÍMITES DEL MODELO")\n    if not slide: return\n',
    'slide = prs.slides[7]\n': 'slide = find_slide_by_text(prs, "RAG END-TO-END")\n    if not slide: return\n',
    'slide = prs.slides[13]\n': 'slide = find_slide_by_text(prs, "PROPAGACIÓN DEL ERROR")\n    if not slide: return\n',
    'slide = prs.slides[14]\n': 'slide = find_slide_by_text(prs, "RETRIEVAL")\n    if not slide: return\n',
    'slide = prs.slides[15]\n': 'slide = find_slide_by_text(prs, "RERANKING")\n    if not slide: return\n',
    'slide = prs.slides[16]\n': 'slide = find_slide_by_text(prs, "GENERACIÓN")\n    if not slide: return\n',
    'slide = prs.slides[17]\n': 'slide = find_slide_by_text(prs, "LÍMITE TEÓRICO")\n    if not slide: return\n',
    'slide = prs.slides[18]\n': 'slide = find_slide_by_text(prs, "CLARIFICACIÓN")\n    if not slide: return\n',
    'slide = prs.slides[19]\n': 'slide = find_slide_by_text(prs, "POLÍTICA DE INTERACCIÓN")\n    if not slide: return\n',
    'slide = prs.slides[20]\n': 'slide = find_slide_by_text(prs, "EVIDENCIA")\n    if not slide: return\n',
    'slide = prs.slides[21]\n': 'slide = find_slide_by_text(prs, "DISEÑO OPERATIVO")\n    if not slide: return\n'
}

for old, new in replacements.items():
    code = code.replace(old, new)

helper = """
def find_slide_by_text(prs: Presentation, keyword: str):
    keyword = keyword.lower()
    for slide in prs.slides:
        for shape in slide.shapes:
            if shape.has_text_frame:
                if keyword in shape.text.lower():
                    return slide
    return None

def apply_styling_improvements(prs: Presentation) -> None:
"""

code = code.replace("def apply_styling_improvements(prs: Presentation) -> None:\n", helper)

with open('scripts/mejorar_formulas_context_engineering.py', 'w', encoding='utf-8') as f:
    f.write(code)

print("Refactored!")
