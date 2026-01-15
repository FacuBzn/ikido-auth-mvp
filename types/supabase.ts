export type DatabaseUserRole = "parent" | "child";
export type UserRole = "Parent" | "Child";

export const isUserRole = (role: unknown): role is UserRole =>
  role === "Parent" || role === "Child";

export const fromDatabaseUserRole = (
  role: DatabaseUserRole | string | null | undefined
): UserRole | null => {
  if (role === "parent" || role === "Parent") {
    return "Parent";
  }
  if (role === "child" || role === "Child") {
    return "Child";
  }
  return null;
};

export const toDatabaseUserRole = (role: UserRole): DatabaseUserRole =>
  role === "Parent" ? "parent" : "child";

export type ChildTaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "approved"
  | "rejected";

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          auth_id: string | null; // NULL for children, UUID for parents
          email: string | null; // NULL for children (no Auth)
          name: string | null;
          role: DatabaseUserRole;
          parent_id: string | null; // Internal FK to parent's users.id
          parent_auth_id: string | null; // auth.uid() of parent (for RLS)
          child_code: string | null; // Unique code for children (e.g., GERONIMO#3842)
          family_code: string | null; // Family code for parents (6 chars, e.g., ABC123)
          points_balance: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          auth_id?: string | null; // Optional, NULL for children
          email?: string | null; // Optional, NULL for children
          name?: string | null;
          role: DatabaseUserRole;
          parent_id?: string | null; // Internal FK to parent's users.id
          parent_auth_id?: string | null; // auth.uid() of parent (for RLS)
          child_code?: string | null; // Unique code for children
          family_code?: string | null; // Family code for parents
          points_balance?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          auth_id?: string | null;
          email?: string | null;
          name?: string | null;
          role?: DatabaseUserRole;
          parent_id?: string | null;
          parent_auth_id?: string | null;
          child_code?: string | null;
          family_code?: string | null;
          points_balance?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "users_parent_id_fkey";
            columns: ["parent_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      children: {
        Row: {
          id: string;
          parent_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          parent_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "children_parent_id_fkey";
            columns: ["parent_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          points
: number;
          is_global: boolean;
          created_by_parent_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          points
: number;
          is_global?: boolean;
          created_by_parent_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          points
?: number;
          is_global?: boolean;
          created_by_parent_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_created_by_parent_id_fkey";
            columns: ["created_by_parent_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      child_tasks: {
        Row: {
          id: string;
          task_id: string;
          child_id: string;
          parent_id: string;
          status: ChildTaskStatus;
          points: number;
          assigned_at: string;
          completed_at: string | null;
          approved_at: string | null;
        };
        Insert: {
          id?: string;
          task_id: string;
          child_id: string;
          parent_id: string;
          status?: ChildTaskStatus;
          points: number;
          assigned_at?: string;
          completed_at?: string | null;
          approved_at?: string | null;
        };
        Update: {
          id?: string;
          task_id?: string;
          child_id?: string;
          parent_id?: string;
          status?: ChildTaskStatus;
          points?: number;
          assigned_at?: string;
          completed_at?: string | null;
          approved_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "child_tasks_task_id_fkey";
            columns: ["task_id"];
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "child_tasks_child_id_fkey";
            columns: ["child_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "child_tasks_parent_id_fkey";
            columns: ["parent_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      ggpoints_ledger: {
        Row: {
          id: string;
          child_id: string;
          parent_id: string;
          child_task_id: string | null;
          delta: number;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          parent_id: string;
          child_task_id?: string | null;
          delta: number;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          parent_id?: string;
          child_task_id?: string | null;
          delta?: number;
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ggpoints_ledger_child_id_fkey";
            columns: ["child_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ggpoints_ledger_parent_id_fkey";
            columns: ["parent_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ggpoints_ledger_child_task_id_fkey";
            columns: ["child_task_id"];
            referencedRelation: "child_tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      rewards: {
        Row: {
          id: string;
          name: string;
          cost: number;
          claimed: boolean;
          child_user_id: string;
          claimed_at: string | null;
          created_at: string;
          // PR13: Request/Approve flow fields
          status: "available" | "requested" | "approved" | "rejected";
          requested_at: string | null;
          approved_at: string | null;
          rejected_at: string | null;
          decided_by_parent_id: string | null;
          reject_reason: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          cost: number;
          claimed?: boolean;
          child_user_id: string;
          claimed_at?: string | null;
          created_at?: string;
          // PR13: Request/Approve flow fields
          status?: "available" | "requested" | "approved" | "rejected";
          requested_at?: string | null;
          approved_at?: string | null;
          rejected_at?: string | null;
          decided_by_parent_id?: string | null;
          reject_reason?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          cost?: number;
          claimed?: boolean;
          child_user_id?: string;
          claimed_at?: string | null;
          created_at?: string;
          // PR13: Request/Approve flow fields
          status?: "available" | "requested" | "approved" | "rejected";
          requested_at?: string | null;
          approved_at?: string | null;
          rejected_at?: string | null;
          decided_by_parent_id?: string | null;
          reject_reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "rewards_child_user_id_fkey";
            columns: ["child_user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      approve_child_task_and_add_points: {
        Args: {
          p_child_task_id: string;
          p_parent_auth_id: string;
        };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

