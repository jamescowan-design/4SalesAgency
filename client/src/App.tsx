import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/_core/hooks/useAuth";
import Home from "./pages/Home";
import CRMDashboard from "./pages/CRMDashboard";
import CustomReports from "@/pages/CustomReports";
import GDPRCompliance from "@/pages/GDPRCompliance";
import RecruitmentIntelligence from "@/pages/RecruitmentIntelligence";
import CampaignTemplates from "@/pages/CampaignTemplates";
import ClientsList from "@/pages/ClientsList";
import ClientDetail from "@/pages/ClientDetail";
import CampaignDetail from "@/pages/CampaignDetail";
import LeadsList from "@/pages/LeadsList";
import LeadDetail from "@/pages/LeadDetail";
import EmailComposer from "@/pages/EmailComposer";
import Settings from "@/pages/Settings";
import PriorityDashboard from "@/pages/PriorityDashboard";
import AnalyticsDashboard from "@/pages/AnalyticsDashboard";
import BulkOperations from "@/pages/BulkOperations";
import WorkflowAutomation from "@/pages/WorkflowAutomation";
import VoiceCalling from "@/pages/VoiceCalling";
import Attribution from "@/pages/Attribution";
import LeadEnrichment from "@/pages/LeadEnrichment";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/crm" component={CRMDashboard} />
      <Route path="/reports" component={CustomReports} />
      <Route path="/gdpr" component={GDPRCompliance} />
      <Route path="/recruitment" component={RecruitmentIntelligence} />
      <Route path="/templates" component={CampaignTemplates} />     <Route path="/clients" component={ClientsList} />
      <Route path="/clients/:id" component={ClientDetail} />
      <Route path="/campaigns/:id" component={CampaignDetail} />
      <Route path="/campaigns/:campaignId/leads" component={LeadsList} />
      <Route path="/leads/:id" component={LeadDetail} />
      <Route path="/leads/:leadId/email/:campaignId" component={EmailComposer} />
      <Route path="/settings" component={Settings} />
      <Route path="/priority" component={PriorityDashboard} />
      <Route path="/analytics" component={AnalyticsDashboard} />
      <Route path="/bulk" component={BulkOperations} />
      <Route path="/workflows" component={WorkflowAutomation} />
      <Route path="/voice" component={VoiceCalling} />
      <Route path="/attribution" component={Attribution} />
      <Route path="/enrichment" component={LeadEnrichment} />
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
          <AppLayout />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function AppLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {isAuthenticated && <Sidebar />}
      <main className={`flex-1 ${isAuthenticated ? 'lg:ml-64' : ''}`}>
        <Router />
      </main>
    </div>
  );
}

export default App;
