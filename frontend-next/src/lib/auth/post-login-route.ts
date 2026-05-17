export function getPrimaryRole(roles: string[] | undefined): string | null {
  if (!roles?.length) return null;
  const priority = [
    "SUPERADMIN",
    "ADMIN",
    "FACULTY",
    "INSTITUTION_MANAGER",
    "STUDENT",
  ];
  for (const p of priority) {
    if (roles.includes(p)) return p;
  }
  return roles[0];
}

export function routeAfterLogin(roles: string[] | undefined): string {
  const primary = getPrimaryRole(roles);
  if (primary === "FACULTY") return "/faculty";
  if (primary === "INSTITUTION_MANAGER") return "/faculty";
  if (primary === "ADMIN" || primary === "SUPERADMIN") return "/dashboard";
  return "/dashboard";
}

export function userHasRole(
  roles: string[] | undefined,
  role: string,
): boolean {
  return Boolean(roles?.includes(role));
}
