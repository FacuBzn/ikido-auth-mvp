import type { Metadata } from "next";
import { ParentLoginForm } from "./ParentLoginForm";

export const metadata: Metadata = {
  title: "Parent Login | iKidO",
  description: "Sign in to manage your family's tasks and rewards",
};

/**
 * V2 Parent Login Page
 * Uses iKidO UI Kit with high fidelity to V0 design
 */
export default function V2ParentLoginPage() {
  return <ParentLoginForm />;
}
