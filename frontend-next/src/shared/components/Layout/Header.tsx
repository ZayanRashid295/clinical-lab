import { Search, Bell, LogOut, Menu } from "lucide-react";
import { HeaderProps } from "../../../app/types/ui";
import { typography, spacing, interactive } from "../../utils/responsive";
import ColorPicker from "../ColorPicker";

const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  enableSearch = true,
  searchPlaceholder = "Search...",
  customActions,
  onMobileMenuToggle,
}) => {
  return (
    <header
      className={`bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 ${spacing.container.xs}`}
    >
      <div className="flex items-center justify-between">
        <div className={`flex items-center ${spacing.element.sm}`}>
          {/* Mobile menu toggle */}
          <button
            onClick={onMobileMenuToggle}
            className={`lg:hidden ${interactive.touch.md} flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors`}
            title="Open menu"
          >
            <Menu size={20} />
          </button>

          {enableSearch && (
            <div className="relative hidden sm:block">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder={searchPlaceholder}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 lg:w-96"
              />
            </div>
          )}

          {/* Mobile search button */}
          {enableSearch && (
            <button className="sm:hidden min-h-[44px] min-w-[44px] sm:min-h-[40px] sm:min-w-[40px] flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
              <Search size={20} />
            </button>
          )}
        </div>

        <div className={`flex items-center ${spacing.element.sm}`}>
          {customActions}

          {/* Color Picker */}
          <ColorPicker variant="header" />

          <button
            className={`relative ${interactive.touch.md} flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors`}
          >
            <Bell size={18} className="sm:w-5 sm:h-5" />
            <span
              className={`absolute -top-1 -right-1 bg-red-500 text-white ${typography.caption.small} rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center`}
            >
              3
            </span>
          </button>

          <div className={`flex items-center ${spacing.element.sm}`}>
            {/* User info - hidden on mobile, shown on tablet+ */}
            <div className="text-right hidden md:block">
              <p
                className={`${typography.ui.regular} text-gray-900 dark:text-white`}
              >
                {user?.name || "User"}
              </p>
              <p
                className={`${typography.caption.regular} text-gray-500 dark:text-gray-400`}
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
              className={`${interactive.touch.sm} flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors`}
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
