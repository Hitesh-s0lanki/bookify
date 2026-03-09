"use server";

import { revalidatePath } from "next/cache";

import { VOICE_PERSONAS, type VoicePersona } from "@/constants/voice-personas";
import { connectToDatabase } from "@/lib/db";
import { extractTextFromPdf } from "@/lib/pdf";
import { createVapiAssistant } from "@/lib/vapi";
import { BookModel } from "@/models/book";

export async function createBookAction(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const author = String(formData.get("author") ?? "").trim();
  const voicePersona = String(formData.get("voicePersona") ?? "").trim();
  const pdfFile = formData.get("pdf");

  if (!title || !author || !voicePersona || !(pdfFile instanceof File)) {
    throw new Error("Invalid form submission.");
  }

  if (!VOICE_PERSONAS.includes(voicePersona as VoicePersona)) {
    throw new Error("Invalid voice persona.");
  }

  console.log("createBookAction payload", {
    title,
    author,
    voicePersona,
    pdfFile: {
      name: pdfFile.name,
      size: pdfFile.size,
      type: pdfFile.type,
    },
  });

  await connectToDatabase();

  const createdBook = await BookModel.create({
    title,
    author,
    coverUrl: "",
    pdfUrl: "pending",
    voicePersona,
    status: "pending",
  });

  const extractedText = await extractTextFromPdf(pdfFile);

  const vapiAssistantId = await createVapiAssistant({
    title,
    voicePersona: voicePersona as VoicePersona,
    context: extractedText,
  });

  const updatedBook = await BookModel.findByIdAndUpdate(
    createdBook._id,
    {
      pdfUrl: `pending/${pdfFile.name}`,
      contextText: extractedText.slice(0, 20000),
      vapiAssistantId,
      status: "ready",
    },
    { new: true }
  );

  if (!updatedBook) {
    throw new Error("Failed to finalize book creation.");
  }

  revalidatePath("/");

  return {
    ok: true,
    id: String(updatedBook._id),
    vapiAssistantId: updatedBook.vapiAssistantId,
  };
}
