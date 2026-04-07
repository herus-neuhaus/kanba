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
  status: string | null;
  priority: 'alta' | 'media' | 'baixa' | null;
  assignee_id: string | null;
  due_date: string | null;
  labels: string[] | null;
  checklist: ChecklistItem[] | null;
  created_at: string | null;
  assignee?: Profile;
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

export const KANBAN_COLUMNS = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'production', label: 'Em Produção' },
  { id: 'internal_review', label: 'Revisão Interna' },
  { id: 'approval', label: 'Em Aprovação' },
  { id: 'done', label: 'Aprovado / Publicado' },
] as const;

export const DEMAND_TYPES = [
  'Post',
  'Criativo',
  'Vídeo',
  'Copy',
  'Landing Page'
] as const;

export type KanbanStatus = typeof KANBAN_COLUMNS[number]['id'];
export type DemandType = typeof DEMAND_TYPES[number] | string;
