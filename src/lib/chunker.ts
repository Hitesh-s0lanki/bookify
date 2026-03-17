const CHUNK_SIZE_CHARS = 3200; // ~800 tokens
const OVERLAP_CHARS = 400; // ~100 tokens

interface ChunkResult {
  bookId: string;
  chunkText: string;
  page: number;
}

function splitAtSentenceBoundary(text: string, maxLen: number): number {
  if (text.length <= maxLen) return text.length;

  const slice = text.slice(0, maxLen);
  const lastPeriod = slice.lastIndexOf(". ");
  const lastNewline = slice.lastIndexOf("\n");
  const boundary = Math.max(lastPeriod, lastNewline);

  return boundary > maxLen * 0.5 ? boundary + 1 : maxLen;
}

function chunkPageText(pageText: string, bookId: string, page: number): ChunkResult[] {
  const chunks: ChunkResult[] = [];
  let offset = 0;

  while (offset < pageText.length) {
    const remaining = pageText.slice(offset);
    const end = splitAtSentenceBoundary(remaining, CHUNK_SIZE_CHARS);
    const chunkText = remaining.slice(0, end).trim();

    if (chunkText) {
      chunks.push({ bookId, chunkText, page });
    }

    const advance = end - OVERLAP_CHARS;
    offset += advance > 0 ? advance : end;
  }

  return chunks;
}

export function chunkTextByPages({ text, bookId }: { text: string; bookId: string }): ChunkResult[] {
  const pages = text.split("\f");
  const allChunks: ChunkResult[] = [];

  for (let i = 0; i < pages.length; i++) {
    const pageText = pages[i].trim();
    if (!pageText) continue;
    allChunks.push(...chunkPageText(pageText, bookId, i + 1));
  }

  return allChunks;
}
