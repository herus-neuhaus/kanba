import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { isBefore, startOfDay, differenceInHours, isAfter, parseISO } from 'date-fns';

export function useAgencyStats(dateRange?: { from: Date; to: Date }) {
  const { agency } = useAuth();

  return useQuery({
    queryKey: ['agency-stats', agency?.id, dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async () => {
      if (!agency) return null;

      // Fetch core data
      const [tasksRes, profilesRes, projectsRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('*, project:projects(name), column:kanban_columns(is_done)')
          .eq('agency_id', agency.id),
        supabase
          .from('profiles')
          .select('*')
          .eq('agency_id', agency.id),
        supabase
          .from('projects')
          .select('*')
          .eq('agency_id', agency.id)
      ]);

      if (tasksRes.error) throw tasksRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (projectsRes.error) throw projectsRes.error;

      const tasks = tasksRes.data || [];
      const profiles = profilesRes.data || [];
      const projects = projectsRes.data || [];

      // Helper for column logic
      const getColumnIsDone = (task: any) => {
        if (!task.column) return false;
        if (Array.isArray(task.column)) return task.column[0]?.is_done || false;
        return task.column.is_done || false;
      };

      // Date normalization for filtering
      const fromDate = dateRange?.from ? startOfDay(dateRange.from) : null;
      const toDate = dateRange?.to ? startOfDay(new Date(dateRange.to.getTime() + 86400000)) : null;

      // 1. Data Filtering
      // Completed Tasks: completed within the range
      const completedTasks = tasks.filter(t => {
        const completedAt = t.completed_at ? parseISO(t.completed_at) : null;
        if (!completedAt && !getColumnIsDone(t)) return false;
        
        // If it's "Done" by column but has no completed_at, we might not have a date
        // But for filtering purposes, if it has no date, we check if it belongs in the window
        if (!completedAt) return true; // Show in any range if it's done but date unknown? No, better filter strictly.
        
        if (fromDate && isBefore(completedAt, fromDate)) return false;
        if (toDate && isAfter(completedAt, toDate)) return false;
        return true;
      });

      // Active Tasks: Existed during the range and was not completed before the range
      const activeTasks = tasks.filter(t => {
        const createdAt = parseISO(t.created_at);
        const completedAt = t.completed_at ? parseISO(t.completed_at) : null;

        // Must be created before or during the range
        if (toDate && isAfter(createdAt, toDate)) return false;
        
        // Must not have been completed before the range
        if (fromDate && completedAt && isBefore(completedAt, fromDate)) return false;
        
        // If currently done, check if it was done during or after the range
        const isCurrentlyDone = !!completedAt || getColumnIsDone(t);
        if (isCurrentlyDone && completedAt && isBefore(completedAt, fromDate)) return false;

        return !isCurrentlyDone || (completedAt && !isBefore(completedAt, fromDate));
      });
      
      const today = startOfDay(new Date());
      const overdueTasks = activeTasks.filter(t => 
        t.due_date && 
        isBefore(new Date(t.due_date), today) &&
        !completedTasks.some(ct => ct.id === t.id)
      );

      // 2. Workload by Member
      const workloadData = profiles.map(profile => {
        const count = activeTasks.filter(t => 
          t.assignee_ids && Array.isArray(t.assignee_ids) && t.assignee_ids.includes(profile.id)
        ).length;
        return {
          name: profile.full_name || 'Sem nome',
          tasks: Number(count)
        };
      }).sort((a, b) => b.tasks - a.tasks);

      // 3. Bottlenecks
      const projectDataMap: Record<string, number> = {};
      activeTasks.forEach(task => {
        const projectName = (task as any).project?.name || 'Sem Projeto';
        projectDataMap[projectName] = (projectDataMap[projectName] || 0) + 1;
      });

      const bottleneckData = Object.entries(projectDataMap).map(([name, value]) => ({
        name,
        value: Number(value)
      })).sort((a, b) => b.value - a.value);

      // 4. Lead Time (Tempo Médio)
      const leadTimeData = profiles.map(profile => {
        const memberTasks = completedTasks.filter(t => 
          Array.isArray(t.assignee_ids) && 
          t.assignee_ids.includes(profile.id) && 
          t.completed_at && t.created_at
        );

        if (memberTasks.length === 0) return { name: profile.full_name || 'Sem nome', avgDays: 0, count: 0 };

        const totalHours = memberTasks.reduce((acc, t) => {
          return acc + differenceInHours(new Date(t.completed_at!), new Date(t.created_at!));
        }, 0);

        const avgDays = (totalHours / memberTasks.length) / 24;

        return {
          name: profile.full_name || 'Sem nome',
          avgDays: Number(parseFloat(avgDays.toFixed(1))),
          count: memberTasks.length
        };
      }).filter(item => item.count > 0).sort((a, b) => a.avgDays - b.avgDays);

      return {
        kpis: {
          totalActive: activeTasks.length,
          completed: completedTasks.length,
          overdue: overdueTasks.length
        },
        workloadData,
        bottleneckData,
        leadTimeData,
        tasks,
        profiles,
        projects
      };
    },
    enabled: !!agency,
  });
}
