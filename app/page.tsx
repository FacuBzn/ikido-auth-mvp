import type { Metadata } from "next";
import { RoleSelection } from "@/components/screens/role-selection";

export const metadata: Metadata = {
  title: "iKidO | GGPoints",
};

export default function Home() {
  // Landing page - no need to check auth here
  // Client-side navigation will handle redirects if needed
  return <RoleSelection />;
}
