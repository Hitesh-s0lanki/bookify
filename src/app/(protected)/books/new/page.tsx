"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, BookOpen, Loader2, CheckCircle2, Upload } from "lucide-react";

import { createBookAction } from "@/modules/books/actions/book";
import { VOICE_PERSONAS } from "@/modules/books/constants";
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
  const [isSuccess, setIsSuccess] = useState(false);

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
    setIsSuccess(false);
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
        setIsSuccess(true);
        setSubmitMessage("Book processed and AI voice assistant configured.");
      } catch {
        clearTimeout(progressTimer);
        setProgressText(null);
        setIsSuccess(false);
        setSubmitMessage("Failed to create book. Please try again.");
      }
    });
  };

  return (
    <section className="mx-auto w-full max-w-2xl animate-fade-in-up space-y-6">
      {/* Back link */}
      <Button asChild variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
        <Link href="/">
          <ArrowLeft className="size-4" />
          Back to Library
        </Link>
      </Button>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm">
            <BookOpen className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Add New Book</h1>
            <p className="text-sm text-muted-foreground">
              Upload a PDF and select a voice persona for conversation.
            </p>
          </div>
        </div>
      </div>

      {/* Form card */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm transition-shadow duration-300 hover:shadow-md sm:p-8"
        >
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Atomic Habits"
                    className="transition-all duration-200 focus-within:border-primary/50 focus-within:ring-primary/20"
                    {...field}
                  />
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
                <FormLabel className="text-sm font-medium">Author</FormLabel>
                <FormControl>
                  <Input
                    placeholder="James Clear"
                    className="transition-all duration-200 focus-within:border-primary/50 focus-within:ring-primary/20"
                    {...field}
                  />
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
                <FormLabel className="text-sm font-medium">PDF File</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      ref={ref}
                      name={name}
                      type="file"
                      accept="application/pdf"
                      onChange={(event) => onChange(event.target.files)}
                      className="cursor-pointer file:mr-3 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-1 file:text-sm file:font-medium file:text-primary transition-all duration-200"
                    />
                    <Upload className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
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
                <FormLabel className="text-sm font-medium">Voice Persona</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="transition-all duration-200">
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

          {/* Submit area */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={isPending}
              className="gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-6 text-white shadow-md transition-all duration-300 hover:shadow-lg hover:brightness-110"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Save Book"
              )}
            </Button>
          </div>

          {/* Success / Error messages */}
          {submitMessage && (
            <div
              className={`animate-fade-in-up flex items-center gap-2 rounded-lg p-3 text-sm ${
                isSuccess
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {isSuccess && <CheckCircle2 className="size-4 shrink-0" />}
              {submitMessage}
            </div>
          )}

          {isPending && progressText && (
            <div className="animate-fade-in flex items-center gap-2 text-sm font-medium text-primary">
              <Loader2 className="size-3.5 animate-spin" />
              {progressText}
            </div>
          )}
        </form>
      </Form>
    </section>
  );
}
