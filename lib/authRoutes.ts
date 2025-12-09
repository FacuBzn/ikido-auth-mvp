import type { UserRole } from "@/types/supabase";

export const DASHBOARD_ROUTE_BY_ROLE: Record<UserRole, string> = {
  Parent: "/parent/dashboard",
  Child: "/child/dashboard",
};

export const LOGIN_ROUTE_BY_ROLE: Record<UserRole, string> = {
  Parent: "/parent/login",
  Child: "/child/join",
};

export const getDashboardPathByRole = (role: UserRole) =>
  DASHBOARD_ROUTE_BY_ROLE[role];

export const getLoginPathByRole = (role: UserRole) =>
  LOGIN_ROUTE_BY_ROLE[role];

