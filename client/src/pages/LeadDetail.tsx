import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft, 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Users, 
  DollarSign,
  Calendar,
  TrendingUp,
  MessageSquare,
  PhoneCall,
  Send,
  Sparkles,
  ExternalLink,
  Linkedin
} from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import Breadcrumb from "@/components/Breadcrumb";
import { useState } from "react";
import { toast } from "sonner";

export default function LeadDetail() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const [, navigate] = useLocation();
  const leadId = parseInt(params.id || "0");

  const [note, setNote] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");

  const { data: lead, isLoading, refetch } = trpc.leads.getById.useQuery({ id: leadId });
  const { data: activities = [] } = trpc.activities.listByLead.useQuery({ leadId });
  const { data: communications = [] } = trpc.communications.listByLead.useQuery({ leadId });

  const addNoteMutation = trpc.activities.create.useMutation({
    onSuccess: () => {
      toast.success("Note added successfully");
      setNote("");
      refetch();
    },
  });

  const updateStatusMutation = trpc.leads.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated successfully");
      refetch();
    },
  });

  const enrichMutation = trpc.enrichment.enrichLead.useMutation({
    onSuccess: () => {
      toast.success("Lead enrichment started");
      refetch();
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="container">
          <p className="text-center text-slate-600">Lead not found</p>
        </div>
      </div>
    );
  }

  const handleAddNote = () => {
    if (!note.trim()) return;
    addNoteMutation.mutate({
      leadId,
      campaignId: lead.campaignId,
      activityType: "note",
      description: note,
    });
  };

  const handleStatusChange = (status: string) => {
    setNewStatus(status);
    updateStatusMutation.mutate({
      id: leadId,
      status: status as any,
    });
  };

  const handleEnrich = () => {
    enrichMutation.mutate({ leadId });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "bg-blue-100 text-blue-700",
      contacted: "bg-yellow-100 text-yellow-700",
      responded: "bg-purple-100 text-purple-700",
      qualified: "bg-green-100 text-green-700",
      unqualified: "bg-red-100 text-red-700",
      converted: "bg-emerald-100 text-emerald-700",
      rejected: "bg-gray-100 text-gray-700",
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  const completenessScore = Math.round(
    ((lead.companyIndustry ? 1 : 0) +
      (lead.companySize ? 1 : 0) +
      (lead.companyRevenue ? 1 : 0) +
      (lead.companyLocation ? 1 : 0) +
      (lead.contactEmail ? 1 : 0) +
      (lead.contactPhone ? 1 : 0) +
      (lead.contactJobTitle ? 1 : 0) +
      (lead.contactLinkedin ? 1 : 0)) /
      8 *
      100
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container py-8 max-w-7xl">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Campaigns", href: "/clients" },
            { label: "Leads", href: `/campaigns/${lead.campaignId}/leads` },
            { label: lead.companyName },
          ]}
        />
        
        {/* Header */}
        <div className="mb-6">
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">{lead.companyName}</h1>
              <div className="flex items-center gap-3">
                <Badge className={getStatusColor(lead.status)}>
                  {lead.status}
                </Badge>
                <span className="text-sm text-slate-500">
                  Confidence: {lead.confidenceScore}%
                </span>
                <span className="text-sm text-slate-500">
                  Data: {completenessScore}% complete
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleEnrich}
                variant="outline"
                disabled={enrichMutation.isPending}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Enrich
              </Button>
              <Link href={`/leads/${leadId}/email/${lead.campaignId}`}>
                <Button>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {lead.companyWebsite && (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Website</p>
                      <a
                        href={lead.companyWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Globe className="h-4 w-4" />
                        {lead.companyWebsite}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {lead.companyIndustry && (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Industry</p>
                      <p className="font-medium">{lead.companyIndustry}</p>
                    </div>
                  )}
                  {lead.companySize && (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Company Size</p>
                      <p className="font-medium flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {lead.companySize} employees
                      </p>
                    </div>
                  )}
                  {lead.companyRevenue && (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Revenue</p>
                      <p className="font-medium flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ${lead.companyRevenue.toLocaleString()}
                      </p>
                    </div>
                  )}
                  {lead.companyLocation && (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Location</p>
                      <p className="font-medium flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {lead.companyLocation}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {lead.contactName && (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Name</p>
                      <p className="font-medium">{lead.contactName}</p>
                    </div>
                  )}
                  {lead.contactJobTitle && (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Job Title</p>
                      <p className="font-medium">{lead.contactJobTitle}</p>
                    </div>
                  )}
                  {lead.contactEmail && (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Email</p>
                      <a
                        href={`mailto:${lead.contactEmail}`}
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Mail className="h-4 w-4" />
                        {lead.contactEmail}
                      </a>
                    </div>
                  )}
                  {lead.contactPhone && (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Phone</p>
                      <a
                        href={`tel:${lead.contactPhone}`}
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Phone className="h-4 w-4" />
                        {lead.contactPhone}
                      </a>
                    </div>
                  )}
                  {lead.contactLinkedin && (
                    <div className="col-span-2">
                      <p className="text-sm text-slate-500 mb-1">LinkedIn</p>
                      <a
                        href={lead.contactLinkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Linkedin className="h-4 w-4" />
                        {lead.contactLinkedin}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>
                  {activities.length} activities · {communications.length} communications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all">
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="activities">Activities</TabsTrigger>
                    <TabsTrigger value="communications">Communications</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="all" className="space-y-4 mt-4">
                    {[...activities, ...communications]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice(0, 10)
                      .map((item: any, idx) => (
                        <div key={idx} className="flex gap-3 pb-4 border-b last:border-0">
                          <div className="flex-shrink-0 mt-1">
                            {'activityType' in item ? (
                              <MessageSquare className="h-5 w-5 text-slate-400" />
                            ) : (
                              <Mail className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {'activityType' in item ? item.activityType : item.communicationType}
                            </p>
                            <p className="text-sm text-slate-600 mt-1">
                              {'notes' in item ? item.notes : `${item.direction} - ${item.status}`}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {new Date(item.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                  </TabsContent>
                  
                  <TabsContent value="activities" className="space-y-4 mt-4">
                    {activities.slice(0, 10).map((activity: any) => (
                      <div key={activity.id} className="flex gap-3 pb-4 border-b last:border-0">
                        <MessageSquare className="h-5 w-5 text-slate-400 mt-1" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{activity.activityType}</p>
                          <p className="text-sm text-slate-600 mt-1">{activity.notes}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="communications" className="space-y-4 mt-4">
                    {communications.slice(0, 10).map((comm: any) => (
                      <div key={comm.id} className="flex gap-3 pb-4 border-b last:border-0">
                        <Mail className="h-5 w-5 text-slate-400 mt-1" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{comm.communicationType}</p>
                          <p className="text-sm text-slate-600 mt-1">
                            {comm.direction} - {comm.status}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(comm.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={newStatus || lead.status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Update status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="responded">Responded</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="unqualified">Unqualified</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add a note..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={handleAddNote}
                    disabled={!note.trim() || addNoteMutation.isPending}
                    className="w-full"
                    size="sm"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Add Note
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lead Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Lead Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Confidence Score</span>
                    <span className="font-bold text-lg">{lead.confidenceScore}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${lead.confidenceScore}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Data Completeness</span>
                    <span className="font-bold text-lg">{completenessScore}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${completenessScore}%` }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Created</span>
                    <span className="font-medium">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {lead.lastContactedAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Last Contact</span>
                      <span className="font-medium">
                        {new Date(lead.lastContactedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
