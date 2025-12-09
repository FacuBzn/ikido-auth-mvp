"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useSessionStore, type Parent, type Child } from "@/store/useSessionStore";
import { Copy, Plus, LogOut } from "lucide-react";

type ParentDashboardClientProps = {
  parent: Parent;
  initialChildren: Child[];
};

export function ParentDashboardClient({
  parent,
  initialChildren,
}: ParentDashboardClientProps) {
  const router = useRouter();
  const logout = useSessionStore((state) => state.logout);
  const [children, setChildren] = useState<Child[]>(initialChildren);
  const [showAddChild, setShowAddChild] = useState(false);
  const [childName, setChildName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedChildCode, setCopiedChildCode] = useState<string | null>(null);

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsAdding(true);

    try {
      // Call API route to create child
      const response = await fetch("/api/children/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: childName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create child");
      }

      // Map API response to Child type
      const newChild: Child = {
        id: data.id,
        parent_id: data.parent_id || parent.id,
        name: data.name,
        child_code: data.child_code, // Include child_code from API response
        created_at: data.created_at,
      };

      setChildren([...children, newChild]);
      setChildName("");
      setShowAddChild(false);
    } catch (err) {
      console.error("[ParentDashboard] Failed to add child:", err);
      setError(err instanceof Error ? err.message : "Failed to add child");
    } finally {
      setIsAdding(false);
    }
  };

  const handleCopyFamilyCode = async () => {
    try {
      await navigator.clipboard.writeText(parent.family_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCopyChildCode = async (childCode: string) => {
    try {
      await navigator.clipboard.writeText(childCode);
      setCopiedChildCode(childCode);
      setTimeout(() => setCopiedChildCode(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0F4C7D] to-[#1A5FA0] p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">iKidO</h1>
            <p className="text-yellow-300 font-semibold mt-1">
              Welcome, {parent.full_name}
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

        {/* Family Code Card */}
        <Card className="bg-white/10 border-yellow-400/30 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-yellow-300 font-semibold text-sm mb-2 block">
                  Family Code
                </Label>
                <p className="text-2xl font-bold text-white tracking-widest">
                  {parent.family_code}
                </p>
                <p className="text-white/70 text-xs mt-2">
                  Share this code with your children
                </p>
              </div>
              <Button
                onClick={handleCopyFamilyCode}
                size="sm"
                className="bg-yellow-400 text-[#0F4C7D] hover:bg-yellow-300"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Children Section */}
        <Card className="bg-white/10 border-yellow-400/30 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Your Children</h2>
              {!showAddChild && (
                <Button
                  onClick={() => setShowAddChild(true)}
                  size="sm"
                  className="bg-yellow-400 text-[#0F4C7D] hover:bg-yellow-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Child
                </Button>
              )}
            </div>

            {showAddChild && (
              <form onSubmit={handleAddChild} className="mb-4 space-y-3 p-4 bg-white/5 rounded-lg">
                {error && (
                  <div className="bg-red-500/20 border-2 border-red-500 text-white text-sm p-2 rounded">
                    {error}
                  </div>
                )}
                <div>
                  <Label htmlFor="child-name" className="text-white text-sm font-semibold mb-2 block">
                    Child Name
                  </Label>
                  <Input
                    id="child-name"
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="Enter child's name"
                    required
                    minLength={2}
                    className="bg-white/10 border-yellow-400 text-white placeholder-white/50"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={isAdding || !childName.trim()}
                    className="flex-1 bg-yellow-400 text-[#0F4C7D] hover:bg-yellow-300"
                  >
                    {isAdding ? "Adding..." : "Add"}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setShowAddChild(false);
                      setChildName("");
                      setError(null);
                    }}
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {children.length === 0 ? (
              <div className="text-center py-8 text-white/70">
                <p>No children added yet.</p>
                <p className="text-sm mt-2">Click "Add Child" to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {children.map((child) => (
                  <Card key={child.id} className="bg-white/5 border-yellow-400/20">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-white text-lg">{child.name}</p>
                          {child.child_code && (
                            <div className="mt-2 space-y-1">
                              <Label className="text-yellow-300 font-semibold text-xs">
                                Child Code
                              </Label>
                              <div className="flex items-center gap-2">
                                <code className="text-sm font-mono text-white bg-white/10 px-2 py-1 rounded border border-yellow-400/30">
                                  {child.child_code}
                                </code>
                                <Button
                                  onClick={() => handleCopyChildCode(child.child_code!)}
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-yellow-300 hover:text-yellow-400 hover:bg-white/10"
                                >
                                  <Copy className="w-3 h-3 mr-1" />
                                  {copiedChildCode === child.child_code ? "Copied!" : "Copy"}
                                </Button>
                              </div>
                              <p className="text-xs text-white/60 mt-1">
                                Share this code + Family Code ({parent.family_code}) with {child.name}
                              </p>
                            </div>
                          )}
                          <p className="text-xs text-white/50 mt-2">
                            Joined: {new Date(child.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

