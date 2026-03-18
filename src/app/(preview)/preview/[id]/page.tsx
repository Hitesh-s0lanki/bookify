import { PreviewContent } from "./_components/preview-content";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <PreviewContent params={params} />;
}
