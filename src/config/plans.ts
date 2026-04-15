export type PlanType = 'basic' | 'standard' | 'profissional' | 'enterprise' | 'trial';

export interface PlanConfig {
  name: string;
  price: number;
  max_users: number;
  max_projects: number;
  has_whatsapp: boolean;
  has_reports: boolean;
  multiple_whatsapp?: boolean;
}

export const PLANS: Record<PlanType, PlanConfig> = {
  trial: {
    name: 'Trial',
    price: 0,
    max_users: 1,
    max_projects: 1,
    has_whatsapp: false,
    has_reports: false,
  },
  basic: {
    name: 'Basic',
    price: 49,
    max_users: 1,
    max_projects: 3,
    has_whatsapp: false,
    has_reports: false,
  },
  standard: {
    name: 'Standard',
    price: 99,
    max_users: 3,
    max_projects: 10,
    has_whatsapp: false,
    has_reports: false,
  },
  profissional: {
    name: 'Profissional',
    price: 249,
    max_users: 10,
    max_projects: 30,
    has_whatsapp: true,
    has_reports: true,
  },
  enterprise: {
    name: 'Enterprise',
    price: 899,
    max_users: Infinity,
    max_projects: Infinity,
    has_whatsapp: true,
    has_reports: true,
    multiple_whatsapp: true,
  },
};
