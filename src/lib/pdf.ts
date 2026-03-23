import "server-only";

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

type PdfParseModule = typeof import("pdf-parse");

let pdfParseModule: PdfParseModule | undefined;

async function loadPdfParseModule() {
  if (!pdfParseModule) {
    pdfParseModule = require("pdf-parse") as PdfParseModule;
  }

  return pdfParseModule;
}

function toBuffer(data: ArrayBuffer | Uint8Array | Buffer) {
  if (Buffer.isBuffer(data)) {
    return data;
  }

  if (data instanceof Uint8Array) {
    return Buffer.from(data);
  }

  return Buffer.from(data);
}

export async function extractRawTextFromPdfBuffer(
  data: ArrayBuffer | Uint8Array | Buffer
) {
  const { PDFParse } = await loadPdfParseModule();
  const parser = new PDFParse({ data: toBuffer(data) });

  try {
    const parsed = await parser.getText();
    return parsed.text;
  } finally {
    await parser.destroy();
  }
}

export async function extractTextFromPdf(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const text = await extractRawTextFromPdfBuffer(arrayBuffer);
  return text.replace(/\s+/g, " ").trim();
}
