import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Sparkles, Send, Eye } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function EmailComposer() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const leadId = parseInt(params.leadId || "0");
  const campaignId = parseInt(params.campaignId || "0");

  const [emailType, setEmailType] = useState<"initial_outreach" | "follow_up" | "meeting_request" | "custom">("initial_outreach");
  const [customInstructions, setCustomInstructions] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const { data: lead } = trpc.leads.getById.useQuery({ id: leadId });

  const utils = trpc.useUtils();
  const generateEmail = trpc.email.generate.useMutation({
    onSuccess: (data) => {
      setSubject(data.subject);
      // Replace merge fields with actual values
      let processedBody = data.body;
      for (const [key, value] of Object.entries(data.mergeFields)) {
        const regex = new RegExp(`{{${key}}}`, "g");
        processedBody = processedBody.replace(regex, value);
      }
      setBody(processedBody);
      setIsGenerating(false);
      toast.success("Email generated successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to generate email: ${error.message}`);
      setIsGenerating(false);
    },
  });

  const sendEmail = trpc.email.send.useMutation({
    onSuccess: () => {
      utils.communications.listByLead.invalidate({ leadId });
      utils.leads.getById.invalidate({ id: leadId });
      toast.success("Email sent successfully!");
      setIsSending(false);
      // Navigate back to lead detail
      setLocation(`/leads/${leadId}`);
    },
    onError: (error) => {
      toast.error(`Failed to send email: ${error.message}`);
      setIsSending(false);
    },
  });

  const handleGenerate = () => {
    setIsGenerating(true);
    generateEmail.mutate({
      campaignId,
      leadId,
      emailType,
      customInstructions: emailType === "custom" ? customInstructions : undefined,
    });
  };

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and body are required");
      return;
    }

    setIsSending(true);
    sendEmail.mutate({
      leadId,
      campaignId,
      subject,
      body,
    });
  };

  if (!lead) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Lead not found</h2>
          <Link href="/clients">
            <Button>Back to Clients</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <div className="container py-8 max-w-4xl">
        <Link href={`/leads/${leadId}`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lead
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Compose Email</h1>
          <p className="text-lg text-muted-foreground">
            To: {lead.contactName || "Contact"} at {lead.companyName}
          </p>
          {lead.contactEmail && (
            <p className="text-sm text-muted-foreground">{lead.contactEmail}</p>
          )}
        </div>

        <div className="space-y-6">
          {/* AI Generation Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Email Generator
              </CardTitle>
              <CardDescription>
                Generate personalized email using your product knowledge
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email-type">Email Type</Label>
                <Select
                  value={emailType}
                  onValueChange={(value: any) => setEmailType(value)}
                >
                  <SelectTrigger id="email-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="initial_outreach">Initial Outreach</SelectItem>
                    <SelectItem value="follow_up">Follow-up</SelectItem>
                    <SelectItem value="meeting_request">Meeting Request</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {emailType === "custom" && (
                <div>
                  <Label htmlFor="custom-instructions">Custom Instructions</Label>
                  <Textarea
                    id="custom-instructions"
                    placeholder="e.g., Focus on their recent funding round and emphasize ROI..."
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Email
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Email Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Email Content</CardTitle>
              <CardDescription>
                Review and edit the generated email before sending
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  placeholder="Email subject..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="body">Email Body</Label>
                <Textarea
                  id="body"
                  placeholder="Email content..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSend}
                  disabled={isSending || !subject.trim() || !body.trim()}
                  className="flex-1"
                >
                  {isSending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Email
                    </>
                  )}
                </Button>
                <Button variant="outline" disabled>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
