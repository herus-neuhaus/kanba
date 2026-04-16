export interface Agency {
  id: string;
  name: string;
  owner_user_id: string | null;
  plan_type: 'basic' | 'standard' | 'profissional' | 'enterprise' | 'trial' | null;
  subscription_status: 'active' | 'past_due' | 'canceled' | 'trialing' | null;
  last_payment_at: string | null;
  next_billing_date: string | null;
  cakto_id: string | null;
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
  onboarding_completed: boolean | null;
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
  completed_at?: string | null;
  started_at?: string | null;
  assignees?: Profile[];
  project?: Project;
  column?: KanbanColumn;
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
  is_done: boolean;
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

export interface CRMPipeline {
  id: string;
  agency_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export type CRMClientStatus = 'prospect' | 'active' | 'paused' | 'canceled';

export interface CRMContactInfo {
  phone?: string;
  email?: string;
  instagram?: string;
  website?: string;
  [key: string]: any;
}

export interface CRMClient {
  id: string;
  agency_id: string;
  name: string;
  status: CRMClientStatus;
  contact_info: CRMContactInfo | null;
  created_at: string;
}

export type CRMDealStage = 'lead' | 'meeting' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface CRMDeal {
  id: string;
  agency_id: string;
  pipeline_id: string;
  client_id: string;
  title: string;
  value: number;
  stage: CRMDealStage;
  expected_close_date: string | null;
  notes: string | null;
  assigned_to?: string | null;
  next_action_date?: string | null;
  next_action_label?: string | null;
  created_at: string;
  client?: CRMClient;
  assignee?: Profile;
}
