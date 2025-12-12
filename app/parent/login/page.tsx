import type { Metadata } from "next";
import { ParentLoginForm } from "./ParentLoginForm";

export const metadata: Metadata = {
  title: "Parent Login | iKidO",
};

export default async function ParentLoginPage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center p-4 page-content"
      style={{ background: "linear-gradient(135deg, #0F4C7D 0%, #1A5FA0 100%)" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-yellow-300 font-semibold text-lg">Parent Login</p>
        </div>

        <ParentLoginForm />
      </div>
    </main>
  );
}

