import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { ArrowRight, Building2, Target, Users, Zap } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Welcome to {APP_TITLE}
              </h1>
              <p className="text-xl text-muted-foreground">
                AI-Powered B2B Lead Generation & Qualification
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <Link href="/clients">
                <div className="group p-8 rounded-xl border-2 border-border hover:border-primary transition-all cursor-pointer bg-card hover:shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Building2 className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-semibold mb-2 group-hover:text-primary transition-colors">
                        Manage Clients
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        View and manage all your clients in one place
                      </p>
                      <div className="flex items-center text-primary font-medium">
                        Get Started <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>

              <div className="group p-8 rounded-xl border-2 border-border hover:border-primary transition-all cursor-not-allowed opacity-60 bg-card">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-muted">
                    <Target className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold mb-2">
                      Active Campaigns
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Monitor and manage your lead generation campaigns
                    </p>
                    <div className="flex items-center text-muted-foreground font-medium">
                      Coming Soon
                    </div>
                  </div>
                </div>
              </div>

              <div className="group p-8 rounded-xl border-2 border-border hover:border-primary transition-all cursor-not-allowed opacity-60 bg-card">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-muted">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold mb-2">
                      Lead Dashboard
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Track and qualify leads with AI assistance
                    </p>
                    <div className="flex items-center text-muted-foreground font-medium">
                      Coming Soon
                    </div>
                  </div>
                </div>
              </div>

              <div className="group p-8 rounded-xl border-2 border-border hover:border-primary transition-all cursor-not-allowed opacity-60 bg-card">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-muted">
                    <Zap className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold mb-2">
                      Analytics
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      View performance metrics and insights
                    </p>
                    <div className="flex items-center text-muted-foreground font-medium">
                      Coming Soon
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Logged in as <span className="font-medium text-foreground">{user?.name || user?.email}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {APP_TITLE}
          </h1>
          <p className="text-2xl text-muted-foreground mb-12">
            AI-Powered B2B Lead Generation & Qualification Platform
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="p-6 rounded-lg bg-card border">
              <div className="p-3 rounded-lg bg-primary/10 w-fit mx-auto mb-4">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Multi-Tenant</h3>
              <p className="text-muted-foreground">
                Manage multiple clients and campaigns in one platform
              </p>
            </div>

            <div className="p-6 rounded-lg bg-card border">
              <div className="p-3 rounded-lg bg-primary/10 w-fit mx-auto mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered</h3>
              <p className="text-muted-foreground">
                Virtual LLMs trained on your product knowledge
              </p>
            </div>

            <div className="p-6 rounded-lg bg-card border">
              <div className="p-3 rounded-lg bg-primary/10 w-fit mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Automated Outreach</h3>
              <p className="text-muted-foreground">
                AI emails and phone calls to qualify leads
              </p>
            </div>
          </div>

          <Button size="lg" asChild className="text-lg px-8 py-6">
            <a href={getLoginUrl()}>
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
