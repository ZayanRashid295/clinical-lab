import { CreditCard, LogOut, Menu, Settings, User } from "lucide-react";
import { HeaderProps } from "../../../app/types/ui";
import { typography, spacing, interactive } from "../../utils/responsive";
import NotificationBell from "./NotificationBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

function formatPrimaryRole(roles: any[] | undefined): string {
  const raw = Array.isArray(roles) ? roles : [];
  const first = raw[0];
  const str =
    typeof first === "string"
      ? first
      : String(first?.name || first?.role?.name || "");
  const cleaned = str.trim().toUpperCase();
  if (!cleaned) return "USER";
  return cleaned.replace(/_/g, " ");
}

const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  leadingContent,
  customActions,
  onMobileMenuToggle,
}) => {
  const roleLabel = formatPrimaryRole(user?.roles);
  const initials =
    user?.name?.trim()?.slice(0, 1)?.toUpperCase() ||
    user?.email?.trim()?.slice(0, 1)?.toUpperCase() ||
    "U";

  return (
    <header
      className={`
        sticky top-0 z-40
        border-b border-slate-200/80 bg-white/85 backdrop-blur
        dark:border-slate-800/70 dark:bg-slate-950/75
        ${spacing.container.xs}
      `}
    >
      <div className="flex items-center justify-between gap-4 w-full min-w-0">
        <div
          className={`flex items-center ${spacing.element.sm} flex-1 min-w-0 gap-2 sm:gap-3`}
        >
          {/* Mobile menu toggle */}
          <button
            onClick={onMobileMenuToggle}
            className={`lg:hidden shrink-0 ${interactive.touch.md} flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors`}
            title="Open menu"
          >
            <Menu size={20} />
          </button>
          {leadingContent ? (
            <div className="flex-1 min-w-0 flex items-center">
              {typeof leadingContent === "function"
                ? (leadingContent as () => React.ReactNode)()
                : leadingContent}
            </div>
          ) : null}
        </div>

        <div className={`flex items-center gap-3 sm:gap-4 shrink-0`}>
          {customActions}

          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={`
                  ${interactive.touch.sm}
                  inline-flex items-center gap-2 rounded-full
                  border border-slate-200 bg-white/70 px-2 py-1
                  shadow-sm hover:bg-white
                  dark:border-slate-800 dark:bg-slate-950/60 dark:hover:bg-slate-950
                  transition-colors
                `}
                aria-label="Open user menu"
                title={user?.name || "User"}
              >
                <span className="hidden md:block text-right leading-tight">
                  <span className={`${typography.ui.regular} block text-slate-900 dark:text-slate-50`}>
                    {user?.name || "User"}
                  </span>
                  <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {roleLabel}
                  </span>
                </span>
                <span
                  className={`
                    h-9 w-9 rounded-full
                    bg-gradient-to-br from-teal-600 to-emerald-600
                    text-white shadow-sm ring-2 ring-white/70
                    dark:ring-slate-950/60
                    flex items-center justify-center font-semibold
                  `}
                >
                  {initials}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className={`
                w-64 rounded-xl p-1.5
                bg-white text-slate-900 border border-slate-200/80 shadow-xl
                dark:bg-slate-950 dark:text-slate-50 dark:border-slate-800/80
              `}
            >
              <DropdownMenuLabel className="px-2 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {user?.name || "User"}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {user?.email || roleLabel}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => {
                  try {
                    window.location.href = "/profile";
                  } catch {
                    /* noop */
                  }
                }}
              >
                <User />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  try {
                    window.location.href = "/my-subscription";
                  } catch {
                    /* noop */
                  }
                }}
              >
                <CreditCard />
                My subscription
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  try {
                    window.location.href = "/settings";
                  } catch {
                    /* noop */
                  }
                }}
              >
                <Settings />
                Settings
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem variant="destructive" onClick={onLogout}>
                <LogOut />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
