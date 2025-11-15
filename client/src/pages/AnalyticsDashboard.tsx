import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Mail,
  Phone,
  Target,
  DollarSign,
  Activity,
} from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function AnalyticsDashboard() {
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  const { data: user } = trpc.auth.me.useQuery();
  const { data: clients } = trpc.clients.list.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: analytics, isLoading } = trpc.analytics.getCampaignAnalytics.useQuery(
    { campaignId: selectedCampaign!, timeRange },
    { enabled: !!selectedCampaign }
  );

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatPercent = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-slate-600 mt-2">
            Track campaign performance and optimize your outreach strategy
          </p>
        </div>

        {/* Campaign Selector */}
        {!selectedCampaign && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients?.map((client) => (
              <Card key={client.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>{client.name}</CardTitle>
                  <CardDescription>View campaign analytics</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setSelectedCampaign(client.id)}
                    className="w-full"
                  >
                    View Analytics
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Analytics View */}
        {selectedCampaign && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setSelectedCampaign(null)}
              >
                ← Back to Campaigns
              </Button>
              <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-slate-600">Loading analytics...</p>
              </div>
            ) : analytics ? (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Total Leads
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-purple-600">
                        {formatNumber(analytics.overview.totalLeads)}
                      </div>
                      {analytics.overview.leadsGrowth !== undefined && (
                        <div className={`text-sm flex items-center gap-1 mt-1 ${analytics.overview.leadsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {analytics.overview.leadsGrowth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {formatPercent(Math.abs(analytics.overview.leadsGrowth))} vs last period
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Qualified Leads
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">
                        {formatNumber(analytics.overview.qualifiedLeads)}
                      </div>
                      <div className="text-sm text-slate-600 mt-1">
                        {formatPercent((analytics.overview.qualifiedLeads / analytics.overview.totalLeads) * 100)} conversion
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Emails Sent
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">
                        {formatNumber(analytics.overview.emailsSent)}
                      </div>
                      <div className="text-sm text-slate-600 mt-1">
                        {formatPercent(analytics.overview.emailOpenRate)}open rate
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Calls Made
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-600">
                        {formatNumber(analytics.overview.callsMade)}
                      </div>
                      <div className="text-sm text-slate-600 mt-1">
                        {formatPercent(analytics.overview.callConnectRate)} connect rate
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Row 1 */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Lead Status Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Lead Status Distribution</CardTitle>
                      <CardDescription>Current status of all leads</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={analytics.leadStatusDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry.name}: ${entry.value}`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {analytics.leadStatusDistribution.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Activity Trends */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Activity Trends</CardTitle>
                      <CardDescription>Daily outreach activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analytics.activityTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="emails" stroke="#3b82f6" strokeWidth={2} />
                          <Line type="monotone" dataKey="calls" stroke="#f59e0b" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts Row 2 */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Email Performance */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Email Performance</CardTitle>
                      <CardDescription>Engagement metrics over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.emailPerformance}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="sent" fill="#3b82f6" />
                          <Bar dataKey="opened" fill="#10b981" />
                          <Bar dataKey="clicked" fill="#f59e0b" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Conversion Funnel */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Conversion Funnel</CardTitle>
                      <CardDescription>Lead progression through stages</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.conversionFunnel} layout="horizontal">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="stage" type="category" width={100} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8b5cf6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Performers */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Leads</CardTitle>
                    <CardDescription>Highest engagement scores</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.topLeads.map((lead: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900">{lead.companyName}</h4>
                            <p className="text-sm text-slate-600">{lead.contactName}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-purple-600">{lead.score}</div>
                            <div className="text-xs text-slate-600">Engagement Score</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Activity className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    No Analytics Data
                  </h3>
                  <p className="text-slate-600">
                    Start adding leads and activities to see analytics.
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
