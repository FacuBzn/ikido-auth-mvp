import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/authHelpers";
import { createSupabaseServerComponentClient } from "@/lib/supabase/serverClient";
import { ChildActivityClient } from "./ChildActivityClient";

export const metadata: Metadata = {
  title: "Child Activity | iKidO",
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ childId: string }>;
}

/**
 * Activity event type for normalized display
 */
export type ActivityEvent = {
  id: string;
  type: "task_completed" | "task_approved" | "task_pending" | "reward_claimed";
  title: string;
  subtitle: string | null;
  pointsDelta: number;
  date: string;
  status: "completed" | "approved" | "pending" | "claimed";
};

/**
 * V2 Child Activity Page
 * Server component that validates ownership and fetches activity data
 */
export default async function V2ChildActivityPage({ params }: PageProps) {
  const { childId } = await params;

  const authUser = await getAuthenticatedUser();

  if (!authUser) {
    redirect("/v2/parent/login");
  }

  if (authUser.profile.role !== "Parent") {
    redirect("/v2/child/dashboard");
  }

  const supabase = await createSupabaseServerComponentClient();

  // Get parent record
  const { data: parentData, error: parentError } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", authUser.user.id)
    .eq("role", "parent")
    .single();

  if (parentError || !parentData) {
    redirect("/v2/parent/login");
  }

  // Get child and validate ownership
  const { data: childData, error: childError } = await supabase
    .from("users")
    .select("id, name, points_balance, parent_id, child_code, created_at")
    .eq("id", childId)
    .eq("role", "child")
    .single();

  if (childError || !childData) {
    notFound();
  }

  // Validate child belongs to this parent
  if (childData.parent_id !== parentData.id) {
    notFound();
  }

  // Fetch child tasks with task details (last 50)
  const { data: tasksData, error: tasksError } = await supabase
    .from("child_tasks")
    .select(`
      id,
      status,
      points,
      assigned_at,
      completed_at,
      approved_at,
      task:tasks(title, description)
    `)
    .eq("child_id", childId)
    .order("assigned_at", { ascending: false })
    .limit(50);

  if (tasksError) {
    console.error("[V2 ChildActivity] Failed to fetch tasks:", tasksError);
  }

  // Fetch claimed rewards (last 50)
  const { data: rewardsData, error: rewardsError } = await supabase
    .from("rewards")
    .select("id, name, cost, claimed, claimed_at, created_at")
    .eq("child_user_id", childId)
    .eq("claimed", true)
    .order("claimed_at", { ascending: false })
    .limit(50);

  if (rewardsError) {
    console.error("[V2 ChildActivity] Failed to fetch rewards:", rewardsError);
  }

  // Build activity events
  const events: ActivityEvent[] = [];

  // Add task events
  if (tasksData) {
    for (const task of tasksData) {
      const taskInfo = task.task as { title: string; description: string | null } | null;
      const title = taskInfo?.title || "Unknown Task";

      if (task.status === "approved" && task.approved_at) {
        events.push({
          id: `task-approved-${task.id}`,
          type: "task_approved",
          title,
          subtitle: taskInfo?.description || null,
          pointsDelta: task.points,
          date: task.approved_at,
          status: "approved",
        });
      } else if (task.status === "completed" && task.completed_at) {
        events.push({
          id: `task-completed-${task.id}`,
          type: "task_completed",
          title,
          subtitle: taskInfo?.description || null,
          pointsDelta: task.points,
          date: task.completed_at,
          status: "completed",
        });
      } else if (task.status === "pending") {
        events.push({
          id: `task-pending-${task.id}`,
          type: "task_pending",
          title,
          subtitle: taskInfo?.description || null,
          pointsDelta: task.points,
          date: task.assigned_at,
          status: "pending",
        });
      }
    }
  }

  // Add reward events
  if (rewardsData) {
    for (const reward of rewardsData) {
      if (reward.claimed && reward.claimed_at) {
        events.push({
          id: `reward-${reward.id}`,
          type: "reward_claimed",
          title: reward.name,
          subtitle: null,
          pointsDelta: -reward.cost,
          date: reward.claimed_at,
          status: "claimed",
        });
      }
    }
  }

  // Sort by date descending
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Child info for display
  const child = {
    id: childData.id,
    name: childData.name || "Unknown",
    points_balance: childData.points_balance ?? 0,
    child_code: childData.child_code || undefined,
  };

  return (
    <ChildActivityClient
      child={child}
      events={events}
    />
  );
}
