"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { createBookAction } from "@/modules/books/actions/book";
import { VOICE_PERSONAS } from "@/constants/voice-personas";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const addBookSchema = z.object({
  title: z.string().min(1, "Title is required").max(150),
  author: z.string().min(1, "Author is required").max(120),
  voicePersona: z.enum(VOICE_PERSONAS, {
    message: "Please choose a voice persona",
  }),
  pdf: z
    .custom<FileList>(
      (value) => typeof FileList !== "undefined" && value instanceof FileList,
      "PDF file is required"
    )
    .refine((files) => files.length > 0, "PDF file is required")
    .refine((files) => files[0]?.type === "application/pdf", "Only PDF files are allowed"),
});

type AddBookFormValues = z.infer<typeof addBookSchema>;

export default function NewBookPage() {
  const [isPending, startTransition] = useTransition();
  const [progressText, setProgressText] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const form = useForm<AddBookFormValues>({
    resolver: zodResolver(addBookSchema),
    defaultValues: {
      title: "",
      author: "",
      voicePersona: undefined,
    },
  });

  const onSubmit = (values: AddBookFormValues) => {
    setSubmitMessage(null);
    setProgressText("Processing PDF...");

    startTransition(async () => {
      const progressTimer = setTimeout(() => {
        setProgressText("Configuring AI Voice...");
      }, 1500);

      try {
        const formData = new FormData();
        formData.append("title", values.title);
        formData.append("author", values.author);
        formData.append("voicePersona", values.voicePersona);
        formData.append("pdf", values.pdf[0]);

        await createBookAction(formData);
        form.reset();
        clearTimeout(progressTimer);
        setProgressText(null);
        setSubmitMessage("Book processed and AI voice assistant configured.");
      } catch {
        clearTimeout(progressTimer);
        setProgressText(null);
        setSubmitMessage("Failed to create book. Please try again.");
      }
    });
  };

  return (
    <section className="mx-auto w-full max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Add New Book</h1>
        <p className="text-muted-foreground">
          Upload a PDF and select the voice persona for conversation.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 rounded-xl border p-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Atomic Habits" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Author</FormLabel>
                <FormControl>
                  <Input placeholder="James Clear" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pdf"
            render={({ field: { onChange, ref, name } }) => (
              <FormItem>
                <FormLabel>PDF</FormLabel>
                <FormControl>
                  <Input
                    ref={ref}
                    name={name}
                    type="file"
                    accept="application/pdf"
                    onChange={(event) => onChange(event.target.files)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="voicePersona"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Voice Persona</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a voice persona" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {VOICE_PERSONAS.map((persona) => (
                      <SelectItem key={persona} value={persona}>
                        {persona}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Submitting..." : "Save Book"}
            </Button>
            <Button asChild type="button" variant="ghost">
              <Link href="/">Back to Library</Link>
            </Button>
          </div>

          {submitMessage ? (
            <p className="text-sm text-muted-foreground">{submitMessage}</p>
          ) : null}
          {isPending && progressText ? (
            <p className="text-sm font-medium text-primary">{progressText}</p>
          ) : null}
        </form>
      </Form>
    </section>
  );
}
