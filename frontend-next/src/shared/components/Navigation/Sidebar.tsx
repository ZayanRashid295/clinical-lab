import {
  ChevronRight,
  ChevronLeft,
  ChevronRight as ExpandIcon,
  Cross,
  Home,
} from "lucide-react";
import { MenuItem } from "../../../app/types/menu";
import { iconMap } from "../Common/IconMap";
import { useMemo } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { NAV_SIDEBAR_SECTIONS } from "../../../app/config/navSections.config";

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

function normalizeRoles(user: any): string[] {
  const raw = user?.roles ?? [];
  return raw
    .map((role: any) =>
      typeof role === "string"
        ? role.toUpperCase()
        : String(role?.name || role?.role?.name || "").toUpperCase()
    )
    .filter(Boolean);
}

function workspaceSubtitleKey(roles: string[]): string {
  if (roles.some((r) => ["SUPERADMIN", "ADMIN"].includes(r))) {
    return "nav.workspace.admin";
  }
  if (roles.includes("FACULTY")) return "nav.workspace.faculty";
  if (roles.includes("STUDENT")) return "nav.workspace.student";
  return "nav.workspace.default";
}

function userInitials(name: string | undefined): string {
  if (!name?.trim()) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
  const { t, isRTL } = useLanguage();
  const rtldir = isRTL ? "rtl" : "ltr";

  const roleStrs = useMemo(() => normalizeRoles(user), [user]);
  const workspaceKey = useMemo(
    () => workspaceSubtitleKey(roleStrs),
    [roleStrs]
  );
  const primaryRoleLabel = roleStrs[0]
    ? roleStrs[0].replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
    : t("common.user");

  const sectionsWithItems = useMemo(
    () =>
      NAV_SIDEBAR_SECTIONS.map((section) => ({
        ...section,
        items: menuItems.filter((m) =>
          (section.menuItemIds as readonly string[]).includes(m.id)
        ),
      })).filter((s) => s.items.length > 0),
    [menuItems]
  );

  const isItemOrChildActive = (item: MenuItem) => {
    if (activeMenu === item.id) return true;
    return item.submenu?.some((s) => s.id === activeMenu) ?? false;
  };

  return (
    <>
      <style jsx>{`
        .sidebar-scroll::-webkit-scrollbar,
        .submenu-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .sidebar-scroll::-webkit-scrollbar-track,
        .submenu-scroll::-webkit-scrollbar-track {
          background: rgb(6 78 59 / 0.5);
          border-radius: 3px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb,
        .submenu-scroll::-webkit-scrollbar-thumb {
          background: rgb(16 185 129 / 0.35);
          border-radius: 3px;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover,
        .submenu-scroll::-webkit-scrollbar-thumb:hover {
          background: rgb(16 185 129 / 0.55);
        }
      `}</style>
      <div
        className={`bg-emerald-950 text-emerald-50 h-full flex flex-col transition-all duration-300 ease-in-out relative border-r border-emerald-900/90 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Brand header */}
        <div className="p-4 border-b border-emerald-800/80 relative shrink-0">
          <div
            className={`flex items-start gap-3 ${isCollapsed ? "justify-center" : ""}`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-400/30">
              <Cross className="h-5 w-5" strokeWidth={2.4} aria-hidden />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1 pr-8">
                <h1 className="text-lg font-bold leading-tight text-white truncate">
                  {applicationTitle}
                </h1>
                <p className="text-xs text-emerald-300/90 mt-0.5 truncate">
                  {t(workspaceKey)}
                </p>
              </div>
            )}
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className={`p-1.5 rounded-md text-emerald-200 hover:bg-emerald-900/80 hover:text-white transition-colors absolute ${
                  !isCollapsed
                    ? "top-3 right-3"
                    : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                }`}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <ExpandIcon size={22} />
                ) : (
                  <ChevronLeft size={22} />
                )}
              </button>
            )}
          </div>
        </div>

        <nav
          dir={rtldir}
          className="flex-1 py-2 pb-4 overflow-y-auto overflow-x-hidden sidebar-scroll min-h-0"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgb(16 185 129 / 0.35) rgb(6 78 59 / 0.5)",
          }}
        >
          {sectionsWithItems.map((section) => (
            <div key={section.id} className="mb-1">
              {!isCollapsed && (
                <p className="text-[10px] font-semibold tracking-[0.12em] text-emerald-400/85 px-4 pt-4 pb-1.5 uppercase">
                  {t(section.labelKey)}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const IconComponent = iconMap[item.icon] || Home;
                  const hasSubmenu = item.submenu && item.submenu.length > 0;
                  const isSubmenuOpen = expandedMenus.includes(item.id);
                  const rowActive = isItemOrChildActive(item);

                  return (
                    <div key={item.id} className="group relative px-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (hasSubmenu) {
                            onToggleMenu(item.id);
                          } else {
                            onMenuChange(item.id);
                          }
                        }}
                        className={`w-full flex items-center gap-2.5 text-left rounded-lg transition-colors ${
                          isCollapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
                        } ${
                          rowActive && !hasSubmenu
                            ? "bg-emerald-600 text-white shadow-sm"
                            : rowActive && hasSubmenu
                              ? "bg-emerald-800/70 text-white"
                              : "text-emerald-100/95 hover:bg-emerald-900/70"
                        }`}
                        title={isCollapsed ? t(item.label) : undefined}
                      >
                        <span className="flex-shrink-0 opacity-95 [&_svg]:stroke-[1.75]">
                          <IconComponent size={20} />
                        </span>
                        {!isCollapsed && (
                          <>
                            <span className="text-sm font-medium truncate flex-1 min-w-0">
                              {t(item.label)}
                            </span>
                            {item.navBadge === "ai" && (
                              <span className="shrink-0 rounded-full bg-emerald-400/25 text-[10px] font-semibold px-2 py-0.5 text-emerald-100 ring-1 ring-emerald-400/40">
                                {t("nav.badgeAi")}
                              </span>
                            )}
                            {hasSubmenu && (
                              <span className="flex-shrink-0 text-emerald-200/80">
                                {isRTL ? (
                                  <ChevronLeft
                                    size={18}
                                    className={`transition-transform duration-200 ${
                                      isSubmenuOpen ? "-rotate-90" : "rotate-0"
                                    }`}
                                  />
                                ) : (
                                  <ChevronRight
                                    size={18}
                                    className={`transition-transform duration-200 ${
                                      isSubmenuOpen ? "rotate-90" : "rotate-0"
                                    }`}
                                  />
                                )}
                              </span>
                            )}
                          </>
                        )}
                      </button>

                      {hasSubmenu && !isCollapsed && (
                        <div
                          className={`ml-3 pl-3 border-l border-emerald-800/80 mt-0.5 space-y-0.5 submenu-scroll overflow-y-auto transition-all duration-300 ${
                            isSubmenuOpen
                              ? "max-h-[480px] opacity-100 py-1"
                              : "max-h-0 opacity-0 overflow-hidden py-0"
                          }`}
                          style={{
                            scrollbarWidth: "thin",
                            scrollbarColor:
                              "rgb(16 185 129 / 0.35) rgb(6 78 59 / 0.5)",
                          }}
                        >
                          {item.submenu?.map((subItem) => {
                            const SubIcon = iconMap[subItem.icon] || Home;
                            const subActive = activeMenu === subItem.id;
                            return (
                              <button
                                key={subItem.id}
                                type="button"
                                onClick={() => onMenuChange(subItem.id)}
                                className={`w-full flex items-center gap-2 text-left text-sm rounded-md px-2 py-2 transition-colors ${
                                  subActive
                                    ? "bg-emerald-600 text-white"
                                    : "text-emerald-200/90 hover:bg-emerald-900/60 hover:text-white"
                                }`}
                              >
                                <SubIcon size={16} />
                                <span className="truncate">{t(subItem.label)}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {isCollapsed && (
                        <div
                          className={`absolute top-0 px-2 py-1.5 bg-emerald-900 text-emerald-50 text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 border border-emerald-700 ${
                            isRTL ? "right-full mr-2" : "left-full ml-2"
                          }`}
                        >
                          {t(item.label)}
                          {hasSubmenu && item.submenu && (
                            <div className="mt-1 space-y-0.5 border-t border-emerald-700 pt-1 text-emerald-300">
                              {item.submenu.map((subItem) => (
                                <div key={subItem.id}>{t(subItem.label)}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="mt-auto border-t border-emerald-800/80 p-3 shrink-0 bg-emerald-950/95">
          <div
            className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-sm font-semibold text-emerald-100 ring-1 ring-emerald-600/50">
              {userInitials(user?.name)}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || t("common.user")}
                </p>
                <p className="text-xs text-emerald-400/90 truncate">
                  {primaryRoleLabel}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
