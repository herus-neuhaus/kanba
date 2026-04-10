export interface Agency {
  id: string;
  name: string;
  owner_user_id: string | null;
  plan: string | null;
  demand_types: string[] | null;
  created_at: string | null;
}

export interface Profile {
  id: string;
  agency_id: string | null;
  full_name: string | null;
  phone: string | null;
  role: string | null;
  status: string | null;
  created_at: string | null;
}

export interface Project {
  id: string;
  agency_id: string;
  name: string;
  description: string | null;
  progress: number | null;
  created_at: string | null;
}

export interface Task {
  id: string;
  project_id: string | null;
  agency_id: string;
  title: string;
  description: string | null;
  column_id: string | null; // Novo campo dinâmico
  priority: 'alta' | 'media' | 'baixa' | null;
  assignee_ids: string[] | null;
  due_date: string | null;
  labels: string[] | null;
  checklist: ChecklistItem[] | null;
  created_at: string | null;
  assignees?: Profile[];
  project?: Project;
  comments?: Comment[];
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Comment {
  id: string;
  task_id: string | null;
  user_id: string | null;
  text: string;
  created_at: string | null;
  user?: Profile;
}

export interface ProjectWiki {
  id: string;
  project_id: string;
  content: any;
  created_at: string;
  updated_at: string;
}

export interface KanbanColumn {
  id: string;
  project_id: string;
  title: string;
  order_index: number;
  color: string;
  created_at?: string;
}

export const DEMAND_TYPES = [
  'Post',
  'Criativo',
  'Vídeo',
  'Copy',
  'Landing Page'
] as const;

export type DemandType = typeof DEMAND_TYPES[number] | string;
