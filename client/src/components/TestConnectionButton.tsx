import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2, Zap } from "lucide-react";

interface TestConnectionButtonProps {
  service: string;
  onTest: (service: string) => void;
  isPending: boolean;
  currentService?: string;
  result?: { success: boolean; message: string; timestamp: number } | null;
}

export function TestConnectionButton({
  service,
  onTest,
  isPending,
  currentService,
  result,
}: TestConnectionButtonProps) {
  const isTestingThis = isPending && currentService === service;

  return (
    <div className="flex gap-2 items-center flex-wrap">
      <Button
        variant="outline"
        onClick={() => onTest(service)}
        disabled={isPending}
      >
        {isTestingThis ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Zap className="mr-2 h-4 w-4" />
        )}
        Test Connection
      </Button>
      {result && (
        <div
          className={`flex items-center gap-2 text-sm ${
            result.success ? "text-green-600" : "text-red-600"
          }`}
        >
          {result.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span>{result.message}</span>
        </div>
      )}
    </div>
  );
}
