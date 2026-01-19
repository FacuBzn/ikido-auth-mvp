"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PrimaryButton,
  SecondaryButton,
  PanelCard,
  TextInput,
  IkidoLogo,
} from "@/components/ikido";
import {
  LogOut,
  Copy,
  Check,
  Plus,
  CheckSquare,
  User,
  Activity,
  ListTodo,
  X,
  Gift,
} from "lucide-react";
import type { Parent, Child } from "@/store/useSessionStore";
import { useSessionStore } from "@/store/useSessionStore";

interface ParentDashboardClientProps {
  parent: Parent;
  initialChildren: Child[];
}

/**
 * V2 Parent Dashboard Client
 * Full dashboard with IKIDO UI Kit
 */
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
  const [addError, setAddError] = useState<string | null>(null);

  // Copy states
  const [copiedFamilyCode, setCopiedFamilyCode] = useState(false);
  const [copiedChildCode, setCopiedChildCode] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    router.push("/parent/login");
    router.refresh();
  };

  const handleCopyFamilyCode = async () => {
    try {
      await navigator.clipboard.writeText(parent.family_code);
      setCopiedFamilyCode(true);
      setTimeout(() => setCopiedFamilyCode(false), 2000);
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

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setIsAdding(true);

    try {
      const response = await fetch("/api/children/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: childName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create child");
      }

      const newChild: Child = {
        id: data.id,
        parent_id: data.parent_id || parent.id,
        name: data.name,
        child_code: data.child_code,
        created_at: data.created_at,
      };

      setChildren([...children, newChild]);
      setChildName("");
      setShowAddChild(false);
    } catch (err) {
      console.error("[V2 ParentDashboard] Failed to add child:", err);
      setAddError(err instanceof Error ? err.message : "Failed to add child");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        {/* Empty for alignment */}
        <div className="w-[88px]" />

        {/* Logo */}
        <IkidoLogo />

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="ik-btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>LOGOUT</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-2xl mx-auto w-full space-y-6">
        {/* Welcome Header */}
        <div className="text-center">
          <h1 className="text-xl font-black text-[var(--ik-accent-yellow)] mb-1">
            Welcome, {parent.full_name || "Parent"}!
          </h1>
          <p className="text-[var(--ik-text-muted)] text-sm">
            Manage chores and rewards together
          </p>
        </div>

        {/* Family Code Card */}
        <PanelCard>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <p className="text-[var(--ik-text-muted)] text-xs mb-1">
                Family Code
              </p>
              <p className="text-2xl font-black text-[var(--ik-accent-yellow)] tracking-wider">
                {parent.family_code || "N/A"}
              </p>
              <p className="text-[var(--ik-text-muted)] text-xs mt-2">
                Share this code with your children
              </p>
            </div>
            <button
              onClick={handleCopyFamilyCode}
              className="ik-btn-primary flex items-center justify-center gap-2 px-4 py-2 text-sm w-full md:w-auto shrink-0"
            >
              {copiedFamilyCode ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </PanelCard>

        {/* Manage Tasks Card */}
        <PanelCard>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white mb-1">Manage Tasks</h2>
              <p className="text-[var(--ik-text-muted)] text-sm">
                Assign tasks and track progress
              </p>
            </div>
            <Link href="/parent/tasks" className="w-full md:w-auto shrink-0">
              <PrimaryButton icon={<CheckSquare className="w-4 h-4" />} className="w-full md:w-auto">
                Go to Tasks
              </PrimaryButton>
            </Link>
          </div>
        </PanelCard>

        {/* Approve Tasks Card */}
        <PanelCard>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white mb-1">Approve Tasks</h2>
              <p className="text-[var(--ik-text-muted)] text-sm">
                Review and approve completed tasks
              </p>
            </div>
            <Link href="/parent/approvals" className="w-full md:w-auto shrink-0">
              <SecondaryButton icon={<CheckSquare className="w-4 h-4" />} className="w-full md:w-auto">
                Review
              </SecondaryButton>
            </Link>
          </div>
        </PanelCard>

        {/* Manage Rewards Card */}
        <PanelCard>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white mb-1">Manage Rewards</h2>
              <p className="text-[var(--ik-text-muted)] text-sm">
                Create rewards and approve claims
              </p>
            </div>
            <Link href="/parent/rewards" className="w-full md:w-auto shrink-0">
              <PrimaryButton icon={<Gift className="w-4 h-4" />} className="w-full md:w-auto">
                Rewards
              </PrimaryButton>
            </Link>
          </div>
        </PanelCard>

        {/* Children Section */}
        <PanelCard className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Your Children</h2>
            {!showAddChild && (
              <button
                onClick={() => setShowAddChild(true)}
                className="ik-btn-primary flex items-center gap-2 px-3 py-1.5 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Child</span>
              </button>
            )}
          </div>

          {/* Add Child Form */}
          {showAddChild && (
            <div className="bg-[var(--ik-surface-1)] rounded-xl p-4 space-y-4">
              {addError && (
                <div className="bg-[var(--ik-danger)]/20 border-2 border-[var(--ik-danger)] text-white text-sm p-3 rounded-xl flex items-start gap-2">
                  <span className="text-lg shrink-0">⚠️</span>
                  <span>{addError}</span>
                </div>
              )}
              <form onSubmit={handleAddChild} className="space-y-4">
                <TextInput
                  label="Child Name"
                  placeholder="Enter child's name"
                  value={childName}
                  onChange={setChildName}
                  disabled={isAdding}
                />
                <div className="flex gap-3">
                  <PrimaryButton
                    type="submit"
                    disabled={isAdding || !childName.trim()}
                    loading={isAdding}
                    fullWidth
                  >
                    Add Child
                  </PrimaryButton>
                  <SecondaryButton
                    type="button"
                    onClick={() => {
                      setShowAddChild(false);
                      setChildName("");
                      setAddError(null);
                    }}
                    icon={<X className="w-4 h-4" />}
                  >
                    Cancel
                  </SecondaryButton>
                </div>
              </form>
            </div>
          )}

          {/* Children List */}
          {children.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-[var(--ik-text-muted)] mx-auto mb-3 opacity-50" />
              <p className="text-[var(--ik-text-muted)]">No children added yet.</p>
              <p className="text-[var(--ik-text-muted)] text-sm mt-1">
                Click &quot;Add Child&quot; to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {children.map((child) => (
                <ChildCard
                  key={child.id}
                  child={child}
                  copiedChildCode={copiedChildCode}
                  onCopyCode={handleCopyChildCode}
                />
              ))}
            </div>
          )}
        </PanelCard>

      </div>
    </div>
  );
}

// Child Card Component
interface ChildCardProps {
  child: Child;
  copiedChildCode: string | null;
  onCopyCode: (code: string) => void;
}

function ChildCard({
  child,
  copiedChildCode,
  onCopyCode,
}: ChildCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="bg-[var(--ik-surface-1)] border-2 border-[var(--ik-outline-light)] rounded-xl p-4 space-y-3">
      {/* Header: Name + Actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-lg truncate">{child.name}</p>
          <p className="text-[var(--ik-text-muted)] text-xs">
            Joined: {formatDate(child.created_at)}
          </p>
        </div>

        {/* Action Pills */}
        <div className="flex gap-2 shrink-0">
          <Link
            href={`/parent/tasks?childId=${child.id}`}
            className="ik-btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs"
          >
            <ListTodo className="w-3 h-3" />
            <span>Tasks</span>
          </Link>
          <Link
            href={`/parent/children/${child.id}/activity`}
            className="ik-btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs"
          >
            <Activity className="w-3 h-3" />
            <span>Activity</span>
          </Link>
        </div>
      </div>

      {/* Child Code */}
      {child.child_code && (
        <div className="bg-[var(--ik-surface-2)] rounded-lg p-3">
          <p className="text-[var(--ik-text-muted)] text-xs mb-1">Child Code</p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <code className="text-sm font-mono text-[var(--ik-accent-yellow)] font-bold break-all">
              {child.child_code}
            </code>
            <button
              onClick={() => onCopyCode(child.child_code!)}
              className="text-[var(--ik-accent-cyan)] hover:text-white text-xs flex items-center gap-1 transition-colors shrink-0 self-start sm:self-auto"
            >
              {copiedChildCode === child.child_code ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <p className="text-[var(--ik-text-muted)] text-xs mt-2">
            Share with {child.name} to join
          </p>
        </div>
      )}
    </div>
  );
}
