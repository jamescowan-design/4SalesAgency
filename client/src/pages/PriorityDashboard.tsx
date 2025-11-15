import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { 
  TrendingUp, 
  Mail, 
  Phone, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Flame,
  Target,
  Zap
} from "lucide-react";
import { useLocation } from "wouter";

export default function PriorityDashboard() {
  const [, setLocation] = useLocation();
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);

  // Get user's campaigns
  const { data: user } = trpc.auth.me.useQuery();
  const { data: clients } = trpc.clients.list.useQuery(undefined, {
    enabled: !!user,
  });

  // Get priority leads for selected campaign
  const { data: priorityData, isLoading } = trpc.leads.getPriorityLeads.useQuery(
    { campaignId: selectedCampaign! },
    { enabled: !!selectedCampaign }
  );

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high": return "bg-red-500";
      case "medium": return "bg-orange-500";
      case "low": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "high": return <Flame className="h-4 w-4" />;
      case "medium": return <Zap className="h-4 w-4" />;
      case "low": return <Target className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "send_email": return <Mail className="h-4 w-4" />;
      case "make_call": return <Phone className="h-4 w-4" />;
      case "follow_up": return <Clock className="h-4 w-4" />;
      default: return <ArrowRight className="h-4 w-4" />;
    }
  };

  const handleTakeAction = (leadId: number, action: string) => {
    if (action === "send_email") {
      setLocation(`/leads/${leadId}/email/${selectedCampaign}`);
    } else if (action === "make_call") {
      setLocation(`/leads/${leadId}`);
    } else {
      setLocation(`/leads/${leadId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Priority Dashboard
          </h1>
          <p className="text-slate-600 mt-2">
            AI-powered lead prioritization to focus your efforts on the hottest opportunities
          </p>
        </div>

        {/* Campaign Selector */}
        {!selectedCampaign && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients?.map((client) => (
              <Card key={client.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>{client.name}</CardTitle>
                  <CardDescription>Select a campaign to view priority leads</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => {
                      // In a real app, you'd fetch campaigns for this client
                      // For now, we'll use the client ID as campaign ID
                      setSelectedCampaign(client.id);
                    }}
                    className="w-full"
                  >
                    View Priority Leads
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Priority Leads View */}
        {selectedCampaign && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setSelectedCampaign(null)}
              >
                ← Back to Campaigns
              </Button>
              <div className="text-sm text-slate-600">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-slate-600">Analyzing leads...</p>
              </div>
            ) : priorityData ? (
              <>
                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-4 mb-8">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-600">
                        Total Priority Leads
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">
                        {priorityData.summary.totalLeads}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                        <Flame className="h-4 w-4 text-red-500" />
                        High Urgency
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600">
                        {priorityData.summary.highUrgency}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-orange-500" />
                        Medium Urgency
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-600">
                        {priorityData.summary.mediumUrgency}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-600">
                        Avg Priority Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-indigo-600">
                        {priorityData.summary.avgScore}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Priority Leads List */}
                <div className="space-y-4">
                  {priorityData.leads.map((lead) => (
                    <Card key={lead.leadId} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-semibold text-slate-900">
                                {lead.companyName}
                              </h3>
                              <Badge className={`${getUrgencyColor(lead.urgency)} text-white flex items-center gap-1`}>
                                {getUrgencyIcon(lead.urgency)}
                                {lead.urgency.toUpperCase()}
                              </Badge>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                Score: {lead.priorityScore}
                              </Badge>
                            </div>

                            {lead.contactName && (
                              <p className="text-slate-600 mb-2">
                                Contact: {lead.contactName}
                                {lead.contactJobTitle && ` • ${lead.contactJobTitle}`}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-2 mb-3">
                              {lead.contactEmail && (
                                <Badge variant="secondary" className="text-xs">
                                  {lead.contactEmail}
                                </Badge>
                              )}
                              {lead.contactPhone && (
                                <Badge variant="secondary" className="text-xs">
                                  {lead.contactPhone}
                                </Badge>
                              )}
                            </div>

                            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                              <p className="text-sm font-medium text-blue-900 mb-1">
                                Recommended Action: {lead.recommendedAction.replace(/_/g, " ").toUpperCase()}
                              </p>
                              <p className="text-sm text-blue-700">
                                {lead.reason}
                              </p>
                            </div>
                          </div>

                          <div className="ml-6 flex flex-col gap-2">
                            <Button
                              onClick={() => handleTakeAction(lead.leadId, lead.recommendedAction)}
                              className="whitespace-nowrap"
                            >
                              {getActionIcon(lead.recommendedAction)}
                              <span className="ml-2">Take Action</span>
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setLocation(`/leads/${lead.leadId}`)}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {priorityData.leads.length === 0 && (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">
                          All Caught Up!
                        </h3>
                        <p className="text-slate-600">
                          No priority leads at the moment. Great job staying on top of your outreach!
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <AlertCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    No Data Available
                  </h3>
                  <p className="text-slate-600">
                    Unable to load priority leads for this campaign.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
