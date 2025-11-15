import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Users,
  Mail,
  Trash2
} from "lucide-react";
import { toast } from "sonner";

export default function BulkOperations() {
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadResults, setUploadResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: user } = trpc.auth.me.useQuery();
  const { data: clients } = trpc.clients.list.useQuery(undefined, {
    enabled: !!user,
  });

  const importLeadsMutation = trpc.bulkOperations.importLeads.useMutation({
    onSuccess: (data) => {
      setUploadResults(data);
      setIsProcessing(false);
      toast.success(`Successfully imported ${data.successful} leads`);
    },
    onError: (error) => {
      setIsProcessing(false);
      toast.error(`Import failed: ${error.message}`);
    },
  });

  const exportLeadsMutation = trpc.bulkOperations.exportLeads.useMutation({
    onSuccess: (data) => {
      // Create CSV and download
      const csv = convertToCSV(data.leads);
      downloadCSV(csv, `leads-export-${Date.now()}.csv`);
      toast.success(`Exported ${data.leads.length} leads`);
    },
    onError: (error) => {
      toast.error(`Export failed: ${error.message}`);
    },
  });

  const sendBulkEmailsMutation = trpc.bulkOperations.sendBulkEmails.useMutation({
    onSuccess: (data) => {
      toast.success(`Sent ${data.successful} emails`);
    },
    onError: (error) => {
      toast.error(`Bulk email failed: ${error.message}`);
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedCampaign) return;

    setIsProcessing(true);
    setUploadProgress(0);

    // Read CSV file
    const text = await file.text();
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const leads = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',').map(v => v.trim());
      const lead: any = { campaignId: selectedCampaign };
      
      headers.forEach((header, index) => {
        const value = values[index];
        if (value) {
          // Map CSV headers to lead fields
          if (header.toLowerCase().includes('company')) lead.companyName = value;
          else if (header.toLowerCase().includes('website')) lead.companyWebsite = value;
          else if (header.toLowerCase().includes('industry')) lead.companyIndustry = value;
          else if (header.toLowerCase().includes('contact') && header.toLowerCase().includes('name')) lead.contactName = value;
          else if (header.toLowerCase().includes('email')) lead.contactEmail = value;
          else if (header.toLowerCase().includes('phone')) lead.contactPhone = value;
          else if (header.toLowerCase().includes('title') || header.toLowerCase().includes('job')) lead.contactJobTitle = value;
        }
      });
      
      if (lead.companyName) {
        leads.push(lead);
      }
      
      // Update progress
      setUploadProgress(Math.round((i / lines.length) * 50));
    }

    // Import leads
    importLeadsMutation.mutate({ campaignId: selectedCampaign, leads });
    setUploadProgress(100);
  };

  const handleExport = () => {
    if (!selectedCampaign) return;
    exportLeadsMutation.mutate({ campaignId: selectedCampaign });
  };

  const handleBulkEmail = () => {
    if (!selectedCampaign) return;
    sendBulkEmailsMutation.mutate({ 
      campaignId: selectedCampaign,
      emailType: "initial_outreach",
    });
  };

  const convertToCSV = (leads: any[]) => {
    if (leads.length === 0) return "";
    
    const headers = [
      "Company Name",
      "Website",
      "Industry",
      "Contact Name",
      "Email",
      "Phone",
      "Job Title",
      "Status",
      "Confidence Score",
    ];
    
    const rows = leads.map(lead => [
      lead.companyName || "",
      lead.companyWebsite || "",
      lead.companyIndustry || "",
      lead.contactName || "",
      lead.contactEmail || "",
      lead.contactPhone || "",
      lead.contactJobTitle || "",
      lead.status || "",
      lead.confidenceScore || "",
    ]);
    
    return [headers, ...rows].map(row => row.join(",")).join("\n");
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const template = [
      ["Company Name", "Website", "Industry", "Contact Name", "Email", "Phone", "Job Title"],
      ["Acme Corp", "https://acme.com", "Technology", "John Doe", "john@acme.com", "+1234567890", "CEO"],
      ["Example Inc", "https://example.com", "Finance", "Jane Smith", "jane@example.com", "+0987654321", "CFO"],
    ];
    
    const csv = template.map(row => row.join(",")).join("\n");
    downloadCSV(csv, "lead-import-template.csv");
    toast.success("Template downloaded");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Bulk Operations
          </h1>
          <p className="text-slate-600 mt-2">
            Import, export, and manage leads at scale
          </p>
        </div>

        {/* Campaign Selector */}
        {!selectedCampaign && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients?.map((client) => (
              <Card key={client.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>{client.name}</CardTitle>
                  <CardDescription>Select campaign for bulk operations</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setSelectedCampaign(client.id)}
                    className="w-full"
                  >
                    Select Campaign
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Bulk Operations View */}
        {selectedCampaign && (
          <>
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCampaign(null);
                  setUploadResults(null);
                }}
              >
                ← Back to Campaigns
              </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Import Leads */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Import Leads
                  </CardTitle>
                  <CardDescription>
                    Upload a CSV file to import leads in bulk
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                    <FileSpreadsheet className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-sm text-slate-600 mb-4">
                      Drag and drop your CSV file here, or click to browse
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Choose File
                        </>
                      )}
                    </Button>
                  </div>

                  {isProcessing && (
                    <div className="space-y-2">
                      <Progress value={uploadProgress} />
                      <p className="text-sm text-slate-600 text-center">
                        {uploadProgress}% complete
                      </p>
                    </div>
                  )}

                  {uploadResults && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-green-900 mb-2">Import Complete</h4>
                          <div className="space-y-1 text-sm text-green-700">
                            <p>✓ {uploadResults.successful} leads imported successfully</p>
                            {uploadResults.failed > 0 && (
                              <p>✗ {uploadResults.failed} leads failed</p>
                            )}
                            {uploadResults.duplicates > 0 && (
                              <p>⚠ {uploadResults.duplicates} duplicates skipped</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    onClick={downloadTemplate}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV Template
                  </Button>
                </CardContent>
              </Card>

              {/* Export Leads */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Export Leads
                  </CardTitle>
                  <CardDescription>
                    Download all leads as a CSV file
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-slate-50 rounded-lg p-6 text-center">
                    <FileSpreadsheet className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-sm text-slate-600 mb-4">
                      Export all campaign leads with full details
                    </p>
                    <Button
                      onClick={handleExport}
                      disabled={exportLeadsMutation.isPending}
                      className="w-full"
                    >
                      {exportLeadsMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Export to CSV
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Export includes:</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li>• Company information</li>
                      <li>• Contact details</li>
                      <li>• Lead status and scores</li>
                      <li>• Custom fields</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Bulk Email */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Bulk Email Campaign
                  </CardTitle>
                  <CardDescription>
                    Send personalized emails to all leads
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <Mail className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                    <p className="text-sm text-slate-600 mb-4 text-center">
                      Send AI-generated personalized emails to all new leads
                    </p>
                    <Button
                      onClick={handleBulkEmail}
                      disabled={sendBulkEmailsMutation.isPending}
                      className="w-full"
                    >
                      {sendBulkEmailsMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Send Bulk Emails
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div className="text-sm text-amber-700">
                        <p className="font-semibold mb-1">Rate Limiting</p>
                        <p>Emails are sent with 1-second delays to avoid rate limits</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bulk Delete */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trash2 className="h-5 w-5" />
                    Bulk Delete
                  </CardTitle>
                  <CardDescription>
                    Remove leads in bulk (use with caution)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-red-50 rounded-lg p-6">
                    <Trash2 className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-sm text-slate-600 mb-4 text-center">
                      Delete leads by status or criteria
                    </p>
                    <div className="space-y-2">
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => toast.info("Feature coming soon")}
                      >
                        Delete Rejected Leads
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => toast.info("Feature coming soon")}
                      >
                        Delete Unqualified Leads
                      </Button>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div className="text-sm text-red-700">
                        <p className="font-semibold mb-1">Warning</p>
                        <p>Deleted leads cannot be recovered</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
