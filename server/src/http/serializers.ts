export function serializeSpace(space: any) {
  if (!space) return null;
  const { agencyId, createdAt, avatarUrl, ...rest } = space;
  return {
    ...rest,
    agency_id: agencyId,
    avatar_url: avatarUrl,
    created_at: createdAt,
  };
}

export function serializeProject(project: any) {
  if (!project) return null;
  const { agencyId, spaceId, createdAt, ...rest } = project;
  return {
    ...rest,
    agency_id: agencyId,
    space_id: spaceId,
    created_at: createdAt,
  };
}

export function serializeTask(task: any) {
  if (!task) return null;
  const { 
    agencyId, 
    projectId, 
    columnId, 
    assigneeIds, 
    dueDate, 
    createdAt,
    visibleToClient,
    project,
    ...rest 
  } = task;
  
  return {
    ...rest,
    agency_id: agencyId,
    project_id: projectId,
    column_id: columnId,
    assignee_ids: assigneeIds,
    due_date: dueDate,
    created_at: createdAt,
    visible_to_client: visibleToClient,
    project: project ? {
      name: project.name,
      space_id: project.spaceId || project.space_id
    } : undefined
  };
}

export function serializeComment(comment: any) {
  if (!comment) return null;
  const { taskId, userId, createdAt, user, ...rest } = comment;
  return {
    ...rest,
    task_id: taskId,
    user_id: userId,
    created_at: createdAt,
    user: user ? {
      id: user.id,
      full_name: user.fullName || user.full_name,
      phone: user.phone,
      avatar_url: user.avatarUrl || user.avatar_url
    } : undefined
  };
}

export function serializeInvite(invite: any) {
  if (!invite) return null;
  const { agencyId, roleId, projectId, createdAt, agencyName, token, ...rest } = invite;
  return {
    ...rest,
    token, // explicitly include token
    agency_id: agencyId,
    role_id: roleId,
    project_id: projectId,
    created_at: createdAt,
    agency_name: agencyName
  };
}

export function serializeColumn(col: any) {
  if (!col) return null;
  const { projectId, orderIndex, isDone, createdAt, ...rest } = col;
  return {
    ...rest,
    project_id: projectId,
    order_index: orderIndex,
    is_done: isDone,
    created_at: createdAt,
  };
}

export function serializeAgency(agency: any) {
  if (!agency) return null;
  const { evolutionInstanceName, whatsappConnected, ownerUserId, planType, subscriptionStatus, ...rest } = agency;
  return {
    ...rest,
    evolution_instance_name: evolutionInstanceName,
    whatsapp_connected: whatsappConnected,
    owner_user_id: ownerUserId,
    plan_type: planType,
    subscription_status: subscriptionStatus,
  };
}

export function serializeProfileContext(context: any) {
  if (!context.profile) return null;
  
  return {
    ...context.profile,
    full_name: context.profile.fullName,
    avatar_url: context.profile.avatarUrl,
    onboarding_completed: context.profile.onboardingCompleted,
    agency_id: context.activeAgency?.id || null,
    role: context.role,
    role_id: context.rolePermissions?.id || null,
    agency_role: context.rolePermissions ? {
      ...context.rolePermissions,
      agency_id: context.rolePermissions.agencyId,
      created_at: context.rolePermissions.createdAt,
    } : null,
  };
}
