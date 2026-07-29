// Reorganización validada de la relación matemática entre las fórmulas 6 y 7.
const COLORS = {
  ink: "#111827",
  muted: "#667085",
  bg: "#F7F8FC",
  white: "#FFFFFF",
  line: "#D9DEEA",
  violet: "#6C63FF",
  violetSoft: "#EEECFF",
  turquoise: "#33D6C8",
  turquoiseSoft: "#E3F9F6",
  coral: "#FF647C",
  green: "#49C986",
  tealText: "#0E4A5A",
};

function area(row) {
  const [left = 0, top = 0, width = 0, height = 0] = row?.bbox ?? [];
  void left;
  void top;
  return Math.abs(width * height);
}

function addText(slide, text, {
  name,
  left,
  top,
  width,
  height,
  fontSize = 16,
  color = COLORS.ink,
  bold = false,
  alignment = "left",
  verticalAlignment = "middle",
  fill = "none",
  lineFill = "none",
  lineWidth = 0,
  radius,
}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    name,
    position: { left, top, width, height },
    fill,
    line: { style: "solid", fill: lineFill, width: lineWidth },
    ...(radius ? { borderRadius: radius } : {}),
  });
  shape.text = text;
  shape.text.style = {
    fontSize,
    color,
    bold,
    alignment,
    verticalAlignment,
    typeface: "Aptos",
    autoFit: "shrinkText",
    wrap: "square",
    insets: { top: 2, right: 3, bottom: 2, left: 3 },
    lineSpacing: 1,
  };
  return shape;
}

function addTag(slide, text, {
  name,
  left,
  top,
  width,
  accent = COLORS.violet,
  fill = COLORS.violetSoft,
}) {
  const tag = slide.shapes.add({
    geometry: "roundRect",
    name: `${name}-surface`,
    position: { left, top, width, height: 28 },
    fill,
    line: { style: "solid", fill: accent, width: 1 },
    borderRadius: "rounded-full",
  });
  addText(slide, text, {
    name,
    left: left + 6,
    top: top + 3,
    width: width - 12,
    height: 22,
    fontSize: 12,
    color: accent,
    bold: true,
    alignment: "center",
  });
  return tag;
}

function setText(shape, text, position, style) {
  shape.text = text;
  shape.position = position;
  shape.text.style = {
    fontSize: style.fontSize,
    color: style.color,
    bold: style.bold ?? false,
    alignment: style.alignment ?? "left",
    verticalAlignment: style.verticalAlignment ?? "middle",
    typeface: style.typeface ?? "Aptos",
    autoFit: "shrinkText",
    wrap: "square",
    insets: style.insets ?? { top: 2, right: 3, bottom: 2, left: 3 },
    lineSpacing: style.lineSpacing ?? 1,
  };
}

function findRow(rows, slide, predicate, description) {
  const row = rows.find((entry) => entry.slide === slide && predicate(entry));
  if (!row) throw new Error(`No se encontró ${description} en la diapositiva ${slide}.`);
  return row;
}

function resolveText(presentation, rows, slide, startsWith) {
  const row = findRow(
    rows,
    slide,
    (entry) => entry.kind === "textbox" && entry.text?.startsWith(startsWith),
    `el texto «${startsWith}»`,
  );
  return presentation.resolve(row.id);
}

function resolveImageByName(presentation, rows, slide, name) {
  const row = findRow(
    rows,
    slide,
    (entry) => entry.kind === "image" && entry.name === name,
    `la imagen ${name}`,
  );
  return presentation.resolve(row.id);
}

export async function organizeSlides6And7(presentation) {
  const inspection = await presentation.inspect({
    kind: "slide,textbox,shape,image,notes,layout",
    include:
      "id,slide,name,title,text,textPreview,textChars,textLines,bbox,bboxUnit,isPlaceholder,placeholders",
    maxChars: 400000,
  });
  const rows = inspection.ndjson
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  // -----------------------------------------------------------------------
  // Diapositiva 6: la primera fórmula produce cada factor; la segunda los
  // multiplica para obtener la probabilidad de la respuesta completa.
  // -----------------------------------------------------------------------
  const slide6Row = findRow(rows, 6, (entry) => entry.kind === "slide", "la diapositiva");
  const slide6 = presentation.resolve(slide6Row.id);
  const slide6Title = resolveText(
    presentation,
    rows,
    6,
    "El contexto redistribuye la probabilidad",
  );
  setText(
    slide6Title,
    "La probabilidad de una respuesta se construye token a token",
    { left: 72, top: 72, width: 1136, height: 116 },
    { fontSize: 40, color: COLORS.ink, bold: true, verticalAlignment: "middle" },
  );

  const tokenFormula = resolveImageByName(
    presentation,
    rows,
    6,
    "Ecuación s05_token",
  );
  tokenFormula.position = { left: 72, top: 252, width: 480, height: 76 };

  const sequenceFormula = resolveImageByName(
    presentation,
    rows,
    6,
    "Ecuación s05_sequence",
  );
  sequenceFormula.position = { left: 680, top: 256, width: 420, height: 70 };

  addTag(slide6, "1 · SIGUIENTE TOKEN", {
    name: "slide6-step1",
    left: 72,
    top: 214,
    width: 168,
    accent: COLORS.violet,
    fill: COLORS.violetSoft,
  });
  addTag(slide6, "2 · RESPUESTA COMPLETA", {
    name: "slide6-step2",
    left: 680,
    top: 214,
    width: 204,
    accent: "#168E83",
    fill: COLORS.turquoiseSoft,
  });

  // El conector se crea antes que las explicaciones para permanecer detrás.
  slide6.shapes.add({
    geometry: "rightArrow",
    name: "slide6-token-to-sequence",
    position: { left: 579, top: 272, width: 62, height: 34 },
    fill: "#B9C0D4",
    line: { style: "solid", fill: "#A5AEC4", width: 1 },
  });
  addText(slide6, "repetir para t=1…T", {
    name: "slide6-connector-label",
    left: 548,
    top: 307,
    width: 124,
    height: 24,
    fontSize: 12,
    color: COLORS.muted,
    alignment: "center",
  });
  addText(
    slide6,
    "Calcula la probabilidad de yₜ usando la consulta X, el contexto C y los tokens anteriores y<ₜ.",
    {
      name: "slide6-step1-explanation",
      left: 72,
      top: 335,
      width: 500,
      height: 38,
      fontSize: 15,
      color: COLORS.muted,
    },
  );
  addText(
    slide6,
    "Repite el mismo cálculo en cada posición y multiplica todos los factores.",
    {
      name: "slide6-step2-explanation",
      left: 680,
      top: 335,
      width: 480,
      height: 38,
      fontSize: 15,
      color: COLORS.muted,
    },
  );

  const bridgeText = resolveText(presentation, rows, 6, "El contexto aporta cuando");
  setText(
    bridgeText,
    "Conexión: la primera fórmula genera cada factor; la segunda combina esos factores para puntuar la respuesta Y.",
    { left: 180, top: 380, width: 920, height: 42 },
    {
      fontSize: 18,
      color: COLORS.tealText,
      bold: true,
      alignment: "center",
      verticalAlignment: "middle",
    },
  );

  const slide6Shapes = rows
    .filter((entry) => entry.slide === 6 && entry.kind === "shape")
    .sort((a, b) => area(b) - area(a));
  const exampleCard = presentation.resolve(slide6Shapes[0].id);
  exampleCard.position = { left: 72, top: 436, width: 1136, height: 166 };

  const examplePillSurface = presentation.resolve(
    findRow(
      rows,
      6,
      (entry) =>
        entry.kind === "shape" &&
        entry.bbox?.[2] === 100 &&
        entry.bbox?.[3] === 30,
      "la superficie de la etiqueta EJEMPLO",
    ).id,
  );
  examplePillSurface.position = { left: 96, top: 500, width: 100, height: 30 };

  const examplePillText = resolveText(presentation, rows, 6, "EJEMPLO");
  setText(
    examplePillText,
    "EJEMPLO",
    { left: 108, top: 504, width: 76, height: 22 },
    {
      fontSize: 12,
      color: COLORS.turquoise,
      bold: true,
      alignment: "center",
    },
  );

  const query = resolveText(presentation, rows, 6, "Consulta:");
  setText(
    query,
    "Consulta: «¿Cuánto dura la garantía?»",
    { left: 96, top: 455, width: 390, height: 30 },
    { fontSize: 16, color: COLORS.tealText, bold: true },
  );

  const noContextLabel = resolveText(presentation, rows, 6, "Sin contrato");
  setText(
    noContextLabel,
    "Sin contrato",
    { left: 500, top: 452, width: 170, height: 28 },
    { fontSize: 16, color: COLORS.muted, bold: true, alignment: "center" },
  );
  const noContextValue = resolveText(presentation, rows, 6, "“12 meses”");
  setText(
    noContextValue,
    "“12 meses”",
    { left: 500, top: 480, width: 170, height: 48 },
    { fontSize: 27, color: COLORS.coral, bold: true, alignment: "center" },
  );

  const contextLabel = resolveText(presentation, rows, 6, "Con contrato");
  setText(
    contextLabel,
    "Con contrato",
    { left: 790, top: 452, width: 170, height: 28 },
    { fontSize: 16, color: COLORS.muted, bold: true, alignment: "center" },
  );
  const contextValue = resolveText(presentation, rows, 6, "“24 meses”");
  setText(
    contextValue,
    "“24 meses”",
    { left: 790, top: 480, width: 180, height: 48 },
    { fontSize: 27, color: COLORS.green, bold: true, alignment: "center" },
  );

  const comparisonLine = presentation.resolve(
    findRow(
      rows,
      6,
      (entry) =>
        entry.kind === "shape" &&
        entry.bbox?.[2] === 55 &&
        entry.bbox?.[3] === 0,
      "la línea comparativa del ejemplo",
    ).id,
  );
  comparisonLine.position = { left: 692, top: 505, width: 68, height: 0 };

  const exampleFormula = resolveImageByName(
    presentation,
    rows,
    6,
    "Ecuación s05_example",
  );
  exampleFormula.position = { left: 500, top: 548, width: 470, height: 38 };

  const slide6Notation = resolveText(presentation, rows, 6, "Notación · θ");
  setText(
    slide6Notation,
    "Notación · θ parámetros · yₜ token actual · y<ₜ prefijo · X consulta · C contrato · Y respuesta completa",
    { left: 72, top: 618, width: 1050, height: 28 },
    { fontSize: 14, color: COLORS.violet, bold: true },
  );

  // -----------------------------------------------------------------------
  // Diapositiva 7: la desigualdad expresa el efecto de C y la resta lo mide.
  // -----------------------------------------------------------------------
  const slide7Row = findRow(rows, 7, (entry) => entry.kind === "slide", "la diapositiva");
  const slide7 = presentation.resolve(slide7Row.id);
  const slide7Title = resolveText(
    presentation,
    rows,
    7,
    "El contexto vale por la incertidumbre",
  );
  setText(
    slide7Title,
    "La información aportada por C es la entropía que logra reducir",
    { left: 72, top: 72, width: 1136, height: 70 },
    { fontSize: 38, color: COLORS.ink, bold: true, verticalAlignment: "middle" },
  );

  const entropyFormula = resolveImageByName(
    presentation,
    rows,
    7,
    "Ecuación s06_entropy",
  );
  entropyFormula.position = { left: 72, top: 230, width: 616.38, height: 74 };

  const mutualFormula = resolveImageByName(
    presentation,
    rows,
    7,
    "Ecuación s06_mutual",
  );
  mutualFormula.position = { left: 72, top: 394, width: 590.4, height: 46.22 };

  addTag(slide7, "1 · EFECTO DE AÑADIR C", {
    name: "slide7-step1",
    left: 72,
    top: 188,
    width: 198,
    accent: COLORS.violet,
    fill: COLORS.violetSoft,
  });
  addText(
    slide7,
    "La incertidumbre restante con contexto es menor o igual que sin contexto.",
    {
      name: "slide7-step1-explanation",
      left: 72,
      top: 307,
      width: 610,
      height: 34,
      fontSize: 15,
      color: COLORS.muted,
    },
  );

  slide7.shapes.add({
    geometry: "downArrow",
    name: "slide7-effect-to-measure",
    position: { left: 349, top: 337, width: 34, height: 30 },
    fill: "#B9C0D4",
    line: { style: "solid", fill: "#A5AEC4", width: 1 },
  });

  addTag(slide7, "2 · MEDIR LA REDUCCIÓN", {
    name: "slide7-step2",
    left: 72,
    top: 356,
    width: 196,
    accent: "#168E83",
    fill: COLORS.turquoiseSoft,
  });

  const valueText = resolveText(
    presentation,
    rows,
    7,
    "Información mutua condicional",
  );
  setText(
    valueText,
    "Se resta la entropía final a la inicial: esa diferencia es I(Y;C|X).",
    { left: 72, top: 455, width: 640, height: 52 },
    {
      fontSize: 18,
      color: COLORS.tealText,
      bold: true,
      verticalAlignment: "middle",
    },
  );

  const notation = resolveText(presentation, rows, 7, "Notación · H");
  setText(
    notation,
    "Notación · H incertidumbre · I información aportada · X consulta · C contexto · Y respuesta\nLectura: más reducción de H implica más información útil de C sobre Y.",
    { left: 72, top: 530, width: 640, height: 70 },
    {
      fontSize: 14,
      color: COLORS.muted,
      verticalAlignment: "top",
      lineSpacing: 1.05,
    },
  );
  notation.text.get("Notación").bold = true;
  notation.text.get("Notación").fill = COLORS.violet;

  const differenceText = resolveText(
    presentation,
    rows,
    7,
    "La diferencia es información",
  );
  setText(
    differenceText,
    "La barra que desaparece representa la información que C aporta sobre Y.",
    { left: 780, top: 456, width: 370, height: 72 },
    {
      fontSize: 19,
      color: COLORS.ink,
      bold: true,
      verticalAlignment: "middle",
    },
  );

  const slide7Source = resolveText(presentation, rows, 7, "Fuente: context.md");
  setText(
    slide7Source,
    "Fuente: context.md — entropía e información mutua condicional",
    { left: 72, top: 678, width: 1045, height: 20 },
    {
      fontSize: 10,
      color: "#8792AA",
      verticalAlignment: "middle",
    },
  );

  return { slides: [6, 7] };
}
