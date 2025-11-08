import type { UserRole } from "@/types/supabase";

export const DASHBOARD_ROUTE_BY_ROLE: Record<UserRole, string> = {
  Parent: "/dashboard/parent",
  Child: "/dashboard/child",
};

export const getDashboardPathByRole = (role: UserRole) =>
  DASHBOARD_ROUTE_BY_ROLE[role];

