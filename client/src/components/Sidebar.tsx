import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl, APP_LOGO, APP_TITLE } from "@/const";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home,
  Users,
  TrendingUp,
  BarChart3,
  Upload,
  Workflow,
  Phone,
  GitBranch,
  Sparkles,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
  CheckSquare,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: "Home", path: "/", icon: <Home className="h-5 w-5" /> },
  { label: "CRM", path: "/crm", icon: <Users className="h-5 w-5" /> },
  { label: "Tasks", path: "/tasks", icon: <CheckSquare className="h-5 w-5" /> },
  { label: "Priority Dashboard", path: "/priority", icon: <TrendingUp className="h-5 w-5" /> },
  { label: "Analytics", path: "/analytics", icon: <BarChart3 className="h-5 w-5" /> },
  { label: "Bulk Operations", path: "/bulk", icon: <Upload className="h-5 w-5" /> },
  { label: "Workflows", path: "/workflows", icon: <Workflow className="h-5 w-5" /> },
  { label: "Voice Calling", path: "/voice", icon: <Phone className="h-5 w-5" /> },
  { label: "Attribution", path: "/attribution", icon: <GitBranch className="h-5 w-5" /> },
  { label: "Enrichment", path: "/enrichment", icon: <Sparkles className="h-5 w-5" /> },
  { label: "Recruitment Intel", path: "/recruitment", icon: <Users className="h-5 w-5" /> },
  { label: "Campaign Templates", path: "/templates", icon: <Sparkles className="h-5 w-5" /> },
  { label: "GDPR Compliance", path: "/gdpr", icon: <Shield className="h-5 w-5" /> },
  { label: "Settings", path: "/settings", icon: <Settings className="h-5 w-5" /> },
];

export default function Sidebar() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-slate-200"
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6 text-slate-700" />
        ) : (
          <Menu className="h-6 w-6 text-slate-700" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          onClick={closeMobileMenu}
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col z-40 transition-transform duration-300 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo/Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8" />
            <h1 className="text-xl font-bold text-slate-900">{APP_TITLE}</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location === item.path;
              return (
                <li key={item.path}>
                  <Link href={item.path}>
                    <span
                      onClick={closeMobileMenu}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                        isActive
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-blue-100 text-blue-700">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {user?.email || ""}
              </p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start"
            size="sm"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
}
