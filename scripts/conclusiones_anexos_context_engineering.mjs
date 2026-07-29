// Módulo validado visualmente para el cierre y los anexos matemáticos.
const COLORS = {
  navy: "#11182E",
  navy2: "#1B2343",
  ink: "#111827",
  muted: "#667085",
  lightMuted: "#C9D1E6",
  bg: "#F7F8FC",
  white: "#FFFFFF",
  line: "#D9DEEA",
  violet: "#6C63FF",
  violetSoft: "#EEECFF",
  turquoise: "#33D6C8",
  turquoiseSoft: "#E3F9F6",
  orange: "#F5A14A",
  orangeSoft: "#FFF3E6",
  coral: "#FF647C",
  coralSoft: "#FFF0F3",
  green: "#49C986",
  greenSoft: "#E9F8F0",
};

const SLIDE_W = 1280;
const SLIDE_H = 720;

function addShape(slide, {
  geometry = "rect",
  name,
  left,
  top,
  width,
  height,
  fill = "none",
  lineFill = "none",
  lineWidth = 0,
  radius,
  shadow,
}) {
  return slide.shapes.add({
    geometry,
    name,
    position: { left, top, width, height },
    fill,
    line: { style: "solid", fill: lineFill, width: lineWidth },
    ...(radius ? { borderRadius: radius } : {}),
    ...(shadow ? { shadow } : {}),
  });
}

function addText(slide, text, {
  name,
  left,
  top,
  width,
  height,
  fontSize = 18,
  color = COLORS.ink,
  bold = false,
  alignment = "left",
  verticalAlignment = "top",
  typeface = "Aptos",
  fill = "none",
  lineFill = "none",
  lineWidth = 0,
  radius,
  autoFit = "shrinkText",
  insets = { top: 2, right: 2, bottom: 2, left: 2 },
  lineSpacing = 1,
}) {
  const shape = addShape(slide, {
    geometry: "textbox",
    name,
    left,
    top,
    width,
    height,
    fill,
    lineFill,
    lineWidth,
    radius,
  });
  shape.text = text;
  shape.text.style = {
    fontSize,
    color,
    bold,
    alignment,
    verticalAlignment,
    typeface,
    autoFit,
    wrap: "square",
    insets,
    lineSpacing,
  };
  return shape;
}

function addRule(slide, left, top, width, color, height = 1) {
  return addShape(slide, {
    left,
    top,
    width,
    height,
    fill: color,
    lineFill: color,
    lineWidth: 0,
  });
}

function addCard(slide, {
  left,
  top,
  width,
  height,
  fill = COLORS.white,
  lineFill = COLORS.line,
  lineWidth = 1,
  radius = "rounded-2xl",
  shadow,
  name,
}) {
  return addShape(slide, {
    geometry: "roundRect",
    name,
    left,
    top,
    width,
    height,
    fill,
    lineFill,
    lineWidth,
    radius,
    shadow,
  });
}

function addPill(slide, text, {
  left,
  top,
  width,
  fill,
  color,
  lineFill = fill,
}) {
  addCard(slide, {
    left,
    top,
    width,
    height: 28,
    fill,
    lineFill,
    lineWidth: 1,
    radius: "rounded-full",
  });
  return addText(slide, text, {
    left: left + 5,
    top: top + 3,
    width: width - 10,
    height: 20,
    fontSize: 12,
    color,
    bold: true,
    alignment: "center",
    verticalAlignment: "middle",
  });
}

function addHeader(slide, {
  number,
  section,
  title,
  dark = false,
  titleSize = 38,
}) {
  const textColor = dark ? COLORS.white : COLORS.ink;
  const kickerColor = dark ? COLORS.turquoise : COLORS.violet;
  addText(slide, `${number} / ${section.toUpperCase()}`, {
    left: 72,
    top: 52,
    width: 470,
    height: 24,
    fontSize: 14,
    color: kickerColor,
    bold: true,
    verticalAlignment: "middle",
  });
  addText(slide, title, {
    left: 72,
    top: 84,
    width: 1135,
    height: 62,
    fontSize: titleSize,
    color: textColor,
    bold: true,
    verticalAlignment: "middle",
    lineSpacing: 0.92,
  });
  addRule(
    slide,
    72,
    164,
    1136,
    dark ? "#303958" : COLORS.line,
    1,
  );
}

function addFooter(slide, {
  number,
  source,
  dark = false,
}) {
  addText(slide, source, {
    left: 72,
    top: 681,
    width: 1040,
    height: 18,
    fontSize: 10,
    color: dark ? "#9AA6C4" : "#8792AA",
    verticalAlignment: "middle",
  });
  addText(slide, String(number), {
    left: 1164,
    top: 681,
    width: 44,
    height: 18,
    fontSize: 11,
    color: dark ? COLORS.lightMuted : "#7B879F",
    bold: true,
    alignment: "right",
    verticalAlignment: "middle",
  });
}

function addFormula(slide, text, {
  left,
  top,
  width,
  height,
  fontSize = 28,
  color = COLORS.violet,
  alignment = "center",
  fill = "none",
  lineFill = "none",
  radius,
  bold = false,
}) {
  return addText(slide, text, {
    left,
    top,
    width,
    height,
    fontSize,
    color,
    bold,
    alignment,
    verticalAlignment: "middle",
    typeface: "Cambria Math",
    fill,
    lineFill,
    lineWidth: lineFill === "none" ? 0 : 1,
    radius,
    insets: { top: 8, right: 10, bottom: 8, left: 10 },
    lineSpacing: 0.95,
  });
}

function addStep(slide, {
  index,
  title,
  body,
  left,
  top,
  width,
  accent = COLORS.violet,
  dark = false,
}) {
  addPill(slide, String(index).padStart(2, "0"), {
    left,
    top,
    width: 42,
    fill: dark ? "#252E4F" : COLORS.violetSoft,
    color: accent,
    lineFill: accent,
  });
  addText(slide, title, {
    left: left + 55,
    top: top - 1,
    width: width - 55,
    height: 26,
    fontSize: 17,
    color: dark ? COLORS.white : COLORS.ink,
    bold: true,
    verticalAlignment: "middle",
  });
  addText(slide, body, {
    left: left + 55,
    top: top + 29,
    width: width - 55,
    height: 55,
    fontSize: 14,
    color: dark ? COLORS.lightMuted : COLORS.muted,
    lineSpacing: 1.05,
  });
}

function addNote(slide, sourceDeckName, sourceSlide, extraSources = []) {
  const lines = [
    "[Sources]",
    `- Deck fuente: ${sourceDeckName}, derivación añadida después de la diapositiva ${sourceSlide}.`,
    ...extraSources.map((source) => `- ${source}`),
  ];
  slide.speakerNotes.textFrame.setText(lines.join("\n"));
  slide.speakerNotes.setVisible(true);
}

function createSlide(presentation, dark = false) {
  const slide = presentation.slides.add();
  slide.background.fill = dark ? COLORS.navy : COLORS.bg;
  return slide;
}

function buildConclusionSlide(presentation, sourceDeckName) {
  const slide = createSlide(presentation, true);
  addHeader(slide, {
    number: 26,
    section: "Conclusiones",
    title: "Qué permite concluir el modelo probabilístico",
    dark: true,
    titleSize: 37,
  });

  const cards = [
    {
      n: "1",
      title: "Contexto discriminativo",
      body: "Ayuda cuando separa intenciones plausibles; similitud semántica por sí sola no basta.",
      accent: COLORS.orange,
    },
    {
      n: "2",
      title: "Entropía como brújula",
      body: "La incertidumbre residual indica si conviene recuperar, aclarar o responder.",
      accent: COLORS.turquoise,
    },
    {
      n: "3",
      title: "Retrieval como cuello",
      body: "Si el documento correcto recibe poco peso, mejorar solo el generador tiene efecto limitado.",
      accent: COLORS.violet,
    },
    {
      n: "4",
      title: "Más contexto ≠ mejor",
      body: "Cada bloque debe aportar información marginal; la redundancia consume ventana sin reducir riesgo.",
      accent: COLORS.green,
    },
    {
      n: "5",
      title: "Aclarar crea evidencia",
      body: "Una pregunta útil incorpora información de intención que no estaba disponible en X ni en C.",
      accent: COLORS.coral,
    },
  ];

  const cardW = 210;
  const gap = 18;
  const startX = 72;
  for (let i = 0; i < cards.length; i += 1) {
    const card = cards[i];
    const x = startX + i * (cardW + gap);
    addCard(slide, {
      left: x,
      top: 205,
      width: cardW,
      height: 286,
      fill: "#242C49",
      lineFill: card.accent,
      lineWidth: 1.4,
      radius: "rounded-2xl",
    });
    addText(slide, card.n, {
      left: x + 18,
      top: 220,
      width: 34,
      height: 26,
      fontSize: 14,
      color: card.accent,
      bold: true,
    });
    addText(slide, card.title, {
      left: x + 18,
      top: 260,
      width: cardW - 36,
      height: 56,
      fontSize: 20,
      color: COLORS.white,
      bold: true,
      lineSpacing: 0.94,
    });
    addText(slide, card.body, {
      left: x + 18,
      top: 333,
      width: cardW - 36,
      height: 122,
      fontSize: 15,
      color: COLORS.lightMuted,
      lineSpacing: 1.08,
    });
    addRule(slide, x + 18, 465, cardW - 36, card.accent, 3);
  }

  addCard(slide, {
    left: 154,
    top: 533,
    width: 972,
    height: 92,
    fill: "#1A2340",
    lineFill: COLORS.turquoise,
    lineWidth: 1.2,
    radius: "rounded-2xl",
  });
  addText(
    slide,
    "Context Engineering = maximizar información útil por token y preguntar cuando el riesgo Bayesiano supera el costo de interactuar.",
    {
      left: 184,
      top: 550,
      width: 912,
      height: 55,
      fontSize: 22,
      color: COLORS.turquoise,
      bold: true,
      alignment: "center",
      verticalAlignment: "middle",
      lineSpacing: 0.95,
    },
  );
  addFooter(slide, {
    number: 26,
    source: "Síntesis propia · Bayes · teoría de la información · decisión Bayesiana · RAG",
    dark: true,
  });
  addNote(slide, sourceDeckName, 25, [
    "Shannon, C. E. (1948), A Mathematical Theory of Communication.",
    "Lewis, P. et al. (2020), Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks.",
  ]);
  return slide;
}

function buildAnnexDivider(presentation, sourceDeckName) {
  const slide = createSlide(presentation, true);
  addPill(slide, "ANEXOS · DERIVACIONES", {
    left: 72,
    top: 72,
    width: 202,
    fill: "#3B3340",
    color: COLORS.turquoise,
    lineFill: COLORS.orange,
  });
  addText(slide, "De las probabilidades\na las conclusiones", {
    left: 72,
    top: 190,
    width: 670,
    height: 150,
    fontSize: 52,
    color: COLORS.white,
    bold: true,
    verticalAlignment: "middle",
    lineSpacing: 0.9,
  });
  addRule(slide, 72, 379, 520, COLORS.turquoise, 5);
  addText(slide, "Desarrollo simbólico · supuestos explícitos · sin depender de ejemplos numéricos", {
    left: 72,
    top: 418,
    width: 720,
    height: 70,
    fontSize: 22,
    color: COLORS.lightMuted,
    verticalAlignment: "middle",
  });

  const nodes = [
    { text: "Bayes", x: 748, y: 286, color: COLORS.orange },
    { text: "Entropía", x: 868, y: 286, color: COLORS.violet },
    { text: "Riesgo", x: 988, y: 286, color: COLORS.coral },
    { text: "Decisión", x: 1108, y: 286, color: COLORS.turquoise },
  ];
  for (let i = 0; i < nodes.length - 1; i += 1) {
    addShape(slide, {
      geometry: "rightArrow",
      left: nodes[i].x + 102,
      top: nodes[i].y + 25,
      width: 16,
      height: 26,
      fill: "#38415F",
      lineFill: "#59627E",
      lineWidth: 1,
    });
  }
  for (const node of nodes) {
    addCard(slide, {
      left: node.x,
      top: node.y,
      width: 100,
      height: 76,
      fill: "#242C49",
      lineFill: node.color,
      lineWidth: 1.4,
      radius: "rounded-2xl",
    });
    addText(slide, node.text, {
      left: node.x + 5,
      top: node.y + 18,
      width: 90,
      height: 38,
      fontSize: 16,
      color: node.color,
      bold: true,
      alignment: "center",
      verticalAlignment: "middle",
    });
  }
  addFooter(slide, {
    number: 27,
    source: "Anexos matemáticos · notación: X consulta · C contexto · Z intención · Y respuesta",
    dark: true,
  });
  addNote(slide, sourceDeckName, 26);
  return slide;
}

function buildBayesSlide(presentation, sourceDeckName) {
  const slide = createSlide(presentation, false);
  addHeader(slide, {
    number: "A1",
    section: "Actualización Bayesiana",
    title: "El contexto es útil cuando cambia las odds entre intenciones",
    titleSize: 35,
  });

  addCard(slide, {
    left: 72,
    top: 200,
    width: 710,
    height: 412,
    fill: COLORS.white,
    lineFill: COLORS.line,
    lineWidth: 1,
    radius: "rounded-2xl",
  });
  addPill(slide, "DESARROLLO LITERAL", {
    left: 96,
    top: 218,
    width: 164,
    fill: COLORS.violetSoft,
    color: COLORS.violet,
  });
  addFormula(
    slide,
    "P(Zᵢ | X,C) = P(C | Zᵢ,X) P(Zᵢ | X) / ∑ⱼ P(C | Zⱼ,X) P(Zⱼ | X)",
    {
      left: 96,
      top: 260,
      width: 662,
      height: 78,
      fontSize: 25,
      color: COLORS.violet,
      fill: "#F8F7FF",
      lineFill: "#D7D2FF",
      radius: "rounded-xl",
    },
  );
  addText(slide, "Al dividir dos posteriores, el denominador común se cancela:", {
    left: 98,
    top: 355,
    width: 620,
    height: 28,
    fontSize: 16,
    color: COLORS.muted,
  });
  addFormula(
    slide,
    "P(Z₁ | X,C) / P(Z₂ | X,C)\n= [P(Z₁ | X) / P(Z₂ | X)] · [P(C | Z₁,X) / P(C | Z₂,X)]",
    {
      left: 96,
      top: 389,
      width: 662,
      height: 112,
      fontSize: 24,
      color: COLORS.ink,
      fill: COLORS.turquoiseSoft,
      lineFill: COLORS.turquoise,
      radius: "rounded-xl",
    },
  );
  addText(slide, "odds posteriores = odds previas × factor de Bayes", {
    left: 130,
    top: 523,
    width: 594,
    height: 32,
    fontSize: 18,
    color: "#168E83",
    bold: true,
    alignment: "center",
  });

  addCard(slide, {
    left: 818,
    top: 200,
    width: 390,
    height: 412,
    fill: COLORS.violetSoft,
    lineFill: COLORS.violet,
    lineWidth: 1.2,
    radius: "rounded-2xl",
  });
  addText(slide, "Lectura de la conclusión", {
    left: 844,
    top: 225,
    width: 338,
    height: 35,
    fontSize: 21,
    color: COLORS.violet,
    bold: true,
  });
  addStep(slide, {
    index: 1,
    title: "Prior",
    body: "P(Zᵢ|X) resume qué intención era plausible antes de añadir C.",
    left: 844,
    top: 281,
    width: 320,
  });
  addStep(slide, {
    index: 2,
    title: "Evidencia",
    body: "P(C|Zᵢ,X) mide cuánto esperaba observar ese contexto bajo cada intención.",
    left: 844,
    top: 376,
    width: 320,
    accent: COLORS.turquoise,
  });
  addStep(slide, {
    index: 3,
    title: "Criterio",
    body: "Si el factor de Bayes ≈ 1, C no separa Z₁ de Z₂: agrega texto, no decisión.",
    left: 844,
    top: 480,
    width: 320,
    accent: COLORS.orange,
  });
  addFooter(slide, {
    number: 28,
    source: "Derivación propia · regla de Bayes · comparación de odds posteriores",
  });
  addNote(slide, sourceDeckName, 26, [
    "Bayes, T. (1763), An Essay towards solving a Problem in the Doctrine of Chances.",
  ]);
  return slide;
}

function buildInformationSlide(presentation, sourceDeckName) {
  const slide = createSlide(presentation, true);
  addHeader(slide, {
    number: "A2",
    section: "Información",
    title: "La ganancia media de información está acotada por la incertidumbre inicial",
    dark: true,
    titleSize: 34,
  });

  addCard(slide, {
    left: 72,
    top: 206,
    width: 520,
    height: 385,
    fill: "#202846",
    lineFill: COLORS.violet,
    lineWidth: 1.2,
    radius: "rounded-2xl",
  });
  addText(slide, "Entropía condicional", {
    left: 98,
    top: 226,
    width: 260,
    height: 30,
    fontSize: 20,
    color: COLORS.violet,
    bold: true,
  });
  addFormula(slide, "H(Z|X) = −Σ z∈𝒵  P(z|X) log P(z|X)", {
    left: 98,
    top: 270,
    width: 468,
    height: 70,
    fontSize: 26,
    color: COLORS.white,
    fill: "#171E37",
    lineFill: "#36405F",
    radius: "rounded-xl",
  });
  addText(slide, "Para un contexto observado c:", {
    left: 100,
    top: 363,
    width: 300,
    height: 25,
    fontSize: 15,
    color: COLORS.lightMuted,
  });
  addFormula(slide, "IG(c) = H(Z|X=x) − H(Z|X=x,C=c)", {
    left: 98,
    top: 398,
    width: 468,
    height: 72,
    fontSize: 24,
    color: COLORS.turquoise,
    fill: "#171E37",
    lineFill: "#36405F",
    radius: "rounded-xl",
  });
  addText(slide, "IG(c) puede variar para cada contexto concreto.", {
    left: 100,
    top: 494,
    width: 445,
    height: 33,
    fontSize: 15,
    color: COLORS.lightMuted,
    alignment: "center",
  });

  addCard(slide, {
    left: 626,
    top: 206,
    width: 582,
    height: 385,
    fill: "#202846",
    lineFill: COLORS.turquoise,
    lineWidth: 1.2,
    radius: "rounded-2xl",
  });
  addText(slide, "Promedio sobre todos los contextos posibles", {
    left: 652,
    top: 226,
    width: 530,
    height: 31,
    fontSize: 20,
    color: COLORS.turquoise,
    bold: true,
  });
  addFormula(
    slide,
    "I(Z;C|X) = 𝔼[IG(C)]\n= H(Z|X) − H(Z|X,C)",
    {
      left: 652,
      top: 274,
      width: 530,
      height: 98,
      fontSize: 27,
      color: COLORS.white,
      fill: "#171E37",
      lineFill: "#36405F",
      radius: "rounded-xl",
    },
  );
  addFormula(slide, "0 ≤ I(Z;C|X) ≤ H(Z|X)", {
    left: 682,
    top: 402,
    width: 470,
    height: 75,
    fontSize: 31,
    color: COLORS.turquoise,
    fill: "#18263C",
    lineFill: COLORS.turquoise,
    radius: "rounded-xl",
    bold: true,
  });
  addText(
    slide,
    "Conclusión: el contexto no puede eliminar más incertidumbre que la que existía. Si I≈0, su aporte medio es redundante.",
    {
      left: 666,
      top: 499,
      width: 500,
      height: 58,
      fontSize: 16,
      color: COLORS.lightMuted,
      alignment: "center",
      verticalAlignment: "middle",
    },
  );
  addFooter(slide, {
    number: 29,
    source: "Shannon (1948) · identidad de información mutua condicional",
    dark: true,
  });
  addNote(slide, sourceDeckName, 28, [
    "Shannon, C. E. (1948), A Mathematical Theory of Communication.",
    "Cover, T. M. & Thomas, J. A. (2006), Elements of Information Theory.",
  ]);
  return slide;
}

function buildDecisionSlide(presentation, sourceDeckName) {
  const slide = createSlide(presentation, false);
  addHeader(slide, {
    number: "A3",
    section: "Decisión",
    title: "El umbral de aclaración aparece al comparar dos riesgos",
    titleSize: 36,
  });

  const xL = 72;
  const xR = 658;
  addCard(slide, {
    left: xL,
    top: 205,
    width: 550,
    height: 190,
    fill: COLORS.orangeSoft,
    lineFill: COLORS.orange,
    lineWidth: 1.2,
    radius: "rounded-2xl",
  });
  addPill(slide, "RESPONDER", {
    left: xL + 24,
    top: 225,
    width: 118,
    fill: "#FFF8EF",
    color: "#C96C0D",
    lineFill: COLORS.orange,
  });
  addFormula(slide, "Rᵣₑₛₚ = Lw (1 − pₘₐₓ)", {
    left: xL + 30,
    top: 274,
    width: 490,
    height: 58,
    fontSize: 29,
    color: COLORS.ink,
  });
  addText(slide, "pₘₐₓ = max sobre z de P(z|X,C) · Lw = pérdida de equivocarse", {
    left: xL + 32,
    top: 339,
    width: 486,
    height: 32,
    fontSize: 14,
    color: COLORS.muted,
    alignment: "center",
  });

  addCard(slide, {
    left: xR,
    top: 205,
    width: 550,
    height: 190,
    fill: COLORS.turquoiseSoft,
    lineFill: COLORS.turquoise,
    lineWidth: 1.2,
    radius: "rounded-2xl",
  });
  addPill(slide, "ACLARAR", {
    left: xR + 24,
    top: 225,
    width: 108,
    fill: "#F0FFFC",
    color: "#168E83",
    lineFill: COLORS.turquoise,
  });
  addFormula(slide, "Rₐcₗₐᵣ = c(q) + Lw ε(q)", {
    left: xR + 30,
    top: 274,
    width: 490,
    height: 58,
    fontSize: 29,
    color: COLORS.ink,
  });
  addText(slide, "c(q) = costo de preguntar · ε(q) = error residual después de la respuesta", {
    left: xR + 32,
    top: 339,
    width: 486,
    height: 32,
    fontSize: 14,
    color: COLORS.muted,
    alignment: "center",
  });

  addText(slide, "Aclarar si Rₐcₗₐᵣ < Rᵣₑₛₚ", {
    left: 390,
    top: 420,
    width: 500,
    height: 36,
    fontSize: 20,
    color: COLORS.violet,
    bold: true,
    alignment: "center",
  });
  addFormula(
    slide,
    "c(q) + Lw ε(q) < Lw(1 − pₘₐₓ)\n⇒  pₘₐₓ < 1 − c(q)/Lw − ε(q)",
    {
      left: 270,
      top: 462,
      width: 740,
      height: 100,
      fontSize: 29,
      color: COLORS.violet,
      fill: COLORS.violetSoft,
      lineFill: COLORS.violet,
      radius: "rounded-xl",
    },
  );
  addText(
    slide,
    "La pregunta óptima minimiza costo + riesgo posterior esperado:   q* = arg min sobre q de [c(q) + 𝔼 R*(X,C,A(q))]",
    {
      left: 170,
      top: 583,
      width: 940,
      height: 38,
      fontSize: 17,
      color: COLORS.ink,
      bold: true,
      alignment: "center",
      verticalAlignment: "middle",
    },
  );
  addFooter(slide, {
    number: 30,
    source: "Derivación propia · pérdida 0–1 generalizada por costo de error e interacción",
  });
  addNote(slide, sourceDeckName, 29, [
    "Berger, J. O. (1985), Statistical Decision Theory and Bayesian Analysis.",
  ]);
  return slide;
}

function buildRagSensitivitySlide(presentation, sourceDeckName) {
  const slide = createSlide(presentation, false);
  addHeader(slide, {
    number: "A4",
    section: "RAG",
    title: "La recuperación y la generación intervienen en operaciones distintas",
    titleSize: 35,
  });

  addCard(slide, {
    left: 72,
    top: 202,
    width: 1136,
    height: 142,
    fill: COLORS.white,
    lineFill: COLORS.line,
    lineWidth: 1,
    radius: "rounded-2xl",
  });
  addText(slide, "Marginalizar documentos y factorizar tokens", {
    left: 96,
    top: 218,
    width: 440,
    height: 28,
    fontSize: 18,
    color: COLORS.violet,
    bold: true,
  });
  addFormula(
    slide,
    "P(Y=y₁:T | X,D) = Σ d∈D  P(d|X,D) · Π t=1…T  P(yₜ | y<ₜ,X,d)",
    {
      left: 140,
      top: 254,
      width: 1000,
      height: 67,
      fontSize: 29,
      color: COLORS.ink,
      alignment: "center",
    },
  );

  addCard(slide, {
    left: 72,
    top: 375,
    width: 545,
    height: 245,
    fill: COLORS.turquoiseSoft,
    lineFill: COLORS.turquoise,
    lineWidth: 1.2,
    radius: "rounded-2xl",
  });
  addText(slide, "Caso simbólico con dos documentos", {
    left: 98,
    top: 394,
    width: 490,
    height: 30,
    fontSize: 20,
    color: "#168E83",
    bold: true,
  });
  addFormula(slide, "P(Y*) = p·g₁ + (1−p)·g₂\n= g₂ + p(g₁−g₂)", {
    left: 98,
    top: 437,
    width: 493,
    height: 83,
    fontSize: 27,
    color: COLORS.ink,
    fill: "#F4FFFD",
    lineFill: "#A8ECE5",
    radius: "rounded-xl",
  });
  addText(slide, "p = peso del documento d₁ · gᵢ = P(Y*|X,dᵢ)", {
    left: 110,
    top: 541,
    width: 470,
    height: 28,
    fontSize: 14,
    color: COLORS.muted,
    alignment: "center",
  });

  addCard(slide, {
    left: 653,
    top: 375,
    width: 555,
    height: 245,
    fill: COLORS.violetSoft,
    lineFill: COLORS.violet,
    lineWidth: 1.2,
    radius: "rounded-2xl",
  });
  addText(slide, "Sensibilidad marginal", {
    left: 679,
    top: 394,
    width: 500,
    height: 30,
    fontSize: 20,
    color: COLORS.violet,
    bold: true,
  });
  addFormula(slide, "∂P(Y*)/∂p = g₁−g₂\n∂P(Y*)/∂g₁ = p", {
    left: 679,
    top: 437,
    width: 503,
    height: 83,
    fontSize: 28,
    color: COLORS.ink,
    fill: "#FAF9FF",
    lineFill: "#D7D2FF",
    radius: "rounded-xl",
  });
  addText(
    slide,
    "Si g₁−g₂ es grande y p es pequeño, reasignar masa al documento correcto puede rendir más que refinar el generador.",
    {
      left: 696,
      top: 536,
      width: 470,
      height: 58,
      fontSize: 14,
      color: COLORS.muted,
      alignment: "center",
    },
  );
  addFooter(slide, {
    number: 31,
    source: "Lewis et al. (2020) · descomposición propia de sensibilidad de una mezcla RAG",
  });
  addNote(slide, sourceDeckName, 30, [
    "Lewis, P. et al. (2020), Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks.",
  ]);
  return slide;
}

function buildLocalEntropySlide(presentation, sourceDeckName) {
  const slide = createSlide(presentation, true);
  addHeader(slide, {
    number: "A5",
    section: "Efecto local",
    title: "Un contexto concreto puede aumentar la incertidumbre aunque el promedio disminuya",
    dark: true,
    titleSize: 34,
  });

  addCard(slide, {
    left: 72,
    top: 205,
    width: 540,
    height: 395,
    fill: "#202846",
    lineFill: COLORS.turquoise,
    lineWidth: 1.2,
    radius: "rounded-2xl",
  });
  addText(slide, "La desigualdad es un promedio", {
    left: 98,
    top: 225,
    width: 480,
    height: 31,
    fontSize: 21,
    color: COLORS.turquoise,
    bold: true,
  });
  addFormula(slide, "H(Z|X,C) ≤ H(Z|X)", {
    left: 110,
    top: 278,
    width: 464,
    height: 70,
    fontSize: 32,
    color: COLORS.white,
    fill: "#171E37",
    lineFill: "#36405F",
    radius: "rounded-xl",
  });
  addText(slide, "Pero para un valor específico c:", {
    left: 106,
    top: 377,
    width: 420,
    height: 27,
    fontSize: 16,
    color: COLORS.lightMuted,
  });
  addFormula(slide, "ΔH(c)=H(Z|x,c)−H(Z|x)", {
    left: 110,
    top: 420,
    width: 464,
    height: 67,
    fontSize: 27,
    color: COLORS.orange,
    fill: "#171E37",
    lineFill: "#36405F",
    radius: "rounded-xl",
  });
  addText(slide, "Nada impide que ΔH(c)>0 para una observación particular.", {
    left: 108,
    top: 510,
    width: 468,
    height: 44,
    fontSize: 15,
    color: COLORS.lightMuted,
    alignment: "center",
  });

  addCard(slide, {
    left: 648,
    top: 205,
    width: 560,
    height: 395,
    fill: "#202846",
    lineFill: COLORS.orange,
    lineWidth: 1.2,
    radius: "rounded-2xl",
  });
  addText(slide, "Cuándo el contexto vuelve binaria la duda", {
    left: 674,
    top: 225,
    width: 508,
    height: 31,
    fontSize: 21,
    color: COLORS.orange,
    bold: true,
  });
  addFormula(
    slide,
    "P(Z₁|x,c) = πℓ₁ / [πℓ₁ + (1−π)ℓ₂]",
    {
      left: 674,
      top: 278,
      width: 508,
      height: 70,
      fontSize: 27,
      color: COLORS.white,
      fill: "#171E37",
      lineFill: "#36405F",
      radius: "rounded-xl",
    },
  );
  addText(slide, "donde π=P(Z₁|x) y ℓᵢ=P(c|Zᵢ,x)", {
    left: 700,
    top: 363,
    width: 456,
    height: 27,
    fontSize: 15,
    color: COLORS.lightMuted,
    alignment: "center",
  });
  addFormula(slide, "πℓ₁ = (1−π)ℓ₂  ⇒  P(Z₁|x,c)=P(Z₂|x,c)", {
    left: 674,
    top: 414,
    width: 508,
    height: 76,
    fontSize: 24,
    color: COLORS.orange,
    fill: "#241F30",
    lineFill: COLORS.orange,
    radius: "rounded-xl",
  });
  addText(
    slide,
    "El nuevo contexto puede equilibrar las hipótesis y llevar el posterior hacia máxima ambigüedad.",
    {
      left: 690,
      top: 512,
      width: 476,
      height: 50,
      fontSize: 15,
      color: COLORS.lightMuted,
      alignment: "center",
    },
  );
  addFooter(slide, {
    number: 32,
    source: "Identidad de entropía condicional · derivación Bayesiana para dos hipótesis",
    dark: true,
  });
  addNote(slide, sourceDeckName, 31, [
    "Cover, T. M. & Thomas, J. A. (2006), Elements of Information Theory.",
  ]);
  return slide;
}

function buildDensitySlide(presentation, sourceDeckName) {
  const slide = createSlide(presentation, false);
  addHeader(slide, {
    number: "A6",
    section: "Selección de contexto",
    title: "La información marginal permite medir utilidad y redundancia",
    titleSize: 36,
  });

  const cardSpecs = [
    {
      x: 72,
      accent: COLORS.turquoise,
      fill: COLORS.turquoiseSoft,
      label: "DENSIDAD",
      formula: "ρ(C) = I(Y;C|X) / |C|",
      body: "Compara información útil con el costo de ventana. Un bloque largo puede tener alta información total y baja densidad.",
    },
    {
      x: 456,
      accent: COLORS.violet,
      fill: COLORS.violetSoft,
      label: "SELECCIÓN",
      formula: "C* = arg max { I(Y;C|X) − λ|C| : C∈𝒞 }",
      body: "λ traduce el costo de tokens, latencia o atención. El óptimo equilibra valor informativo y presupuesto.",
    },
    {
      x: 840,
      accent: COLORS.orange,
      fill: COLORS.orangeSoft,
      label: "REDUNDANCIA",
      formula: "I(Y;C₁,C₂|X)\n= I(Y;C₁|X)+I(Y;C₂|X,C₁)",
      body: "Si el segundo término es cercano a cero, C₂ repite lo ya explicado por C₁ y aporta poco valor marginal.",
    },
  ];
  for (const spec of cardSpecs) {
    addCard(slide, {
      left: spec.x,
      top: 212,
      width: 352,
      height: 360,
      fill: spec.fill,
      lineFill: spec.accent,
      lineWidth: 1.2,
      radius: "rounded-2xl",
    });
    addPill(slide, spec.label, {
      left: spec.x + 22,
      top: 232,
      width: 118,
      fill: COLORS.white,
      color: spec.accent,
      lineFill: spec.accent,
    });
    addFormula(slide, spec.formula, {
      left: spec.x + 22,
      top: 290,
      width: 308,
      height: 102,
      fontSize: spec.label === "REDUNDANCIA" ? 22 : 25,
      color: COLORS.ink,
      fill: COLORS.white,
      lineFill: "#FFFFFF",
      radius: "rounded-xl",
    });
    addText(slide, spec.body, {
      left: spec.x + 28,
      top: 417,
      width: 296,
      height: 112,
      fontSize: 15,
      color: COLORS.muted,
      alignment: "center",
      lineSpacing: 1.05,
    });
    addRule(slide, spec.x + 42, 545, 268, spec.accent, 3);
  }
  addText(
    slide,
    "Conclusión operativa: priorizar el siguiente bloque con mayor información condicional, no el más parecido ni el más largo.",
    {
      left: 180,
      top: 598,
      width: 920,
      height: 42,
      fontSize: 19,
      color: COLORS.violet,
      bold: true,
      alignment: "center",
      verticalAlignment: "middle",
    },
  );
  addFooter(slide, {
    number: 33,
    source: "Regla de la cadena de información mutua · objetivo regularizado por longitud",
  });
  addNote(slide, sourceDeckName, 32, [
    "Cover, T. M. & Thomas, J. A. (2006), Elements of Information Theory.",
  ]);
  return slide;
}

function buildLimitSlide(presentation, sourceDeckName) {
  const slide = createSlide(presentation, true);
  addHeader(slide, {
    number: "A7",
    section: "Límite teórico",
    title: "El procesamiento no crea información de intención que nunca ingresó",
    dark: true,
    titleSize: 35,
  });

  const flow = [
    { x: 82, text: "Z\nintención", color: COLORS.orange },
    { x: 342, text: "C\ncontexto", color: COLORS.turquoise },
    { x: 602, text: "R\nrazonamiento", color: COLORS.violet },
    { x: 862, text: "Y\nrespuesta", color: COLORS.green },
  ];
  for (let i = 0; i < flow.length; i += 1) {
    const node = flow[i];
    addCard(slide, {
      left: node.x,
      top: 222,
      width: 174,
      height: 104,
      fill: "#232B49",
      lineFill: node.color,
      lineWidth: 1.5,
      radius: "rounded-2xl",
    });
    addText(slide, node.text, {
      left: node.x + 12,
      top: 240,
      width: 150,
      height: 64,
      fontSize: 20,
      color: node.color,
      bold: true,
      alignment: "center",
      verticalAlignment: "middle",
    });
    if (i < flow.length - 1) {
      addShape(slide, {
        geometry: "rightArrow",
        left: node.x + 188,
        top: 257,
        width: 58,
        height: 32,
        fill: "#46506F",
        lineFill: "#65708E",
        lineWidth: 1,
      });
    }
  }
  addText(slide, "Cadena de Markov condicionada en X", {
    left: 934,
    top: 341,
    width: 245,
    height: 26,
    fontSize: 13,
    color: COLORS.lightMuted,
    alignment: "center",
  });
  addFormula(
    slide,
    "I(Z;Y|X) ≤ I(Z;R|X) ≤ I(Z;C|X)",
    {
      left: 252,
      top: 382,
      width: 776,
      height: 74,
      fontSize: 31,
      color: COLORS.turquoise,
      fill: "#18213B",
      lineFill: COLORS.turquoise,
      radius: "rounded-xl",
      bold: true,
    },
  );

  addCard(slide, {
    left: 72,
    top: 494,
    width: 548,
    height: 135,
    fill: "#202846",
    lineFill: COLORS.coral,
    lineWidth: 1.2,
    radius: "rounded-2xl",
  });
  addText(slide, "Límite de error (Fano)", {
    left: 96,
    top: 510,
    width: 240,
    height: 28,
    fontSize: 18,
    color: COLORS.coral,
    bold: true,
  });
  addFormula(slide, "Pₑ ≥ [H(Z|O) − 1] / log₂K", {
    left: 96,
    top: 545,
    width: 500,
    height: 58,
    fontSize: 25,
    color: COLORS.white,
  });

  addCard(slide, {
    left: 660,
    top: 494,
    width: 548,
    height: 135,
    fill: "#202846",
    lineFill: COLORS.turquoise,
    lineWidth: 1.2,
    radius: "rounded-2xl",
  });
  addText(slide, "Por qué preguntar sí ayuda", {
    left: 684,
    top: 510,
    width: 300,
    height: 28,
    fontSize: 18,
    color: COLORS.turquoise,
    bold: true,
  });
  addFormula(
    slide,
    "I(Z;C,A(q)|X)=I(Z;C|X)+I(Z;A(q)|X,C)",
    {
      left: 684,
      top: 545,
      width: 500,
      height: 58,
      fontSize: 22,
      color: COLORS.white,
    },
  );
  addFooter(slide, {
    number: 34,
    source: "Desigualdad de procesamiento de datos · desigualdad de Fano · regla de la cadena",
    dark: true,
  });
  addNote(slide, sourceDeckName, 33, [
    "Cover, T. M. & Thomas, J. A. (2006), Elements of Information Theory.",
  ]);
  return slide;
}

function buildEvidenceSlide(presentation, sourceDeckName) {
  const slide = createSlide(presentation, false);
  addHeader(slide, {
    number: "A8",
    section: "Lectura de evidencia",
    title: "La brecha de ambigüedad puede analizarse sin depender de porcentajes",
    titleSize: 34,
  });

  addCard(slide, {
    left: 72,
    top: 205,
    width: 535,
    height: 405,
    fill: COLORS.white,
    lineFill: COLORS.line,
    lineWidth: 1,
    radius: "rounded-2xl",
  });
  addText(slide, "Definiciones simbólicas", {
    left: 98,
    top: 225,
    width: 480,
    height: 31,
    fontSize: 21,
    color: COLORS.violet,
    bold: true,
  });
  addFormula(
    slide,
    "Qₙ⁰, Qₐ⁰ : calidad sin contexto\nQₙᶜ, Qₐᶜ : calidad con contexto",
    {
      left: 98,
      top: 274,
      width: 483,
      height: 88,
      fontSize: 24,
      color: COLORS.ink,
      fill: COLORS.violetSoft,
      lineFill: "#D7D2FF",
      radius: "rounded-xl",
    },
  );
  addText(slide, "N = consultas no ambiguas · A = consultas ambiguas", {
    left: 110,
    top: 373,
    width: 458,
    height: 28,
    fontSize: 14,
    color: COLORS.muted,
    alignment: "center",
  });
  addFormula(slide, "Δₙ = Qₙᶜ − Qₙ⁰\nΔₐ = Qₐᶜ − Qₐ⁰", {
    left: 98,
    top: 426,
    width: 483,
    height: 87,
    fontSize: 28,
    color: COLORS.turquoise,
    fill: COLORS.turquoiseSoft,
    lineFill: COLORS.turquoise,
    radius: "rounded-xl",
  });
  addText(slide, "Δ mide el lift atribuible a añadir contexto dentro de cada grupo.", {
    left: 110,
    top: 536,
    width: 458,
    height: 40,
    fontSize: 14,
    color: COLORS.muted,
    alignment: "center",
  });

  addCard(slide, {
    left: 643,
    top: 205,
    width: 565,
    height: 405,
    fill: COLORS.orangeSoft,
    lineFill: COLORS.orange,
    lineWidth: 1.2,
    radius: "rounded-2xl",
  });
  addText(slide, "Identidad para la brecha", {
    left: 669,
    top: 225,
    width: 513,
    height: 31,
    fontSize: 21,
    color: "#C96C0D",
    bold: true,
  });
  addFormula(
    slide,
    "G₀ = Qₙ⁰ − Qₐ⁰\nG꜀ = Qₙᶜ − Qₐᶜ",
    {
      left: 669,
      top: 274,
      width: 513,
      height: 88,
      fontSize: 27,
      color: COLORS.ink,
      fill: COLORS.white,
      lineFill: "#FFD7AD",
      radius: "rounded-xl",
    },
  );
  addText(slide, "Restando ambas brechas:", {
    left: 691,
    top: 385,
    width: 469,
    height: 25,
    fontSize: 15,
    color: COLORS.muted,
  });
  addFormula(slide, "G꜀ − G₀ = Δₙ − Δₐ", {
    left: 699,
    top: 426,
    width: 453,
    height: 68,
    fontSize: 30,
    color: COLORS.coral,
    fill: COLORS.coralSoft,
    lineFill: COLORS.coral,
    radius: "rounded-xl",
    bold: true,
  });
  addText(
    slide,
    "Si Δₙ > Δₐ, el contexto mejora ambos grupos, pero amplía la brecha de ambigüedad. Es señal de que falta inferir Z o preguntar.",
    {
      left: 691,
      top: 514,
      width: 469,
      height: 65,
      fontSize: 15,
      color: COLORS.muted,
      alignment: "center",
      verticalAlignment: "middle",
    },
  );
  addFooter(slide, {
    number: 35,
    source: "Reexpresión algebraica de la evidencia agregada del deck · interpretación no causal",
  });
  addNote(slide, sourceDeckName, 34, [
    "Su & Cardie (2026), evidencia agregada citada en el deck fuente.",
  ]);
  return slide;
}

export function appendConclusionsAndAnnexes(
  presentation,
  orderedSlides,
  {
    sourceDeckName = "Context_Engineering_y_Ambiguedad_profesional.pptx",
  } = {},
) {
  const additions = [
    buildConclusionSlide(presentation, sourceDeckName),
    buildAnnexDivider(presentation, sourceDeckName),
    buildBayesSlide(presentation, sourceDeckName),
    buildInformationSlide(presentation, sourceDeckName),
    buildDecisionSlide(presentation, sourceDeckName),
    buildRagSensitivitySlide(presentation, sourceDeckName),
    buildLocalEntropySlide(presentation, sourceDeckName),
    buildDensitySlide(presentation, sourceDeckName),
    buildLimitSlide(presentation, sourceDeckName),
    buildEvidenceSlide(presentation, sourceDeckName),
  ];

  for (const slide of additions) {
    orderedSlides.push(slide);
    slide.moveTo(orderedSlides.length - 1);
  }
  return additions;
}
