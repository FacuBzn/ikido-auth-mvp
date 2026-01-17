import type { Metadata } from "next";
import { ChildJoinForm } from "./ChildJoinForm";

export const metadata: Metadata = {
  title: "Child Join | iKidO",
  description: "Enter your child code to start playing",
};

/**
 * V2 Child Join Page
 * Uses iKidO UI Kit with high fidelity to V0 design
 */
export default function V2ChildJoinPage() {
  return <ChildJoinForm />;
}
