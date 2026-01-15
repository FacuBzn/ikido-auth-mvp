import { redirect } from "next/navigation";

/**
 * Root page - redirects to V2 as the default entrypoint
 * V1 is accessible via /legacy
 */
export default function Home() {
  redirect("/v2");
}
