/**
 * Child Tasks API Client
 * Maps V2 UI to existing API routes
 */

import { apiPost } from "../client";

export interface ChildTask {
  id: string;
  task_id: string;
  title: string;
  description: string | null;
  points: number;
  status: "pending" | "in_progress" | "completed" | "approved" | "rejected";
  assigned_at: string;
  completed_at: string | null;
}

export interface TasksListInput {
  child_code: string;
  family_code: string;
}

export interface TasksListResponse {
  tasks: ChildTask[];
}

/**
 * Get tasks for child
 * Maps to POST /api/child/tasks
 */
export async function getChildTasks(input: TasksListInput) {
  return apiPost<TasksListResponse>("/api/child/tasks", {
    child_code: input.child_code.toUpperCase(),
    family_code: input.family_code.toUpperCase(),
  });
}

export interface CompleteTaskInput {
  child_task_id: string;
  child_code: string;
  family_code: string;
}

/**
 * Mark task as completed
 * Maps to POST /api/child/tasks/complete
 */
export async function completeTask(input: CompleteTaskInput) {
  return apiPost<{ success: boolean }>("/api/child/tasks/complete", {
    child_task_id: input.child_task_id,
    child_code: input.child_code.toUpperCase(),
    family_code: input.family_code.toUpperCase(),
  });
}
