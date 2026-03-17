import { Button } from "@/components/ui/button";

type Props = {
  message: string;
};

export function LibraryErrorState({ message }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 py-12 text-center">
      <p className="text-sm text-destructive">{message}</p>
      <Button variant="outline" onClick={() => window.location.reload()}>
        Retry
      </Button>
    </div>
  );
}
