import { supabase } from '@/integrations/supabase/client';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api/v1';

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  const activeAgencyId = localStorage.getItem('active_agency_id');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(activeAgencyId ? { 'X-Agency-Id': activeAgencyId } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.statusText}`);
  }

  return response.json();
}
