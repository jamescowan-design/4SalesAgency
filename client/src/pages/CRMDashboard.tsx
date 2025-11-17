import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  ExternalLink, 
  MoreVertical,
  Download,
  Trash2,
  Edit,
  CheckSquare,
  Square,
  Calendar,
  MessageSquare,
  TrendingUp,
  Users
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import Breadcrumb from "@/components/Breadcrumb";
import AddLeadDialog from "@/components/AddLeadDialog";

export default function CRMDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLeads, setSelectedLeads] = useState<Set<number>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteLeadId, setNoteLeadId] = useState<number | null>(null);
  const [noteContent, setNoteContent] = useState("");

  const { data: leads, isLoading } = trpc.leads.list.useQuery();
  const { data: stats } = trpc.leads.getStats.useQuery();
  
  const utils = trpc.useUtils();
  
  const updateLeadStatus = trpc.leads.updateStatus.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      utils.leads.getStats.invalidate();
      toast.success("Lead status updated");
    },
  });

  const bulkUpdateStatus = trpc.leads.bulkUpdateStatus.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      utils.leads.getStats.invalidate();
      setSelectedLeads(new Set());
      toast.success("Bulk update completed");
    },
  });

  const deleteLeads = trpc.leads.bulkDelete.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      utils.leads.getStats.invalidate();
      setSelectedLeads(new Set());
      toast.success("Leads deleted");
    },
  });

  const addNote = trpc.activities.create.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      setShowNoteDialog(false);
      setNoteContent("");
      toast.success("Note added");
    },
  });

  const filteredLeads = (leads?.filter((lead: any) => {
    const matchesSearch = !searchQuery || 
      lead.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || []) as any[];

  const handleSelectLead = (leadId: number, index: number, event: React.MouseEvent) => {
    const newSelected = new Set(selectedLeads);
    
    if (event.shiftKey && lastSelectedIndex !== null) {
      // Shift+Click: Select range
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      for (let i = start; i <= end; i++) {
        if (filteredLeads[i]) {
          newSelected.add(filteredLeads[i].id);
        }
      }
    } else {
      // Regular click: Toggle selection
      if (newSelected.has(leadId)) {
        newSelected.delete(leadId);
      } else {
        newSelected.add(leadId);
      }
    }
    
    setSelectedLeads(newSelected);
    setLastSelectedIndex(index);
  };

  const handleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const handleBulkStatusUpdate = (status: string) => {
    if (selectedLeads.size === 0) return;
    
    bulkUpdateStatus.mutate({
      leadIds: Array.from(selectedLeads),
      status: status as any,
    });
  };

  const handleBulkDelete = () => {
    if (selectedLeads.size === 0) return;
    
    if (confirm(`Delete ${selectedLeads.size} leads? This cannot be undone.`)) {
      deleteLeads.mutate({
        leadIds: Array.from(selectedLeads),
      });
    }
  };

  const handleAddNote = (leadId: number) => {
    setNoteLeadId(leadId);
    setShowNoteDialog(true);
  };

  const submitNote = () => {
    if (!noteLeadId || !noteContent.trim()) return;
    
    addNote.mutate({
      leadId: noteLeadId,
      campaignId: 1, // TODO: Get from lead
      activityType: "note",
      description: noteContent,
    });
  };

  const exportToCSV = () => {
    const leadsToExport = selectedLeads.size > 0 
      ? filteredLeads.filter(l => selectedLeads.has(l.id))
      : filteredLeads;

    const headers = ["Company", "Contact", "Email", "Phone", "Status", "Confidence", "Created"];
    const rows = leadsToExport.map(lead => [
      lead.companyName,
      lead.contactName || "",
      lead.contactEmail || "",
      lead.contactPhone || "",
      lead.status,
      lead.confidenceScore || "",
      new Date(lead.createdAt).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    
    toast.success(`Exported ${leadsToExport.length} leads`);
  };

  const statusColors: Record<string, string> = {
    new: "bg-blue-500",
    contacted: "bg-yellow-500",
    responded: "bg-purple-500",
    qualified: "bg-green-500",
    unqualified: "bg-red-500",
    converted: "bg-emerald-500",
    rejected: "bg-gray-500",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading CRM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <Breadcrumb items={[
          { label: "Home", href: "/" },
          { label: "CRM Dashboard" }
        ]} />

        <div className="mb-8 mt-6">
          <h1 className="text-4xl font-bold mb-2">CRM Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Manage all your leads in one place
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Qualified</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.qualified || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Contacted</CardTitle>
              <MessageSquare className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats?.contacted || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Converted</CardTitle>
              <CheckSquare className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{stats?.converted || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads by company, contact, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
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

              <AddLeadDialog />
              
              <Button onClick={exportToCSV} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions Bar */}
        {selectedLeads.size > 0 && (
          <Card className="mb-4 border-primary">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedLeads.size} lead{selectedLeads.size > 1 ? "s" : ""} selected
                </span>
                <div className="flex gap-2">
                  <Select onValueChange={handleBulkStatusUpdate}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Update status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contacted">Mark as Contacted</SelectItem>
                      <SelectItem value="qualified">Mark as Qualified</SelectItem>
                      <SelectItem value="unqualified">Mark as Unqualified</SelectItem>
                      <SelectItem value="converted">Mark as Converted</SelectItem>
                      <SelectItem value="rejected">Mark as Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={() => setSelectedLeads(new Set())}>
                    Clear Selection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leads Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No leads found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead: any, index: number) => (
                    <TableRow 
                      key={lead.id}
                      className={selectedLeads.has(lead.id) ? "bg-muted/50" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedLeads.has(lead.id)}
                          onCheckedChange={(e) => handleSelectLead(lead.id, index, e as any)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link href={`/leads/${lead.id}`} className="hover:underline">
                          {lead.companyName}
                        </Link>
                      </TableCell>
                      <TableCell>{lead.contactName || "-"}</TableCell>
                      <TableCell>{lead.contactEmail || "-"}</TableCell>
                      <TableCell>{lead.contactPhone || "-"}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[lead.status]}>
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {lead.confidenceScore ? (
                          <Badge variant="outline">{lead.confidenceScore}%</Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddNote(lead.id)}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Link href={`/leads/${lead.id}`}>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Note Dialog */}
        <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Note</DialogTitle>
              <DialogDescription>
                Add a note or task for this lead
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Enter your note..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={5}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
                Cancel
              </Button>
              <Button onClick={submitNote} disabled={!noteContent.trim()}>
                Save Note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
