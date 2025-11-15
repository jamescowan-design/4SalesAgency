import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Briefcase, Users, TrendingUp, Code, Building2, DollarSign, Rocket } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface CampaignTemplate {
  id: string;
  name: string;
  industry: string;
  description: string;
  icon: any;
  icp: {
    industries: string[];
    companySize: string[];
    revenue: string[];
    location: string[];
    technologies?: string[];
  };
  emailSequence: {
    day: number;
    subject: string;
    body: string;
  }[];
  workflow: {
    name: string;
    triggerType: string;
    actionType: string;
  }[];
}

const templates: CampaignTemplate[] = [
  {
    id: "saas-outbound",
    name: "SaaS Outbound Sales",
    industry: "SaaS",
    description: "Target fast-growing SaaS companies with 50-500 employees. Includes 5-email sequence and automated follow-ups.",
    icon: Rocket,
    icp: {
      industries: ["SaaS", "Software", "Technology"],
      companySize: ["50-100", "100-250", "250-500"],
      revenue: ["$5M-$10M", "$10M-$25M", "$25M-$50M"],
      location: ["United States", "Canada", "United Kingdom"],
      technologies: ["Cloud", "API", "Microservices"],
    },
    emailSequence: [
      {
        day: 0,
        subject: "Quick question about {{companyName}}'s growth",
        body: "Hi {{firstName}},\n\nI noticed {{companyName}} has been expanding rapidly in the {{industry}} space. We've helped similar companies like [Customer] achieve [Result].\n\nWould you be open to a quick 15-minute call to discuss how we could help {{companyName}} scale even faster?\n\nBest regards,\n{{senderName}}",
      },
      {
        day: 3,
        subject: "Re: Quick question about {{companyName}}'s growth",
        body: "Hi {{firstName}},\n\nI wanted to follow up on my previous email. I understand you're busy, so I'll keep this brief.\n\nWe specialize in helping SaaS companies like yours streamline their sales process and increase conversion rates by an average of 35%.\n\nWould next Tuesday or Wednesday work for a brief call?\n\nBest,\n{{senderName}}",
      },
      {
        day: 7,
        subject: "Case study: How [Customer] increased revenue by 45%",
        body: "Hi {{firstName}},\n\nI thought you might find this case study interesting. [Customer], a company similar to {{companyName}}, used our platform to:\n\n• Increase qualified leads by 60%\n• Reduce sales cycle by 30%\n• Boost revenue by 45%\n\nI'd love to show you how we could achieve similar results for {{companyName}}.\n\nInterested in learning more?\n\nBest,\n{{senderName}}",
      },
      {
        day: 14,
        subject: "Last attempt - exclusive offer for {{companyName}}",
        body: "Hi {{firstName}},\n\nI haven't heard back from you, so I'll assume the timing isn't right.\n\nBefore I close your file, I wanted to extend an exclusive offer: a free 30-day trial of our platform, plus a complimentary strategy session with our team.\n\nThis offer expires in 48 hours. Interested?\n\nBest,\n{{senderName}}",
      },
      {
        day: 30,
        subject: "Checking in - any updates on your priorities?",
        body: "Hi {{firstName}},\n\nIt's been a month since we last connected. I wanted to reach out one final time to see if your priorities have shifted.\n\nIf now isn't the right time, I completely understand. Feel free to reach out whenever you're ready to explore how we can help {{companyName}} grow.\n\nBest wishes,\n{{senderName}}",
      },
    ],
    workflow: [
      {
        name: "Follow-up unopened emails",
        triggerType: "inactivity",
        actionType: "send_email",
      },
      {
        name: "Notify on qualified",
        triggerType: "status_change",
        actionType: "notify_owner",
      },
    ],
  },
  {
    id: "recruiting-outbound",
    name: "Recruiting Services",
    industry: "Recruiting",
    description: "Target companies with active hiring signals. Focuses on HR leaders and hiring managers at growing companies.",
    icon: Users,
    icp: {
      industries: ["Technology", "Healthcare", "Finance", "Manufacturing"],
      companySize: ["100-250", "250-500", "500-1000"],
      revenue: ["$10M-$25M", "$25M-$50M", "$50M-$100M"],
      location: ["United States", "Canada"],
    },
    emailSequence: [
      {
        day: 0,
        subject: "Noticed you're hiring - can we help?",
        body: "Hi {{firstName}},\n\nI saw that {{companyName}} has {{jobCount}} open positions on your careers page. Congrats on the growth!\n\nWe specialize in helping companies like yours fill technical roles 40% faster while reducing cost-per-hire.\n\nWould you be interested in learning how we've helped [Customer] build their engineering team?\n\nBest,\n{{senderName}}",
      },
      {
        day: 4,
        subject: "Re: Noticed you're hiring",
        body: "Hi {{firstName}},\n\nJust following up on my previous email. I know hiring is a top priority right now, and I'd love to share how we can help.\n\nWe have a database of pre-vetted candidates in {{industry}} and can present qualified candidates within 48 hours.\n\nAre you available for a quick call this week?\n\nBest,\n{{senderName}}",
      },
      {
        day: 10,
        subject: "Free talent market report for {{companyName}}",
        body: "Hi {{firstName}},\n\nI wanted to provide value regardless of whether we work together.\n\nI've prepared a custom talent market report for {{companyName}} showing:\n• Salary benchmarks for your open roles\n• Competitor hiring activity\n• Best sourcing channels for your industry\n\nWould you like me to send it over?\n\nBest,\n{{senderName}}",
      },
    ],
    workflow: [
      {
        name: "Detect new job postings",
        triggerType: "time_based",
        actionType: "send_email",
      },
      {
        name: "Alert on hiring signals",
        triggerType: "status_change",
        actionType: "notify_owner",
      },
    ],
  },
  {
    id: "consulting-outbound",
    name: "Consulting Services",
    industry: "Consulting",
    description: "Target mid-market companies needing strategic consulting. Emphasizes thought leadership and expertise.",
    icon: Briefcase,
    icp: {
      industries: ["Professional Services", "Financial Services", "Healthcare", "Retail"],
      companySize: ["250-500", "500-1000", "1000+"],
      revenue: ["$25M-$50M", "$50M-$100M", "$100M+"],
      location: ["United States", "Canada", "United Kingdom", "Australia"],
    },
    emailSequence: [
      {
        day: 0,
        subject: "Insight on {{companyName}}'s market position",
        body: "Hi {{firstName}},\n\nI've been following {{companyName}}'s progress in the {{industry}} sector and noticed some interesting trends that might impact your strategy.\n\nWe recently completed a study showing that companies in your position can increase market share by 25% through [specific approach].\n\nWould you be interested in a brief discussion about what we're seeing in your market?\n\nBest regards,\n{{senderName}}",
      },
      {
        day: 5,
        subject: "Re: Insight on {{companyName}}'s market position",
        body: "Hi {{firstName}},\n\nI wanted to follow up with a specific example that might resonate.\n\nWe helped [Customer], a {{industry}} company similar to {{companyName}}, navigate [challenge] and achieve [result].\n\nI'd be happy to share the case study and discuss potential applications for {{companyName}}.\n\nInterested?\n\nBest,\n{{senderName}}",
      },
      {
        day: 12,
        subject: "Complimentary strategy session for {{companyName}}",
        body: "Hi {{firstName}},\n\nI'd like to offer {{companyName}} a complimentary 60-minute strategy session with our senior partners.\n\nWe'll discuss:\n• Market trends affecting your business\n• Competitive positioning opportunities\n• Strategic initiatives for 2025\n\nNo strings attached - just valuable insights for your team.\n\nWould next week work?\n\nBest,\n{{senderName}}",
      },
    ],
    workflow: [
      {
        name: "Nurture with content",
        triggerType: "inactivity",
        actionType: "send_email",
      },
    ],
  },
  {
    id: "fintech-outbound",
    name: "FinTech Solutions",
    industry: "Financial Technology",
    description: "Target financial institutions and fintech companies. Emphasizes compliance, security, and ROI.",
    icon: DollarSign,
    icp: {
      industries: ["Financial Services", "Banking", "Insurance", "FinTech"],
      companySize: ["100-250", "250-500", "500-1000", "1000+"],
      revenue: ["$25M-$50M", "$50M-$100M", "$100M+"],
      location: ["United States", "United Kingdom", "Singapore"],
      technologies: ["Blockchain", "API", "Cloud"],
    },
    emailSequence: [
      {
        day: 0,
        subject: "Compliance-ready solution for {{companyName}}",
        body: "Hi {{firstName}},\n\nWith the recent regulatory changes in {{industry}}, many companies are looking for compliant solutions that don't sacrifice user experience.\n\nWe've helped institutions like [Customer] achieve full compliance while reducing operational costs by 30%.\n\nWould you be open to a brief conversation about your compliance strategy?\n\nBest regards,\n{{senderName}}",
      },
      {
        day: 5,
        subject: "ROI calculator for {{companyName}}",
        body: "Hi {{firstName}},\n\nI've prepared a custom ROI calculator showing potential savings for {{companyName}}.\n\nBased on your company size and industry, we estimate:\n• $XXX,XXX in annual cost savings\n• XX% reduction in processing time\n• XX% improvement in customer satisfaction\n\nWould you like to see the full analysis?\n\nBest,\n{{senderName}}",
      },
    ],
    workflow: [
      {
        name: "Follow-up high-value leads",
        triggerType: "status_change",
        actionType: "notify_owner",
      },
    ],
  },
  {
    id: "enterprise-software",
    name: "Enterprise Software",
    industry: "Enterprise",
    description: "Target large enterprises with complex needs. Multi-stakeholder approach with technical and business value.",
    icon: Building2,
    icp: {
      industries: ["Enterprise Software", "Manufacturing", "Logistics", "Healthcare"],
      companySize: ["1000+"],
      revenue: ["$100M+"],
      location: ["United States", "Canada", "United Kingdom", "Germany"],
      technologies: ["ERP", "CRM", "Cloud", "Integration"],
    },
    emailSequence: [
      {
        day: 0,
        subject: "Enterprise solution for {{companyName}}'s scale",
        body: "Hi {{firstName}},\n\nAt {{companyName}}'s scale, you need enterprise-grade solutions that can handle complexity while remaining flexible.\n\nWe've worked with Fortune 500 companies like [Customer] to implement solutions that:\n• Scale to millions of transactions\n• Integrate with existing systems\n• Provide enterprise-level security\n\nWould you be interested in learning more?\n\nBest regards,\n{{senderName}}",
      },
      {
        day: 7,
        subject: "Technical deep-dive for {{companyName}}",
        body: "Hi {{firstName}},\n\nI'd like to arrange a technical deep-dive session for your team.\n\nOur solutions architect can walk through:\n• Architecture and scalability\n• Security and compliance\n• Integration capabilities\n• Implementation timeline\n\nWould your technical team be available next week?\n\nBest,\n{{senderName}}",
      },
    ],
    workflow: [
      {
        name: "Multi-touch nurture",
        triggerType: "time_based",
        actionType: "send_email",
      },
    ],
  },
  {
    id: "developer-tools",
    name: "Developer Tools",
    industry: "DevTools",
    description: "Target engineering teams and CTOs. Technical approach with code examples and API documentation.",
    icon: Code,
    icp: {
      industries: ["Software", "SaaS", "Technology"],
      companySize: ["50-100", "100-250", "250-500"],
      revenue: ["$5M-$10M", "$10M-$25M", "$25M-$50M"],
      location: ["United States", "Canada", "United Kingdom", "Germany"],
      technologies: ["API", "Cloud", "Microservices", "Kubernetes"],
    },
    emailSequence: [
      {
        day: 0,
        subject: "Developer tool for {{companyName}}'s tech stack",
        body: "Hi {{firstName}},\n\nI noticed {{companyName}} is using {{technology}} in your stack. We've built a developer tool that integrates seamlessly and reduces deployment time by 50%.\n\nHere's a quick code example:\n```\n// Your existing code\n// + our 3-line integration\n```\n\nWant to try it out? We offer a free tier for teams under 10 developers.\n\nBest,\n{{senderName}}",
      },
      {
        day: 4,
        subject: "API documentation for {{companyName}}",
        body: "Hi {{firstName}},\n\nI've prepared custom API documentation showing how our tool integrates with your specific tech stack.\n\nYou can get started in under 5 minutes with our quickstart guide.\n\nWould you like me to set up a sandbox environment for your team to test?\n\nBest,\n{{senderName}}",
      },
    ],
    workflow: [
      {
        name: "Product-led nurture",
        triggerType: "inactivity",
        actionType: "send_email",
      },
    ],
  },
];

export default function CampaignTemplates() {
  const [, navigate] = useLocation();
  const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [clientId, setClientId] = useState<string>("");
  const [campaignName, setCampaignName] = useState("");

  const { data: clients } = trpc.clients.list.useQuery();
  const createCampaign = trpc.campaigns.create.useMutation({
    onSuccess: (data) => {
      toast.success("Campaign created from template!");
      navigate(`/campaigns/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Failed to create campaign: ${error.message}`);
    },
  });

  const handleUseTemplate = (template: CampaignTemplate) => {
    setSelectedTemplate(template);
    setCampaignName(template.name);
    setShowDialog(true);
  };

  const handleCreateCampaign = () => {
    if (!selectedTemplate || !clientId) {
      toast.error("Please select a client");
      return;
    }

    const icp = selectedTemplate.icp;
    createCampaign.mutate({
      clientId: parseInt(clientId),
      name: campaignName,
      targetIndustries: icp.industries,
      targetGeographies: icp.location,
      description: selectedTemplate.description,
    });

    setShowDialog(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Campaign Templates
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Launch campaigns faster with pre-built templates for your industry
          </p>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => {
            const Icon = template.icon;
            return (
              <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <Badge variant="secondary">{template.industry}</Badge>
                </div>

                <h3 className="text-xl font-semibold mb-2">{template.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{template.description}</p>

                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Target Industries</p>
                    <div className="flex flex-wrap gap-1">
                      {template.icp.industries.slice(0, 3).map((industry) => (
                        <Badge key={industry} variant="outline" className="text-xs">
                          {industry}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Includes</p>
                    <ul className="text-xs space-y-1">
                      <li>✓ {template.emailSequence.length}-email sequence</li>
                      <li>✓ {template.workflow.length} automated workflows</li>
                      <li>✓ Pre-configured ICP</li>
                    </ul>
                  </div>
                </div>

                <Button onClick={() => handleUseTemplate(template)} className="w-full">
                  Use Template
                </Button>
              </Card>
            );
          })}
        </div>

        {/* Custom Template Card */}
        <Card className="mt-8 p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2">Need a Custom Template?</h3>
            <p className="text-muted-foreground mb-4">
              We can create a custom campaign template tailored to your specific industry and use case.
            </p>
            <Button variant="outline" onClick={() => toast.info("Contact support for custom templates")}>
              Request Custom Template
            </Button>
          </div>
        </Card>
      </div>

      {/* Create Campaign Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Campaign from Template</DialogTitle>
            <DialogDescription>
              Configure your campaign using the {selectedTemplate?.name} template
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Enter campaign name"
              />
            </div>

            {selectedTemplate && (
              <div className="space-y-2">
                <Label>Template Details</Label>
                <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                  <p><strong>Email Sequence:</strong> {selectedTemplate.emailSequence.length} emails over {selectedTemplate.emailSequence[selectedTemplate.emailSequence.length - 1].day} days</p>
                  <p><strong>Workflows:</strong> {selectedTemplate.workflow.length} automated workflows</p>
                  <p><strong>Target Industries:</strong> {selectedTemplate.icp.industries.join(", ")}</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCampaign} disabled={!clientId || !campaignName || createCampaign.isPending}>
              {createCampaign.isPending ? "Creating..." : "Create Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
