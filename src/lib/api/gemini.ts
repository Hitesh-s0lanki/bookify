import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// gemini-1.5-flash returns 404 on current v1beta; use 2.0 or override via GEMINI_MODEL
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

const metadataSchema = z.object({
  title: z.string().default(""),
  author: z.string().default(""),
  description: z.string().default(""),
  genre: z.string().default(""),
  tags: z.array(z.string()).default([]),
});

export type ExtractedBookMetadata = z.infer<typeof metadataSchema>;

function cleanJsonText(raw: string) {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");

  if (start >= 0 && end > start) {
    return raw.slice(start, end + 1).trim();
  }

  return raw.trim();
}

export async function extractBookMetadataWithGemini({
  coverBase64,
  coverMimeType,
}: {
  coverBase64: string;
  coverMimeType: string;
}): Promise<ExtractedBookMetadata> {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const prompt = `Extract book metadata from this cover image only.

Return strict JSON only:
{
  "title": "",
  "author": "",
  "description": "",
  "genre": "",
  "tags": []
}

Read the title and author from the cover. Write a brief description based on what you can infer from the cover design, title, and author. Identify the genre and relevant tags.
Keep description concise (max 300 chars) and tags under 8 items.`;

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: coverMimeType,
              data: coverBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  const responseText = result.response.text();
  const cleanedText = cleanJsonText(responseText);

  const parsedJson = JSON.parse(cleanedText);
  const metadata = metadataSchema.parse(parsedJson);

  return {
    title: metadata.title.trim(),
    author: metadata.author.trim(),
    description: metadata.description.trim(),
    genre: metadata.genre.trim(),
    tags: metadata.tags
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 8),
  };
}
