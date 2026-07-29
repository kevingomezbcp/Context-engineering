import re

with open('scripts/mejorar_formulas_context_engineering.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
in_update_equations = False
for line in lines:
    if 'def update_equations' in line:
        in_update_equations = True
    if 'def add_new_comparison_slide' in line:
        in_update_equations = False
        
    if in_update_equations and 'if not slide: return' in line:
        continue
    
    if in_update_equations and 'slide = find_slide_by_text(prs, ' in line:
        if '"02 / EL PROBLEMA"' in line:
            line = '    slide = prs.slides[1]\n'
        elif '"QUÉ ES CONTEXT ENGINEERING"' in line:
            line = '    slide = prs.slides[2]\n'
        elif '"TESIS CENTRAL"' in line:
            line = '    slide = prs.slides[3]\n'
        elif '"MODELO PROBABILÍSTICO"' in line:
            line = '    slide = prs.slides[4]\n'
        elif '"VALOR DE LA INFORMACIÓN"' in line:
            line = '    slide = prs.slides[5]\n'
        elif '"LÍMITES DEL MODELO"' in line:
            line = '    slide = prs.slides[6]\n'
        elif '"RAG END-TO-END"' in line:
            line = '    slide = prs.slides[7]\n'
        elif '"PROPAGACIÓN DEL ERROR"' in line:
            line = '    slide = prs.slides[13]\n'
        elif '"RETRIEVAL"' in line:
            line = '    slide = prs.slides[14]\n'
        elif '"RERANKING"' in line:
            line = '    slide = prs.slides[15]\n'
        elif '"GENERACIÓN"' in line:
            line = '    slide = prs.slides[16]\n'
        elif '"LÍMITE TEÓRICO"' in line:
            line = '    slide = prs.slides[17]\n'
        elif '"CLARIFICACIÓN"' in line:
            line = '    slide = prs.slides[18]\n'
        elif '"POLÍTICA DE INTERACCIÓN"' in line:
            line = '    slide = prs.slides[19]\n'
        elif '"EVIDENCIA"' in line:
            line = '    slide = prs.slides[20]\n'
        elif '"DISEÑO OPERATIVO"' in line:
            line = '    slide = prs.slides[21]\n'
            
    new_lines.append(line)

with open('scripts/mejorar_formulas_context_engineering.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Restored update_equations!")
