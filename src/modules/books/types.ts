export type BookStatus = "pending" | "ready" | "UPLOADED" | "PROCESSING" | "READY" | "FAILED";

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  pdfUrl: string;
  voicePersona?: string;
  status: BookStatus;
  createdAt: string;
  /** Optional metadata for detail page */
  description?: string;
  genre?: string;
  tags?: string[];
  failureReason?: string;
}
