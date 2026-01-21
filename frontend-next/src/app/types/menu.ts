import { MENU_CONFIG } from "../config/menu.config";

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  roles: string[];
  submenu?: MenuItem[] | null;
  action?: string; // Custom action like "open-subscription-modal"
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

  // Normalize roles to string array
  const normalizedRoles = userRoles.map((role: any) => 
    typeof role === 'string' ? role : role.role?.name || role.name || role
  ).filter(Boolean);

  // SUPERADMIN has access to everything - return all menu items
  if (normalizedRoles.includes('SUPERADMIN')) {
    return MENU_CONFIG.items.map((item) => ({
      ...item,
      submenu: item.submenu || null, // Include all submenu items for SUPERADMIN
    }));
  }

  // For other roles (including ADMIN), filter based on role permissions
  const filteredItems = MENU_CONFIG.items
    .filter((item) => {
      const hasAccess = item.roles.some((role) => normalizedRoles.includes(role));
      return hasAccess;
    })
    .map((item) => ({
      ...item,
      submenu: item.submenu
        ? item.submenu.filter((subItem) => {
            const hasSubAccess = subItem.roles.some((role) => normalizedRoles.includes(role));
            return hasSubAccess;
          })
        : null,
    }));

  return filteredItems;
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
