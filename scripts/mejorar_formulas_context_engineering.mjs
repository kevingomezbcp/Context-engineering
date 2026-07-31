#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { FileBlob, PresentationFile } from "@oai/artifact-tool";

let MATH_ASSETS = new Map();

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

const SOURCES = {
  survey:
    "Mei et al. (2025), A Survey of Context Engineering for Large Language Models, arXiv:2507.13334v2. https://arxiv.org/abs/2507.13334",
  rateDistortion:
    "Nagle et al. (2024), Fundamental Limits of Prompt Compression: A Rate-Distortion Framework for Black-Box Language Models, NeurIPS 2024. https://proceedings.neurips.cc/paper/2024/hash/ac8fbba029dadca99d6b8c3f913d3ed6-Abstract-Conference.html",
  rag:
    "Lewis et al. (2020), Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. https://arxiv.org/abs/2005.11401",
  attention:
    "Vaswani et al. (2017), Attention Is All You Need. https://arxiv.org/abs/1706.03762",
  cot:
    "Wei et al. (2022), Chain-of-Thought Prompting Elicits Reasoning in Large Language Models. https://arxiv.org/abs/2201.11903",
  shannon:
    "Shannon (1948), A Mathematical Theory of Communication. https://doi.org/10.1002/j.1538-7305.1948.tb01338.x",
  cover:
    "Cover & Thomas (2006), Elements of Information Theory.",
  clarify:
    "Zhang & Choi (2025), Clarify When Necessary: Resolving Ambiguity Through Interaction with LMs, Findings of NAACL 2025. https://aclanthology.org/2025.naacl-findings.306/",
  infoDialog:
    "Deits et al. (2013), Clarifying Commands with Information-Theoretic Human-Robot Dialog. https://people.csail.mit.edu/stefie10/publications/deits13.pdf",
  evidence:
    "Su & Cardie (2026), Knowing but Not Showing: LLMs Recognize Ambiguity but Rarely Ask Clarifying Questions, preprint. https://arxiv.org/abs/2605.25284",
  clam:
    "Kuhn, Gal & Farquhar (2022), CLAM: Selective Clarification for Ambiguous Questions with Generative Language Models. https://arxiv.org/abs/2212.07769",
  decision:
    "Berger (1985), Statistical Decision Theory and Bayesian Analysis.",
};

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

async function saveBlob(blob, outputPath) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, Buffer.from(await blob.arrayBuffer()));
}

function addShape(
  slide,
  {
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
  },
) {
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

function addText(
  slide,
  text,
  {
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
  },
) {
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

function addCard(
  slide,
  {
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
  },
) {
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

function addRule(slide, left, top, width, color, height = 1) {
  return addShape(slide, {
    left,
    top,
    width,
    height,
    fill: color,
    lineFill: color,
  });
}

function addPill(
  slide,
  text,
  { left, top, width, fill, color, lineFill = fill },
) {
  addCard(slide, {
    left,
    top,
    width,
    height: 30,
    fill,
    lineFill,
    lineWidth: 1,
    radius: "rounded-full",
  });
  return addText(slide, text, {
    left: left + 6,
    top: top + 4,
    width: width - 12,
    height: 22,
    fontSize: 12,
    color,
    bold: true,
    alignment: "center",
    verticalAlignment: "middle",
  });
}

function addFormula(
  slide,
  text,
  {
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
  },
) {
  const asset = MATH_ASSETS.get(text);
  if (!asset) {
    throw new Error(
      `No existe un PNG MathText para la fórmula: ${JSON.stringify(text)}`,
    );
  }

  if (fill !== "none" || lineFill !== "none") {
    addCard(slide, {
      left,
      top,
      width,
      height,
      fill,
      lineFill,
      lineWidth: lineFill === "none" ? 0 : 1,
      radius,
    });
  }

  const paddingX = fill !== "none" || lineFill !== "none" ? 16 : 4;
  const paddingY = fill !== "none" || lineFill !== "none" ? 10 : 2;
  const available = {
    left: left + paddingX,
    top: top + paddingY,
    width: Math.max(1, width - paddingX * 2),
    height: Math.max(1, height - paddingY * 2),
  };
  const scale = Math.min(
    available.width / asset.width,
    available.height / asset.height,
  );
  const imageWidth = asset.width * scale;
  const imageHeight = asset.height * scale;
  const imageLeft =
    alignment === "left"
      ? available.left
      : alignment === "right"
        ? available.left + available.width - imageWidth
        : available.left + (available.width - imageWidth) / 2;
  const imageTop = available.top + (available.height - imageHeight) / 2;

  return slide.images.add({
    blob: asset.blob,
    contentType: "image/png",
    alt: `Ecuación MathText: ${text.replaceAll("\n", " ")}`,
    name: `MathText ${asset.id}`,
    fit: "contain",
    position: {
      left: imageLeft,
      top: imageTop,
      width: imageWidth,
      height: imageHeight,
    },
  });
}

async function loadMathAssets(mathDir) {
  const indexPath = path.join(mathDir, "mathtext-index.json");
  const index = JSON.parse(await fs.readFile(indexPath, "utf8"));
  const loaded = new Map();

  for (const entry of index) {
    const bytes = await fs.readFile(path.join(mathDir, entry.file));
    const blob = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    );
    loaded.set(entry.text, {
      id: entry.id,
      width: entry.width,
      height: entry.height,
      blob,
    });
  }

  MATH_ASSETS = loaded;
}

function addArrow(slide, left, top, width = 28, height = 24, fill = "#7E8AA8") {
  return addShape(slide, {
    geometry: "rightArrow",
    left,
    top,
    width,
    height,
    fill,
    lineFill: fill,
    lineWidth: 1,
  });
}

async function getLayout(slide) {
  const blob = await slide.export({ format: "layout" });
  return JSON.parse(await blob.text());
}

async function clearBody(presentation, slide, top = 172, bottom = 662) {
  // Los gráficos importados no siempre se resuelven mediante su AID como una
  // shape normal. Eliminarlos por ID evita conservar un chart heredado debajo
  // del nuevo y previene leyendas/series duplicadas.
  for (const chart of [...slide.charts.items]) {
    slide.charts.deleteById(chart.id);
  }
  const layout = await getLayout(slide);
  const targets = layout.elements
    .filter((element) => {
      if (!element.aid || !element.bbox) return false;
      const [, y, , h] = element.bbox;
      const centerY = y + h / 2;
      return centerY >= top && centerY <= bottom;
    })
    .reverse();
  for (const element of targets) {
    try {
      presentation.resolve(element.aid).delete();
    } catch {
      // El elemento puede haber sido eliminado junto con un grupo heredado.
    }
  }
}

async function rewriteChrome(
  presentation,
  slide,
  { number, kicker, title, footer, dark = false, titleSize = 38 },
) {
  const layout = await getLayout(slide);
  const elements = layout.elements.filter(
    (element) => element.aid && element.bbox && typeof element.text === "string",
  );

  const kickerElement = elements
    .filter((element) => element.bbox[1] < 70 && element.text.trim())
    .sort((a, b) => a.bbox[1] - b.bbox[1])[0];
  const titleElement = elements
    .filter(
      (element) =>
        element.bbox[1] >= 68 &&
        element.bbox[1] < 155 &&
        element.bbox[2] > 600 &&
        element.text.trim(),
    )
    .sort((a, b) => b.bbox[2] * b.bbox[3] - a.bbox[2] * a.bbox[3])[0];
  const footerElement = elements
    .filter(
      (element) =>
        element.bbox[1] >= 660 &&
        element.bbox[0] < 1120 &&
        element.text.trim(),
    )
    .sort((a, b) => b.bbox[2] - a.bbox[2])[0];
  const pageElement = elements
    .filter(
      (element) =>
        element.bbox[1] >= 660 &&
        element.bbox[0] >= 1120 &&
        element.text.trim(),
    )
    .sort((a, b) => b.bbox[0] - a.bbox[0])[0];

  if (kickerElement) {
    const shape = presentation.resolve(kickerElement.aid);
    shape.text = kicker;
    shape.text.style = {
      fontSize: 14,
      bold: true,
      color: dark ? COLORS.turquoise : COLORS.violet,
      typeface: "Aptos",
      autoFit: "shrinkText",
      verticalAlignment: "middle",
    };
  }
  if (titleElement) {
    const shape = presentation.resolve(titleElement.aid);
    shape.text = title;
    shape.text.style = {
      fontSize: titleSize,
      bold: true,
      color: dark ? COLORS.white : COLORS.ink,
      typeface: "Aptos Display",
      autoFit: "shrinkText",
      verticalAlignment: "middle",
      lineSpacing: 0.92,
    };
  }
  if (footerElement) {
    const shape = presentation.resolve(footerElement.aid);
    shape.text = footer;
    shape.text.style = {
      fontSize: 10,
      color: dark ? "#9AA6C4" : "#8792AA",
      typeface: "Aptos",
      autoFit: "shrinkText",
      verticalAlignment: "middle",
    };
  }
  if (pageElement) {
    const shape = presentation.resolve(pageElement.aid);
    shape.text = String(number).padStart(2, "0");
    shape.text.style = {
      fontSize: 11,
      bold: true,
      color: dark ? COLORS.lightMuted : "#7B879F",
      alignment: "right",
      typeface: "Aptos",
      verticalAlignment: "middle",
    };
  }
}

function setNotes(slide, classification, sources = []) {
  const lines = [
    "[Sources]",
    `- Clasificación: ${classification}.`,
    ...sources.map((source) => `- ${source}`),
  ];
  slide.speakerNotes.textFrame.setText(lines.join("\n"));
  slide.speakerNotes.setVisible(true);
}

function buildSlide4(slide) {
  addFormula(
    slide,
    "C = { c_instr , c_know , c_tools , c_mem , c_state , c_query }",
    {
      left: 165,
      top: 186,
      width: 950,
      height: 72,
      fontSize: 31,
      color: COLORS.violet,
      fill: COLORS.white,
      lineFill: "#D7D2FF",
      radius: "rounded-xl",
    },
  );
  const items = [
    ["INSTRUCCIONES", "reglas y objetivos", COLORS.violet, COLORS.violetSoft],
    ["CONOCIMIENTO", "evidencia recuperada", COLORS.turquoise, COLORS.turquoiseSoft],
    ["HERRAMIENTAS", "funciones disponibles", COLORS.orange, COLORS.orangeSoft],
    ["MEMORIA", "información persistente", COLORS.green, COLORS.greenSoft],
    ["ESTADO", "usuario, mundo y agentes", COLORS.coral, COLORS.coralSoft],
    ["CONSULTA", "petición inmediata", "#4E96A3", "#E8F4F6"],
  ];
  for (let index = 0; index < items.length; index += 1) {
    const [label, body, accent, fill] = items[index];
    const col = index % 3;
    const row = Math.floor(index / 3);
    const left = 72 + col * 382;
    const top = 302 + row * 142;
    addCard(slide, {
      left,
      top,
      width: 350,
      height: 112,
      fill,
      lineFill: accent,
      lineWidth: 1.2,
    });
    addText(slide, label, {
      left: left + 20,
      top: top + 18,
      width: 310,
      height: 28,
      fontSize: 15,
      color: accent,
      bold: true,
    });
    addText(slide, body, {
      left: left + 20,
      top: top + 54,
      width: 310,
      height: 36,
      fontSize: 17,
      color: COLORS.ink,
    });
  }
}

function buildSlide5(slide) {
  addText(slide, "OBJETIVO DEL SURVEY", {
    left: 72,
    top: 205,
    width: 420,
    height: 28,
    fontSize: 15,
    color: COLORS.turquoise,
    bold: true,
  });
  addFormula(
    slide,
    "F* = arg max_F  𝔼_{τ~T}\n[ Reward(Pθ(Y | C_F(τ)), Y*τ) ]",
    {
      left: 72,
      top: 245,
      width: 620,
      height: 154,
      fontSize: 31,
      color: COLORS.white,
      alignment: "left",
      fill: "#19213C",
      lineFill: "#36405F",
      radius: "rounded-xl",
    },
  );
  addFormula(slide, "|C| ≤ Lmax", {
    left: 72,
    top: 425,
    width: 300,
    height: 74,
    fontSize: 35,
    color: COLORS.turquoise,
    fill: "#18263C",
    lineFill: COLORS.turquoise,
    radius: "rounded-xl",
  });
  addText(
    slide,
    "Maximizar calidad esperada y tratar la longitud como una restricción explícita.",
    {
      left: 72,
      top: 522,
      width: 620,
      height: 62,
      fontSize: 20,
      color: COLORS.lightMuted,
      lineSpacing: 1.05,
    },
  );

  addText(slide, "QUÉ OPTIMIZA F", {
    left: 756,
    top: 205,
    width: 410,
    height: 28,
    fontSize: 15,
    color: COLORS.orange,
    bold: true,
  });
  const actions = [
    ["GENERAR", "crear instrucciones o memoria", COLORS.violet],
    ["RECUPERAR", "buscar conocimiento", COLORS.turquoise],
    ["SELECCIONAR", "conservar lo relevante", COLORS.green],
    ["COMPRIMIR", "reducir longitud con control", COLORS.orange],
  ];
  for (let index = 0; index < actions.length; index += 1) {
    const [label, body, accent] = actions[index];
    const top = 253 + index * 85;
    addCard(slide, {
      left: 756,
      top,
      width: 424,
      height: 66,
      fill: "#242C49",
      lineFill: accent,
      lineWidth: 1.2,
      radius: "rounded-xl",
    });
    addText(slide, label, {
      left: 776,
      top: top + 12,
      width: 130,
      height: 24,
      fontSize: 15,
      color: accent,
      bold: true,
    });
    addText(slide, body, {
      left: 910,
      top: top + 12,
      width: 246,
      height: 38,
      fontSize: 16,
      color: COLORS.white,
    });
  }
  addText(
    slide,
    "La razón información/tokens no es la ecuación del survey.",
    {
      left: 756,
      top: 610,
      width: 424,
      height: 28,
      fontSize: 14,
      color: COLORS.coral,
      bold: true,
      alignment: "center",
    },
  );
}

function buildSlide8(slide) {
  addCard(slide, {
    left: 72,
    top: 196,
    width: 520,
    height: 404,
    fill: COLORS.white,
    lineFill: COLORS.line,
  });
  addPill(slide, "SURVEY · EC. 4 + LÍMITE", {
    left: 96,
    top: 218,
    width: 224,
    fill: COLORS.violetSoft,
    color: COLORS.violet,
    lineFill: COLORS.violet,
  });
  addFormula(
    slide,
    "Retrieve* = arg max  I(Y*; c_know | c_query)\n(sobre la función Retrieve)\n\nlímite global: |C| ≤ Lmax",
    {
      left: 98,
      top: 276,
      width: 468,
      height: 154,
      fontSize: 24,
      color: COLORS.violet,
      fill: "#F8F7FF",
      lineFill: "#D7D2FF",
      radius: "rounded-xl",
    },
  );
  addText(
    slide,
    "Pregunta que responde:\n¿qué evidencia recuperada informa más sobre Y* sin desbordar C?",
    {
      left: 110,
      top: 466,
      width: 442,
      height: 72,
      fontSize: 18,
      color: COLORS.muted,
      alignment: "center",
      lineSpacing: 1.05,
    },
  );

  addCard(slide, {
    left: 626,
    top: 196,
    width: 582,
    height: 404,
    fill: COLORS.white,
    lineFill: COLORS.line,
  });
  addPill(slide, "NEURIPS 2024 · TASA–DISTORSIÓN", {
    left: 650,
    top: 218,
    width: 254,
    fill: COLORS.turquoiseSoft,
    color: "#168E83",
    lineFill: COLORS.turquoise,
  });
  addFormula(
    slide,
    "D*(R) = min  𝔼[d(Y*, Ŷ_M)]\n\nsujeto a  𝔼[len(M)] ≤ R",
    {
      left: 650,
      top: 276,
      width: 534,
      height: 154,
      fontSize: 29,
      color: COLORS.ink,
      fill: COLORS.turquoiseSoft,
      lineFill: COLORS.turquoise,
      radius: "rounded-xl",
    },
  );
  addText(
    slide,
    "Pregunta que responde:\n¿qué degradación mínima es posible a cada longitud?",
    {
      left: 662,
      top: 466,
      width: 510,
      height: 72,
      fontSize: 18,
      color: COLORS.muted,
      alignment: "center",
      lineSpacing: 1.05,
    },
  );
  addText(
    slide,
    "Ambos enfoques separan utilidad y costo; no necesitan convertirlos en un cociente.",
    {
      left: 190,
      top: 620,
      width: 900,
      height: 28,
      fontSize: 18,
      color: COLORS.violet,
      bold: true,
      alignment: "center",
    },
  );
}

function buildSlide9(slide) {
  addFormula(
    slide,
    "pRAG(Y | X) = Σ d∈Dₖ pη(d | X) · Π t=1…T pθ(yₜ | X,d,y<t)",
    {
      left: 112,
      top: 192,
      width: 1056,
      height: 92,
      fontSize: 29,
      color: COLORS.violet,
      fill: COLORS.white,
      lineFill: "#D7D2FF",
      radius: "rounded-xl",
    },
  );
  addArrow(slide, 365, 393, 54, 28, COLORS.violet);
  addArrow(slide, 823, 393, 54, 28, COLORS.violet);
  const nodes = [
    {
      x: 102,
      title: "RETRIEVER",
      body: "asigna pη(d|X)",
      accent: COLORS.turquoise,
    },
    {
      x: 420,
      title: "MARGINALIZACIÓN",
      body: "combina documentos",
      accent: COLORS.violet,
    },
    {
      x: 878,
      title: "GENERADOR",
      body: "factoriza tokens",
      accent: COLORS.orange,
    },
  ];
  for (const node of nodes) {
    addCard(slide, {
      left: node.x,
      top: 342,
      width: node.x === 420 ? 350 : 250,
      height: 126,
      fill: COLORS.white,
      lineFill: node.accent,
      lineWidth: 1.4,
    });
    addText(slide, node.title, {
      left: node.x + 18,
      top: 366,
      width: node.x === 420 ? 314 : 214,
      height: 28,
      fontSize: 15,
      color: node.accent,
      bold: true,
      alignment: "center",
    });
    addText(slide, node.body, {
      left: node.x + 18,
      top: 406,
      width: node.x === 420 ? 314 : 214,
      height: 32,
      fontSize: 18,
      color: COLORS.ink,
      alignment: "center",
    });
  }
  addText(
    slide,
    "Lewis et al. marginalizan evidencia recuperada; no multiplican dos porcentajes ilustrativos.",
    {
      left: 170,
      top: 526,
      width: 940,
      height: 50,
      fontSize: 20,
      color: COLORS.violet,
      bold: true,
      alignment: "center",
      verticalAlignment: "middle",
    },
  );
}

function buildSlide10(slide) {
  addCard(slide, {
    left: 72,
    top: 190,
    width: 530,
    height: 386,
    fill: "#F3F5FA",
    lineFill: COLORS.line,
  });
  addText(slide, "RAG", {
    left: 98,
    top: 214,
    width: 120,
    height: 32,
    fontSize: 22,
    color: COLORS.violet,
    bold: true,
  });
  addFormula(slide, "c_know = Retrieve(X,D)", {
    left: 98,
    top: 270,
    width: 478,
    height: 74,
    fontSize: 28,
    color: COLORS.ink,
    fill: COLORS.white,
    lineFill: COLORS.line,
    radius: "rounded-xl",
  });
  addText(
    slide,
    "Su función principal es recuperar conocimiento externo relevante para la consulta.",
    {
      left: 104,
      top: 382,
      width: 466,
      height: 96,
      fontSize: 19,
      color: COLORS.muted,
      lineSpacing: 1.08,
    },
  );

  addCard(slide, {
    left: 646,
    top: 190,
    width: 562,
    height: 386,
    fill: COLORS.violetSoft,
    lineFill: COLORS.violet,
    lineWidth: 1.4,
  });
  addText(slide, "CONTEXT ENGINEERING", {
    left: 672,
    top: 214,
    width: 330,
    height: 32,
    fontSize: 22,
    color: COLORS.turquoise,
    bold: true,
  });
  addFormula(
    slide,
    "C = { c_instr, c_know, c_tools,\n      c_mem, c_state, c_query }",
    {
      left: 672,
      top: 270,
      width: 510,
      height: 102,
      fontSize: 26,
      color: COLORS.violet,
      fill: COLORS.white,
      lineFill: "#D7D2FF",
      radius: "rounded-xl",
    },
  );
  addText(
    slide,
    "Orquesta recuperación, instrucciones, herramientas, memoria, estado y consulta bajo una función objetivo.",
    {
      left: 678,
      top: 406,
      width: 498,
      height: 104,
      fontSize: 19,
      color: COLORS.ink,
      lineSpacing: 1.08,
    },
  );
  addText(slide, "RAG llena una parte de C; Context Engineering gobierna el conjunto.", {
    left: 180,
    top: 607,
    width: 920,
    height: 32,
    fontSize: 20,
    color: COLORS.violet,
    bold: true,
    alignment: "center",
  });
}

function buildSlide12(slide) {
  addFormula(
    slide,
    "Attention(Q,K,V) = softmax(QKᵀ / √d_k) V",
    {
      left: 72,
      top: 207,
      width: 610,
      height: 86,
      fontSize: 30,
      color: COLORS.white,
      alignment: "left",
    },
  );
  addText(
    slide,
    "La atención pondera representaciones que ya están en la ventana.",
    {
      left: 72,
      top: 315,
      width: 600,
      height: 48,
      fontSize: 21,
      color: COLORS.lightMuted,
    },
  );
  addText(slide, "RECUPERACIÓN EXTERNA", {
    left: 72,
    top: 410,
    width: 250,
    height: 28,
    fontSize: 15,
    color: COLORS.turquoise,
    bold: true,
  });
  addText(
    slide,
    "decide qué documentos o memorias llegan a C",
    {
      left: 72,
      top: 449,
      width: 510,
      height: 58,
      fontSize: 22,
      color: COLORS.white,
      bold: true,
    },
  );
  addText(slide, "ATENCIÓN", {
    left: 72,
    top: 548,
    width: 160,
    height: 28,
    fontSize: 15,
    color: COLORS.orange,
    bold: true,
  });
  addText(slide, "decide cómo se combinan dentro del modelo", {
    left: 72,
    top: 584,
    width: 510,
    height: 44,
    fontSize: 22,
    color: COLORS.white,
    bold: true,
  });

  addArrow(slide, 845, 268, 54, 28, "#59627E");
  addArrow(slide, 845, 392, 54, 28, COLORS.turquoise);
  addArrow(slide, 845, 516, 54, 28, COLORS.orange);
  const nodes = [
    ["DOCUMENTOS", 690, 236, COLORS.turquoise],
    ["CONTEXTO C", 902, 360, COLORS.violet],
    ["ATENCIÓN", 690, 484, COLORS.orange],
    ["RESPUESTA", 902, 484, COLORS.green],
  ];
  for (const [text, left, top, accent] of nodes) {
    addCard(slide, {
      left,
      top,
      width: 210,
      height: 82,
      fill: "#242C49",
      lineFill: accent,
      lineWidth: 1.4,
      radius: "rounded-xl",
    });
    addText(slide, text, {
      left: left + 12,
      top: top + 24,
      width: 186,
      height: 32,
      fontSize: 17,
      color: accent,
      bold: true,
      alignment: "center",
      verticalAlignment: "middle",
    });
  }
}

function buildSlide13(slide) {
  addCard(slide, {
    left: 72,
    top: 182,
    width: 544,
    height: 390,
    fill: COLORS.violetSoft,
    lineFill: COLORS.violet,
    lineWidth: 1.2,
  });
  addPill(slide, "EVIDENCIA EMPÍRICA", {
    left: 96,
    top: 204,
    width: 166,
    fill: COLORS.white,
    color: COLORS.violet,
    lineFill: COLORS.violet,
  });
  addText(
    slide,
    "Wei et al. muestran mejoras al solicitar cadenas de razonamiento en tareas aritméticas, simbólicas y de sentido común.",
    {
      left: 98,
      top: 262,
      width: 492,
      height: 112,
      fontSize: 21,
      color: COLORS.ink,
      lineSpacing: 1.08,
    },
  );
  addFormula(
    slide,
    "pθ(Y | X,C,R) = Π t=1…T pθ(yₜ | X,C,R,y<t)",
    {
    left: 98,
    top: 410,
    width: 492,
    height: 78,
    fontSize: 23,
    color: COLORS.violet,
    fill: COLORS.white,
    lineFill: "#D7D2FF",
    radius: "rounded-xl",
    },
  );
  addText(slide, "R amplía el prefijo; no añade por sí mismo intención del usuario.", {
    left: 108,
    top: 510,
    width: 472,
    height: 38,
    fontSize: 16,
    color: COLORS.muted,
    alignment: "center",
  });

  addCard(slide, {
    left: 650,
    top: 182,
    width: 558,
    height: 390,
    fill: COLORS.coralSoft,
    lineFill: COLORS.coral,
    lineWidth: 1.2,
  });
  addPill(slide, "LO QUE NO GARANTIZA", {
    left: 674,
    top: 204,
    width: 178,
    fill: COLORS.white,
    color: COLORS.coral,
    lineFill: COLORS.coral,
  });
  addFormula(slide, "H(Y | X,C,R) ≤ H(Y | X,C)", {
    left: 674,
    top: 265,
    width: 510,
    height: 78,
    fontSize: 28,
    color: COLORS.coral,
    fill: COLORS.white,
    lineFill: "#FFC4CE",
    radius: "rounded-xl",
  });
  addText(
    slide,
    "Esta es una identidad sobre variables aleatorias en promedio. No implica que un LLM concreto sea más exacto, esté mejor calibrado o razone fielmente.",
    {
      left: 684,
      top: 374,
      width: 490,
      height: 116,
      fontSize: 20,
      color: COLORS.ink,
      lineSpacing: 1.08,
    },
  );
  addText(slide, "Implicación derivada: CoT no sustituye una pregunta de aclaración.", {
    left: 684,
    top: 514,
    width: 490,
    height: 36,
    fontSize: 17,
    color: COLORS.coral,
    bold: true,
    alignment: "center",
  });
  addText(
    slide,
    "Separar resultado empírico, identidad matemática e implicación evita atribuir a CoT una garantía inexistente.",
    {
      left: 150,
      top: 612,
      width: 980,
      height: 32,
      fontSize: 18,
      color: COLORS.violet,
      bold: true,
      alignment: "center",
    },
  );
}

function buildSlide14(slide) {
  const items = [
    ["TIEMPO", "«¿Quién era el presidente?»\nFalta el año.", COLORS.coral, COLORS.coralSoft],
    ["IDENTIDAD", "«¿Quién es Ben Stone?»\nHay varias entidades.", COLORS.violet, COLORS.violetSoft],
    ["VERSIÓN", "«¿Quién interpretó a Annie?»\nDepende de la versión.", COLORS.turquoise, COLORS.turquoiseSoft],
    ["ALCANCE", "«¿Dónde ocurrió la batalla?»\nFalta granularidad.", COLORS.orange, COLORS.orangeSoft],
  ];
  for (let index = 0; index < items.length; index += 1) {
    const [label, body, accent, fill] = items[index];
    const col = index % 2;
    const row = Math.floor(index / 2);
    const left = 72 + col * 586;
    const top = 190 + row * 184;
    addCard(slide, {
      left,
      top,
      width: 550,
      height: 154,
      fill,
      lineFill: accent,
      lineWidth: 1.2,
    });
    addText(slide, label, {
      left: left + 24,
      top: top + 20,
      width: 160,
      height: 26,
      fontSize: 15,
      color: accent,
      bold: true,
    });
    addText(slide, body, {
      left: left + 24,
      top: top + 58,
      width: 500,
      height: 72,
      fontSize: 19,
      color: COLORS.ink,
      bold: true,
      lineSpacing: 1.05,
    });
  }
  addText(
    slide,
    "Taxonomía abreviada del preprint; también incluye ambigüedad semántica y de localidad.",
    {
      left: 160,
      top: 584,
      width: 960,
      height: 44,
      fontSize: 18,
      color: COLORS.violet,
      alignment: "center",
    },
  );
}

function buildSlide16(slide) {
  addFormula(
    slide,
    "p(Y | X,C) = Σ z p(Y | X,C,Z=z) · p(Z=z | X,C)",
    {
      left: 145,
      top: 191,
      width: 990,
      height: 86,
      fontSize: 31,
      color: COLORS.violet,
      fill: COLORS.white,
      lineFill: "#D7D2FF",
      radius: "rounded-xl",
    },
  );
  addText(slide, "Ejemplo ilustrativo: «¿Cómo funciona la memoria?»", {
    left: 72,
    top: 324,
    width: 450,
    height: 34,
    fontSize: 20,
    color: COLORS.ink,
    bold: true,
  });
  const intents = [
    ["Z₁", "memoria conversacional", COLORS.turquoise, COLORS.turquoiseSoft],
    ["Z₂", "memoria persistente", COLORS.violet, COLORS.violetSoft],
    ["Z₃", "ventana de contexto", COLORS.orange, COLORS.orangeSoft],
    ["Z₄", "framework específico", COLORS.coral, COLORS.coralSoft],
  ];
  for (let index = 0; index < intents.length; index += 1) {
    const [z, label, accent, fill] = intents[index];
    const left = 72 + index * 286;
    addCard(slide, {
      left,
      top: 388,
      width: 260,
      height: 126,
      fill,
      lineFill: accent,
      lineWidth: 1.2,
    });
    addText(slide, z, {
      left: left + 18,
      top: 408,
      width: 44,
      height: 28,
      fontSize: 18,
      color: accent,
      bold: true,
    });
    addText(slide, label, {
      left: left + 18,
      top: 448,
      width: 224,
      height: 48,
      fontSize: 17,
      color: COLORS.ink,
      bold: true,
      alignment: "center",
      verticalAlignment: "middle",
    });
  }
  addText(
    slide,
    "Los pesos p(Z=z|X,C) son probabilidades a estimar; no porcentajes inventados para la lámina.",
    {
      left: 160,
      top: 570,
      width: 960,
      height: 42,
      fontSize: 18,
      color: COLORS.violet,
      bold: true,
      alignment: "center",
    },
  );
}

function buildSlide17(slide) {
  addFormula(
    slide,
    "H(Y,Z | X,C) = H(Z | X,C) + H(Y | X,C,Z)",
    {
      left: 150,
      top: 207,
      width: 980,
      height: 96,
      fontSize: 35,
      color: COLORS.white,
      fill: "#171E37",
      lineFill: "#36405F",
      radius: "rounded-xl",
    },
  );
  addCard(slide, {
    left: 100,
    top: 360,
    width: 500,
    height: 190,
    fill: "#202846",
    lineFill: COLORS.turquoise,
    lineWidth: 1.3,
  });
  addText(slide, "INCERTIDUMBRE DE INTENCIÓN", {
    left: 126,
    top: 386,
    width: 448,
    height: 28,
    fontSize: 15,
    color: COLORS.turquoise,
    bold: true,
    alignment: "center",
  });
  addFormula(slide, "H(Z | X,C)", {
    left: 160,
    top: 438,
    width: 380,
    height: 62,
    fontSize: 34,
    color: COLORS.turquoise,
  });
  addCard(slide, {
    left: 680,
    top: 360,
    width: 500,
    height: 190,
    fill: "#202846",
    lineFill: COLORS.violet,
    lineWidth: 1.3,
  });
  addText(slide, "INCERTIDUMBRE DE RESPUESTA DADA Z", {
    left: 706,
    top: 386,
    width: 448,
    height: 28,
    fontSize: 15,
    color: COLORS.violet,
    bold: true,
    alignment: "center",
  });
  addFormula(slide, "H(Y | X,C,Z)", {
    left: 740,
    top: 438,
    width: 380,
    height: 62,
    fontSize: 34,
    color: COLORS.violet,
  });
  addText(
    slide,
    "Derivación: mejorar el generador reduce el segundo término; aclarar apunta al primero.",
    {
      left: 160,
      top: 594,
      width: 960,
      height: 34,
      fontSize: 19,
      color: COLORS.turquoise,
      bold: true,
      alignment: "center",
    },
  );
}

function buildSlide18(slide) {
  addArrow(slide, 366, 365, 66, 30, "#8A96B2");
  addArrow(slide, 848, 300, 66, 30, COLORS.turquoise);
  addArrow(slide, 848, 454, 66, 30, COLORS.violet);
  addCard(slide, {
    left: 72,
    top: 290,
    width: 294,
    height: 176,
    fill: COLORS.white,
    lineFill: COLORS.orange,
    lineWidth: 1.4,
  });
  addText(slide, "QUERY AMBIGUA", {
    left: 96,
    top: 315,
    width: 246,
    height: 28,
    fontSize: 15,
    color: COLORS.orange,
    bold: true,
    alignment: "center",
  });
  addText(slide, "«¿Cómo funciona\nla memoria?»", {
    left: 96,
    top: 359,
    width: 246,
    height: 76,
    fontSize: 23,
    color: COLORS.ink,
    bold: true,
    alignment: "center",
    verticalAlignment: "middle",
  });
  addCard(slide, {
    left: 432,
    top: 285,
    width: 416,
    height: 190,
    fill: COLORS.violetSoft,
    lineFill: COLORS.violet,
    lineWidth: 1.3,
  });
  addText(slide, "RETRIEVER", {
    left: 458,
    top: 315,
    width: 364,
    height: 28,
    fontSize: 15,
    color: COLORS.violet,
    bold: true,
    alignment: "center",
  });
  addFormula(slide, "s(c,X) = relevancia(c,X)", {
    left: 470,
    top: 365,
    width: 340,
    height: 60,
    fontSize: 24,
    color: COLORS.ink,
  });
  const clusters = [
    ["memoria del agente", 914, 234, COLORS.turquoise, COLORS.turquoiseSoft],
    ["memoria informática", 914, 438, COLORS.violet, COLORS.violetSoft],
  ];
  for (const [label, left, top, accent, fill] of clusters) {
    addCard(slide, {
      left,
      top,
      width: 294,
      height: 134,
      fill,
      lineFill: accent,
      lineWidth: 1.3,
    });
    addText(slide, label, {
      left: left + 22,
      top: top + 47,
      width: 250,
      height: 40,
      fontSize: 20,
      color: accent,
      bold: true,
      alignment: "center",
      verticalAlignment: "middle",
    });
  }
  addText(
    slide,
    "La similitud puede recuperar evidencia válida para varias interpretaciones; no identifica por sí sola Z.",
    {
      left: 130,
      top: 578,
      width: 1020,
      height: 50,
      fontSize: 19,
      color: COLORS.violet,
      bold: true,
      alignment: "center",
      verticalAlignment: "middle",
    },
  );
}

function buildSlide19(slide) {
  addFormula(
    slide,
    "sᵢ = Σ z p(Cᵢ relevante | X,Z=z) · p(Z=z | X)",
    {
      left: 182,
      top: 190,
      width: 916,
      height: 78,
      fontSize: 29,
      color: COLORS.ink,
    },
  );
  const cards = [
    ["C₁", "evidencia para Z₁", COLORS.turquoise, COLORS.turquoiseSoft],
    ["C₂", "evidencia para Z₂", COLORS.violet, COLORS.violetSoft],
  ];
  for (let index = 0; index < cards.length; index += 1) {
    const [symbol, label, accent, fill] = cards[index];
    const left = 105 + index * 610;
    addCard(slide, {
      left,
      top: 320,
      width: 460,
      height: 198,
      fill,
      lineFill: accent,
      lineWidth: 1.4,
    });
    addText(slide, symbol, {
      left: left + 30,
      top: 348,
      width: 100,
      height: 42,
      fontSize: 34,
      color: accent,
      bold: true,
    });
    addText(slide, label, {
      left: left + 30,
      top: 412,
      width: 400,
      height: 42,
      fontSize: 22,
      color: COLORS.ink,
      bold: true,
      alignment: "center",
    });
    addFormula(slide, index === 0 ? "s₁" : "s₂", {
      left: left + 140,
      top: 462,
      width: 180,
      height: 40,
      fontSize: 30,
      color: accent,
    });
  }
  addFormula(slide, "s₁ ≈ s₂", {
    left: 520,
    top: 548,
    width: 240,
    height: 60,
    fontSize: 34,
    color: COLORS.coral,
  });
  addText(slide, "Un margen bajo es una señal para estimar intención o preguntar.", {
    left: 230,
    top: 610,
    width: 820,
    height: 30,
    fontSize: 19,
    color: COLORS.violet,
    bold: true,
    alignment: "center",
  });
}

function buildSlide20(slide) {
  addArrow(slide, 365, 300, 102, 28, COLORS.turquoise);
  addArrow(slide, 365, 470, 102, 28, COLORS.violet);
  addArrow(slide, 814, 386, 116, 28, COLORS.orange);
  const evidence = [
    ["C₁", "evidencia válida para Z₁", 72, 248, COLORS.turquoise],
    ["C₂", "evidencia válida para Z₂", 72, 418, COLORS.violet],
  ];
  for (const [symbol, label, left, top, accent] of evidence) {
    addCard(slide, {
      left,
      top,
      width: 294,
      height: 122,
      fill: "#242C49",
      lineFill: accent,
      lineWidth: 1.3,
    });
    addText(slide, symbol, {
      left: left + 22,
      top: top + 18,
      width: 58,
      height: 28,
      fontSize: 20,
      color: accent,
      bold: true,
    });
    addText(slide, label, {
      left: left + 22,
      top: top + 58,
      width: 250,
      height: 42,
      fontSize: 17,
      color: COLORS.white,
    });
  }
  addCard(slide, {
    left: 468,
    top: 303,
    width: 346,
    height: 190,
    fill: COLORS.white,
    lineFill: COLORS.violet,
    lineWidth: 1.3,
  });
  addText(slide, "LLM", {
    left: 498,
    top: 330,
    width: 286,
    height: 30,
    fontSize: 18,
    color: COLORS.violet,
    bold: true,
    alignment: "center",
  });
  addText(slide, "Genera una respuesta\ncondicionada al contexto", {
    left: 498,
    top: 384,
    width: 286,
    height: 74,
    fontSize: 23,
    color: COLORS.ink,
    bold: true,
    alignment: "center",
    verticalAlignment: "middle",
  });
  addCard(slide, {
    left: 930,
    top: 323,
    width: 278,
    height: 154,
    fill: "#3B3038",
    lineFill: COLORS.orange,
    lineWidth: 1.4,
  });
  addText(slide, "¿QUÉ Z QUERÍA\nEL USUARIO?", {
    left: 952,
    top: 363,
    width: 234,
    height: 72,
    fontSize: 22,
    color: COLORS.orange,
    bold: true,
    alignment: "center",
    verticalAlignment: "middle",
  });
  addText(
    slide,
    "Recuperar evidencia para dos intenciones no decide cuál de ellas era la intención real.",
    {
      left: 170,
      top: 574,
      width: 940,
      height: 50,
      fontSize: 20,
      color: COLORS.turquoise,
      bold: true,
      alignment: "center",
      verticalAlignment: "middle",
    },
  );
}

function buildSlide21(slide) {
  addText(slide, "PÉRDIDA 0–1", {
    left: 72,
    top: 205,
    width: 220,
    height: 28,
    fontSize: 15,
    color: COLORS.violet,
    bold: true,
  });
  addFormula(
    slide,
    "R*(X,C) = 1 − max z∈𝒵 { p(Z=z | X,C) }",
    {
      left: 166,
      top: 263,
      width: 948,
      height: 112,
      fontSize: 37,
      color: COLORS.white,
      fill: COLORS.navy,
      lineFill: COLORS.navy,
      radius: "rounded-2xl",
    },
  );
  addText(
    slide,
    "Si ninguna intención concentra toda la probabilidad posterior, el riesgo mínimo sigue siendo positivo.",
    {
      left: 190,
      top: 417,
      width: 900,
      height: 62,
      fontSize: 22,
      color: COLORS.ink,
      bold: true,
      alignment: "center",
      verticalAlignment: "middle",
    },
  );
  addFormula(
    slide,
    "max z∈𝒵 { p(Z=z|X,C) } < 1  ⇒  R*(X,C) > 0",
    {
    left: 266,
    top: 509,
    width: 748,
    height: 72,
    fontSize: 28,
    color: COLORS.coral,
    fill: COLORS.coralSoft,
    lineFill: COLORS.coral,
    radius: "rounded-xl",
    },
  );
  addText(
    slide,
    "Derivación: el error puede provenir de información de intención ausente, no de falta de capacidad generativa.",
    {
      left: 150,
      top: 610,
      width: 980,
      height: 34,
      fontSize: 18,
      color: COLORS.violet,
      alignment: "center",
    },
  );
}

function buildSlide22(slide) {
  addArrow(slide, 248, 360, 32, 24, "#6E7C98");
  addArrow(slide, 496, 360, 32, 24, "#6E7C98");
  addArrow(slide, 744, 360, 32, 24, "#6E7C98");
  const nodes = [
    ["CONSULTA X", 72, COLORS.turquoise, COLORS.turquoiseSoft],
    ["INTENCIÓN Z", 280, COLORS.orange, COLORS.orangeSoft],
    ["PREGUNTA q", 528, COLORS.green, COLORS.greenSoft],
    ["RESPUESTA A(q)", 776, "#0E4A5A", "#0E4A5A"],
  ];
  for (const [label, left, accent, fill] of nodes) {
    addCard(slide, {
      left,
      top: 320,
      width: 200,
      height: 104,
      fill,
      lineFill: accent,
      lineWidth: 1.3,
      radius: "rounded-xl",
    });
    addText(slide, label, {
      left: left + 14,
      top: 351,
      width: 172,
      height: 40,
      fontSize: 16,
      color: left === 776 ? COLORS.white : COLORS.ink,
      bold: true,
      alignment: "center",
      verticalAlignment: "middle",
    });
  }
  addFormula(slide, "I(Z;A(q) | X) = H(Z|X) − H(Z|X,A(q))", {
    left: 725,
    top: 205,
    width: 483,
    height: 78,
    fontSize: 26,
    color: COLORS.violet,
  });
  addFormula(slide, "q* = arg max q∈𝒬  I(Z;A(q) | X)", {
    left: 725,
    top: 465,
    width: 483,
    height: 74,
    fontSize: 27,
    color: COLORS.ink,
    fill: COLORS.turquoiseSoft,
    lineFill: COLORS.turquoise,
    radius: "rounded-xl",
  });
  addText(
    slide,
    "Deits et al. seleccionan preguntas para maximizar la reducción de entropía; Zhang y Choi modelan cuándo aclarar mediante entropía sobre intenciones.",
    {
      left: 72,
      top: 501,
      width: 610,
      height: 102,
      fontSize: 18,
      color: COLORS.muted,
      lineSpacing: 1.08,
    },
  );
}

function buildSlide23(slide) {
  addFormula(slide, "Rdirecto(X) = min ŷ  𝔼[L(ŷ,Y) | X,C]", {
    left: 82,
    top: 190,
    width: 522,
    height: 66,
    fontSize: 22,
    color: COLORS.white,
  });
  addFormula(
    slide,
    "Rpreg(X,q) = c(q) + 𝔼 sobre A(q) [ Rdirecto(X,C,A(q)) ]",
    {
      left: 646,
      top: 190,
      width: 562,
      height: 66,
      fontSize: 20,
      color: COLORS.white,
    },
  );
  addCard(slide, {
    left: 72,
    top: 300,
    width: 516,
    height: 226,
    fill: "#242C49",
    lineFill: COLORS.orange,
    lineWidth: 1.2,
  });
  addPill(slide, "RESPONDER", {
    left: 102,
    top: 326,
    width: 132,
    fill: "#3A3340",
    color: COLORS.white,
    lineFill: COLORS.orange,
  });
  addText(slide, "cuando el riesgo residual\nes menor que preguntar", {
    left: 116,
    top: 390,
    width: 428,
    height: 84,
    fontSize: 24,
    color: COLORS.white,
    bold: true,
    alignment: "center",
    verticalAlignment: "middle",
  });
  addCard(slide, {
    left: 692,
    top: 300,
    width: 516,
    height: 226,
    fill: "#242C49",
    lineFill: COLORS.turquoise,
    lineWidth: 1.2,
  });
  addPill(slide, "ACLARAR", {
    left: 722,
    top: 326,
    width: 132,
    fill: "#263E4A",
    color: COLORS.white,
    lineFill: COLORS.turquoise,
  });
  addText(slide, "cuando la reducción esperada\nde pérdida supera c(q)", {
    left: 736,
    top: 390,
    width: 428,
    height: 84,
    fontSize: 24,
    color: COLORS.white,
    bold: true,
    alignment: "center",
    verticalAlignment: "middle",
  });
  addFormula(slide, "min q∈𝒬  Rpreg(X,q) < Rdirecto(X)", {
    left: 355,
    top: 570,
    width: 570,
    height: 62,
    fontSize: 28,
    color: COLORS.turquoise,
  });
}

function buildSlide24(slide) {
  slide.charts.add("bar", {
    position: { left: 120, top: 235, width: 600, height: 330 },
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
    barOptions: { direction: "bar", grouping: "clustered", gapWidth: 52 },
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
    chartFill: COLORS.white,
    chartLine: { style: "solid", fill: COLORS.white, width: 0 },
    plotAreaFill: COLORS.white,
    plotAreaLine: { style: "solid", fill: COLORS.white, width: 0 },
  });
  addPill(slide, "PREPRINT · MAYO 2026", {
    left: 780,
    top: 218,
    width: 190,
    fill: COLORS.violetSoft,
    color: COLORS.violet,
    lineFill: COLORS.violet,
  });
  addText(slide, "QA promedio", {
    left: 780,
    top: 274,
    width: 260,
    height: 30,
    fontSize: 18,
    color: COLORS.muted,
    bold: true,
  });
  addText(slide, "54% → 67%", {
    left: 780,
    top: 320,
    width: 360,
    height: 48,
    fontSize: 32,
    color: COLORS.green,
    bold: true,
  });
  addText(slide, "preguntas no ambiguas", {
    left: 780,
    top: 370,
    width: 360,
    height: 30,
    fontSize: 17,
    color: COLORS.muted,
  });
  addText(slide, "46% → 55%", {
    left: 780,
    top: 416,
    width: 360,
    height: 48,
    fontSize: 32,
    color: COLORS.orange,
    bold: true,
  });
  addText(slide, "preguntas ambiguas", {
    left: 780,
    top: 466,
    width: 360,
    height: 30,
    fontSize: 17,
    color: COLORS.muted,
  });
  addRule(slide, 780, 518, 390, COLORS.line);
  addText(slide, "Aclaración: rara", {
    left: 780,
    top: 542,
    width: 220,
    height: 28,
    fontSize: 18,
    color: COLORS.coral,
    bold: true,
  });
  addText(
    slide,
    "máximo ≈5% en preguntas ambiguas sin contexto; añadir contexto la reduce",
    {
      left: 780,
      top: 578,
      width: 390,
      height: 58,
      fontSize: 16,
      color: COLORS.muted,
      lineSpacing: 1.05,
    },
  );
  addText(
    slide,
    "Método: 10 modelos · muestra de 1,000 ítems de AmbigQA (425 no ambiguos, 575 ambiguos).",
    {
      left: 126,
      top: 604,
      width: 594,
      height: 34,
      fontSize: 12,
      color: COLORS.muted,
      alignment: "center",
    },
  );
}

function buildSlide25(slide) {
  const steps = [
    ["1", "DETECTAR", "estimar p(Z|X,C)", COLORS.orange],
    ["2", "DECIDIR", "responder o preguntar", COLORS.turquoise],
    ["3", "RECUPERAR", "condicionar por intención", COLORS.violet],
    ["4", "RESPONDER", "usar evidencia trazable", COLORS.green],
    ["5", "MEDIR", "calidad, costo y riesgo", COLORS.coral],
  ];
  for (let index = 0; index < steps.length - 1; index += 1) {
    addArrow(slide, 253 + index * 232, 385, 46, 24, "#59627E");
  }
  for (let index = 0; index < steps.length; index += 1) {
    const [n, title, body, accent] = steps[index];
    const left = 72 + index * 232;
    addCard(slide, {
      left,
      top: 306,
      width: 190,
      height: 182,
      fill: "#242C49",
      lineFill: accent,
      lineWidth: 1.3,
    });
    addText(slide, n, {
      left: left + 16,
      top: 326,
      width: 30,
      height: 26,
      fontSize: 15,
      color: accent,
      bold: true,
    });
    addText(slide, title, {
      left: left + 16,
      top: 371,
      width: 158,
      height: 30,
      fontSize: 17,
      color: COLORS.white,
      bold: true,
      alignment: "center",
    });
    addText(slide, body, {
      left: left + 16,
      top: 418,
      width: 158,
      height: 52,
      fontSize: 15,
      color: COLORS.lightMuted,
      alignment: "center",
      lineSpacing: 1.05,
    });
  }
  addText(
    slide,
    "La política de interacción forma parte de la ingeniería del contexto.",
    {
      left: 180,
      top: 565,
      width: 920,
      height: 42,
      fontSize: 23,
      color: COLORS.turquoise,
      bold: true,
      alignment: "center",
    },
  );
}

function buildSlide26(slide) {
  addPill(slide, "DEMO CONCEPTUAL · NO EMPÍRICA", {
    left: 72,
    top: 188,
    width: 226,
    fill: "#3A3340",
    color: COLORS.turquoise,
    lineFill: COLORS.orange,
  });
  addText(slide, "Usuario", {
    left: 72,
    top: 254,
    width: 150,
    height: 28,
    fontSize: 15,
    color: COLORS.orange,
    bold: true,
  });
  addText(slide, "«¿Cómo funciona la memoria?»", {
    left: 72,
    top: 291,
    width: 450,
    height: 50,
    fontSize: 24,
    color: COLORS.white,
    bold: true,
  });
  addFormula(slide, "p(Z₁|X,C) ≈ p(Z₂|X,C)", {
    left: 72,
    top: 365,
    width: 450,
    height: 62,
    fontSize: 26,
    color: COLORS.violet,
    alignment: "left",
  });
  addText(slide, "El sistema no fuerza una interpretación.", {
    left: 72,
    top: 452,
    width: 450,
    height: 34,
    fontSize: 18,
    color: COLORS.lightMuted,
  });

  addArrow(slide, 540, 374, 54, 28, COLORS.turquoise);
  addArrow(slide, 884, 374, 54, 28, COLORS.green);
  addCard(slide, {
    left: 594,
    top: 292,
    width: 290,
    height: 186,
    fill: "#242C49",
    lineFill: COLORS.turquoise,
    lineWidth: 1.4,
  });
  addText(slide, "ACLARAR", {
    left: 618,
    top: 318,
    width: 242,
    height: 28,
    fontSize: 15,
    color: COLORS.turquoise,
    bold: true,
    alignment: "center",
  });
  addText(
    slide,
    "«¿Memoria de la conversación o memoria persistente del agente?»",
    {
      left: 618,
      top: 368,
      width: 242,
      height: 84,
      fontSize: 19,
      color: COLORS.white,
      bold: true,
      alignment: "center",
      verticalAlignment: "middle",
      lineSpacing: 1.02,
    },
  );
  addCard(slide, {
    left: 938,
    top: 292,
    width: 270,
    height: 186,
    fill: "#203B39",
    lineFill: COLORS.green,
    lineWidth: 1.4,
  });
  addText(slide, "DESPUÉS", {
    left: 960,
    top: 318,
    width: 226,
    height: 28,
    fontSize: 15,
    color: COLORS.green,
    bold: true,
    alignment: "center",
  });
  addText(slide, "Z se concentra\n→ retrieval dirigido\n→ respuesta específica", {
    left: 960,
    top: 362,
    width: 226,
    height: 96,
    fontSize: 19,
    color: COLORS.white,
    bold: true,
    alignment: "center",
    verticalAlignment: "middle",
    lineSpacing: 1.05,
  });
  addText(
    slide,
    "La demo ilustra el flujo matemático; no reporta precisión ni porcentajes.",
    {
      left: 220,
      top: 566,
      width: 840,
      height: 38,
      fontSize: 18,
      color: COLORS.orange,
      alignment: "center",
    },
  );
}

function buildSlide27(slide) {
  const cards = [
    {
      n: "1",
      title: "Optimizar calidad",
      body: "El survey formula recompensa esperada bajo restricciones.",
      accent: COLORS.orange,
    },
    {
      n: "2",
      title: "Recuperar información",
      body: "Retrieval debe aportar información sobre Y*, no solo similitud.",
      accent: COLORS.turquoise,
    },
    {
      n: "3",
      title: "Presupuestar tokens",
      body: "Restricción o tasa–distorsión; el cociente no es la tesis.",
      accent: COLORS.violet,
    },
    {
      n: "4",
      title: "Modelar intención",
      body: "Si p(Z|X,C) no se concentra, persiste riesgo Bayesiano.",
      accent: COLORS.green,
    },
    {
      n: "5",
      title: "Preguntar con criterio",
      body: "Aclarar conviene si la reducción esperada de pérdida supera su costo.",
      accent: COLORS.coral,
    },
  ];
  for (let index = 0; index < cards.length; index += 1) {
    const card = cards[index];
    const left = 72 + index * 228;
    addCard(slide, {
      left,
      top: 205,
      width: 210,
      height: 288,
      fill: "#242C49",
      lineFill: card.accent,
      lineWidth: 1.3,
    });
    addText(slide, card.n, {
      left: left + 18,
      top: 222,
      width: 34,
      height: 26,
      fontSize: 14,
      color: card.accent,
      bold: true,
    });
    addText(slide, card.title, {
      left: left + 18,
      top: 266,
      width: 174,
      height: 60,
      fontSize: 19,
      color: COLORS.white,
      bold: true,
      lineSpacing: 0.95,
    });
    addText(slide, card.body, {
      left: left + 18,
      top: 342,
      width: 174,
      height: 108,
      fontSize: 15,
      color: COLORS.lightMuted,
      lineSpacing: 1.06,
    });
    addRule(slide, left + 18, 465, 174, card.accent, 3);
  }
  addCard(slide, {
    left: 154,
    top: 535,
    width: 972,
    height: 88,
    fill: "#1A2340",
    lineFill: COLORS.turquoise,
    lineWidth: 1.2,
  });
  addText(
    slide,
    "Context Engineering = optimizar evidencia, presupuesto y decisión de interacción.",
    {
      left: 184,
      top: 556,
      width: 912,
      height: 48,
      fontSize: 23,
      color: COLORS.turquoise,
      bold: true,
      alignment: "center",
      verticalAlignment: "middle",
    },
  );
}

function buildSlide34(slide) {
  const panels = [
    {
      title: "OBJETIVO · SURVEY",
      formula: "F* = arg max F∈ℱ  𝔼τ[Reward]\ncon |CF(τ)| ≤ Lmax",
      body: "Maximiza calidad esperada bajo el límite de la ventana.",
      accent: COLORS.turquoise,
      fill: COLORS.turquoiseSoft,
    },
    {
      title: "PENALIZACIÓN · DERIVACIÓN",
      formula: "max F∈ℱ  { 𝔼τ[Reward] − λ|CF| }",
      body: "Forma Lagrangiana de una relajación; λ fija el costo marginal.",
      accent: COLORS.violet,
      fill: COLORS.violetSoft,
    },
    {
      title: "TASA–DISTORSIÓN · PAPER",
      formula: "D*(R)=min 𝔼[d]\ns.a. 𝔼[len(M)]≤R",
      body: "Traza la frontera entre longitud y degradación de la respuesta.",
      accent: COLORS.orange,
      fill: COLORS.orangeSoft,
    },
  ];
  for (let index = 0; index < panels.length; index += 1) {
    const panel = panels[index];
    const left = 72 + index * 384;
    addCard(slide, {
      left,
      top: 205,
      width: 360,
      height: 365,
      fill: panel.fill,
      lineFill: panel.accent,
      lineWidth: 1.2,
    });
    addText(slide, panel.title, {
      left: left + 22,
      top: 230,
      width: 316,
      height: 28,
      fontSize: 14,
      color: panel.accent,
      bold: true,
      alignment: "center",
    });
    addFormula(slide, panel.formula, {
      left: left + 22,
      top: 286,
      width: 316,
      height: 118,
      fontSize: 24,
      color: COLORS.ink,
      fill: COLORS.white,
      lineFill: panel.accent,
      radius: "rounded-xl",
    });
    addText(slide, panel.body, {
      left: left + 30,
      top: 442,
      width: 300,
      height: 86,
      fontSize: 17,
      color: COLORS.muted,
      alignment: "center",
      lineSpacing: 1.06,
    });
  }
  addText(
    slide,
    "La razón I/|C| puede usarse como KPI derivado, pero no sustituye el objetivo restringido ni la frontera tasa–distorsión.",
    {
      left: 150,
      top: 605,
      width: 980,
      height: 42,
      fontSize: 18,
      color: COLORS.violet,
      bold: true,
      alignment: "center",
    },
  );
}

function buildSlide35(slide) {
  addArrow(slide, 266, 266, 46, 24, "#59627E");
  addArrow(slide, 526, 266, 46, 24, "#59627E");
  addArrow(slide, 786, 266, 46, 24, "#59627E");
  const nodes = [
    ["Z\nintención", 72, COLORS.orange],
    ["C\ncontexto", 312, COLORS.turquoise],
    ["R\nrazonamiento", 572, COLORS.violet],
    ["Y\nrespuesta", 832, COLORS.green],
  ];
  for (const [text, left, accent] of nodes) {
    addCard(slide, {
      left,
      top: 222,
      width: 194,
      height: 112,
      fill: "#242C49",
      lineFill: accent,
      lineWidth: 1.3,
    });
    addText(slide, text, {
      left: left + 16,
      top: 250,
      width: 162,
      height: 56,
      fontSize: 19,
      color: accent,
      bold: true,
      alignment: "center",
      verticalAlignment: "middle",
    });
  }
  addText(slide, "Supuesto: cadena de Markov condicionada en X", {
    left: 886,
    top: 350,
    width: 322,
    height: 24,
    fontSize: 12,
    color: COLORS.lightMuted,
    alignment: "right",
  });
  addFormula(slide, "I(Z;Y|X) ≤ I(Z;R|X) ≤ I(Z;C|X)", {
    left: 250,
    top: 390,
    width: 780,
    height: 76,
    fontSize: 31,
    color: COLORS.turquoise,
    fill: "#18263C",
    lineFill: COLORS.turquoise,
    radius: "rounded-xl",
  });
  addCard(slide, {
    left: 72,
    top: 506,
    width: 530,
    height: 126,
    fill: "#202846",
    lineFill: COLORS.coral,
    lineWidth: 1.2,
  });
  addText(slide, "FANO · ERROR AL INFERIR Z", {
    left: 96,
    top: 520,
    width: 482,
    height: 26,
    fontSize: 15,
    color: COLORS.coral,
    bold: true,
  });
  addFormula(slide, "P_e ≥ [ H(Z|X,C) − 1 ] / log₂ K", {
    left: 96,
    top: 552,
    width: 482,
    height: 70,
    fontSize: 24,
    color: COLORS.white,
  });
  addCard(slide, {
    left: 650,
    top: 506,
    width: 558,
    height: 126,
    fill: "#202846",
    lineFill: COLORS.turquoise,
    lineWidth: 1.2,
  });
  addText(slide, "PREGUNTAR AÑADE UNA OBSERVACIÓN", {
    left: 674,
    top: 526,
    width: 510,
    height: 26,
    fontSize: 15,
    color: COLORS.turquoise,
    bold: true,
  });
  addFormula(
    slide,
    "I(Z;C,A(q)|X) = I(Z;C|X) + I(Z;A(q)|X,C)",
    {
    left: 674,
    top: 566,
    width: 510,
    height: 46,
    fontSize: 21,
    color: COLORS.white,
    },
  );
}

function buildSlide36(slide) {
  addCard(slide, {
    left: 72,
    top: 192,
    width: 552,
    height: 418,
    fill: COLORS.white,
    lineFill: COLORS.line,
  });
  addText(slide, "BASE CITADA", {
    left: 98,
    top: 216,
    width: 500,
    height: 30,
    fontSize: 18,
    color: COLORS.violet,
    bold: true,
  });
  const cited = [
    ["Survey · Ec. 3–4", "calidad bajo límite + información mutua"],
    ["Nagle et al. 2024", "frontera tasa–distorsión"],
    ["Lewis et al. 2020", "marginalización RAG"],
    ["Zhang–Choi / Deits", "entropía de intención y preguntas"],
    ["Su–Cardie 2026", "evidencia empírica, rotulada preprint"],
  ];
  for (let index = 0; index < cited.length; index += 1) {
    const [name, body] = cited[index];
    const top = 274 + index * 61;
    addText(slide, name, {
      left: 100,
      top,
      width: 190,
      height: 26,
      fontSize: 16,
      color: index % 2 === 0 ? COLORS.violet : COLORS.turquoise,
      bold: true,
    });
    addText(slide, body, {
      left: 295,
      top,
      width: 300,
      height: 38,
      fontSize: 15,
      color: COLORS.muted,
    });
  }

  addCard(slide, {
    left: 656,
    top: 192,
    width: 552,
    height: 418,
    fill: COLORS.orangeSoft,
    lineFill: COLORS.orange,
    lineWidth: 1.2,
  });
  addText(slide, "DERIVACIONES DE LA PRESENTACIÓN", {
    left: 682,
    top: 216,
    width: 500,
    height: 30,
    fontSize: 18,
    color: COLORS.orange,
    bold: true,
  });
  const derived = [
    ["A1", "odds posteriores = prior × factor de Bayes"],
    ["A2", "información = reducción media de entropía"],
    ["A3", "preguntar si costo + riesgo posterior < riesgo directo"],
    ["A5", "un contexto concreto puede aumentar la duda"],
    ["A6–A7", "presupuesto, Lagrangiano, DPI y Fano"],
  ];
  for (let index = 0; index < derived.length; index += 1) {
    const [tag, body] = derived[index];
    const top = 274 + index * 61;
    addPill(slide, tag, {
      left: 682,
      top,
      width: 62,
      fill: COLORS.white,
      color: COLORS.orange,
      lineFill: COLORS.orange,
    });
    addText(slide, body, {
      left: 762,
      top: top + 2,
      width: 410,
      height: 42,
      fontSize: 16,
      color: COLORS.ink,
    });
  }
  addText(
    slide,
    "Regla de auditoría: si una conclusión no se conecta con una fuente o una derivación explícita, no entra al deck.",
    {
      left: 150,
      top: 622,
      width: 980,
      height: 34,
      fontSize: 18,
      color: COLORS.violet,
      bold: true,
      alignment: "center",
    },
  );
}

const args = parseArgs(process.argv.slice(2));
const input = path.resolve(
  args.input ??
    "C:/BCP/kevin/Context engineering/.codex-tmp/context-engineering-redesign/template-starter.pptx",
);
const output = path.resolve(
  args.output ??
    "C:/BCP/kevin/Context engineering/presentation/Context_Engineering_y_Ambiguedad_fuentes_verificadas.pptx",
);
const qaDir = path.resolve(
  args["qa-dir"] ??
    "C:/BCP/kevin/Context engineering/.codex-tmp/context-engineering-redesign/final-qa",
);
const mathDir = path.resolve(
  args["math-dir"] ??
    "C:/BCP/kevin/Context engineering/.codex-tmp/context-engineering-redesign/mathtext",
);

await loadMathAssets(mathDir);
const presentation = await PresentationFile.importPptx(await FileBlob.load(input));
if (presentation.slides.items.length === 35) {
  // La plantilla histórica no incluía la lámina de demostración. Duplicamos
  // su marco visual más cercano y lo insertamos antes de las conclusiones.
  const demoFrame = presentation.slides.getItem(24).duplicate();
  demoFrame.moveTo(25);
}
if (presentation.slides.items.length !== 36) {
  throw new Error(
    `La plantilla debe tener 35 o 36 diapositivas; contiene ${presentation.slides.items.length}.`,
  );
}

const slide = (number) => presentation.slides.getItem(number - 1);

// Actualizar notas y fuentes en las láminas que se preservan.
setNotes(slide(1), "Apertura y tesis narrativa; diagrama conceptual propio.", []);
setNotes(slide(2), "Ejemplo ilustrativo, no resultado empírico.", []);
setNotes(slide(3), "Definición y figura citadas.", [SOURCES.survey]);
setNotes(slide(6), "Identidad autoregresiva; ejemplo de garantía ilustrativo.", [
  SOURCES.survey,
]);
setNotes(slide(7), "Identidad matemática de información mutua condicional.", [
  SOURCES.shannon,
  SOURCES.cover,
]);
setNotes(slide(11), "Ecuación y arquitectura RAG citadas.", [SOURCES.rag]);
setNotes(slide(15), "Transición narrativa y modelamiento propio de Z.", []);
setNotes(slide(28), "Separador de anexos; sin afirmaciones externas.", []);

// Pies visibles y paginación en láminas conservadas.
await rewriteChrome(presentation, slide(2), {
  number: 2,
  kicker: "02 / PROBLEMA",
  title: "Una pregunta puede tener varias respuestas correctas",
  footer: "Ejemplo ilustrativo · las alternativas no son resultados empíricos",
});
await rewriteChrome(presentation, slide(3), {
  number: 3,
  kicker: "03 / QUÉ ES CONTEXT ENGINEERING",
  title: "Context Engineering decide qué información entra al modelo",
  footer: "Mei et al. (2025) · survey_context.pdf · Fig. 3",
});
await rewriteChrome(presentation, slide(6), {
  number: 6,
  kicker: "06 / MODELO PROBABILÍSTICO",
  title: "La probabilidad de una respuesta se construye token a token",
  footer: "Identidad autoregresiva · ejemplo hipotético de garantía",
});
await rewriteChrome(presentation, slide(7), {
  number: 7,
  kicker: "07 / VALOR DE LA INFORMACIÓN",
  title: "La información mutua mide una reducción media de incertidumbre",
  footer: "Shannon (1948) · Cover & Thomas (2006) · identidad matemática",
});
await rewriteChrome(presentation, slide(11), {
  number: 11,
  kicker: "11 / RAG",
  title: "RAG marginaliza documentos antes de generar la respuesta",
  footer: "Lewis et al. (2020) · formulación RAG",
});

// Rediseño de cuerpo principal.
const redesigns = [
  [4, buildSlide4],
  [5, buildSlide5],
  [8, buildSlide8],
  [9, buildSlide9],
  [10, buildSlide10],
  [12, buildSlide12],
  [13, buildSlide13],
  [14, buildSlide14],
  [16, buildSlide16],
  [17, buildSlide17],
  [18, buildSlide18],
  [19, buildSlide19],
  [20, buildSlide20],
  [21, buildSlide21],
  [22, buildSlide22],
  [23, buildSlide23],
  [24, buildSlide24],
  [25, buildSlide25],
  [26, buildSlide26],
  [27, buildSlide27],
];
for (const [number, builder] of redesigns) {
  await clearBody(presentation, slide(number));
  builder(slide(number));
}

const chrome = {
  4: [
    "04 / QUÉ ES CONTEXT ENGINEERING",
    "El contexto se compone de seis familias de información",
    "Mei et al. (2025) · componentes de C en el survey",
    false,
    38,
  ],
  5: [
    "05 / OBJETIVO FORMAL",
    "Maximizar calidad bajo un límite de contexto",
    "Mei et al. (2025) · Ec. 3 y restricción |C| ≤ Lmax",
    true,
    39,
  ],
  8: [
    "08 / PRESUPUESTO DE TOKENS",
    "La longitud se modela como restricción o tasa–distorsión",
    "Mei et al. (2025) · Nagle et al. (NeurIPS 2024)",
    false,
    37,
  ],
  9: [
    "09 / RAG END-TO-END",
    "RAG combina recuperación y generación mediante marginalización",
    "Lewis et al. (2020) · identidad RAG",
    false,
    36,
  ],
  10: [
    "10 / MODELOS COMPARADOS",
    "RAG recupera conocimiento; Context Engineering orquesta C",
    "Mei et al. (2025) · Lewis et al. (2020)",
    false,
    37,
  ],
  12: [
    "12 / RECUPERACIÓN Y ATENCIÓN",
    "La atención pondera tokens; retrieval decide cuáles llegan",
    "Vaswani et al. (2017) · Mei et al. (2025)",
    true,
    36,
  ],
  13: [
    "13 / CHAIN-OF-THOUGHT",
    "CoT añade cómputo; no garantiza menor error",
    "Wei et al. (2022) · Cover & Thomas (2006) · implicación derivada",
    false,
    38,
  ],
  14: [
    "14 / AMBIGÜEDAD",
    "La ambigüedad puede venir de tiempo, identidad, versión o alcance",
    "Su & Cardie (2026, preprint) · taxonomía abreviada",
    false,
    35,
  ],
  16: [
    "16 / INTENCIÓN LATENTE",
    "La respuesta se vuelve una mezcla de interpretaciones",
    "Ley de probabilidad total · ejemplo ilustrativo",
    false,
    39,
  ],
  17: [
    "17 / DESCOMPOSICIÓN",
    "La incertidumbre separa intención y respuesta",
    "Regla de la cadena de entropía · derivación",
    true,
    39,
  ],
  18: [
    "18 / RETRIEVAL",
    "Un retriever puede devolver evidencia para varias intenciones",
    "Lewis et al. (2020) · Zhang & Choi (2025) · esquema conceptual",
    false,
    36,
  ],
  19: [
    "19 / RERANKING",
    "Un margen bajo no identifica la intención",
    "Marginalización sobre Z · derivación simbólica",
    false,
    39,
  ],
  20: [
    "20 / GENERACIÓN",
    "Contexto correcto no equivale a intención correcta",
    "Derivación conceptual a partir del modelo con Z",
    true,
    38,
  ],
  21: [
    "21 / LÍMITE TEÓRICO",
    "Sin nueva información, persiste un error irreducible",
    "Riesgo Bayesiano con pérdida 0–1 · derivación",
    false,
    38,
  ],
  22: [
    "22 / CLARIFICACIÓN",
    "Aclarar adquiere información sobre la intención",
    "Deits et al. (2013) · Zhang & Choi (2025)",
    false,
    38,
  ],
  23: [
    "23 / POLÍTICA DE INTERACCIÓN",
    "Preguntar conviene cuando reduce la pérdida más que su costo",
    "Decisión Bayesiana · Berger (1985) · derivación",
    true,
    36,
  ],
  24: [
    "24 / EVIDENCIA",
    "El contexto mejora QA, pero puede suprimir la aclaración",
    "Su & Cardie (2026, preprint) · Fig. 1 y 5 · muestra de 1,000",
    false,
    37,
  ],
  25: [
    "25 / DISEÑO OPERATIVO",
    "Diseña el sistema alrededor de la incertidumbre",
    "Síntesis · survey · Zhang & Choi (2025) · Su & Cardie (2026)",
    true,
    38,
  ],
  26: [
    "26 / DEMO",
    "Una pregunta breve convierte ambigüedad en retrieval dirigido",
    "Demo conceptual · sin métricas ni resultados empíricos",
    true,
    36,
  ],
  27: [
    "27 / CONCLUSIONES",
    "Cinco conclusiones defendibles y trazables",
    "Síntesis basada en survey, tasa–distorsión, RAG e información",
    true,
    38,
  ],
};
for (const [numberText, values] of Object.entries(chrome)) {
  const number = Number(numberText);
  const [kicker, title, footer, dark, titleSize] = values;
  await rewriteChrome(presentation, slide(number), {
    number,
    kicker,
    title,
    footer,
    dark,
    titleSize,
  });
}

setNotes(slide(4), "Componentes citados del survey; composición visual propia.", [
  SOURCES.survey,
]);
setNotes(slide(5), "Ecuación 3 y restricción citadas; advertencia editorial propia.", [
  SOURCES.survey,
]);
setNotes(slide(8), "Comparación de dos formulaciones citadas.", [
  SOURCES.survey,
  SOURCES.rateDistortion,
]);
setNotes(slide(9), "Ecuación RAG citada; diagrama explicativo propio.", [SOURCES.rag]);
setNotes(slide(10), "Comparación basada en las definiciones de las fuentes.", [
  SOURCES.survey,
  SOURCES.rag,
]);
setNotes(slide(12), "Ecuación de atención citada; distinción retrieval/atención derivada.", [
  SOURCES.attention,
  SOURCES.survey,
]);
setNotes(slide(13), "Resultado empírico e identidad matemática separados.", [
  SOURCES.cot,
  SOURCES.cover,
]);
setNotes(slide(14), "Taxonomía abreviada y ejemplos parafraseados; preprint.", [
  SOURCES.evidence,
]);
setNotes(slide(16), "Ley de probabilidad total; ejemplo ilustrativo.", [SOURCES.cover]);
setNotes(slide(17), "Identidad matemática y lectura operacional derivada.", [
  SOURCES.cover,
]);
setNotes(slide(18), "Esquema conceptual informado por RAG y entropía de intención.", [
  SOURCES.rag,
  SOURCES.clarify,
]);
setNotes(slide(19), "Derivación simbólica; no contiene scores empíricos.", [
  SOURCES.cover,
]);
setNotes(slide(20), "Implicación del modelo latente; diagrama conceptual propio.", []);
setNotes(slide(21), "Riesgo Bayesiano con pérdida 0–1; derivación.", [
  SOURCES.decision,
]);
setNotes(slide(22), "Criterio de información para seleccionar preguntas.", [
  SOURCES.infoDialog,
  SOURCES.clarify,
]);
setNotes(slide(23), "Comparación de acciones mediante riesgo Bayesiano; derivación.", [
  SOURCES.decision,
]);
setNotes(slide(24), "Resultado empírico citado y rotulado como preprint.", [
  SOURCES.evidence,
]);
setNotes(slide(25), "Síntesis operacional derivada de las fuentes.", [
  SOURCES.survey,
  SOURCES.clarify,
  SOURCES.evidence,
]);
setNotes(slide(26), "Ejemplo conceptual; no resultado empírico.", [
  SOURCES.clarify,
]);
setNotes(slide(27), "Síntesis; cada punto se desarrolla en anexos.", [
  SOURCES.survey,
  SOURCES.rateDistortion,
  SOURCES.rag,
  SOURCES.infoDialog,
  SOURCES.clarify,
]);

// Renumerar y documentar anexos preservados.
await rewriteChrome(presentation, slide(29), {
  number: 29,
  kicker: "A1 / ACTUALIZACIÓN BAYESIANA",
  title: "El contexto es útil cuando cambia las odds entre intenciones",
  footer: "Regla de Bayes · derivación explícita de odds posteriores",
});
await rewriteChrome(presentation, slide(30), {
  number: 30,
  kicker: "A2 / INFORMACIÓN",
  title: "La ganancia media está acotada por la incertidumbre inicial",
  footer: "Shannon (1948) · Cover & Thomas (2006)",
  dark: true,
  titleSize: 34,
});
await rewriteChrome(presentation, slide(31), {
  number: 31,
  kicker: "A3 / DECISIÓN",
  title: "El umbral de aclaración aparece al comparar dos riesgos",
  footer: "Decisión Bayesiana · derivación con pérdida 0–1",
});
await rewriteChrome(presentation, slide(32), {
  number: 32,
  kicker: "A4 / RAG",
  title: "Recuperación y generación intervienen en operaciones distintas",
  footer: "Lewis et al. (2020) · derivación simbólica",
});
await rewriteChrome(presentation, slide(33), {
  number: 33,
  kicker: "A5 / EFECTO LOCAL",
  title: "Un contexto concreto puede aumentar la duda aunque el promedio disminuya",
  footer: "Entropía condicional · actualización Bayesiana · derivación",
  dark: true,
  titleSize: 31,
});
setNotes(slide(29), "Derivación de la regla de Bayes.", [SOURCES.cover]);
setNotes(slide(30), "Identidad de información mutua condicional.", [
  SOURCES.shannon,
  SOURCES.cover,
]);
setNotes(slide(31), "Derivación de umbral bajo pérdida 0–1.", [SOURCES.decision]);
setNotes(slide(32), "Fórmula RAG citada y sensibilidad derivada.", [SOURCES.rag]);
setNotes(slide(33), "Diferencia entre promedio y observación puntual.", [
  SOURCES.cover,
]);

// Rediseñar los tres últimos anexos.
for (const number of [34, 35, 36]) {
  await clearBody(presentation, slide(number));
}
buildSlide34(slide(34));
buildSlide35(slide(35));
buildSlide36(slide(36));

await rewriteChrome(presentation, slide(34), {
  number: 34,
  kicker: "A6 / TOKENS Y CALIDAD",
  title: "Presupuesto, penalización y tasa–distorsión responden preguntas distintas",
  footer: "Mei et al. (2025) · Nagle et al. (NeurIPS 2024) · derivación Lagrangiana",
  titleSize: 32,
});
await rewriteChrome(presentation, slide(35), {
  number: 35,
  kicker: "A7 / LÍMITES DE INFORMACIÓN",
  title: "El procesamiento no crea información de intención ausente",
  footer: "Procesamiento de datos · Fano · regla de la cadena",
  dark: true,
  titleSize: 35,
});
await rewriteChrome(presentation, slide(36), {
  number: 36,
  kicker: "A8 / TRAZABILIDAD",
  title: "Cada conclusión se conecta con una fuente o una derivación",
  footer: "Matriz de trazabilidad de la presentación",
  titleSize: 35,
});
setNotes(slide(34), "Dos formulaciones citadas y una forma Lagrangiana derivada.", [
  SOURCES.survey,
  SOURCES.rateDistortion,
]);
setNotes(slide(35), "Identidades matemáticas bajo el supuesto de Markov indicado.", [
  SOURCES.cover,
  SOURCES.infoDialog,
]);
setNotes(slide(36), "Matriz editorial de trazabilidad; no añade resultados.", [
  SOURCES.survey,
  SOURCES.rateDistortion,
  SOURCES.rag,
  SOURCES.clarify,
  SOURCES.infoDialog,
  SOURCES.evidence,
]);

// Actualizar número visible del separador de anexos.
{
  const layout = await getLayout(slide(28));
  const page = layout.elements
    .filter(
      (element) =>
        element.aid &&
        element.bbox &&
        element.bbox[1] >= 660 &&
        element.bbox[0] >= 1120 &&
        typeof element.text === "string",
    )
    .sort((a, b) => b.bbox[0] - a.bbox[0])[0];
  if (page) presentation.resolve(page.aid).text = "28";
}

await fs.mkdir(path.join(qaDir, "render"), { recursive: true });
await fs.mkdir(path.join(qaDir, "layout"), { recursive: true });
for (let index = 0; index < presentation.slides.items.length; index += 1) {
  const currentSlide = presentation.slides.getItem(index);
  const stem = `slide-${String(index + 1).padStart(2, "0")}`;
  await saveBlob(
    await presentation.export({ slide: currentSlide, format: "png", scale: 1 }),
    path.join(qaDir, "render", `${stem}.png`),
  );
  await saveBlob(
    await currentSlide.export({ format: "layout" }),
    path.join(qaDir, "layout", `${stem}.layout.json`),
  );
}

const inspection = await presentation.inspect({
  kind: "slide,textbox,shape,image,chart,notes,layout",
  include:
    "id,slide,name,title,text,textPreview,textChars,textLines,bbox,bboxUnit,isPlaceholder,placeholders",
  maxChars: 800000,
});
await fs.writeFile(
  path.join(qaDir, "final-inspect.ndjson"),
  inspection.ndjson,
  "utf8",
);

const montage = await presentation.export({
  format: "webp",
  montage: true,
  scale: 1,
});
await saveBlob(montage, path.join(qaDir, "montage.webp"));

const pptx = await PresentationFile.exportPptx(presentation);
await fs.mkdir(path.dirname(output), { recursive: true });
await pptx.save(output);

console.log(
  JSON.stringify(
    {
      input,
      output,
      slideCount: presentation.slides.items.length,
      mathTextEquations: MATH_ASSETS.size,
      qaDir,
      outputBytes: (await fs.stat(output)).size,
    },
    null,
    2,
  ),
);
