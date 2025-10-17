import { MENU_CONFIG } from "../config/menu.config";

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  roles: string[];
  order: number;
  submenu?: MenuItem[] | null;
}

export interface MenuPermissions {
  [role: string]: {
    canAccessAll: boolean;
    canManageUsers: boolean;
    canManageRoles: boolean;
    canViewAnalytics: boolean;
    canManageFleet: boolean;
    canViewReports: boolean;
    canManageRides: boolean;
    canManagePayments: boolean;
  };
}

export function getMenuItemsForRole(userRoles: string[]): MenuItem[] {
  if (!userRoles || userRoles.length === 0) return [];

  return MENU_CONFIG.items
    .filter((item) => {
      return item.roles.some((role) => userRoles.includes(role));
    })
    .map((item) => ({
      ...item,
      submenu: item.submenu
        ? item.submenu.filter((subItem) =>
            subItem.roles.some((role) => userRoles.includes(role))
          )
        : null,
    }))
    .sort((a, b) => a.order - b.order);
}

export function hasPermission(
  userRoles: string[],
  permission: string
): boolean {
  if (!userRoles || userRoles.length === 0) return false;

  return userRoles.some((role) => {
    const rolePermissions =
      MENU_CONFIG.permissions[role as keyof typeof MENU_CONFIG.permissions];
    return (
      rolePermissions &&
      rolePermissions[permission as keyof typeof rolePermissions]
    );
  });
}

export function getAccessiblePaths(userRoles: string[]): string[] {
  const items = getMenuItemsForRole(userRoles);
  const paths: string[] = [];

  const extractPaths = (items: MenuItem[]) => {
    items.forEach((item) => {
      paths.push(item.path);
      if (item.submenu) {
        extractPaths(item.submenu);
      }
    });
  };

  extractPaths(items);
  return paths;
}
