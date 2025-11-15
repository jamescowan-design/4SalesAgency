import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Search, Upload, FileText, Users, Target, Sparkles } from "lucide-react";
import { Link, useParams } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function CampaignDetail() {
  const params = useParams();
  const campaignId = parseInt(params.id || "0");
  
  const [companyInput, setCompanyInput] = useState("");
  const [isEnriching, setIsEnriching] = useState(false);

  const { data: campaign, isLoading } = trpc.campaigns.getById.useQuery({ id: campaignId });
  const { data: leads } = trpc.leads.listByCampaign.useQuery({ campaignId });
  const { data: knowledge } = trpc.productKnowledge.getByCampaign.useQuery({ campaignId });
  const { data: documents } = trpc.productKnowledge.listDocuments.useQuery({ campaignId });

  const utils = trpc.useUtils();
  const enrichCompany = trpc.scraper.enrichCompany.useMutation({
    onSuccess: () => {
      utils.leads.listByCampaign.invalidate({ campaignId });
      toast.success("Company enriched successfully!");
      setCompanyInput("");
      setIsEnriching(false);
    },
    onError: (error) => {
      toast.error(`Failed to enrich company: ${error.message}`);
      setIsEnriching(false);
    },
  });

  const handleEnrichCompany = async () => {
    if (!companyInput.trim()) {
      toast.error("Please enter a company name or website");
      return;
    }

    setIsEnriching(true);
    enrichCompany.mutate({
      campaignId,
      companyNameOrUrl: companyInput.trim(),
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Campaign not found</h2>
          <Button onClick={() => window.location.href = '/clients'}>Back to Clients</Button>
        </div>
      </div>
    );
  }

  const statusColors = {
    draft: "bg-gray-500",
    active: "bg-green-500",
    paused: "bg-yellow-500",
    completed: "bg-blue-500",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <div className="container py-8">
        <Button variant="ghost" className="mb-6" onClick={() => window.location.href = `/clients/${campaign.clientId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Client
        </Button>

        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">{campaign.name}</h1>
              {campaign.description && (
                <p className="text-lg text-muted-foreground">{campaign.description}</p>
              )}
            </div>
            <Badge className={`${statusColors[campaign.status as keyof typeof statusColors]} text-white px-4 py-2`}>
              {campaign.status}
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Leads</p>
                  <p className="text-3xl font-bold">{leads?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <Target className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Qualified</p>
                  <p className="text-3xl font-bold">
                    {leads?.filter(l => l.status === "qualified").length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <FileText className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Knowledge Items</p>
                  <p className="text-3xl font-bold">{knowledge ? 1 : 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <Upload className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Documents</p>
                  <p className="text-3xl font-bold">{documents?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* ICP Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Ideal Customer Profile (ICP)
              </CardTitle>
              <CardDescription>
                Target criteria for lead discovery
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Target Industries</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {campaign.targetIndustries && campaign.targetIndustries.length > 0 ? (
                    campaign.targetIndustries.map((industry, idx) => (
                      <Badge key={idx} variant="secondary">{industry}</Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Not specified</p>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Target Geographies</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {campaign.targetGeographies && campaign.targetGeographies.length > 0 ? (
                    campaign.targetGeographies.map((geo, idx) => (
                      <Badge key={idx} variant="secondary">{geo}</Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Not specified</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Company Size</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {campaign.companySizeMin || 0} - {campaign.companySizeMax || "∞"} employees
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Confidence Threshold</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {campaign.confidenceThreshold || 50}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Web Scraper */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Lead Discovery
              </CardTitle>
              <CardDescription>
                Find and enrich companies matching your ICP
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="company-input">Company Name or Website</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="company-input"
                    placeholder="e.g., Acme Corp or https://acme.com"
                    value={companyInput}
                    onChange={(e) => setCompanyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEnrichCompany();
                    }}
                    disabled={isEnriching}
                  />
                  <Button 
                    onClick={handleEnrichCompany}
                    disabled={isEnriching || !companyInput.trim()}
                  >
                    {isEnriching ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enriching...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Enrich
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  AI will scrape the website and extract company information, products, services, and hiring signals
                </p>
              </div>

              <div className="pt-4 border-t">
                <Link href={`/campaigns/${campaignId}/leads`}>
                  <Button variant="outline" className="w-full">
                    <Users className="mr-2 h-4 w-4" />
                    View All Leads ({leads?.length || 0})
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Knowledge Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Product Knowledge (Virtual LLM)
            </CardTitle>
            <CardDescription>
              Train AI with your product information for personalized outreach
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {knowledge ? (
                <div className="p-4 rounded-lg border bg-muted/50">
                  <div className="space-y-2">
                    {knowledge.productName && (
                      <div>
                        <Label className="text-sm font-medium">Product Name</Label>
                        <p className="text-sm">{knowledge.productName}</p>
                      </div>
                    )}
                    {knowledge.productDescription && (
                      <div>
                        <Label className="text-sm font-medium">Description</Label>
                        <p className="text-sm text-muted-foreground">{knowledge.productDescription}</p>
                      </div>
                    )}
                    {knowledge.keyFeatures && knowledge.keyFeatures.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Key Features</Label>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                          {knowledge.keyFeatures.map((feature: string, idx: number) => (
                            <li key={idx}>{feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No product knowledge added yet
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Add product information, sales scripts, and training materials to power the AI
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
