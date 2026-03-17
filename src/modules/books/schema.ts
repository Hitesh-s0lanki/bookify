import { z } from "zod";

export const createBookSchema = z.object({
  title: z.string().trim().min(1).max(150),
  author: z.string().trim().min(1).max(120),
  description: z.string().trim().max(3000).optional().default(""),
  genre: z.string().trim().max(120).optional().default(""),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).optional().default([]),
  pdfUrl: z.string().url().optional(),
  coverUrl: z.string().url().optional(),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;
