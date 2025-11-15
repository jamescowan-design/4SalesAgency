import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export default function VoiceCalling() {
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [callNotes, setCallNotes] = useState("");
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const { data: user } = trpc.auth.me.useQuery();
  const { data: clients } = trpc.clients.list.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: leads, refetch: refetchLeads } = trpc.leads.listByCampaign.useQuery(
    { campaignId: selectedCampaign! },
    { enabled: !!selectedCampaign }
  );

  const { data: callHistory } = trpc.voiceCalls.getCallHistory.useQuery(
    { leadId: selectedLead?.id },
    { enabled: !!selectedLead }
  );

  const initiateCallMutation = trpc.voiceCalls.initiateCall.useMutation({
    onSuccess: (data: any) => {
      toast.success("Call initiated successfully");
      setIsCallActive(true);
    },
    onError: (error: any) => {
      toast.error(`Failed to initiate call: ${error.message}`);
    },
  });

  const endCallMutation = trpc.voiceCalls.endCall.useMutation({
    onSuccess: () => {
      toast.success("Call ended");
      setIsCallActive(false);
      setCallNotes("");
      refetchLeads();
    },
  });

  const handleInitiateCall = () => {
    if (!selectedLead || !selectedCampaign) return;

    initiateCallMutation.mutate({
      leadId: selectedLead.id,
      campaignId: selectedCampaign,
      callType: "manual",
    });
  };

  const handleEndCall = () => {
    if (!selectedLead) return;

    endCallMutation.mutate({
      leadId: selectedLead.id,
      notes: callNotes,
      outcome: "completed",
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Voice Calling
          </h1>
          <p className="text-slate-600 mt-2">
            Make calls, track conversations, and manage call outcomes
          </p>
        </div>

        {/* Campaign Selector */}
        {!selectedCampaign && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients?.map((client) => (
              <Card key={client.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>{client.name}</CardTitle>
                  <CardDescription>Select campaign for calling</CardDescription>
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

        {/* Voice Calling Interface */}
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
                  <CardTitle>Leads to Call</CardTitle>
                  <CardDescription>
                    {leads?.filter(l => l.contactPhone).length || 0} leads with phone numbers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {leads
                      ?.filter(l => l.contactPhone)
                      .map((lead) => (
                        <div
                          key={lead.id}
                          onClick={() => setSelectedLead(lead)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedLead?.id === lead.id
                              ? "bg-blue-50 border-blue-300"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <div className="font-semibold text-sm">{lead.companyName}</div>
                          <div className="text-xs text-slate-600">{lead.contactName}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            {lead.contactPhone}
                          </div>
                          <Badge
                            variant={lead.status === "new" ? "default" : "secondary"}
                            className="mt-2 text-xs"
                          >
                            {lead.status}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Call Interface */}
              <Card className="lg:col-span-2">
                {selectedLead ? (
                  <>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{selectedLead.companyName}</CardTitle>
                          <CardDescription>
                            {selectedLead.contactName} • {selectedLead.contactPhone}
                          </CardDescription>
                        </div>
                        <Badge>{selectedLead.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Call Controls */}
                      <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 text-white text-center">
                        {!isCallActive ? (
                          <div className="space-y-4">
                            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                              <Phone className="h-12 w-12" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold mb-1">Ready to Call</h3>
                              <p className="text-blue-100">
                                Click below to initiate call
                              </p>
                            </div>
                            <Button
                              size="lg"
                              onClick={handleInitiateCall}
                              disabled={initiateCallMutation.isPending}
                              className="bg-white text-blue-600 hover:bg-blue-50"
                            >
                              {initiateCallMutation.isPending ? (
                                <>
                                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                  Connecting...
                                </>
                              ) : (
                                <>
                                  <PhoneCall className="h-5 w-5 mr-2" />
                                  Start Call
                                </>
                              )}
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
                              <PhoneCall className="h-12 w-12" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold mb-1">Call in Progress</h3>
                              <p className="text-blue-100">
                                Connected to {selectedLead.contactName}
                              </p>
                            </div>
                            <div className="flex items-center justify-center gap-4">
                              <Button
                                size="lg"
                                variant="ghost"
                                onClick={() => setIsMuted(!isMuted)}
                                className="bg-white/20 hover:bg-white/30 text-white"
                              >
                                {isMuted ? (
                                  <MicOff className="h-5 w-5" />
                                ) : (
                                  <Mic className="h-5 w-5" />
                                )}
                              </Button>
                              <Button
                                size="lg"
                                onClick={handleEndCall}
                                className="bg-red-500 hover:bg-red-600 text-white"
                              >
                                <PhoneOff className="h-5 w-5 mr-2" />
                                End Call
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Call Notes */}
                      {isCallActive && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Call Notes</label>
                          <Textarea
                            value={callNotes}
                            onChange={(e) => setCallNotes(e.target.value)}
                            placeholder="Take notes during the call..."
                            rows={4}
                          />
                        </div>
                      )}

                      {/* Lead Info */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Company Info</h4>
                          <div className="space-y-1 text-sm">
                            <p className="text-slate-600">
                              <span className="font-medium">Industry:</span>{" "}
                              {selectedLead.companyIndustry || "N/A"}
                            </p>
                            <p className="text-slate-600">
                              <span className="font-medium">Website:</span>{" "}
                              {selectedLead.companyWebsite || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Contact Info</h4>
                          <div className="space-y-1 text-sm">
                            <p className="text-slate-600">
                              <span className="font-medium">Email:</span>{" "}
                              {selectedLead.contactEmail || "N/A"}
                            </p>
                            <p className="text-slate-600">
                              <span className="font-medium">Title:</span>{" "}
                              {selectedLead.contactJobTitle || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Call History */}
                      {callHistory && callHistory.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-3">Call History</h4>
                          <div className="space-y-2">
                            {callHistory.map((call: any) => (
                              <div
                                key={call.id}
                                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  {call.outcome === "completed" ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  )}
                                  <div>
                                    <p className="text-sm font-medium">
                                      {call.outcome || "Unknown"}
                                    </p>
                                    <p className="text-xs text-slate-600">
                                      {new Date(call.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium">
                                    {call.duration ? formatDuration(call.duration) : "N/A"}
                                  </p>
                                  <p className="text-xs text-slate-600">Duration</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="p-12 text-center">
                    <Phone className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      Select a Lead
                    </h3>
                    <p className="text-slate-600">
                      Choose a lead from the list to start calling
                    </p>
                  </CardContent>
                )}
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4 mt-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Total Calls</p>
                      <p className="text-2xl font-bold">
                        {callHistory?.length || 0}
                      </p>
                    </div>
                    <PhoneCall className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Avg Duration</p>
                      <p className="text-2xl font-bold">5:32</p>
                    </div>
                    <Clock className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">Connect Rate</p>
                      <p className="text-2xl font-bold">68%</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-indigo-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">To Call</p>
                      <p className="text-2xl font-bold">
                        {leads?.filter(l => l.contactPhone && l.status === "new").length || 0}
                      </p>
                    </div>
                    <Phone className="h-8 w-8 text-orange-500" />
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
