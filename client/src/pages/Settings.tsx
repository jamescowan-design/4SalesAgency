import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Save, Eye, EyeOff } from "lucide-react";
import { TestConnectionButton } from "@/components/TestConnectionButton";

export default function Settings() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    // Email Settings
    smtpHost: "",
    smtpPort: "",
    smtpUser: "",
    smtpPassword: "",
    smtpFromEmail: "",
    smtpFromName: "",
    sendgridApiKey: "",
    
    // Twilio Settings
    twilioAccountSid: "",
    twilioAuthToken: "",
    twilioPhoneNumber: "",
    
    // VAPI Settings
    vapiApiKey: "",
    vapiAssistantId: "",
    
    // ElevenLabs Settings
    elevenlabsApiKey: "",
    elevenlabsVoiceId: "",
    
    // AssemblyAI Settings
    assemblyaiApiKey: "",
    
    // Email Verification
    zerobounceApiKey: "",
    neverbounceApiKey: "",
  });

  const { data: settings, refetch } = trpc.settings.get.useQuery();
  const saveSettings = trpc.settings.save.useMutation({
    onSuccess: () => {
      toast.success("Settings saved successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to save settings: ${error.message}`);
    },
  });

  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; timestamp: number } | null>>({});

  const testConnection = trpc.settings.testConnection.useMutation({
    onSuccess: (result, variables) => {
      const timestamp = Date.now();
      setTestResults(prev => ({
        ...prev,
        [variables.service]: { ...result, timestamp }
      }));
      if (result.success) {
        toast.success(result.message || "Connection test successful");
      } else {
        toast.error(result.message || "Connection test failed");
      }
    },
    onError: (error, variables) => {
      setTestResults(prev => ({
        ...prev,
        [variables.service]: { success: false, message: error.message, timestamp: Date.now() }
      }));
      toast.error(`Connection test failed: ${error.message}`);
    },
  });

  const toggleShowKey = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = (section: string) => {
    const sectionData: Record<string, string> = {};
    
    if (section === "email") {
      sectionData.smtpHost = formData.smtpHost;
      sectionData.smtpPort = formData.smtpPort;
      sectionData.smtpUser = formData.smtpUser;
      sectionData.smtpPassword = formData.smtpPassword;
      sectionData.smtpFromEmail = formData.smtpFromEmail;
      sectionData.smtpFromName = formData.smtpFromName;
      sectionData.sendgridApiKey = formData.sendgridApiKey;
    } else if (section === "twilio") {
      sectionData.twilioAccountSid = formData.twilioAccountSid;
      sectionData.twilioAuthToken = formData.twilioAuthToken;
      sectionData.twilioPhoneNumber = formData.twilioPhoneNumber;
    } else if (section === "vapi") {
      sectionData.vapiApiKey = formData.vapiApiKey;
      sectionData.vapiAssistantId = formData.vapiAssistantId;
    } else if (section === "elevenlabs") {
      sectionData.elevenlabsApiKey = formData.elevenlabsApiKey;
      sectionData.elevenlabsVoiceId = formData.elevenlabsVoiceId;
    } else if (section === "assemblyai") {
      sectionData.assemblyaiApiKey = formData.assemblyaiApiKey;
    } else if (section === "verification") {
      sectionData.zerobounceApiKey = formData.zerobounceApiKey;
      sectionData.neverbounceApiKey = formData.neverbounceApiKey;
    }

    saveSettings.mutate({ section, data: sectionData });
  };

  const handleTestConnection = (service: string) => {
    testConnection.mutate({ service });
  };

  const renderKeyField = (
    id: string,
    label: string,
    placeholder: string,
    value: string,
    onChange: (value: string) => void
  ) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          type={showKeys[id] ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => toggleShowKey(id)}
        >
          {showKeys[id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            API Settings
          </h1>
          <p className="text-slate-600 mt-2">
            Configure your API credentials for email, voice calling, and lead enrichment services
          </p>
        </div>

        <Tabs defaultValue="email" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="twilio">Twilio</TabsTrigger>
            <TabsTrigger value="vapi">VAPI</TabsTrigger>
            <TabsTrigger value="elevenlabs">ElevenLabs</TabsTrigger>
            <TabsTrigger value="assemblyai">AssemblyAI</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
          </TabsList>

          {/* Email Settings */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Email Configuration</CardTitle>
                <CardDescription>
                  Configure SMTP or SendGrid for sending emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      placeholder="smtp.gmail.com"
                      value={formData.smtpHost}
                      onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      placeholder="587"
                      value={formData.smtpPort}
                      onChange={(e) => setFormData({ ...formData, smtpPort: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpUser">SMTP Username</Label>
                  <Input
                    id="smtpUser"
                    placeholder="your-email@example.com"
                    value={formData.smtpUser}
                    onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                  />
                </div>

                {renderKeyField(
                  "smtpPassword",
                  "SMTP Password",
                  "••••••••",
                  formData.smtpPassword,
                  (value) => setFormData({ ...formData, smtpPassword: value })
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpFromEmail">From Email</Label>
                    <Input
                      id="smtpFromEmail"
                      placeholder="noreply@yourdomain.com"
                      value={formData.smtpFromEmail}
                      onChange={(e) => setFormData({ ...formData, smtpFromEmail: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpFromName">From Name</Label>
                    <Input
                      id="smtpFromName"
                      placeholder="4 Sales Agency"
                      value={formData.smtpFromName}
                      onChange={(e) => setFormData({ ...formData, smtpFromName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-slate-600 mb-4">Or use SendGrid instead:</p>
                  {renderKeyField(
                    "sendgridApiKey",
                    "SendGrid API Key",
                    "SG.xxxxxxxxxx",
                    formData.sendgridApiKey,
                    (value) => setFormData({ ...formData, sendgridApiKey: value })
                  )}
                </div>

                <div className="flex gap-2 items-center">
                  <Button onClick={() => handleSave("email")} disabled={saveSettings.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Email Settings
                  </Button>
                  <TestConnectionButton
                    service="email"
                    onTest={handleTestConnection}
                    isPending={testConnection.isPending}
                    currentService={testConnection.variables?.service}
                    result={testResults.email}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Twilio Settings */}
          <TabsContent value="twilio">
            <Card>
              <CardHeader>
                <CardTitle>Twilio Configuration</CardTitle>
                <CardDescription>
                  Configure Twilio for voice calls and SMS
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderKeyField(
                  "twilioAccountSid",
                  "Account SID",
                  "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
                  formData.twilioAccountSid,
                  (value) => setFormData({ ...formData, twilioAccountSid: value })
                )}

                {renderKeyField(
                  "twilioAuthToken",
                  "Auth Token",
                  "••••••••••••••••••••••••••••••••",
                  formData.twilioAuthToken,
                  (value) => setFormData({ ...formData, twilioAuthToken: value })
                )}

                <div className="space-y-2">
                  <Label htmlFor="twilioPhoneNumber">Twilio Phone Number</Label>
                  <Input
                    id="twilioPhoneNumber"
                    placeholder="+1234567890"
                    value={formData.twilioPhoneNumber}
                    onChange={(e) => setFormData({ ...formData, twilioPhoneNumber: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 items-center">
                  <Button onClick={() => handleSave("twilio")} disabled={saveSettings.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Twilio Settings
                  </Button>
                  <TestConnectionButton
                    service="twilio"
                    onTest={handleTestConnection}
                    isPending={testConnection.isPending}
                    currentService={testConnection.variables?.service}
                    result={testResults.twilio}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* VAPI Settings */}
          <TabsContent value="vapi">
            <Card>
              <CardHeader>
                <CardTitle>VAPI Configuration</CardTitle>
                <CardDescription>
                  Configure VAPI for AI-powered voice conversations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderKeyField(
                  "vapiApiKey",
                  "VAPI API Key",
                  "vapi_xxxxxxxxxxxxxxxxxxxxxxxx",
                  formData.vapiApiKey,
                  (value) => setFormData({ ...formData, vapiApiKey: value })
                )}

                <div className="space-y-2">
                  <Label htmlFor="vapiAssistantId">Assistant ID (Optional)</Label>
                  <Input
                    id="vapiAssistantId"
                    placeholder="assistant_xxxxxxxxxxxxxxxx"
                    value={formData.vapiAssistantId}
                    onChange={(e) => setFormData({ ...formData, vapiAssistantId: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 items-center">
                  <Button onClick={() => handleSave("vapi")} disabled={saveSettings.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    Save VAPI Settings
                  </Button>
                  <TestConnectionButton
                    service="vapi"
                    onTest={handleTestConnection}
                    isPending={testConnection.isPending}
                    currentService={testConnection.variables?.service}
                    result={testResults.vapi}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ElevenLabs Settings */}
          <TabsContent value="elevenlabs">
            <Card>
              <CardHeader>
                <CardTitle>ElevenLabs Configuration</CardTitle>
                <CardDescription>
                  Configure ElevenLabs for AI voice synthesis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderKeyField(
                  "elevenlabsApiKey",
                  "ElevenLabs API Key",
                  "sk_xxxxxxxxxxxxxxxxxxxxxxxx",
                  formData.elevenlabsApiKey,
                  (value) => setFormData({ ...formData, elevenlabsApiKey: value })
                )}

                <div className="space-y-2">
                  <Label htmlFor="elevenlabsVoiceId">Voice ID (Optional)</Label>
                  <Input
                    id="elevenlabsVoiceId"
                    placeholder="21m00Tcm4TlvDq8ikWAM"
                    value={formData.elevenlabsVoiceId}
                    onChange={(e) => setFormData({ ...formData, elevenlabsVoiceId: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 items-center">
                  <Button onClick={() => handleSave("elevenlabs")} disabled={saveSettings.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    Save ElevenLabs Settings
                  </Button>
                  <TestConnectionButton
                    service="elevenlabs"
                    onTest={handleTestConnection}
                    isPending={testConnection.isPending}
                    currentService={testConnection.variables?.service}
                    result={testResults.elevenlabs}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AssemblyAI Settings */}
          <TabsContent value="assemblyai">
            <Card>
              <CardHeader>
                <CardTitle>AssemblyAI Configuration</CardTitle>
                <CardDescription>
                  Configure AssemblyAI for speech-to-text transcription
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderKeyField(
                  "assemblyaiApiKey",
                  "AssemblyAI API Key",
                  "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
                  formData.assemblyaiApiKey,
                  (value) => setFormData({ ...formData, assemblyaiApiKey: value })
                )}

                <div className="flex gap-2 items-center">
                  <Button onClick={() => handleSave("assemblyai")} disabled={saveSettings.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    Save AssemblyAI Settings
                  </Button>
                  <TestConnectionButton
                    service="assemblyai"
                    onTest={handleTestConnection}
                    isPending={testConnection.isPending}
                    currentService={testConnection.variables?.service}
                    result={testResults.assemblyai}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verification Settings */}
          <TabsContent value="verification">
            <Card>
              <CardHeader>
                <CardTitle>Email & Phone Verification</CardTitle>
                <CardDescription>
                  Configure services for validating email addresses and phone numbers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderKeyField(
                  "zerobounceApiKey",
                  "ZeroBounce API Key (Optional)",
                  "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
                  formData.zerobounceApiKey,
                  (value) => setFormData({ ...formData, zerobounceApiKey: value })
                )}

                {renderKeyField(
                  "neverbounceApiKey",
                  "NeverBounce API Key (Optional)",
                  "secret_xxxxxxxxxxxxxxxxxxxxxxxx",
                  formData.neverbounceApiKey,
                  (value) => setFormData({ ...formData, neverbounceApiKey: value })
                )}

                <div className="flex gap-2">
                  <Button onClick={() => handleSave("verification")} disabled={saveSettings.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Verification Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
