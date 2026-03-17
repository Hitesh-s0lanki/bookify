import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions — Bookify",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Terms &amp; Conditions
        </h1>
        <p className="text-sm text-muted-foreground">Last updated: March 2026</p>
      </header>

      <Section title="1. Acceptance of Terms">
        By accessing or using Bookify, you agree to be bound by these terms. If
        you do not agree, please do not use the service.
      </Section>

      <Section title="2. Description of Service">
        Bookify is an AI-powered reading platform that allows you to upload
        books, chat with their content, and listen to voice summaries. The
        service is provided &ldquo;as is&rdquo; without warranties of any kind.
      </Section>

      <Section title="3. User Accounts">
        You are responsible for maintaining the security of your account and all
        activity that occurs under it. You must provide accurate information
        during registration.
      </Section>

      <Section title="4. Uploaded Content">
        You retain ownership of any books or files you upload. By uploading
        content, you confirm that you have the right to do so and grant Bookify
        a limited license to process the content for the purpose of providing
        the service.
      </Section>

      <Section title="5. Acceptable Use">
        <p>You agree not to:</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
          <li>Upload content that infringes on intellectual property rights</li>
          <li>Attempt to reverse-engineer or disrupt the service</li>
          <li>Use the service for any unlawful purpose</li>
        </ul>
      </Section>

      <Section title="6. Termination">
        We reserve the right to suspend or terminate your account at our
        discretion if you violate these terms.
      </Section>

      <Section title="7. Changes to Terms">
        We may update these terms from time to time. Continued use of Bookify
        after changes constitutes acceptance of the new terms.
      </Section>

      <Section title="8. Contact">
        If you have questions about these terms, please reach out to us at{" "}
        <a
          href="mailto:support@bookify.app"
          className="text-primary underline hover:text-primary/80"
        >
          support@bookify.app
        </a>
        .
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
