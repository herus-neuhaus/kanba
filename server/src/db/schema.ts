import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, numeric, date } from 'drizzle-orm/pg-core';

export const agencies = pgTable('agencies', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  ownerUserId: uuid('owner_user_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  demandTypes: text('demand_types').array(),
  evolutionInstanceName: text('evolution_instance_name'),
  whatsappConnected: boolean('whatsapp_connected').default(false),
  whatsappNumber: text('whatsapp_number'),
  planType: text('plan_type').default('trial'),
  subscriptionStatus: text('subscription_status').default('trialing'),
  lastPaymentAt: timestamp('last_payment_at', { withTimezone: true }),
  nextBillingDate: timestamp('next_billing_date', { withTimezone: true }),
  caktoId: text('cakto_id'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  aiActive: boolean('ai_active').default(false),
});

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  agencyId: uuid('agency_id'),
  fullName: text('full_name'),
  phone: text('phone'),
  role: text('role').default('member'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  status: text('status').default('active'),
  onboardingCompleted: boolean('onboarding_completed').default(false),
  roleId: uuid('role_id'),
  avatarUrl: text('avatar_url'),
  email: text('email'),
});

export const agencyRoles = pgTable('agency_roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  agencyId: uuid('agency_id'),
  name: text('name').notNull(),
  permissions: jsonb('permissions').default({}),
  isImmutable: boolean('is_immutable').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  isDefault: boolean('is_default').default(false),
  roleType: text('role_type').default('internal'),
});

export const agencyMembers = pgTable('agency_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  agencyId: uuid('agency_id').notNull(),
  userId: uuid('user_id').notNull(),
  roleId: uuid('role_id'),
  role: text('role').default('member'),
  status: text('status').default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const spaces = pgTable('spaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  agencyId: uuid('agency_id').notNull(),
  name: text('name').notNull(),
  color: text('color'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  agencyId: uuid('agency_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  progress: integer('progress').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  spaceId: uuid('space_id'),
});

export const kanbanColumns = pgTable('kanban_columns', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull(),
  title: text('title').notNull(),
  orderIndex: integer('order_index').default(0),
  color: text('color').default('bg-muted'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  isDone: boolean('is_done').default(false),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id'),
  agencyId: uuid('agency_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: timestamp('due_date', { withTimezone: true }),
  labels: text('labels').array(),
  checklist: jsonb('checklist').default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  priority: text('priority').default('baixa'),
  lastNotifiedAt: timestamp('last_notified_at', { withTimezone: true }),
  columnId: uuid('column_id'),
  assigneeIds: uuid('assignee_ids').array(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  startedAt: timestamp('started_at', { withTimezone: true }),
  visibleToClient: boolean('visible_to_client').default(false),
});

export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id'),
  userId: uuid('user_id'),
  text: text('text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const invites = pgTable('invites', {
  id: uuid('id').defaultRandom().primaryKey(),
  agencyId: uuid('agency_id').notNull(),
  email: text('email'),
  role: text('role').default('member'),
  token: text('token').notNull(),
  used: boolean('used').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  roleId: uuid('role_id'),
  projectId: uuid('project_id'),
});

export const projectPermissions = pgTable('project_permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  profileId: uuid('profile_id').notNull(),
  projectId: uuid('project_id').notNull(),
  permissionLevel: text('permission_level').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const notificationLogs = pgTable('notification_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id'),
  type: text('type').notNull(),
  recipientPhone: text('recipient_phone').notNull(),
  commentId: uuid('comment_id'),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow(),
});

export const crmPipelines = pgTable('crm_pipelines', {
  id: uuid('id').defaultRandom().primaryKey(),
  agencyId: uuid('agency_id').notNull(),
  spaceId: uuid('space_id'),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const crmClients = pgTable('crm_clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  agencyId: uuid('agency_id').notNull(),
  spaceId: uuid('space_id'),
  name: text('name').notNull(),
  status: text('status'),
  contactInfo: jsonb('contact_info').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const crmDeals = pgTable('crm_deals', {
  id: uuid('id').defaultRandom().primaryKey(),
  agencyId: uuid('agency_id').notNull(),
  spaceId: uuid('space_id'),
  pipelineId: uuid('pipeline_id').notNull(),
  clientId: uuid('client_id').notNull(),
  title: text('title').notNull(),
  value: numeric('value').default('0'),
  stage: text('stage').notNull(),
  expectedCloseDate: timestamp('expected_close_date', { withTimezone: true }),
  assignedTo: uuid('assigned_to'),
  nextActionDate: timestamp('next_action_date', { withTimezone: true }),
  nextActionLabel: text('next_action_label'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const enterpriseLeads = pgTable('enterprise_leads', {
  id: uuid('id').defaultRandom().primaryKey(),
  agencyId: uuid('agency_id'),
  name: text('name').notNull(),
  email: text('email').notNull(),
  whatsapp: text('whatsapp').notNull(),
  teamSize: text('team_size').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const projectWikis = pgTable('project_wikis', {
  id: uuid('id').defaultRandom().primaryKey(),
  spaceId: uuid('space_id'),
  projectId: uuid('project_id').unique(),
  agencyId: uuid('agency_id'),
  content: jsonb('content'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const inAppNotifications = pgTable('in_app_notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  agencyId: uuid('agency_id').notNull(),
  spaceId: uuid('space_id'),
  recipientId: uuid('recipient_id').notNull(),
  actorId: uuid('actor_id'),
  type: text('type').notNull(),
  title: text('title').notNull(),
  content: text('content'),
  link: text('link'),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
