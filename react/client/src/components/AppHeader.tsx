import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoutDialog } from "./LogoutDialog";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface AppHeaderProps {
  title?: string;
  showLogout?: boolean;
  children?: React.ReactNode;
}

export function AppHeader({
  title,
  showLogout = true,
  children,
}: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-4">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        {title && <h1 className="text-lg font-semibold">{title}</h1>}
        {children}
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {showLogout && (
          <LogoutDialog variant="ghost" size="icon" className="md:hidden" />
        )}
      </div>
    </header>
  );
}
