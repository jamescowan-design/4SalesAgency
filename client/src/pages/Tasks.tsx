import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { 
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  Mail,
  Users,
  Search,
  Filter,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import AddTaskDialog from "@/components/AddTaskDialog";
import Breadcrumb from "@/components/Breadcrumb";
// Using native date formatting instead of date-fns

export default function Tasks() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const { data: tasks, isLoading } = trpc.tasks.list.useQuery();
  const { data: stats } = trpc.tasks.getStats.useQuery();
  const utils = trpc.useUtils();

  const completeTask = trpc.tasks.complete.useMutation({
    onSuccess: () => {
      toast.success("Task completed");
      utils.tasks.list.invalidate();
      utils.tasks.getStats.invalidate();
    },
  });

  const deleteTask = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      toast.success("Task deleted");
      utils.tasks.list.invalidate();
      utils.tasks.getStats.invalidate();
    },
  });

  const updateStatus = trpc.tasks.updateStatus.useMutation({
    onSuccess: () => {
      utils.tasks.list.invalidate();
      utils.tasks.getStats.invalidate();
    },
  });

  const filteredTasks = tasks?.filter((task: any) => {
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    return matchesStatus && matchesPriority;
  }) || [];

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case "call": return <Phone className="h-4 w-4" />;
      case "email": return <Mail className="h-4 w-4" />;
      case "meeting": return <Users className="h-4 w-4" />;
      default: return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-red-500 bg-red-50 border-red-200";
      case "high": return "text-orange-500 bg-orange-50 border-orange-200";
      case "medium": return "text-yellow-500 bg-yellow-50 border-yellow-200";
      case "low": return "text-blue-500 bg-blue-50 border-blue-200";
      default: return "text-gray-500 bg-gray-50 border-gray-200";
    }
  };

  const isOverdue = (dueDate: Date | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <Breadcrumb items={[
          { label: "Home", href: "/" },
          { label: "Tasks" }
        ]} />

        <div className="mb-8 mt-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">Tasks & Follow-ups</h1>
            <p className="text-lg text-muted-foreground">
              Manage your action items and reminders
            </p>
          </div>
          <AddTaskDialog />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats?.pending || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats?.completed || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats?.overdue || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No tasks found</p>
                <p className="text-muted-foreground mb-4">
                  {statusFilter !== "all" || priorityFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Create your first task to get started"}
                </p>
                <AddTaskDialog />
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map((task: any) => (
              <Card key={task.id} className={`${task.status === "completed" ? "opacity-60" : ""}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={task.status === "completed"}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          completeTask.mutate({ id: task.id });
                        } else {
                          updateStatus.mutate({ id: task.id, status: "pending" });
                        }
                      }}
                      className="mt-1"
                    />

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getTaskIcon(task.taskType)}
                        <h3 className={`font-semibold ${task.status === "completed" ? "line-through" : ""}`}>
                          {task.title}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        {isOverdue(task.dueDate) && task.status !== "completed" && (
                          <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                            Overdue
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {task.dueDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(task.dueDate).toLocaleString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric', 
                              hour: 'numeric', 
                              minute: '2-digit', 
                              hour12: true 
                            })}
                          </div>
                        )}
                        <span className="capitalize">{task.taskType.replace("_", " ")}</span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this task?")) {
                          deleteTask.mutate({ id: task.id });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
