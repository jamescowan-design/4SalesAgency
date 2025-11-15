import { ChevronRight, Home } from "lucide-react";
import { Link } from "wouter";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-slate-600 mb-6">
      <Link href="/">
        <a className="hover:text-slate-900 transition-colors flex items-center">
          <Home className="h-4 w-4" />
        </a>
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4 text-slate-400" />
          {item.href && index < items.length - 1 ? (
            <Link href={item.href}>
              <a className="hover:text-slate-900 transition-colors">
                {item.label}
              </a>
            </Link>
          ) : (
            <span className={index === items.length - 1 ? "text-slate-900 font-medium" : ""}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
