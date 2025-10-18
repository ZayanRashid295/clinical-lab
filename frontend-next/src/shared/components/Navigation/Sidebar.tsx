import {
  ChevronRight,
  Home,
  ChevronLeft,
  ChevronRight as ExpandIcon,
} from "lucide-react";
import { MenuItem } from "../../../app/types/menu";
import { iconMap } from "../Common/IconMap";
import { useState } from "react";
import { useTheme } from "../../../hooks/useTheme";
import { useLanguage } from "../../contexts/LanguageContext";

interface SidebarProps {
  menuItems: MenuItem[];
  activeMenu: string;
  expandedMenus: string[];
  user: any;
  applicationTitle: string;
  onMenuChange: (menuId: string) => void;
  onToggleMenu: (menuId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  menuItems,
  activeMenu,
  expandedMenus,
  user,
  applicationTitle,
  onMenuChange,
  onToggleMenu,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { config } = useTheme();
  const { t, isRTL } = useLanguage();
  const rtldir = isRTL ? "rtl" : "ltr";
  return (
    <>
      <style jsx>{`
        .sidebar-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
          background: #374151;
          border-radius: 3px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 3px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
      <div
        className={`bg-primary-800 dark:bg-primary-900 text-white h-full flex flex-col transition-all duration-300 ease-in-out relative ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-primary-700 dark:border-primary-600 relative">
          <div className="flex items-center justify-between">
            <div
              className={`transition-opacity duration-300 ${
                !isCollapsed ? "opacity-100" : "opacity-0"
              }`}
            >
              <h1 className="text-2xl font-bold whitespace-nowrap">
                {applicationTitle}
              </h1>
              <p className="text-base text-gray-300 whitespace-nowrap">
                {user?.name || "User"}
              </p>
              <p className="text-sm text-gray-400 whitespace-nowrap">
                {user?.roles?.join(", ") || "No Role"}
              </p>
            </div>

            {/* Toggle button */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className={`p-1 hover:bg-gray-800 rounded transition-colors absolute ${
                  !isCollapsed
                    ? "top-4 right-4"
                    : "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                }`}
              >
                {isCollapsed ? (
                  <ExpandIcon size={25} />
                ) : (
                  <ChevronLeft size={25} />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav
          dir={rtldir}
          className="flex-1 py-4 pb-8 overflow-y-auto overflow-x-hidden sidebar-scroll"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#4B5563 #374151",
          }}
        >
          <div
            dir={rtldir}
            className={!isCollapsed ? "space-y-1" : "space-y-0"}
          >
            {menuItems.map((item) => {
              const IconComponent = iconMap[item.icon] || Home;
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const isSubmenuActive = expandedMenus.includes(item.id);

              return (
                <div key={item.id} className="relative">
                  <button
                    onClick={() => {
                      if (hasSubmenu) {
                        onToggleMenu(item.id);
                      } else {
                        onMenuChange(item.id);
                      }
                    }}
                    className={`w-full flex items-center px-4 py-4 text-left transition-all duration-200 group ${
                      activeMenu === item.id
                        ? "bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
                        : "hover:bg-primary-700 dark:hover:bg-primary-800"
                    } ${
                      hasSubmenu && activeMenu !== item.id ? "hover:pl-5" : ""
                    }`}
                    title={isCollapsed ? t(item.label) : undefined}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        <IconComponent size={20} />
                      </div>
                      <span
                        className={`text-base whitespace-nowrap transition-all duration-300 ${
                          !isCollapsed
                            ? "opacity-100 translate-x-0"
                            : "opacity-0 -translate-x-2"
                        }`}
                      >
                        {t(item.label)}
                      </span>
                    </div>

                    {hasSubmenu && !isCollapsed && (
                      <div className="flex-shrink-0">
                        {isRTL ? (
                          <ChevronLeft
                            size={25}
                            className={`transition-transform duration-200 ease-in-out ${
                              isSubmenuActive ? "-rotate-90" : "rotate-0"
                            }`}
                          />
                        ) : (
                          <ChevronRight
                            size={25}
                            className={`transition-transform duration-200 ease-in-out ${
                              isSubmenuActive ? "rotate-90" : "rotate-0"
                            }`}
                          />
                        )}
                      </div>
                    )}
                  </button>

                  {/* Submenu */}
                  {hasSubmenu && !isCollapsed && (
                    <div
                      className={`ml-8 overflow-hidden transition-all duration-300 ease-out ${
                        isSubmenuActive
                          ? "max-h-96 opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="py-1 space-y-1">
                        {item.submenu?.map((subItem) => {
                          const SubIconComponent =
                            iconMap[subItem.icon] || Home;
                          return (
                            <button
                              key={subItem.id}
                              onClick={() => onMenuChange(subItem.id)}
                              className={`w-full flex items-center gap-2 text-left px-4 py-3 text-base rounded transition-all duration-300 ease-out transform ${
                                activeMenu === subItem.id
                                  ? "bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white"
                                  : "text-gray-300 hover:bg-primary-700 dark:hover:bg-primary-800 hover:text-white"
                              } ${
                                isSubmenuActive
                                  ? "translate-y-0 opacity-100 scale-100"
                                  : "translate-y-2 opacity-0 scale-95"
                              }`}
                              style={{
                                transitionDelay: isSubmenuActive
                                  ? `${
                                      (item.submenu?.indexOf(subItem) ?? 0) * 50
                                    }ms`
                                  : "0ms",
                              }}
                            >
                              <SubIconComponent size={16} />
                              <span className="whitespace-nowrap">
                                {t(subItem.label)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div
                      className={`absolute top-0 px-2 py-1 bg-primary-800 dark:bg-primary-900 text-white text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 ${
                        isRTL ? "right-full mr-2" : "left-full ml-2"
                      }`}
                    >
                      {t(item.label)}
                      {hasSubmenu && item.submenu && (
                        <div className="mt-1 space-y-1 border-t border-primary-600 dark:border-primary-500 pt-1">
                          {item.submenu.map((subItem) => (
                            <div
                              key={subItem.id}
                              className="text-xs text-gray-300"
                            >
                              {t(subItem.label)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
