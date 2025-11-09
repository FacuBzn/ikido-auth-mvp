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
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          role: DatabaseUserRole;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          role: DatabaseUserRole;
        };
        Update: {
          email?: string;
          name?: string | null;
          role?: DatabaseUserRole;
        };
        Relationships: [];
      };
      children: {
        Row: {
          id: string;
          parent_id: string;
          name: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          name: string;
        };
        Update: {
          parent_id?: string;
          name?: string;
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
          points: number;
          child_id: string;
          completed: boolean;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          points: number;
          child_id: string;
          completed?: boolean;
        };
        Update: {
          title?: string;
          description?: string | null;
          points?: number;
          child_id?: string;
          completed?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_child_id_fkey";
            columns: ["child_id"];
            referencedRelation: "children";
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
          child_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          cost: number;
          claimed?: boolean;
          child_id: string;
        };
        Update: {
          name?: string;
          cost?: number;
          claimed?: boolean;
          child_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rewards_child_id_fkey";
            columns: ["child_id"];
            referencedRelation: "children";
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

