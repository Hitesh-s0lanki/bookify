import { PDFParse } from "pdf-parse";

export async function extractTextFromPdf(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const parser = new PDFParse({ data: Buffer.from(arrayBuffer) });

  try {
    const parsed = await parser.getText();
    return parsed.text.replace(/\s+/g, " ").trim();
  } finally {
    await parser.destroy();
  }
}
