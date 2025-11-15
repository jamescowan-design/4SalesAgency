import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "@/pages/Home";
import ClientsList from "@/pages/ClientsList";
import ClientDetail from "@/pages/ClientDetail";
import CampaignDetail from "@/pages/CampaignDetail";
import LeadsList from "@/pages/LeadsList";
import LeadDetail from "@/pages/LeadDetail";
import EmailComposer from "@/pages/EmailComposer";
import Settings from "@/pages/Settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/clients" component={ClientsList} />
      <Route path="/clients/:id" component={ClientDetail} />
      <Route path="/campaigns/:id" component={CampaignDetail} />
      <Route path="/campaigns/:campaignId/leads" component={LeadsList} />
      <Route path="/leads/:id" component={LeadDetail} />
      <Route path="/leads/:leadId/email/:campaignId" component={EmailComposer} />
      <Route path="/settings" component={Settings} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
