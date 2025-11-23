"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSessionStore } from "@/store/useSessionStore";
import { useRequireChildAuth } from "@/hooks/useRequireChildAuth";
import { createBrowserClient } from "@/lib/supabaseClient";
import { LogOut } from "lucide-react";

export function ChildDashboardClient() {
  const router = useRouter();
  const child = useRequireChildAuth();
  const logout = useSessionStore((state) => state.logout);
  const [parentName, setParentName] = useState<string | null>(null);

  useEffect(() => {
    if (child) {
      // Fetch parent name
      const fetchParent = async () => {
        try {
          const supabase = createBrowserClient();
          const { data, error } = await supabase
            .from("parents")
            .select("full_name")
            .eq("id", child.parent_id)
            .maybeSingle();

          if (error) {
            console.error("Failed to fetch parent:", error);
            return;
          }

          if (data) {
            setParentName(data.full_name);
          }
        } catch (error) {
          console.error("Failed to fetch parent:", error);
        }
      };

      fetchParent();
    }
  }, [child]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (!child) {
    return null; // useRequireChildAuth will redirect
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">iKidO</h1>
            <p className="text-yellow-300 font-semibold mt-1">
              Welcome, {child.name}!
            </p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="text-white border-white/30 hover:bg-white/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Parent Info */}
        {parentName && (
          <Card className="bg-white/10 border-yellow-400/30 backdrop-blur">
            <CardContent className="p-6">
              <p className="text-white/70 text-sm mb-1">Parent</p>
              <p className="text-xl font-bold text-white">{parentName}</p>
            </CardContent>
          </Card>
        )}

        {/* Placeholder for Tasks & GGPoints */}
        <Card className="bg-white/10 border-yellow-400/30 backdrop-blur">
          <CardContent className="p-6 text-center">
            <div className="text-6xl mb-4">🎮</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Tasks & GGPoints
            </h2>
            <p className="text-yellow-300 font-semibold">Coming Soon</p>
            <p className="text-white/70 text-sm mt-2">
              Your tasks and rewards will appear here
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

