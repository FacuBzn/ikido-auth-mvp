import { redirect } from "next/navigation";

/**
 * V2 Parent Redirect
 * Redirects /v2/parent to /parent for compatibility
 */
export default function V2ParentRedirectPage() {
  redirect("/parent/dashboard");
}
