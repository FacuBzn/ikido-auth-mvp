import type { Metadata } from "next";
import { requireMetricsAdmin } from "@/lib/auth/requireMetricsAdmin";
import { MetricsClient } from "./MetricsClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Metrics | iKidO",
  description: "Login metrics dashboard",
};

/**
 * Metrics Page (Admin Only)
 * 
 * Server-side protected route that only allows access to users
 * whose email is in METRICS_ADMIN_EMAILS environment variable.
 * 
 * Accessible only via direct URL: /metrics
 * No links or buttons in the application point to this route.
 * 
 * If not authorized, returns 404 (notFound).
 */
export default async function MetricsPage() {
  // This will call notFound() if user is not authorized
  await requireMetricsAdmin();

  // If we reach here, user is authorized
  return <MetricsClient />;
}
