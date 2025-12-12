import type { Metadata } from "next";
import { ChildJoinForm } from "./ChildJoinForm";

export const metadata: Metadata = {
  title: "Child Join | iKidO",
};

export default async function ChildJoinPage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center p-4 page-content"
      style={{ background: "linear-gradient(135deg, #0F4C7D 0%, #1A5FA0 100%)" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-yellow-300 font-semibold text-lg">Welcome, Player!</p>
        </div>

        <ChildJoinForm />
      </div>
    </main>
  );
}

