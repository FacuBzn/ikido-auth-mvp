/**
 * Domain types for the Tasks & GGPoints module
 * 
 * Schema REAL en Supabase:
 * - tasks: id, title, description, points, is_global, created_at
 * - child_tasks: id, child_user_id, task_id, completed, completed_at, created_at
 * - ggpoints_ledger: id, child_user_id, points, reason, created_at
 */

/**
 * Task template (from tasks table).
 * Can be global (is_global = true) or custom.
 */
export interface TaskTemplate {
  id: string;
  title: string;
  description: string | null;
  points: number;
  is_global: boolean;
  created_at: string;
}

/**
 * Child task instance (from child_tasks table).
 * Represents a task assigned to a specific child.
 */
export interface ChildTaskInstance {
  id: string;
  child_user_id: string;
  task_id: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  // Points from child_tasks.points (assignment-specific points)
  points: number;
  // Optional joined task info
  task?: {
    id: string;
    title: string;
    description: string | null;
    points: number;
    is_global: boolean;
  };
}

/**
 * GGPoints ledger entry (from ggpoints_ledger table).
 * Represents a point movement (credit or debit) for a child.
 */
export interface GGPointsEntry {
  id: string;
  child_user_id: string;
  points: number;
  reason: string | null;
  created_at: string;
}

/**
 * DTO for creating a custom task
 */
export interface CreateCustomTaskDTO {
  title: string;
  description?: string;
  points: number;
}

/**
 * DTO for updating a custom task
 */
export interface UpdateCustomTaskDTO {
  title?: string;
  description?: string;
  points?: number;
}

/**
 * DTO for assigning a task to children
 */
export interface AssignTaskDTO {
  taskId: string;
  childIds: string[];
  points?: number;
}
