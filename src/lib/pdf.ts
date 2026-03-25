import "server-only";

import { createRequire } from "node:module";

// pdfjs-dist v5 has a module-level `new DOMMatrix()` that throws in Node.js
// environments where DOMMatrix is not a global. Polyfill it before the module loads.
type GlobalWithDOMMatrix = { DOMMatrix: new (...args: unknown[]) => unknown };

if (typeof globalThis.DOMMatrix === "undefined") {
  (globalThis as unknown as Record<string, unknown>).DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m13 = 0; m14 = 0;
    m21 = 0; m22 = 1; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41 = 0; m42 = 0; m43 = 0; m44 = 1;
    is2D = true;
    isIdentity = true;
    constructor(_init?: string | number[]) {}
    static fromMatrix() { return new (globalThis as unknown as GlobalWithDOMMatrix).DOMMatrix(); }
    static fromFloat32Array(a: Float32Array) { return new (globalThis as unknown as GlobalWithDOMMatrix).DOMMatrix([...a]); }
    static fromFloat64Array(a: Float64Array) { return new (globalThis as unknown as GlobalWithDOMMatrix).DOMMatrix([...a]); }
    multiply() { return new (globalThis as unknown as GlobalWithDOMMatrix).DOMMatrix(); }
    translate(_tx = 0, _ty = 0, _tz = 0) { return new (globalThis as unknown as GlobalWithDOMMatrix).DOMMatrix(); }
    scale() { return new (globalThis as unknown as GlobalWithDOMMatrix).DOMMatrix(); }
    rotate() { return new (globalThis as unknown as GlobalWithDOMMatrix).DOMMatrix(); }
    rotateAxisAngle() { return new (globalThis as unknown as GlobalWithDOMMatrix).DOMMatrix(); }
    rotateFromVector() { return new (globalThis as unknown as GlobalWithDOMMatrix).DOMMatrix(); }
    skewX() { return new (globalThis as unknown as GlobalWithDOMMatrix).DOMMatrix(); }
    skewY() { return new (globalThis as unknown as GlobalWithDOMMatrix).DOMMatrix(); }
    flipX() { return new (globalThis as unknown as GlobalWithDOMMatrix).DOMMatrix(); }
    flipY() { return new (globalThis as unknown as GlobalWithDOMMatrix).DOMMatrix(); }
    inverse() { return new (globalThis as unknown as GlobalWithDOMMatrix).DOMMatrix(); }
    invertSelf() { return this; }
    multiplySelf() { return this; }
    preMultiplySelf() { return this; }
    translateSelf(_tx = 0, _ty = 0, _tz = 0) { return this; }
    scaleSelf() { return this; }
    scale3dSelf() { return this; }
    rotateSelf() { return this; }
    rotateAxisAngleSelf() { return this; }
    rotateFromVectorSelf() { return this; }
    skewXSelf() { return this; }
    skewYSelf() { return this; }
    transformPoint(_p?: unknown) { return { x: 0, y: 0, z: 0, w: 1 }; }
    toFloat32Array() { return new Float32Array(16); }
    toFloat64Array() { return new Float64Array(16); }
    toJSON() { return {}; }
    toString() { return `matrix(${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.e}, ${this.f})`; }
  };
}

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
