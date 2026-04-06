export interface Agency {
  id: string;
  name: string;
  owner_user_id: string | null;
  plan: string | null;
  created_at: string | null;
}

export interface Profile {
  id: string;
  agency_id: string | null;
  full_name: string | null;
  phone: string | null;
  role: string | null;
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
  { id: 'todo', label: 'A Fazer' },
  { id: 'in_progress', label: 'Em Andamento' },
  { id: 'internal_review', label: 'Revisão Interna' },
  { id: 'client_review', label: 'Revisão Cliente' },
  { id: 'done', label: 'Concluído' },
] as const;

export type KanbanStatus = typeof KANBAN_COLUMNS[number]['id'];
