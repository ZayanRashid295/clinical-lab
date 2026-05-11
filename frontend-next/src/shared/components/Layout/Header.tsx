import { LogOut, Menu } from "lucide-react";
import { HeaderProps } from "../../../app/types/ui";
import { typography, spacing, interactive } from "../../utils/responsive";
import NotificationBell from "./NotificationBell";

const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  leadingContent,
  customActions,
  onMobileMenuToggle,
}) => {
  return (
    <header
      className={`bg-[color:var(--app-surface)] shadow-sm border-b border-[color:var(--app-border)] text-[color:var(--app-text)] ${spacing.container.xs}`}
    >
      <div className="flex items-center justify-between gap-3 w-full min-w-0">
        <div
          className={`flex items-center ${spacing.element.sm} flex-1 min-w-0 gap-2 sm:gap-3`}
        >
          {/* Mobile menu toggle */}
          <button
            onClick={onMobileMenuToggle}
            className={`lg:hidden shrink-0 ${interactive.touch.md} flex items-center justify-center text-[color:var(--app-muted)] hover:text-[color:var(--app-text)] hover:bg-[color:var(--app-elevated)] rounded-md transition-colors`}
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

        <div className={`flex items-center ${spacing.element.sm} shrink-0`}>
          {customActions}

          <NotificationBell />

          <div className={`flex items-center ${spacing.element.sm}`}>
            {/* User info - hidden on mobile, shown on tablet+ */}
            <div className="text-right hidden md:block">
              <p
                className={`${typography.ui.regular} text-[color:var(--app-text)]`}
              >
                {user?.name || "User"}
              </p>
              <p
                className={`${typography.caption.regular} text-[color:var(--app-muted)]`}
              >
                {user?.roles?.join(", ") || "No Role"}
              </p>
            </div>
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium ${typography.ui.regular}`}
            >
              {user?.name?.charAt(0) || "U"}
            </div>
            <button
              onClick={onLogout}
              className={`${interactive.touch.sm} flex items-center justify-center text-[color:var(--app-muted)] hover:text-[color:var(--app-text)] hover:bg-[color:var(--app-elevated)] rounded-md transition-colors`}
              title="Logout"
            >
              <LogOut size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
