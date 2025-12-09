import type { Metadata } from "next";
import { ParentRegisterForm } from "./ParentRegisterForm";

export const metadata: Metadata = {
  title: "Parent Register | iKidO",
};

export default async function ParentRegisterPage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #0F4C7D 0%, #1A5FA0 100%)" }}
    >
      <ParentRegisterForm />
    </main>
  );
}

