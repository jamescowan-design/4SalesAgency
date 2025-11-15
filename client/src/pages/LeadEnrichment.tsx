import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import {
  Sparkles,
  Globe,
  Mail,
  Phone,
  Building2,
  Users,
  DollarSign,
  MapPin,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export default function LeadEnrichment() {
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [enrichmentUrl, setEnrichmentUrl] = useState("");

  const { data: user } = trpc.auth.me.useQuery();
  const { data: clients } = trpc.clients.list.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: leads, refetch: refetchLeads } = trpc.leads.listByCampaign.useQuery(
    { campaignId: selectedCampaign! },
    { enabled: !!selectedCampaign }
  );

  const enrichLeadMutation = trpc.enrichment.enrichLead.useMutation({
    onSuccess: () => {
      toast.success("Lead enriched successfully");
      refetchLeads();
    },
    onError: (error: any) => {
      toast.error(`Enrichment failed: ${error.message}`);
    },
  });

  const enrichFromUrlMutation = trpc.enrichment.enrichFromUrl.useMutation({
    onSuccess: () => {
      toast.success("Lead enriched from URL");
      refetchLeads();
      setEnrichmentUrl("");
    },
    onError: (error: any) => {
      toast.error(`URL enrichment failed: ${error.message}`);
    },
  });

  const handleEnrichLead = () => {
    if (!selectedLead) return;
    enrichLeadMutation.mutate({ leadId: selectedLead.id });
  };

  const handleEnrichFromUrl = () => {
    if (!selectedLead || !enrichmentUrl) return;
    enrichFromUrlMutation.mutate({
      leadId: selectedLead.id,
      url: enrichmentUrl,
    });
  };

  const getEnrichmentScore = (lead: any) => {
    let score = 0;
    const fields = [
      lead.companyWebsite,
      lead.companyIndustry,
      lead.companySize,
      lead.companyRevenue,
      lead.companyLocation,
      lead.contactEmail,
      lead.contactPhone,
      lead.contactJobTitle,
      lead.contactLinkedIn,
    ];
    
    fields.forEach(field => {
      if (field) score++;
    });
    
    return Math.round((score / fields.length) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Lead Enrichment
          </h1>
          <p className="text-slate-600 mt-2">
            Automatically enhance lead data with company and contact information
          </p>
        </div>

        {/* Campaign Selector */}
        {!selectedCampaign && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients?.map((client) => (
              <Card key={client.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>{client.name}</CardTitle>
                  <CardDescription>Enrich campaign leads</CardDescription>
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

        {/* Enrichment Interface */}
        {selectedCampaign && (
          <>
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCampaign(null);
                  setSelectedLead(null);
                }}
              >
                ← Back to Campaigns
              </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Lead List */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Leads</CardTitle>
                  <CardDescription>
                    {leads?.length || 0} total leads
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {leads?.map((lead) => {
                      const enrichmentScore = getEnrichmentScore(lead);
                      return (
                        <div
                          key={lead.id}
                          onClick={() => setSelectedLead(lead)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedLead?.id === lead.id
                              ? "bg-emerald-50 border-emerald-300"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="font-semibold text-sm">{lead.companyName}</div>
                              <div className="text-xs text-slate-600">{lead.contactName}</div>
                            </div>
                            <Badge
                              variant={enrichmentScore >= 70 ? "default" : enrichmentScore >= 40 ? "secondary" : "outline"}
                            >
                              {enrichmentScore}%
                            </Badge>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                enrichmentScore >= 70
                                  ? "bg-emerald-500"
                                  : enrichmentScore >= 40
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${enrichmentScore}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Enrichment Details */}
              <Card className="lg:col-span-2">
                {selectedLead ? (
                  <>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{selectedLead.companyName}</CardTitle>
                          <CardDescription>
                            {selectedLead.contactName}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={getEnrichmentScore(selectedLead) >= 70 ? "default" : "secondary"}
                        >
                          {getEnrichmentScore(selectedLead)}% Complete
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Enrichment Actions */}
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
                        <h3 className="text-xl font-bold mb-4">Enrich This Lead</h3>
                        
                        <div className="space-y-4">
                          {/* Auto Enrichment */}
                          <div className="bg-white/10 rounded-lg p-4">
                            <h4 className="font-semibold mb-2">Automatic Enrichment</h4>
                            <p className="text-sm text-emerald-100 mb-3">
                              Use web scraping to find missing company and contact information
                            </p>
                            <Button
                              onClick={handleEnrichLead}
                              disabled={enrichLeadMutation.isPending}
                              className="bg-white text-emerald-600 hover:bg-emerald-50"
                            >
                              {enrichLeadMutation.isPending ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Enriching...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-4 w-4 mr-2" />
                                  Auto-Enrich
                                </>
                              )}
                            </Button>
                          </div>

                          {/* URL Enrichment */}
                          <div className="bg-white/10 rounded-lg p-4">
                            <h4 className="font-semibold mb-2">Enrich from URL</h4>
                            <p className="text-sm text-emerald-100 mb-3">
                              Extract data from a specific company website or LinkedIn profile
                            </p>
                            <div className="flex gap-2">
                              <Input
                                value={enrichmentUrl}
                                onChange={(e) => setEnrichmentUrl(e.target.value)}
                                placeholder="https://company.com or LinkedIn URL"
                                className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                              />
                              <Button
                                onClick={handleEnrichFromUrl}
                                disabled={enrichFromUrlMutation.isPending || !enrichmentUrl}
                                className="bg-white text-emerald-600 hover:bg-emerald-50"
                              >
                                {enrichFromUrlMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Current Data */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Current Data</h3>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                          {/* Company Info */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              Company Information
                            </h4>
                            
                            <div className="space-y-2">
                              <div className="flex items-start gap-2">
                                {selectedLead.companyWebsite ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                )}
                                <div className="flex-1">
                                  <p className="text-xs text-slate-600">Website</p>
                                  <p className="text-sm font-medium">
                                    {selectedLead.companyWebsite || "Not available"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                {selectedLead.companyIndustry ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                )}
                                <div className="flex-1">
                                  <p className="text-xs text-slate-600">Industry</p>
                                  <p className="text-sm font-medium">
                                    {selectedLead.companyIndustry || "Not available"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                {selectedLead.companySize ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                )}
                                <div className="flex-1">
                                  <p className="text-xs text-slate-600">Company Size</p>
                                  <p className="text-sm font-medium">
                                    {selectedLead.companySize ? `${selectedLead.companySize} employees` : "Not available"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                {selectedLead.companyLocation ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                )}
                                <div className="flex-1">
                                  <p className="text-xs text-slate-600">Location</p>
                                  <p className="text-sm font-medium">
                                    {selectedLead.companyLocation || "Not available"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Contact Info */}
                          <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Contact Information
                            </h4>
                            
                            <div className="space-y-2">
                              <div className="flex items-start gap-2">
                                {selectedLead.contactEmail ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                )}
                                <div className="flex-1">
                                  <p className="text-xs text-slate-600">Email</p>
                                  <p className="text-sm font-medium">
                                    {selectedLead.contactEmail || "Not available"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                {selectedLead.contactPhone ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                )}
                                <div className="flex-1">
                                  <p className="text-xs text-slate-600">Phone</p>
                                  <p className="text-sm font-medium">
                                    {selectedLead.contactPhone || "Not available"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                {selectedLead.contactJobTitle ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                )}
                                <div className="flex-1">
                                  <p className="text-xs text-slate-600">Job Title</p>
                                  <p className="text-sm font-medium">
                                    {selectedLead.contactJobTitle || "Not available"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                {selectedLead.contactLinkedIn ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                )}
                                <div className="flex-1">
                                  <p className="text-xs text-slate-600">LinkedIn</p>
                                  <p className="text-sm font-medium">
                                    {selectedLead.contactLinkedIn || "Not available"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="p-12 text-center">
                    <Sparkles className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      Select a Lead
                    </h3>
                    <p className="text-slate-600">
                      Choose a lead to view and enrich their data
                    </p>
                  </CardContent>
                )}
              </Card>
            </div>

            {/* Enrichment Stats */}
            <div className="grid gap-4 md:grid-cols-4 mt-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Avg Completeness</p>
                      <p className="text-2xl font-bold">
                        {leads
                          ? Math.round(
                              leads.reduce((sum, l) => sum + getEnrichmentScore(l), 0) /
                                leads.length
                            )
                          : 0}
                        %
                      </p>
                    </div>
                    <Sparkles className="h-8 w-8 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Fully Enriched</p>
                      <p className="text-2xl font-bold">
                        {leads?.filter(l => getEnrichmentScore(l) >= 90).length || 0}
                      </p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Needs Enrichment</p>
                      <p className="text-2xl font-bold">
                        {leads?.filter(l => getEnrichmentScore(l) < 70).length || 0}
                      </p>
                    </div>
                    <XCircle className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Total Leads</p>
                      <p className="text-2xl font-bold">{leads?.length || 0}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
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
