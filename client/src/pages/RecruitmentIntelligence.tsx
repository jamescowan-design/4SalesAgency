import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { 
  Briefcase, TrendingUp, Users, DollarSign, 
  ExternalLink, RefreshCw, Search, Filter 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RecruitmentIntelligence() {
  const [searchTerm, setSearchTerm] = useState("");
  const [signalType, setSignalType] = useState("all");

  const { data: hiringSignals, isLoading, refetch } = trpc.recruitment.getHiringSignals.useQuery({
    limit: 50,
    signalType: signalType === "all" ? undefined : signalType,
  });

  const { data: stats } = trpc.recruitment.getStats.useQuery();

  const filteredSignals = hiringSignals?.filter(signal =>
    signal.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    signal.signalType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSignalBadgeColor = (type: string) => {
    switch (type) {
      case "job_posting": return "bg-blue-500";
      case "funding": return "bg-green-500";
      case "expansion": return "bg-purple-500";
      case "leadership_change": return "bg-orange-500";
      default: return "bg-gray-500";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high": return "text-red-600";
      case "medium": return "text-yellow-600";
      case "low": return "text-green-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Recruitment Intelligence</h1>
        <p className="text-muted-foreground">
          Track hiring signals, job postings, and company growth indicators
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Signals</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSignals || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.newThisWeek || 0} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Job Postings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.jobPostings || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across {stats?.companiesHiring || 0} companies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funding Events</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.fundingEvents || 0}</div>
            <p className="text-xs text-muted-foreground">
              ${stats?.totalFunding || 0}M raised
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expansion Signals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.expansions || 0}</div>
            <p className="text-xs text-muted-foreground">
              New offices & growth
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Hiring Signals</CardTitle>
              <CardDescription>
                Real-time intelligence on companies actively hiring
              </CardDescription>
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies or signals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={signalType} onValueChange={setSignalType}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Signals" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Signals</SelectItem>
                <SelectItem value="job_posting">Job Postings</SelectItem>
                <SelectItem value="funding">Funding</SelectItem>
                <SelectItem value="expansion">Expansion</SelectItem>
                <SelectItem value="leadership_change">Leadership Change</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Signals List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading hiring signals...
              </div>
            ) : filteredSignals && filteredSignals.length > 0 ? (
              filteredSignals.map((signal) => (
                <Card key={signal.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{signal.companyName}</h3>
                          <Badge className={getSignalBadgeColor(signal.signalType)}>
                            {signal.signalType.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className={getUrgencyColor(signal.urgency)}>
                            {signal.urgency} urgency
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">{signal.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Source: {signal.source}</span>
                          <span>•</span>
                          <span>Detected: {new Date(signal.detectedAt).toLocaleDateString()}</span>
                          {signal.metadata && typeof signal.metadata === 'object' && 'jobCount' in signal.metadata ? (
                            <>
                              <span>•</span>
                              <span>{(signal.metadata as any).jobCount} open positions</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {signal.sourceUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={signal.sourceUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              View
                            </a>
                          </Button>
                        )}
                        <Button size="sm">
                          Create Lead
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hiring signals found. Run the web scraper to discover opportunities.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Insights Tab */}
      <Tabs defaultValue="signals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="signals">All Signals</TabsTrigger>
          <TabsTrigger value="trending">Trending Industries</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="signals" className="space-y-4">
          {/* Already shown above */}
        </TabsContent>

        <TabsContent value="trending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trending Industries</CardTitle>
              <CardDescription>Industries with the most hiring activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.trendingIndustries?.map((industry: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{industry.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {industry.signalCount} signals • {industry.jobCount} jobs
                      </p>
                    </div>
                    <Badge>{industry.growth}% growth</Badge>
                  </div>
                )) || (
                  <p className="text-center text-muted-foreground py-4">
                    No trending data available yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recommended Actions</CardTitle>
              <CardDescription>AI-powered suggestions based on hiring signals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                  <h4 className="font-semibold mb-2">High Priority: SaaS Companies</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    15 SaaS companies posted new sales roles this week. These are prime targets for outreach.
                  </p>
                  <Button size="sm">Create Campaign</Button>
                </div>
                
                <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                  <h4 className="font-semibold mb-2">Funding Alert: FinTech</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    3 FinTech companies raised Series B funding. They'll be scaling their teams soon.
                  </p>
                  <Button size="sm">View Companies</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
