export interface Parent {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Child {
  id: string;
  parent_id: string;
  name: string;
  join_code: string;
  points: number;
  created_at: string;
}

export interface AuthSession {
  type: 'parent' | 'child';
  id: string;
  name: string;
  email?: string;
  parent_id?: string;
}
