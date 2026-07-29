#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";
import { appendConclusionsAndAnnexes } from "./conclusiones_anexos_context_engineering.mjs";
import { organizeSlides6And7 } from "./organizar_slides_6_7_context_engineering.mjs";

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    args[token.slice(2)] = argv[index + 1];
    index += 1;
  }
  return args;
}

function parseInventory(ndjson) {
  return ndjson
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function area(row) {
  const bbox = row?.bbox ?? [0, 0, 0, 0];
  return Math.abs((bbox[2] ?? 0) * (bbox[3] ?? 0));
}

async function saveBlobToFile(blob, outputPath) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  if (blob && typeof blob.arrayBuffer === "function") {
    await fs.writeFile(outputPath, Buffer.from(await blob.arrayBuffer()));
    return;
  }
  if (blob instanceof Uint8Array || Buffer.isBuffer(blob)) {
    await fs.writeFile(outputPath, Buffer.from(blob));
    return;
  }
  throw new Error(`No se pudo guardar el blob en ${outputPath}`);
}

const args = parseArgs(process.argv.slice(2));
const input = path.resolve(
  args.input ??
    "C:/BCP/kevin/Context engineering/.codex-tmp/context-engineering-ppt/template-starter.pptx",
);
const output = path.resolve(
  args.output ??
    "C:/BCP/kevin/Context engineering/presentation/Context_Engineering_y_Ambiguedad_profesional_con_anexos.pptx",
);
const qaDir = path.resolve(
  args["qa-dir"] ??
    "C:/BCP/kevin/Context engineering/.codex-tmp/context-engineering-ppt/final-qa",
);

const presentation = await PresentationFile.importPptx(
  await FileBlob.load(input),
);

// La versión histórica contiene ocho líneas con dimensiones negativas. Estas
// reparaciones son idempotentes: solo se aplican cuando la geometría sigue
// siendo inválida, por lo que el mismo generador acepta una plantilla ya limpia.
const legacyLineRepairs = [
  ["sh/utg3698n", { left: 925, top: 180, width: 133, height: 198, verticalFlip: true }],
  ["sh/wn6dc7eh", { left: 925, top: 280, width: 177, height: 98, verticalFlip: true }],
  ["sh/id4ju1oz", { left: 760, top: 430, width: 60, height: 54, verticalFlip: true }],
  ["sh/jedkn654", { left: 820, top: 374, width: 60, height: 56, verticalFlip: true }],
  ["sh/4fm1wb6p", { left: 880, top: 336, width: 60, height: 38, verticalFlip: true }],
  ["sh/nmdg3q54", { left: 1020, top: 359, width: 105, height: 127, horizontalFlip: true }],
  [
    "sh/q18f65cr",
    {
      left: 820,
      top: 293,
      width: 130,
      height: 59,
      horizontalFlip: true,
      verticalFlip: true,
    },
  ],
  ["sh/65gnqlk7", { left: 350, top: 416, width: 260, height: 60, verticalFlip: true }],
];

let repairedLineCount = 0;
for (const [id, position] of legacyLineRepairs) {
  let element;
  try {
    element = presentation.resolve(id);
  } catch {
    continue;
  }
  const current = element?.position;
  if (!element || !current) continue;
  if ((current.width ?? 0) < 0 || (current.height ?? 0) < 0) {
    element.position = position;
    repairedLineCount += 1;
  }
}

const inspected = await presentation.inspect({
  kind: "slide,textbox,shape,image,chart,notes,layout",
  include:
    "id,slide,name,title,text,textPreview,textChars,textLines,bbox,bboxUnit,isPlaceholder,placeholders",
  maxChars: 300000,
});
const inventory = parseInventory(inspected.ndjson);

function textRow(exactText) {
  const row = inventory.find(
    (entry) => entry.kind === "textbox" && entry.text === exactText,
  );
  if (!row) {
    throw new Error(`No se encontró el texto heredado: ${exactText}`);
  }
  return row;
}

function replaceText(exactText, replacement, options = {}) {
  const row = textRow(exactText);
  const shape = presentation.resolve(row.id);
  shape.text = replacement;
  if (options.position) shape.position = options.position;
  if (options.textStyle) {
    shape.text.style = { ...options.textStyle };
  }
  return shape;
}

replaceText(
  "El Ecosistema Completo de Context Engineering",
  "Context Engineering integra RAG, memoria y herramientas",
);
replaceText(
  "Arquitectura de Context Engineering: Superconjunto que orquesta RAG, Prompt Engineering, gestión de Memoria, Historial de Estado y Formatos Estructurados.",
  "Context Engineering orquesta RAG, memoria, herramientas, historial y formatos estructurados.",
);

replaceText(
  "Consulta (X): «¿Cuánto dura la garantía?»",
  "Consulta: «¿Cuánto dura la garantía?»",
  {
    position: { left: 477, top: 215, width: 402, height: 42 },
    textStyle: {
      fontSize: 18,
      bold: true,
      color: "#0E4A5A",
      alignment: "center",
    },
  },
);
replaceText(
  "Notación · θ parámetros · t posición · yₜ token actual · X consulta («¿Cuánto dura la garantía?») · C contexto (contrato)",
  "Notación · θ parámetros · yₜ token actual · X consulta · C contrato recuperado",
);

replaceText(
  "Modelo Probabilístico DAG de Recuperación-Generación",
  "RAG recupera evidencia antes de generar la respuesta",
);
replaceText(
  "El retriever calcula la probabilidad P(d|q) y el generador P(g|q,d) para producir la respuesta final 'g' condicionada sobre el corpus 'D'.",
  "El sistema marginaliza documentos recuperados y genera la respuesta condicionada a la evidencia.",
);

replaceText(
  "Chain-of-Thought extiende el prefijo y reduce la entropía",
  "CoT reduce entropía, pero puede amplificar errores",
);
replaceText(
  "• Prefijo extendido y<t: Los tokens de razonamiento R=(r₁..rₘ) se incorporan a la historia autoregresiva antes de generar Y.\n\n• Pasos de atención extra: Cada token r_t brinda un paso de cómputo adicional para integrar la evidencia de X y C.",
  "• El razonamiento R amplía el prefijo antes de generar Y.\n\n• Cada paso integra mejor la evidencia de X y C.",
);
replaceText(
  "Cascada de Errores (Error Propagation)\nUn fallo o alucinación en r₁ o r₂ queda fijado en y<t. Por autoconsistencia, el modelo se condiciona a justificar una respuesta final errónea.",
  "Cascada de errores\nUn error temprano puede fijarse en el prefijo y condicionar la respuesta final.",
);
replaceText(
  "Overthinking y Ruido en el Contexto\nUn razonamiento excesivamente largo infla |C|, inyectando ruido N(C) y reduciendo la densidad de señal útil por token I(Y;C|X)/|C|.",
  "Overthinking y ruido\nMás tokens pueden diluir la señal útil e introducir contexto irrelevante.",
);
replaceText(
  "CoT maximiza la probabilidad en tareas complejas descomponiendo la inferencia, pero no resuelve la ambigüedad original si la consulta X es indeterminada.",
  "CoT ayuda a inferir; no resuelve una intención ambigua.",
);
replaceText(
  "Notación · X consulta · C contexto · R tokens de razonamiento · Y respuesta final · H entropía condicional · N ruido en el prompt",
  "Notación · X consulta · C contexto · R razonamiento · Y respuesta · H entropía",
);

replaceText(
  '1. Ironía y Sarcasmo\nInversión de la polaridad semántica literal.\nX: "Qué gran servicio..." (esperando 3 semanas) → Z: Reclamo',
  "1. Ironía y sarcasmo\n«Qué gran servicio…» → reclamo, no elogio.",
);
replaceText(
  '2. Actos de Habla Indirectos\nPeticiones de acción formuladas como preguntas de habilidad.\nX: "¿Tienes el saldo disponible?" → Z: Comando de consulta',
  "2. Actos de habla indirectos\n«¿Tienes saldo?» → consulta, no habilidad.",
);
replaceText(
  '3. Elipsis y Co-referencia\nOmisión de información que se asume conocida por el contexto.\nX: "Haz lo mismo con la otra" → Z: Aplicar acción al historial',
  "3. Elipsis y correferencia\n«Haz lo mismo con la otra» → resolver el referente en el historial.",
);
replaceText(
  '4. Modismos y Lenguaje Figurado\nSemántica no composicional y modismos locales.\nX: "Se me cayó el sistema" → Z: Reporte de fallo técnico',
  "4. Modismos\n«Se cayó el sistema» → incidente, no caída física.",
);
replaceText(
  "Al igual que la ambigüedad matemática, estos desafíos requieren que el sistema infiera una intención latente Z a partir de una consulta X que no describe literalmente la acción esperada.",
  "La intención se infiere: la consulta literal no siempre describe la acción esperada.",
);
replaceText(
  "Notación · X consulta observable del usuario · Z intención latente real que el agente debe resolver para actuar correctamente",
  "Notación · X consulta observable · Z intención latente",
);

replaceText(
  "Aclarar reduce entropía sobre la intención",
  "Aclarar reduce la incertidumbre de intención",
);
replaceText(
  "“¿Te refieres a la ventana de contexto del LLM o a la memoria persistente del agente?”",
  "Pregunta clave:\n«¿Te refieres a la ventana del LLM o a la memoria del agente?»",
);
replaceText(
  "Notación · q pregunta · A_q respuesta · Z intención · I información ganada",
  "Notación · q pregunta · Z intención · I ganancia de información",
);

replaceText(
  "La evidencia confirma la brecha: saber no implica preguntar",
  "El contexto mejora QA, pero casi no induce aclaración",
);
replaceText(
  "{Caso de uso}  ·  {Política de riesgo}  ·  {Umbral de ambigüedad}",
  "Caso de negocio · Tolerancia al error · Umbral de ambigüedad",
);

// Reemplazo del diagrama raster de clarificación por un flujo causal nativo,
// delimitado por el mismo marco heredado.
const slide22 = presentation.resolve(
  inventory.find((entry) => entry.kind === "slide" && entry.slide === 22).id,
);
const slide22Image = inventory
  .filter((entry) => entry.kind === "image" && entry.slide === 22)
  .sort((a, b) => area(b) - area(a))[0];
presentation.resolve(slide22Image.id).delete();

const flowX = [102, 230, 358, 486];
for (const arrowLeft of [216, 344, 472]) {
  slide22.shapes.add({
    geometry: "rightArrow",
    position: { left: arrowLeft, top: 374, width: 18, height: 24 },
    fill: "#4E96A3",
    line: { style: "solid", fill: "#4E96A3", width: 1 },
  });
}

const flowNodes = [
  { text: "Consulta\nq", fill: "#E8F4F6", line: "#4E96A3", color: "#0E2841" },
  { text: "Intención\nZ", fill: "#FFF1E8", line: "#E97132", color: "#0E2841" },
  {
    text: "Pregunta\nclarificadora",
    fill: "#EEF7EE",
    line: "#5D8C5A",
    color: "#0E2841",
  },
  {
    text: "Respuesta\ncon evidencia",
    fill: "#0E4A5A",
    line: "#0E4A5A",
    color: "#FFFFFF",
  },
];

for (let index = 0; index < flowNodes.length; index += 1) {
  const config = flowNodes[index];
  const node = slide22.shapes.add({
    geometry: "roundRect",
    position: { left: flowX[index], top: 345, width: 118, height: 82 },
    fill: config.fill,
    line: { style: "solid", fill: config.line, width: 1.5 },
    borderRadius: "rounded-xl",
    shadow: "shadow-sm",
  });
  node.text = config.text;
  node.text.style = {
    fontSize: 15,
    bold: true,
    color: config.color,
    alignment: "center",
  };
}

// Reemplazo del raster de evidencia por un gráfico editable y legible.
const slide24 = presentation.resolve(
  inventory.find((entry) => entry.kind === "slide" && entry.slide === 24).id,
);
const slide24Image = inventory
  .filter((entry) => entry.kind === "image" && entry.slide === 24)
  .sort((a, b) => area(b) - area(a))[0];
presentation.resolve(slide24Image.id).delete();

slide24.charts.add("bar", {
  position: { left: 158, top: 262, width: 525, height: 346 },
  categories: ["No ambigua", "Ambigua"],
  series: [
    {
      name: "Sin contexto",
      values: [54, 46],
      valuesFormatCode: '0"%"',
      fill: "#AFC8CE",
      line: { style: "solid", fill: "#8AABB4", width: 1 },
    },
    {
      name: "Con contexto",
      values: [67, 55],
      valuesFormatCode: '0"%"',
      fill: "#156082",
      line: { style: "solid", fill: "#0E4A5A", width: 1 },
    },
  ],
  barOptions: {
    direction: "bar",
    grouping: "clustered",
    gapWidth: 52,
  },
  hasLegend: true,
  legend: {
    position: "bottom",
    overlay: false,
    textStyle: { fill: "#475569", fontSize: 12 },
  },
  xAxis: {
    visible: true,
    min: 0,
    max: 80,
    majorUnit: 20,
    numberFormatCode: '0"%"',
    textStyle: { fill: "#64748B", fontSize: 11 },
    line: { style: "solid", fill: "#CBD5E1", width: 1 },
    majorGridlines: { style: "solid", fill: "#E2E8F0", width: 1 },
  },
  yAxis: {
    visible: true,
    textStyle: { fill: "#334155", fontSize: 13, bold: true },
    line: { style: "solid", fill: "#CBD5E1", width: 1 },
    majorGridlines: null,
  },
  dataLabels: {
    showValue: true,
    position: "outEnd",
    textStyle: { fill: "#0F172A", fontSize: 12, bold: true },
  },
  chartFill: "#FFFFFF",
  chartLine: { style: "solid", fill: "#FFFFFF", width: 0 },
  plotAreaFill: "#FFFFFF",
  plotAreaLine: { style: "solid", fill: "#FFFFFF", width: 0 },
});

// Las fórmulas de las diapositivas 6 y 7 se convierten en secuencias
// pedagógicas: factor por token -> producto de la secuencia, y efecto sobre la
// entropía -> medida de la reducción.
await organizeSlides6And7(presentation);

// Notas: cada diapositiva queda trazable al deck fuente; se agregan las
// referencias técnicas primarias solo donde aportan al contenido.
const sourceDeckName = path.basename(input);
const slideRecords = inventory
  .filter((entry) => entry.kind === "slide")
  .sort((a, b) => a.slide - b.slide);

const technicalSources = {
  5: [
    "Shannon, C. E. (1948), A Mathematical Theory of Communication. https://doi.org/10.1002/j.1538-7305.1948.tb01338.x",
  ],
  6: [
    "Shannon, C. E. (1948), A Mathematical Theory of Communication. https://doi.org/10.1002/j.1538-7305.1948.tb01338.x",
  ],
  7: [
    "Shannon, C. E. (1948), A Mathematical Theory of Communication. https://doi.org/10.1002/j.1538-7305.1948.tb01338.x",
  ],
  9: [
    "Lewis, P. et al. (2020), Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. https://arxiv.org/abs/2005.11401",
  ],
  10: [
    "Lewis, P. et al. (2020), Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. https://arxiv.org/abs/2005.11401",
  ],
  11: [
    "Lewis, P. et al. (2020), Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. https://arxiv.org/abs/2005.11401",
  ],
  13: [
    "Wei, J. et al. (2022), Chain-of-Thought Prompting Elicits Reasoning in Large Language Models. https://arxiv.org/abs/2201.11903",
  ],
};

for (const record of slideRecords) {
  const slide = presentation.resolve(record.id);
  const lines = [
    "[Sources]",
    `- Deck fuente: ${sourceDeckName}, diapositiva ${record.slide}.`,
    ...(technicalSources[record.slide] ?? []).map((source) => `- ${source}`),
  ];
  slide.speakerNotes.textFrame.setText(lines.join("\n"));
  slide.speakerNotes.setVisible(true);
}

// Fijar la secuencia visible evita que el exportador reordene las partes
// heredadas por su identificador interno.
const originalSlides = [...presentation.slides.items];
const orderedSlides = slideRecords.map((record) => {
  const slide = presentation.resolve(record.id);
  if (!slide) throw new Error(`No se encontró la diapositiva ${record.slide}`);
  return slide.duplicate();
});
for (const slide of originalSlides) slide.delete();
for (let index = 0; index < orderedSlides.length; index += 1) {
  orderedSlides[index].moveTo(index);
}

// La diapositiva 26 cierra el cuerpo principal. Después se agrega un separador
// de anexos y ocho láminas de derivación simbólica, sin cálculos numéricos.
appendConclusionsAndAnnexes(presentation, orderedSlides, {
  sourceDeckName,
});

await fs.mkdir(output.substring(0, output.lastIndexOf(path.sep)), {
  recursive: true,
});
await fs.mkdir(path.join(qaDir, "render"), { recursive: true });
await fs.mkdir(path.join(qaDir, "layout"), { recursive: true });

for (let index = 0; index < orderedSlides.length; index += 1) {
  const padded = String(index + 1).padStart(2, "0");
  const preview = await presentation.export({
    slide: orderedSlides[index],
    format: "png",
    scale: 1,
  });
  await saveBlobToFile(
    preview,
    path.join(qaDir, "render", `slide-${padded}.png`),
  );

  const layout = await presentation.export({
    slide: orderedSlides[index],
    format: "layout",
  });
  await saveBlobToFile(
    layout,
    path.join(qaDir, "layout", `slide-${padded}.layout.json`),
  );
}

const finalInspection = await presentation.inspect({
  kind: "slide,textbox,shape,image,chart,notes,layout",
  include:
    "id,slide,name,title,text,textPreview,textChars,textLines,bbox,bboxUnit,isPlaceholder,placeholders",
  maxChars: 350000,
});
await fs.writeFile(
  path.join(qaDir, "final-inspect.ndjson"),
  finalInspection.ndjson,
  "utf8",
);

const pptx = await PresentationFile.exportPptx(presentation);
await pptx.save(output);
const stat = await fs.stat(output);

console.log(
  JSON.stringify(
    {
      input,
      output,
      outputBytes: stat.size,
      slideCount: orderedSlides.length,
      repairedLineCount,
      qaDir,
    },
    null,
    2,
  ),
);
