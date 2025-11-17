import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Search, Filter, Mail, Phone, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "wouter";
import AddLeadDialog from "@/components/AddLeadDialog";

export default function LeadsList() {
  const params = useParams();
  const campaignId = parseInt(params.campaignId || "0");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: campaign } = trpc.campaigns.getById.useQuery({ id: campaignId });
  const { data: leads, isLoading } = trpc.leads.listByCampaign.useQuery({ campaignId });

  const utils = trpc.useUtils();
  const updateLeadStatus = trpc.leads.updateStatus.useMutation({
    onSuccess: () => {
      utils.leads.listByCampaign.invalidate({ campaignId });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading leads...</p>
        </div>
      </div>
    );
  }

  const filteredLeads = leads?.filter((lead) => {
    const matchesSearch = !searchQuery || 
      lead.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const statusColors = {
    new: "bg-blue-500",
    contacted: "bg-yellow-500",
    responded: "bg-purple-500",
    qualified: "bg-green-500",
    unqualified: "bg-red-500",
    converted: "bg-emerald-500",
    rejected: "bg-gray-500",
  };

  const statusCounts = {
    all: leads?.length || 0,
    new: leads?.filter(l => l.status === "new").length || 0,
    contacted: leads?.filter(l => l.status === "contacted").length || 0,
    qualified: leads?.filter(l => l.status === "qualified").length || 0,
    converted: leads?.filter(l => l.status === "converted").length || 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <div className="container py-8">
        <Button variant="ghost" className="mb-6" onClick={() => window.location.href = `/campaigns/${campaignId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaign
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Leads</h1>
          <p className="text-lg text-muted-foreground">
            {campaign?.name || `Campaign #${campaignId}`}
          </p>
        </div>

        {/* Status Filter Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card 
            className={`cursor-pointer transition-all ${statusFilter === "all" ? "ring-2 ring-primary" : "hover:shadow-md"}`}
            onClick={() => setStatusFilter("all")}
          >
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">All Leads</p>
              <p className="text-3xl font-bold">{statusCounts.all}</p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${statusFilter === "new" ? "ring-2 ring-primary" : "hover:shadow-md"}`}
            onClick={() => setStatusFilter("new")}
          >
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">New</p>
              <p className="text-3xl font-bold text-blue-500">{statusCounts.new}</p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${statusFilter === "contacted" ? "ring-2 ring-primary" : "hover:shadow-md"}`}
            onClick={() => setStatusFilter("contacted")}
          >
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Contacted</p>
              <p className="text-3xl font-bold text-yellow-500">{statusCounts.contacted}</p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${statusFilter === "qualified" ? "ring-2 ring-primary" : "hover:shadow-md"}`}
            onClick={() => setStatusFilter("qualified")}
          >
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Qualified</p>
              <p className="text-3xl font-bold text-green-500">{statusCounts.qualified}</p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all ${statusFilter === "converted" ? "ring-2 ring-primary" : "hover:shadow-md"}`}
            onClick={() => setStatusFilter("converted")}
          >
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Converted</p>
              <p className="text-3xl font-bold text-emerald-500">{statusCounts.converted}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-center">
              <AddLeadDialog campaignId={campaignId} />
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by company, contact name, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="responded">Responded</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="unqualified">Unqualified</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card>
          <CardContent className="pt-6">
            {filteredLeads.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No leads found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {statusFilter !== "all" 
                    ? "Try changing the status filter" 
                    : "Start generating leads for this campaign"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead className="text-center">Confidence</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Contact</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{lead.companyName}</p>
                          {lead.companyWebsite && (
                            <a 
                              href={lead.companyWebsite} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {lead.companyWebsite.replace(/^https?:\/\//, '')}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {lead.contactName && <p className="font-medium">{lead.contactName}</p>}
                          {lead.contactEmail && (
                            <p className="text-sm text-muted-foreground">{lead.contactEmail}</p>
                          )}
                          {lead.contactJobTitle && (
                            <p className="text-xs text-muted-foreground">{lead.contactJobTitle}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {lead.companyIndustry && <p className="text-sm">{lead.companyIndustry}</p>}
                          {lead.companyLocation && (
                            <p className="text-xs text-muted-foreground">{lead.companyLocation}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-2xl font-bold">{lead.confidenceScore || 0}</span>
                          <span className="text-xs text-muted-foreground">/ 100</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={lead.status}
                          onValueChange={(value) => updateLeadStatus.mutate({ id: lead.id, status: value as any })}
                        >
                          <SelectTrigger className="w-[140px]" onClick={(e) => e.stopPropagation()}>
                            <Badge className={`${statusColors[lead.status as keyof typeof statusColors]} text-white`}>
                              {lead.status}
                            </Badge>
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
                      </TableCell>
                      <TableCell>
                        {lead.lastContactedAt ? (
                          <span className="text-sm">
                            {new Date(lead.lastContactedAt).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {lead.contactEmail && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `mailto:${lead.contactEmail}`;
                              }}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                          {lead.contactPhone && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `tel:${lead.contactPhone}`;
                              }}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                          )}
                          <Link href={`/leads/${lead.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
