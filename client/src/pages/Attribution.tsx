import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Mail,
  Phone,
  Globe,
  MessageSquare,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";

export default function Attribution() {
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [selectedLead, setSelectedLead] = useState<any>(null);

  const { data: user } = trpc.auth.me.useQuery();
  const { data: clients } = trpc.clients.list.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: leads } = trpc.leads.listByCampaign.useQuery(
    { campaignId: selectedCampaign! },
    { enabled: !!selectedCampaign }
  );

  const { data: journey } = trpc.attribution.leadJourney.useQuery(
    { leadId: selectedLead?.id },
    { enabled: !!selectedLead }
  );

  const { data: channelStats } = trpc.attribution.channelPerformance.useQuery(
    { campaignId: selectedCampaign! },
    { enabled: !!selectedCampaign }
  );

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "call":
        return <Phone className="h-4 w-4" />;
      case "website":
        return <Globe className="h-4 w-4" />;
      case "sms":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case "email":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "call":
        return "bg-green-100 text-green-700 border-green-300";
      case "website":
        return "bg-purple-100 text-purple-700 border-purple-300";
      case "sms":
        return "bg-orange-100 text-orange-700 border-orange-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Multi-Channel Attribution
          </h1>
          <p className="text-slate-600 mt-2">
            Track lead journey across all touchpoints and channels
          </p>
        </div>

        {/* Campaign Selector */}
        {!selectedCampaign && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients?.map((client) => (
              <Card key={client.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>{client.name}</CardTitle>
                  <CardDescription>View attribution data</CardDescription>
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

        {/* Attribution Dashboard */}
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

            {/* Channel Performance Stats */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Email Touches</p>
                      <p className="text-2xl font-bold">
                        {channelStats?.find(c => c.channel === 'email')?.totalSent || 0}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {channelStats?.find(c => c.channel === 'email')?.conversionRate || 0}% conversion
                      </p>
                    </div>
                    <Mail className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Call Touches</p>
                      <p className="text-2xl font-bold">
                        {channelStats?.find(c => c.channel === 'call')?.totalSent || 0}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {channelStats?.find(c => c.channel === 'call')?.conversionRate || 0}% conversion
                      </p>
                    </div>
                    <Phone className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Website Visits</p>
                      <p className="text-2xl font-bold">
                        {channelStats?.find(c => c.channel === 'web')?.totalSent || 0}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {channelStats?.find(c => c.channel === 'web')?.conversionRate || 0}% conversion
                      </p>
                    </div>
                    <Globe className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Avg Touches</p>
                      <p className="text-2xl font-bold">
                        {Math.round((channelStats?.reduce((sum, c) => sum + c.totalSent, 0) || 0) / (channelStats?.length || 1))}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        to conversion
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
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
                    {leads?.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedLead?.id === lead.id
                            ? "bg-purple-50 border-purple-300"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="font-semibold text-sm">{lead.companyName}</div>
                        <div className="text-xs text-slate-600">{lead.contactName}</div>
                        <Badge
                          variant={lead.status === "converted" ? "default" : "secondary"}
                          className="mt-2 text-xs"
                        >
                          {lead.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Journey Timeline */}
              <Card className="lg:col-span-2">
                {selectedLead ? (
                  <>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>Lead Journey</CardTitle>
                          <CardDescription>
                            {selectedLead.companyName} • {selectedLead.contactName}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={selectedLead.status === "converted" ? "default" : "secondary"}
                        >
                          {selectedLead.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {journey && journey.touchpoints && journey.touchpoints.length > 0 ? (
                        <div className="space-y-4">
                          {/* Journey Timeline */}
                          <div className="relative">
                            {journey.touchpoints.map((touchpoint: any, index: number) => (
                              <div key={touchpoint.id} className="relative pl-8 pb-8 last:pb-0">
                                {/* Timeline line */}
                                {index < journey.touchpoints.length - 1 && (
                                  <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-slate-200" />
                                )}

                                {/* Timeline dot */}
                                <div
                                  className={`absolute left-0 top-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${getChannelColor(
                                    touchpoint.channel
                                  )}`}
                                >
                                  {getChannelIcon(touchpoint.channel)}
                                </div>

                                {/* Touchpoint content */}
                                <div className="bg-white rounded-lg border p-4 shadow-sm">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h4 className="font-semibold capitalize">
                                        {touchpoint.channel} {touchpoint.type}
                                      </h4>
                                      <p className="text-xs text-slate-600">
                                        {formatDate(touchpoint.timestamp)}
                                      </p>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {touchpoint.outcome || "In Progress"}
                                    </Badge>
                                  </div>

                                  {touchpoint.description && (
                                    <p className="text-sm text-slate-700 mt-2">
                                      {touchpoint.description}
                                    </p>
                                  )}

                                  {touchpoint.metadata && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {touchpoint.metadata.opened && (
                                        <Badge variant="secondary" className="text-xs">
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                          Opened
                                        </Badge>
                                      )}
                                      {touchpoint.metadata.clicked && (
                                        <Badge variant="secondary" className="text-xs">
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                          Clicked
                                        </Badge>
                                      )}
                                      {touchpoint.metadata.duration && (
                                        <Badge variant="secondary" className="text-xs">
                                          <Clock className="h-3 w-3 mr-1" />
                                          {touchpoint.metadata.duration}s
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Journey Summary */}
                          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                            <CardContent className="p-4">
                              <h4 className="font-semibold mb-3">Journey Summary</h4>
                              <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                  <p className="text-2xl font-bold text-purple-600">
                                    {journey.touchpoints.length}
                                  </p>
                                  <p className="text-xs text-slate-600">Total Touches</p>
                                </div>
                                <div>
                                  <p className="text-2xl font-bold text-purple-600">
                                    {new Set(journey.touchpoints.map((t: any) => t.channel)).size}
                                  </p>
                                  <p className="text-xs text-slate-600">Channels Used</p>
                                </div>
                                <div>
                                  <p className="text-2xl font-bold text-purple-600">
                                    {journey.daysSinceFirstTouch}
                                  </p>
                                  <p className="text-xs text-slate-600">Days Active</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Clock className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-slate-900 mb-2">
                            No Journey Data Yet
                          </h3>
                          <p className="text-slate-600">
                            Start engaging with this lead to build their journey
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="p-12 text-center">
                    <TrendingUp className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      Select a Lead
                    </h3>
                    <p className="text-slate-600">
                      Choose a lead to view their multi-channel journey
                    </p>
                  </CardContent>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
