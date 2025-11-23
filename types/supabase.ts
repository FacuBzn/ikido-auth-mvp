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

export type Database = {
  public: {
    Tables: {
      parents: {
        Row: {
          id: string;
          auth_user_id: string;
          full_name: string;
          email: string;
          family_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          full_name: string;
          email: string;
          family_code: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string;
          full_name?: string;
          email?: string;
          family_code?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          auth_id: string;
          email: string;
          name: string | null;
          role: DatabaseUserRole;
          parent_id: string | null;
          child_code: string | null;
          points_balance: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          auth_id: string;
          email: string;
          name?: string | null;
          role: DatabaseUserRole;
          parent_id?: string | null;
          child_code?: string | null;
          points_balance?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          auth_id?: string;
          email?: string;
          name?: string | null;
          role?: DatabaseUserRole;
          parent_id?: string | null;
          child_code?: string | null;
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
            referencedRelation: "parents";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          points: number;
          child_user_id: string;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          points: number;
          child_user_id: string;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          points?: number;
          child_user_id?: string;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_child_user_id_fkey";
            columns: ["child_user_id"];
            referencedRelation: "users";
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
        };
        Insert: {
          id?: string;
          name: string;
          cost: number;
          claimed?: boolean;
          child_user_id: string;
          claimed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          cost?: number;
          claimed?: boolean;
          child_user_id?: string;
          claimed_at?: string | null;
          created_at?: string;
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
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

