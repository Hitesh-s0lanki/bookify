import { MetadataForm } from "@/app/(protected)/upload/_components/metadata-form";
import { UploadPageHeader } from "@/app/(protected)/upload/_components/upload-page-header";
import { Separator } from "@/components/ui/separator";

export default function UploadPage() {
  return (
    <div className="relative w-full pb-8">
      {/* Single card: header + form, one border only */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-xl shadow-black/5 dark:shadow-black/20">
        {/* Decorative layer — once for whole page */}
        <div
          className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-primary/10 blur-3xl dark:bg-primary/15"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-10 size-48 rounded-full bg-amber-400/10 blur-3xl dark:bg-amber-500/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.25] dark:opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.05) 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
          aria-hidden
        />

        <div className="relative z-10">
          <UploadPageHeader />
          <div className="px-5 py-6 sm:px-8 sm:pb-8 sm:pt-6">
            <Separator />
          </div>
          <div className=" px-5 py-6 sm:px-8 sm:pb-8 sm:pt-6">
            <MetadataForm />
          </div>
        </div>
      </div>
    </div>
  );
}
