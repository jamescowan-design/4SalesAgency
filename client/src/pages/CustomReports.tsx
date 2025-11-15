import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { 
  Download, 
  FileText, 
  Calendar,
  TrendingUp,
  Users,
  Mail,
  Phone,
  Target
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Breadcrumb from "@/components/Breadcrumb";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function CustomReports() {
  const [timeRange, setTimeRange] = useState("30");
  const [reportType, setReportType] = useState("overview");

  const { data: analytics } = trpc.analytics.getCampaignAnalytics.useQuery({
    campaignId: 1, // TODO: Make this dynamic
    timeRange: (timeRange === "7" ? "7d" : timeRange === "30" ? "30d" : "90d") as "7d" | "30d" | "90d",
  });

  const exportReport = (format: "csv" | "pdf") => {
    if (!analytics) return;

    if (format === "csv") {
      const headers = ["Metric", "Value"];
      const rows = [
        ["Total Leads", analytics.overview.totalLeads],
        ["Qualified Leads", analytics.overview.qualifiedLeads],
        ["Emails Sent", analytics.overview.emailsSent],
        ["Email Open Rate", `${analytics.overview.emailOpenRate}%`],
        ["Calls Made", analytics.overview.callsMade],
        ["Call Connect Rate", `${analytics.overview.callConnectRate}%`],
      ];

      const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${reportType}-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      
      toast.success("Report exported as CSV");
    } else {
      toast.info("PDF export coming soon");
    }
  };

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  const statusData = analytics?.leadStatusDistribution.map((item: any, index: number) => ({
    ...item,
    fill: COLORS[index % COLORS.length],
  })) || [];

  const conversionData = analytics?.conversionFunnel || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <Breadcrumb items={[
          { label: "Home", href: "/" },
          { label: "Analytics", href: "/analytics" },
          { label: "Custom Reports" }
        ]} />

        <div className="mb-8 mt-6">
          <h1 className="text-4xl font-bold mb-2">Custom Reports</h1>
          <p className="text-lg text-muted-foreground">
            Generate and export detailed performance reports
          </p>
        </div>

        {/* Report Controls */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <FileText className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Campaign Overview</SelectItem>
                  <SelectItem value="email">Email Performance</SelectItem>
                  <SelectItem value="calls">Call Performance</SelectItem>
                  <SelectItem value="leads">Lead Analysis</SelectItem>
                  <SelectItem value="conversion">Conversion Funnel</SelectItem>
                </SelectContent>
              </Select>

              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2 ml-auto">
                <Button onClick={() => exportReport("csv")} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button onClick={() => exportReport("pdf")} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Content */}
        {reportType === "overview" && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.overview?.totalLeads || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics?.overview?.qualifiedLeads || 0} qualified
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Email Performance</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.overview?.emailsSent || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics?.overview?.emailOpenRate || 0}% open rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Call Performance</CardTitle>
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics?.overview?.callsMade || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics?.overview?.callConnectRate || 0}% connect rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(analytics?.overview?.qualifiedLeads && analytics?.overview?.totalLeads 
                      ? (analytics.overview.qualifiedLeads / analytics.overview.totalLeads * 100).toFixed(1)
                      : 0)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics?.overview?.qualifiedLeads || 0} qualified
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lead Status Distribution</CardTitle>
                  <CardDescription>Breakdown of leads by status</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {statusData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Conversion Funnel</CardTitle>
                  <CardDescription>Lead progression through stages</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={conversionData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="stage" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Activity Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Trends</CardTitle>
                <CardDescription>Daily email and call activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics?.activityTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="emails" stroke="#3b82f6" name="Emails" />
                    <Line type="monotone" dataKey="calls" stroke="#10b981" name="Calls" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}

        {reportType === "email" && (
          <Card>
            <CardHeader>
              <CardTitle>Email Performance Report</CardTitle>
              <CardDescription>Detailed email campaign metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Sent</p>
                    <p className="text-2xl font-bold">{analytics?.overview?.emailsSent || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Opened</p>
                    <p className="text-2xl font-bold">{Math.round((analytics?.overview?.emailsSent || 0) * (analytics?.overview?.emailOpenRate || 0) / 100)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Clicked</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Replied</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics?.emailPerformance || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sent" fill="#3b82f6" name="Sent" />
                    <Bar dataKey="opened" fill="#10b981" name="Opened" />
                    <Bar dataKey="clicked" fill="#f59e0b" name="Clicked" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {reportType === "calls" && (
          <Card>
            <CardHeader>
              <CardTitle>Call Performance Report</CardTitle>
              <CardDescription>Detailed call campaign metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Calls</p>
                    <p className="text-2xl font-bold">{analytics?.overview?.callsMade || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Connected</p>
                    <p className="text-2xl font-bold">{Math.round((analytics?.overview?.callsMade || 0) * (analytics?.overview?.callConnectRate || 0) / 100)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Duration</p>
                    <p className="text-2xl font-bold">0s</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Connect Rate</p>
                    <p className="text-2xl font-bold">{analytics?.overview?.callConnectRate || 0}%</p>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics?.activityTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="calls" stroke="#10b981" name="Calls Made" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
