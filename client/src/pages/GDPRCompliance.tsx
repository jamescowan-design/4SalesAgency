import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Download, Trash2, Shield, CheckCircle2, XCircle, Clock, FileText } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";

export default function GDPRCompliance() {
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

  const { data: summary } = trpc.gdpr.getComplianceSummary.useQuery();
  const { data: deletionRequests, refetch: refetchDeletions } = trpc.gdpr.listDeletionRequests.useQuery({});
  const { data: consentStatus, refetch: refetchConsent } = trpc.gdpr.getConsentStatus.useQuery(
    { leadId: selectedLeadId! },
    { enabled: !!selectedLeadId }
  );

  const utils = trpc.useUtils();

  const handleExportData = async (leadId: number) => {
    try {
      const data = await utils.client.gdpr.exportLeadData.query({ leadId });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lead-data-${leadId}-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully");
    } catch (error) {
      toast.error("Failed to export data");
    }
  };

  const handleRequestDeletion = async (leadId: number) => {
    if (confirm("Are you sure you want to request deletion of this lead's data?")) {
      try {
        await utils.client.gdpr.requestDeletion.mutate({ 
          leadId,
          reason: "User requested data deletion per GDPR Article 17 (Right to be Forgotten)"
        });
        toast.success("Deletion request submitted");
        refetchDeletions();
      } catch (error) {
        toast.error("Failed to submit deletion request");
      }
    }
  };

  const handleProcessDeletion = async (requestId: number, action: "approve" | "reject" | "complete") => {
    const confirmMessages = {
      approve: "Are you sure you want to approve this deletion request?",
      reject: "Are you sure you want to reject this deletion request?",
      complete: "Are you sure you want to permanently delete this lead's data? This action cannot be undone.",
    };

    if (confirm(confirmMessages[action])) {
      try {
        await utils.client.gdpr.processDeletionRequest.mutate({ requestId, action });
        toast.success("Deletion request processed");
        refetchDeletions();
      } catch (error) {
        toast.error("Failed to process deletion request");
      }
    }
  };

  const handleToggleConsent = async (leadId: number, consentType: "email" | "phone" | "sms" | "data_processing", currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await utils.client.gdpr.withdrawConsent.mutate({ leadId, consentType });
        toast.success("Consent withdrawn");
      } else {
        await utils.client.gdpr.recordConsent.mutate({ leadId, consentType, consented: true });
        toast.success("Consent recorded");
      }
      refetchConsent();
    } catch (error) {
      toast.error("Failed to update consent");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Breadcrumb 
        items={[
          { label: "Home", href: "/" },
          { label: "GDPR Compliance" }
        ]} 
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">GDPR Compliance</h1>
        <p className="text-muted-foreground">
          Manage data privacy, consent, and deletion requests in compliance with GDPR regulations
        </p>
      </div>

      {/* Compliance Summary */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalLeads || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Under GDPR protection
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Consent</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.leadsWithConsent || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.totalLeads ? Math.round((summary.leadsWithConsent / summary.totalLeads) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Deletions</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.pendingDeletionRequests || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Deletions</CardTitle>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.completedDeletions || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Data removed
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="consent" className="space-y-6">
        <TabsList>
          <TabsTrigger value="consent">Consent Management</TabsTrigger>
          <TabsTrigger value="deletions">Deletion Requests</TabsTrigger>
          <TabsTrigger value="export">Data Export</TabsTrigger>
        </TabsList>

        {/* Consent Management Tab */}
        <TabsContent value="consent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Consent by Type</CardTitle>
              <CardDescription>
                Overview of consent status across all leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Email</span>
                    <Badge variant="outline">{summary?.consentByType.email || 0} leads</Badge>
                  </div>
                  <div className="text-2xl font-bold">{summary?.consentByType.email || 0}</div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Phone</span>
                    <Badge variant="outline">{summary?.consentByType.phone || 0} leads</Badge>
                  </div>
                  <div className="text-2xl font-bold">{summary?.consentByType.phone || 0}</div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">SMS</span>
                    <Badge variant="outline">{summary?.consentByType.sms || 0} leads</Badge>
                  </div>
                  <div className="text-2xl font-bold">{summary?.consentByType.sms || 0}</div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Data Processing</span>
                    <Badge variant="outline">{summary?.consentByType.data_processing || 0} leads</Badge>
                  </div>
                  <div className="text-2xl font-bold">{summary?.consentByType.data_processing || 0}</div>
                </div>
              </div>

              <div className="mt-6">
                <label className="text-sm font-medium mb-2 block">Select Lead to Manage Consent</label>
                <input
                  type="number"
                  placeholder="Enter Lead ID"
                  className="w-full px-3 py-2 border rounded-md"
                  onChange={(e) => setSelectedLeadId(Number(e.target.value) || null)}
                />
              </div>

              {selectedLeadId && consentStatus && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-medium">Consent Status for Lead #{selectedLeadId}</h4>
                  
                  {Object.entries(consentStatus).map(([type, status]) => (
                    <div key={type} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center gap-2">
                        {status ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="capitalize">{type.replace("_", " ")}</span>
                      </div>
                      <Button
                        variant={status ? "destructive" : "default"}
                        size="sm"
                        onClick={() => handleToggleConsent(
                          selectedLeadId, 
                          type as "email" | "phone" | "sms" | "data_processing",
                          status
                        )}
                      >
                        {status ? "Withdraw" : "Grant"}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deletion Requests Tab */}
        <TabsContent value="deletions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deletion Requests</CardTitle>
              <CardDescription>
                Manage "Right to be Forgotten" requests from leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deletionRequests && deletionRequests.length > 0 ? (
                  deletionRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-md">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{request.leadName || "Unknown Lead"}</span>
                          <Badge variant={
                            request.status === "completed" ? "default" :
                            request.status === "approved" ? "secondary" :
                            request.status === "rejected" ? "destructive" :
                            "outline"
                          }>
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{request.leadEmail}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Requested: {new Date(request.requestedAt).toLocaleDateString()}
                        </p>
                        {request.reason && (
                          <p className="text-xs text-muted-foreground mt-1">Reason: {request.reason}</p>
                        )}
                      </div>

                      {request.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProcessDeletion(request.id, "approve")}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProcessDeletion(request.id, "reject")}
                          >
                            Reject
                          </Button>
                        </div>
                      )}

                      {request.status === "approved" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleProcessDeletion(request.id, "complete")}
                        >
                          Complete Deletion
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No deletion requests</p>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <label className="text-sm font-medium mb-2 block">Request Deletion for Lead</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Enter Lead ID"
                    className="flex-1 px-3 py-2 border rounded-md"
                    id="deletion-lead-id"
                  />
                  <Button
                    onClick={() => {
                      const input = document.getElementById("deletion-lead-id") as HTMLInputElement;
                      const leadId = Number(input.value);
                      if (leadId) {
                        handleRequestDeletion(leadId);
                        input.value = "";
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Request Deletion
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Export Tab */}
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Export</CardTitle>
              <CardDescription>
                Export lead data in compliance with GDPR Article 15 (Right of Access)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Export all personal data associated with a lead, including:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                  <li>Lead profile information</li>
                  <li>Activity history</li>
                  <li>Communication logs (emails, calls, SMS)</li>
                  <li>Consent records</li>
                </ul>

                <div className="mt-6">
                  <label className="text-sm font-medium mb-2 block">Export Data for Lead</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Enter Lead ID"
                      className="flex-1 px-3 py-2 border rounded-md"
                      id="export-lead-id"
                    />
                    <Button
                      onClick={() => {
                        const input = document.getElementById("export-lead-id") as HTMLInputElement;
                        const leadId = Number(input.value);
                        if (leadId) {
                          handleExportData(leadId);
                          input.value = "";
                        }
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export as JSON
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Data will be downloaded as a JSON file containing all personal information
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
