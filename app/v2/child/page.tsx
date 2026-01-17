import { redirect } from "next/navigation";

/**
 * V2 Child Redirect
 * Redirects /v2/child to /child for compatibility
 */
export default function V2ChildRedirectPage() {
  redirect("/child/join");
}
