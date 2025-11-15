import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import {
  Zap,
  Clock,
  Mail,
  Phone,
  Bell,
  PlayCircle,
  PauseCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export default function WorkflowAutomation() {
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    triggerType: "inactivity",
    triggerDays: 7,
    actionType: "send_email",
    isActive: true,
  });

  const { data: user } = trpc.auth.me.useQuery();
  const { data: clients } = trpc.clients.list.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: workflows, refetch } = trpc.workflows.list.useQuery(
    { campaignId: selectedCampaign! },
    { enabled: !!selectedCampaign }
  );

  const createWorkflowMutation = trpc.workflows.create.useMutation({
    onSuccess: () => {
      toast.success("Workflow created successfully");
      setShowCreateForm(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Failed to create workflow: ${error.message}`);
    },
  });

  const toggleWorkflowMutation = trpc.workflows.toggle.useMutation({
    onSuccess: () => {
      toast.success("Workflow updated");
      refetch();
    },
  });

  const deleteWorkflowMutation = trpc.workflows.delete.useMutation({
    onSuccess: () => {
      toast.success("Workflow deleted");
      refetch();
    },
  });

  const handleCreateWorkflow = () => {
    if (!selectedCampaign) return;

    createWorkflowMutation.mutate({
      campaignId: selectedCampaign,
      triggerType: newWorkflow.triggerType as any,
      triggerConfig: {
        days: newWorkflow.triggerDays,
      },
      actionType: newWorkflow.actionType as any,
      actionConfig: {},
      isActive: newWorkflow.isActive,
    });
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case "inactivity":
        return <Clock className="h-4 w-4" />;
      case "time_based":
        return <Clock className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case "send_email":
        return <Mail className="h-4 w-4" />;
      case "make_call":
        return <Phone className="h-4 w-4" />;
      case "notify_owner":
        return <Bell className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            Workflow Automation
          </h1>
          <p className="text-slate-600 mt-2">
            Automate follow-ups and lead nurturing with intelligent workflows
          </p>
        </div>

        {/* Campaign Selector */}
        {!selectedCampaign && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients?.map((client) => (
              <Card key={client.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>{client.name}</CardTitle>
                  <CardDescription>Manage automation workflows</CardDescription>
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

        {/* Workflow Management */}
        {selectedCampaign && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setSelectedCampaign(null)}
              >
                ← Back to Campaigns
              </Button>
              <Button onClick={() => setShowCreateForm(!showCreateForm)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow
              </Button>
            </div>

            {/* Create Workflow Form */}
            {showCreateForm && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Create New Workflow</CardTitle>
                  <CardDescription>
                    Set up automated actions based on triggers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Trigger Type</Label>
                      <Select
                        value={newWorkflow.triggerType}
                        onValueChange={(v) =>
                          setNewWorkflow({ ...newWorkflow, triggerType: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inactivity">
                            Inactivity (No contact in X days)
                          </SelectItem>
                          <SelectItem value="status_change">
                            Status Change
                          </SelectItem>
                          <SelectItem value="time_based">
                            Time-based Schedule
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {newWorkflow.triggerType === "inactivity" && (
                      <div className="space-y-2">
                        <Label>Days of Inactivity</Label>
                        <Input
                          type="number"
                          value={newWorkflow.triggerDays}
                          onChange={(e) =>
                            setNewWorkflow({
                              ...newWorkflow,
                              triggerDays: parseInt(e.target.value),
                            })
                          }
                          min={1}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Action Type</Label>
                      <Select
                        value={newWorkflow.actionType}
                        onValueChange={(v) =>
                          setNewWorkflow({ ...newWorkflow, actionType: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="send_email">Send Email</SelectItem>
                          <SelectItem value="make_call">Schedule Call</SelectItem>
                          <SelectItem value="update_status">
                            Update Status
                          </SelectItem>
                          <SelectItem value="notify_owner">
                            Notify Owner
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 flex items-center gap-2">
                      <Switch
                        checked={newWorkflow.isActive}
                        onCheckedChange={(checked) =>
                          setNewWorkflow({ ...newWorkflow, isActive: checked })
                        }
                      />
                      <Label>Active</Label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleCreateWorkflow} className="flex-1">
                      Create Workflow
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Workflow List */}
            <div className="space-y-4">
              {workflows && workflows.length > 0 ? (
                workflows.map((workflow: any) => (
                  <Card key={workflow.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center gap-2 bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-sm font-medium">
                              {getTriggerIcon(workflow.triggerType)}
                              {workflow.triggerType === "inactivity"
                                ? `No contact in ${workflow.triggerConfig.days} days`
                                : workflow.triggerType.replace("_", " ")}
                            </div>
                            <span className="text-slate-400">→</span>
                            <div className="flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                              {getActionIcon(workflow.actionType)}
                              {workflow.actionType.replace("_", " ")}
                            </div>
                            <Badge
                              variant={workflow.isActive ? "default" : "secondary"}
                            >
                              {workflow.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>

                          <div className="text-sm text-slate-600">
                            <p>
                              When a lead has no activity for{" "}
                              {workflow.triggerConfig.days} days, automatically{" "}
                              {workflow.actionType.replace("_", " ").toLowerCase()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              toggleWorkflowMutation.mutate({
                                id: workflow.id,
                                isActive: !workflow.isActive,
                              })
                            }
                          >
                            {workflow.isActive ? (
                              <PauseCircle className="h-4 w-4" />
                            ) : (
                              <PlayCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              deleteWorkflowMutation.mutate({ id: workflow.id })
                            }
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Zap className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      No Workflows Yet
                    </h3>
                    <p className="text-slate-600 mb-4">
                      Create your first workflow to automate lead nurturing
                    </p>
                    <Button onClick={() => setShowCreateForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Workflow
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Workflow Templates */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Workflow Templates</CardTitle>
                <CardDescription>
                  Quick-start templates for common scenarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="border rounded-lg p-4 hover:border-violet-300 transition-colors cursor-pointer">
                    <h4 className="font-semibold mb-2">7-Day Follow-up</h4>
                    <p className="text-sm text-slate-600 mb-3">
                      Send follow-up email after 7 days of no contact
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast.info("Feature coming soon")}
                    >
                      Use Template
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4 hover:border-violet-300 transition-colors cursor-pointer">
                    <h4 className="font-semibold mb-2">Re-engagement Campaign</h4>
                    <p className="text-sm text-slate-600 mb-3">
                      Call leads after 14 days of inactivity
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast.info("Feature coming soon")}
                    >
                      Use Template
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4 hover:border-violet-300 transition-colors cursor-pointer">
                    <h4 className="font-semibold mb-2">Status Progression</h4>
                    <p className="text-sm text-slate-600 mb-3">
                      Auto-update status based on engagement
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast.info("Feature coming soon")}
                    >
                      Use Template
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4 hover:border-violet-300 transition-colors cursor-pointer">
                    <h4 className="font-semibold mb-2">Owner Alerts</h4>
                    <p className="text-sm text-slate-600 mb-3">
                      Notify when high-value leads need attention
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast.info("Feature coming soon")}
                    >
                      Use Template
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
