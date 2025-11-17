import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

interface AddLeadDialogProps {
  campaignId?: number;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export default function AddLeadDialog({ campaignId, trigger, onSuccess }: AddLeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    campaignId: campaignId || 0,
    companyName: "",
    companyWebsite: "",
    companyIndustry: "",
    companySize: "",
    companyRevenue: "",
    companyLocation: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contactJobTitle: "",
    contactLinkedin: "",
    sourceUrl: "",
    notes: "",
  });

  const utils = trpc.useUtils();
  const { data: campaigns } = trpc.campaigns.listByClient.useQuery(
    { clientId: 0 },
    { enabled: !campaignId }
  );

  const createLead = trpc.leads.create.useMutation({
    onSuccess: () => {
      toast.success("Lead created successfully");
      utils.leads.list.invalidate();
      utils.leads.listByCampaign.invalidate();
      utils.leads.getStats.invalidate();
      if (campaignId) {
        utils.campaigns.getById.invalidate({ id: campaignId });
      }
      setOpen(false);
      resetForm();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast.error(`Failed to create lead: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      campaignId: campaignId || 0,
      companyName: "",
      companyWebsite: "",
      companyIndustry: "",
      companySize: "",
      companyRevenue: "",
      companyLocation: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      contactJobTitle: "",
      contactLinkedin: "",
      sourceUrl: "",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.companyName.trim()) {
      toast.error("Company name is required");
      return;
    }

    if (!formData.campaignId) {
      toast.error("Please select a campaign");
      return;
    }

    // Validate email if provided
    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      toast.error("Invalid email address");
      return;
    }

    // Validate website if provided
    if (formData.companyWebsite && !formData.companyWebsite.startsWith("http")) {
      formData.companyWebsite = `https://${formData.companyWebsite}`;
    }

    createLead.mutate({
      campaignId: formData.campaignId,
      companyName: formData.companyName,
      companyWebsite: formData.companyWebsite || undefined,
      companyIndustry: formData.companyIndustry || undefined,
      companySize: formData.companySize ? parseInt(formData.companySize) : undefined,
      companyRevenue: formData.companyRevenue ? parseInt(formData.companyRevenue) : undefined,
      companyLocation: formData.companyLocation || undefined,
      contactName: formData.contactName || undefined,
      contactEmail: formData.contactEmail || undefined,
      contactPhone: formData.contactPhone || undefined,
      contactJobTitle: formData.contactJobTitle || undefined,
      contactLinkedin: formData.contactLinkedin || undefined,
      sourceUrl: formData.sourceUrl || undefined,
      notes: formData.notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>
            Create a new lead manually. Fill in as much information as you have.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Selection */}
          {!campaignId && (
            <div className="space-y-2">
              <Label htmlFor="campaignId">
                Campaign <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.campaignId.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, campaignId: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns?.map((campaign: any) => (
                    <SelectItem key={campaign.id} value={campaign.id.toString()}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Company Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="companyName">
                  Company Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Acme Corporation"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyWebsite">Website</Label>
                <Input
                  id="companyWebsite"
                  type="url"
                  value={formData.companyWebsite}
                  onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyIndustry">Industry</Label>
                <Input
                  id="companyIndustry"
                  value={formData.companyIndustry}
                  onChange={(e) => setFormData({ ...formData, companyIndustry: e.target.value })}
                  placeholder="Software, Healthcare, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companySize">Company Size (employees)</Label>
                <Input
                  id="companySize"
                  type="number"
                  value={formData.companySize}
                  onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                  placeholder="50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyRevenue">Annual Revenue ($)</Label>
                <Input
                  id="companyRevenue"
                  type="number"
                  value={formData.companyRevenue}
                  onChange={(e) => setFormData({ ...formData, companyRevenue: e.target.value })}
                  placeholder="1000000"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="companyLocation">Location</Label>
                <Input
                  id="companyLocation"
                  value={formData.companyLocation}
                  onChange={(e) => setFormData({ ...formData, companyLocation: e.target.value })}
                  placeholder="San Francisco, CA"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Contact Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name</Label>
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactJobTitle">Job Title</Label>
                <Input
                  id="contactJobTitle"
                  value={formData.contactJobTitle}
                  onChange={(e) => setFormData({ ...formData, contactJobTitle: e.target.value })}
                  placeholder="CEO, VP of Sales, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone">Phone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="contactLinkedin">LinkedIn Profile</Label>
                <Input
                  id="contactLinkedin"
                  value={formData.contactLinkedin}
                  onChange={(e) => setFormData({ ...formData, contactLinkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/johndoe"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Additional Information</h3>

            <div className="space-y-2">
              <Label htmlFor="sourceUrl">Source URL</Label>
              <Input
                id="sourceUrl"
                value={formData.sourceUrl}
                onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                placeholder="Where did you find this lead?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information about this lead..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              disabled={createLead.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createLead.isPending}>
              {createLead.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
