import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Save, TestTube } from "lucide-react";

export default function ScraperSettings() {
  const [proxyService, setProxyService] = useState<string>("scraperapi");
  const [scraperApiKey, setScraperApiKey] = useState("");
  const [proxyUrl, setProxyUrl] = useState("");
  const [proxyUsername, setProxyUsername] = useState("");
  const [proxyPassword, setProxyPassword] = useState("");
  const [captchaService, setCaptchaService] = useState<string>("2captcha");
  const [captchaApiKey, setCaptchaApiKey] = useState("");

  const saveSettings = trpc.settings.save.useMutation({
    onSuccess: () => {
      toast.success("Scraper settings saved successfully");
    },
    onError: (error) => {
      toast.error(`Failed to save settings: ${error.message}`);
    },
  });

  const handleSave = async () => {
    const data: Record<string, string> = {};

    if (scraperApiKey) data.scraperapi_key = scraperApiKey;
    if (proxyUrl) data.scraper_proxy_url = proxyUrl;
    if (proxyUsername) data.scraper_proxy_username = proxyUsername;
    if (proxyPassword) data.scraper_proxy_password = proxyPassword;
    if (captchaApiKey) data.captcha_api_key = captchaApiKey;

    await saveSettings.mutateAsync({ section: "scraper", data });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Web Scraper Configuration</CardTitle>
          <CardDescription>
            Configure proxy services and CAPTCHA solving for enterprise-grade web scraping
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Proxy Service Selection */}
          <div className="space-y-2">
            <Label>Proxy Service</Label>
            <Select value={proxyService} onValueChange={setProxyService}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scraperapi">ScraperAPI (Recommended)</SelectItem>
                <SelectItem value="brightdata">Bright Data</SelectItem>
                <SelectItem value="custom">Custom Proxy</SelectItem>
                <SelectItem value="none">No Proxy</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Proxies help avoid IP blocks and rate limiting
            </p>
          </div>

          {/* ScraperAPI Configuration */}
          {proxyService === "scraperapi" && (
            <div className="space-y-2">
              <Label htmlFor="scraperapi-key">ScraperAPI Key</Label>
              <Input
                id="scraperapi-key"
                type="password"
                value={scraperApiKey}
                onChange={(e) => setScraperApiKey(e.target.value)}
                placeholder="Enter your ScraperAPI key"
              />
              <p className="text-sm text-muted-foreground">
                Get your API key from{" "}
                <a
                  href="https://www.scraperapi.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  scraperapi.com
                </a>{" "}
                - Free tier: 5,000 requests/month
              </p>
            </div>
          )}

          {/* Bright Data Configuration */}
          {proxyService === "brightdata" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="proxy-username">Bright Data Username</Label>
                <Input
                  id="proxy-username"
                  value={proxyUsername}
                  onChange={(e) => setProxyUsername(e.target.value)}
                  placeholder="brd-customer-xxxxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proxy-password">Bright Data Password</Label>
                <Input
                  id="proxy-password"
                  type="password"
                  value={proxyPassword}
                  onChange={(e) => setProxyPassword(e.target.value)}
                  placeholder="Enter your zone password"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Get credentials from{" "}
                <a
                  href="https://brightdata.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  brightdata.com
                </a>
              </p>
            </>
          )}

          {/* Custom Proxy Configuration */}
          {proxyService === "custom" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="proxy-url">Proxy URL</Label>
                <Input
                  id="proxy-url"
                  value={proxyUrl}
                  onChange={(e) => setProxyUrl(e.target.value)}
                  placeholder="http://proxy.example.com:8080"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-username">Username (Optional)</Label>
                <Input
                  id="custom-username"
                  value={proxyUsername}
                  onChange={(e) => setProxyUsername(e.target.value)}
                  placeholder="proxy-username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-password">Password (Optional)</Label>
                <Input
                  id="custom-password"
                  type="password"
                  value={proxyPassword}
                  onChange={(e) => setProxyPassword(e.target.value)}
                  placeholder="proxy-password"
                />
              </div>
            </>
          )}

          {/* CAPTCHA Solving */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="text-lg font-semibold">CAPTCHA Solving (Optional)</h3>
            
            <div className="space-y-2">
              <Label>CAPTCHA Service</Label>
              <Select value={captchaService} onValueChange={setCaptchaService}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2captcha">2Captcha</SelectItem>
                  <SelectItem value="anticaptcha">Anti-Captcha</SelectItem>
                  <SelectItem value="none">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {captchaService !== "none" && (
              <div className="space-y-2">
                <Label htmlFor="captcha-key">
                  {captchaService === "2captcha" ? "2Captcha" : "Anti-Captcha"} API Key
                </Label>
                <Input
                  id="captcha-key"
                  type="password"
                  value={captchaApiKey}
                  onChange={(e) => setCaptchaApiKey(e.target.value)}
                  placeholder="Enter your API key"
                />
                <p className="text-sm text-muted-foreground">
                  Get your API key from{" "}
                  <a
                    href={
                      captchaService === "2captcha"
                        ? "https://2captcha.com"
                        : "https://anti-captcha.com"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {captchaService === "2captcha" ? "2captcha.com" : "anti-captcha.com"}
                  </a>{" "}
                  - Cost: ~$1-3 per 1000 solves
                </p>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={saveSettings.isPending}
              className="flex-1"
            >
              {saveSettings.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cost Estimator */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Estimator</CardTitle>
          <CardDescription>Estimated monthly costs based on usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">ScraperAPI (5,000 requests/month)</span>
              <span className="font-semibold">$49/month</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Bright Data (Pay-as-you-go)</span>
              <span className="font-semibold">~$50-200/month</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">2Captcha (1,000 solves)</span>
              <span className="font-semibold">$1-3</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="font-semibold">Estimated Total</span>
              <span className="font-bold text-lg">$50-250/month</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Compared to $150-1,500/month for external enrichment APIs (Clearbit, ZoomInfo)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
