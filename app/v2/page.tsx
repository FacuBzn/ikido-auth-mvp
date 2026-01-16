import { redirect } from "next/navigation";

/**
 * V2 Redirect Page
 * Redirects /v2 to root (/) for compatibility
 * V2 is now the default at root routes
 */
export default function V2RedirectPage() {
  redirect("/");
}
