import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { Loader2, Download, CheckCircle2, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ExportLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadIds: number[];
  onExportComplete?: () => void;
}

const PLATFORMS = [
  { value: "csv", label: "CSV File", description: "Download as CSV file" },
  { value: "hubspot", label: "HubSpot", description: "Export to HubSpot CRM" },
  { value: "salesforce", label: "Salesforce", description: "Export to Salesforce CRM" },
  { value: "pipedrive", label: "Pipedrive", description: "Export to Pipedrive CRM" },
];

export default function ExportLeadDialog({
  open,
  onOpenChange,
  leadIds,
  onExportComplete,
}: ExportLeadDialogProps) {
  const [platform, setPlatform] = useState<"csv" | "hubspot" | "salesforce" | "pipedrive">("csv");
  const [exporting, setExporting] = useState(false);

  const exportMutation = trpc.exports.exportLeads.useMutation({
    onSuccess: (data) => {
      setExporting(false);
      if (data.success) {
        if (platform === "csv" && data.csvContent) {
          // Download CSV file
          const blob = new Blob([data.csvContent], { type: "text/csv" });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `leads-export-${new Date().toISOString().split("T")[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
        toast.success(`Successfully exported ${data.recordsExported} lead(s) to ${platform.toUpperCase()}`);
        onExportComplete?.();
        onOpenChange(false);
      } else {
        toast.error(data.errorMessage || "Export failed");
      }
    },
    onError: (error) => {
      setExporting(false);
      toast.error(error.message);
    },
  });

  const handleExport = () => {
    if (leadIds.length === 0) {
      toast.error("No leads selected for export");
      return;
    }

    setExporting(true);
    exportMutation.mutate({
      leadIds,
      platform,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Leads</DialogTitle>
          <DialogDescription>
            Export {leadIds.length} lead{leadIds.length !== 1 ? "s" : ""} to your CRM platform or download as CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Platform Selection */}
          <div className="space-y-2">
            <Label htmlFor="platform">Export To</Label>
            <Select value={platform} onValueChange={(value: any) => setPlatform(value)}>
              <SelectTrigger id="platform">
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{p.label}</span>
                      <span className="text-xs text-muted-foreground">{p.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* API Key Warning */}
          {platform !== "csv" && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-100">API Key Required</p>
                  <p className="text-amber-700 dark:text-amber-300 mt-1">
                    Make sure you've added your {PLATFORMS.find((p) => p.value === platform)?.label} API key in Settings before exporting.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Export Summary */}
          <div className="rounded-lg border bg-muted/50 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Leads to export:</span>
              <span className="font-semibold">{leadIds.length}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-muted-foreground">Destination:</span>
              <span className="font-semibold">{PLATFORMS.find((p) => p.value === platform)?.label}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={exporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
