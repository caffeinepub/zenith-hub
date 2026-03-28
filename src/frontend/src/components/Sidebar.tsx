import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  Brain,
  Clock,
  Compass,
  LayoutDashboard,
  LogOut,
  Wallet,
} from "lucide-react";

interface SidebarProps {
  onLogout: () => void;
}

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/study-planner", icon: BookOpen, label: "Study Planner" },
  { path: "/focus-timer", icon: Clock, label: "Focus Timer" },
  { path: "/finance", icon: Wallet, label: "Finance" },
  { path: "/ai-assistant", icon: Brain, label: "AI Assistant" },
  { path: "/trip-manager", icon: Compass, label: "Trip Manager" },
];

export default function Sidebar({ onLogout }: SidebarProps) {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  return (
    <aside className="w-60 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img
            src="/assets/generated/zenith-hub-logo.dim_256x256.png"
            alt="Zenith Hub"
            className="w-10 h-10 rounded-xl shadow-sm"
          />
          <div>
            <h1 className="font-display font-bold text-sidebar-foreground text-lg leading-tight">
              Zenith Hub
            </h1>
            <p className="text-sidebar-foreground/50 text-xs">
              Student Productivity
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = isActive(path);
          return (
            <Link key={path} to={path}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          onClick={onLogout}
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 rounded-xl"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
