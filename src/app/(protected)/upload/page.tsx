import { MetadataForm } from "@/app/(protected)/upload/_components/metadata-form";
import { UploadPageHeader } from "@/app/(protected)/upload/_components/upload-page-header";
import { UploadPlanGate } from "@/app/(protected)/upload/_components/upload-plan-gate";

export default function UploadPage() {
  return (
    <div className="relative w-full pb-8">
      <div className="relative z-10 space-y-5">
        <UploadPageHeader />
        <div className="px-8 sm:pb-8 ">
          <UploadPlanGate>
            <MetadataForm />
          </UploadPlanGate>
        </div>
      </div>
    </div>
  );
}
