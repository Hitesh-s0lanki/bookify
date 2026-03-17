import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Bookify",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground">Last updated: March 2026</p>
      </header>

      <Section title="1. Information We Collect">
        <p>We collect information you provide directly, including:</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
          <li>Account details (name, email) when you sign up</li>
          <li>Books and files you upload to the platform</li>
          <li>Usage data such as interactions with the AI features</li>
        </ul>
      </Section>

      <Section title="2. How We Use Your Information">
        <p>Your information is used to:</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
          <li>Provide and improve the Bookify service</li>
          <li>Process your uploaded content with AI</li>
          <li>Communicate important service updates</li>
        </ul>
      </Section>

      <Section title="3. Data Storage & Security">
        Your data is stored securely using industry-standard encryption. Uploaded
        books are processed for AI features and stored in your personal library.
        We do not sell your data to third parties.
      </Section>

      <Section title="4. Third-Party Services">
        Bookify uses third-party services for authentication, file storage, and
        AI processing. These services have their own privacy policies and handle
        data according to their terms.
      </Section>

      <Section title="5. Your Rights">
        <p>You have the right to:</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
          <li>Access the personal data we hold about you</li>
          <li>Request deletion of your account and associated data</li>
          <li>Export your uploaded content at any time</li>
        </ul>
      </Section>

      <Section title="6. Changes to This Policy">
        We may update this policy periodically. We will notify you of
        significant changes through the service or via email.
      </Section>

      <Section title="7. Contact">
        For privacy-related inquiries, contact us at{" "}
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
