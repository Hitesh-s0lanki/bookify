import type { Book } from "@/types/book";

export const MOCK_BOOKS: Book[] = [
  {
    id: "book-1",
    title: "Atomic Habits",
    author: "James Clear",
    coverUrl: "https://covers.openlibrary.org/b/id/10594765-L.jpg",
    pdfUrl: "/mock/atomic-habits.pdf",
    voicePersona: "Calm Narrator",
    createdAt: "2026-03-01T10:00:00.000Z",
  },
  {
    id: "book-2",
    title: "Deep Work",
    author: "Cal Newport",
    coverUrl: "https://covers.openlibrary.org/b/id/8372691-L.jpg",
    pdfUrl: "/mock/deep-work.pdf",
    voicePersona: "Professional Mentor",
    createdAt: "2026-03-02T10:00:00.000Z",
  },
  {
    id: "book-3",
    title: "The Pragmatic Programmer",
    author: "Andy Hunt & Dave Thomas",
    coverUrl: "https://covers.openlibrary.org/b/id/8091016-L.jpg",
    pdfUrl: "/mock/pragmatic-programmer.pdf",
    voicePersona: "Warm Storyteller",
    createdAt: "2026-03-03T10:00:00.000Z",
  },
  {
    id: "book-4",
    title: "Clean Code",
    author: "Robert C. Martin",
    coverUrl: "https://covers.openlibrary.org/b/id/9641656-L.jpg",
    pdfUrl: "/mock/clean-code.pdf",
    voicePersona: "Focused Coach",
    createdAt: "2026-03-04T10:00:00.000Z",
  },
];
