import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Building2, Plus, Target, TrendingUp, Users } from "lucide-react";
import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { toast } from "sonner";

export default function ClientDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const clientId = parseInt(params.id || "0");
  const { user } = useAuth();
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    description: "",
    targetIndustries: "",
    targetGeographies: "",
    companySizeMin: "",
    companySizeMax: "",
  });

  const utils = trpc.useUtils();
  const { data: client, isLoading: clientLoading } = trpc.clients.getById.useQuery({ id: clientId });
  const { data: campaigns, isLoading: campaignsLoading } = trpc.campaigns.listByClient.useQuery({ clientId });

  const createCampaign = trpc.campaigns.create.useMutation({
    onSuccess: (data) => {
      utils.campaigns.listByClient.invalidate({ clientId });
      setCampaignDialogOpen(false);
      setCampaignForm({
        name: "",
        description: "",
        targetIndustries: "",
        targetGeographies: "",
        companySizeMin: "",
        companySizeMax: "",
      });
      toast.success("Campaign created successfully");
      setLocation(`/campaigns/${data.id}`);
    },
    onError: (error) => {
      toast.error("Failed to create campaign: " + error.message);
    },
  });

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    createCampaign.mutate({
      clientId,
      name: campaignForm.name,
      description: campaignForm.description || undefined,
      targetIndustries: campaignForm.targetIndustries ? campaignForm.targetIndustries.split(",").map(s => s.trim()) : undefined,
      targetGeographies: campaignForm.targetGeographies ? campaignForm.targetGeographies.split(",").map(s => s.trim()) : undefined,
      companySizeMin: campaignForm.companySizeMin ? parseInt(campaignForm.companySizeMin) : undefined,
      companySizeMax: campaignForm.companySizeMax ? parseInt(campaignForm.companySizeMax) : undefined,
    });
  };

  if (clientLoading || campaignsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading client...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Client not found</h2>
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
    archived: "bg-gray-400",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <div className="container py-8">
        <Button variant="ghost" className="mb-6" onClick={() => window.location.href = '/clients'}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>

        {/* Client Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-4">
              <div className="p-4 rounded-xl bg-primary/10">
                <Building2 className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">{client.name}</h1>
                {client.industry && (
                  <p className="text-lg text-muted-foreground">{client.industry}</p>
                )}
              </div>
            </div>
          </div>

          {/* Client Info Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Target className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Campaigns</p>
                    <p className="text-2xl font-bold">
                      {campaigns?.filter(c => c.status === "active").length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Users className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Leads</p>
                    <p className="text-2xl font-bold">
                      {campaigns?.reduce((sum, c) => sum + (c.leadsGenerated || 0), 0) || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Qualified Leads</p>
                    <p className="text-2xl font-bold">
                      {campaigns?.reduce((sum, c) => sum + (c.leadsQualified || 0), 0) || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Client Details */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {client.website && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Website</p>
                    <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {client.website}
                    </a>
                  </div>
                )}
                {client.contactEmail && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Contact Email</p>
                    <p>{client.contactEmail}</p>
                  </div>
                )}
                {client.contactPhone && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Contact Phone</p>
                    <p>{client.contactPhone}</p>
                  </div>
                )}
                {client.address && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Address</p>
                    <p>{client.address}</p>
                  </div>
                )}
              </div>
              {client.notes && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{client.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Campaigns Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Campaigns</h2>
            <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <form onSubmit={handleCreateCampaign}>
                  <DialogHeader>
                    <DialogTitle>Create New Campaign</DialogTitle>
                    <DialogDescription>
                      Define your campaign and target audience criteria
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="campaign-name">Campaign Name *</Label>
                      <Input
                        id="campaign-name"
                        value={campaignForm.name}
                        onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                        placeholder="Q1 2026 Enterprise Outreach"
                        required
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={campaignForm.description}
                        onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                        placeholder="Describe the campaign goals and strategy..."
                        rows={3}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="industries">Target Industries</Label>
                      <Input
                        id="industries"
                        value={campaignForm.targetIndustries}
                        onChange={(e) => setCampaignForm({ ...campaignForm, targetIndustries: e.target.value })}
                        placeholder="Technology, Finance, Healthcare (comma-separated)"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="geographies">Target Geographies</Label>
                      <Input
                        id="geographies"
                        value={campaignForm.targetGeographies}
                        onChange={(e) => setCampaignForm({ ...campaignForm, targetGeographies: e.target.value })}
                        placeholder="United States, United Kingdom, Germany (comma-separated)"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="size-min">Min Company Size</Label>
                        <Input
                          id="size-min"
                          type="number"
                          value={campaignForm.companySizeMin}
                          onChange={(e) => setCampaignForm({ ...campaignForm, companySizeMin: e.target.value })}
                          placeholder="50"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="size-max">Max Company Size</Label>
                        <Input
                          id="size-max"
                          type="number"
                          value={campaignForm.companySizeMax}
                          onChange={(e) => setCampaignForm({ ...campaignForm, companySizeMax: e.target.value })}
                          placeholder="500"
                        />
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setCampaignDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createCampaign.isPending}>
                      {createCampaign.isPending ? "Creating..." : "Create Campaign"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {!campaigns || campaigns.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <Target className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No campaigns yet</h3>
                <p className="text-muted-foreground mb-6 text-center max-w-md">
                  Create your first campaign to start generating and qualifying leads for {client.name}.
                </p>
                <Button onClick={() => setCampaignDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Campaign
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="p-2 rounded-lg bg-primary/10 w-fit">
                          <Target className="h-5 w-5 text-primary" />
                        </div>
                        <Badge className={`${statusColors[campaign.status as keyof typeof statusColors]} text-white`}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      {campaign.description && (
                        <CardDescription className="line-clamp-2">{campaign.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Leads Generated:</span>
                          <span className="font-medium">{campaign.leadsGenerated || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Qualified:</span>
                          <span className="font-medium">{campaign.leadsQualified || 0}</span>
                        </div>
                        <div className="pt-2 text-xs text-muted-foreground">
                          Created {new Date(campaign.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
