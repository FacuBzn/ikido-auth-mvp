import type { Metadata } from "next";
import { RegisterClient } from "./RegisterClient";

export const metadata: Metadata = {
  title: "Parent Register | iKidO",
  description: "Create a new parent account to manage your family's tasks and rewards",
};

/**
 * V2 Parent Register Page
 * Uses iKidO UI Kit with high fidelity to V0 design
 */
export default function V2ParentRegisterPage() {
  return <RegisterClient />;
}
