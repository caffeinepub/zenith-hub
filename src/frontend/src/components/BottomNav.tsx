import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  Clock,
  Compass,
  LayoutDashboard,
  Wallet,
} from "lucide-react";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Home" },
  { path: "/study-planner", icon: BookOpen, label: "Planner" },
  { path: "/focus-timer", icon: Clock, label: "Timer" },
  { path: "/finance", icon: Wallet, label: "Finance" },
  { path: "/trip-manager", icon: Compass, label: "Trips" },
];

export default function BottomNav() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = isActive(path);
          return (
            <Link key={path} to={path} className="flex-1">
              <div
                className={cn(
                  "flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all duration-150",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("w-5 h-5", active && "scale-110")} />
                <span className="text-[10px] font-medium">{label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
