import { useAuth } from '@/hooks/useAuth';

export function useCan(permissionKey: string): boolean {
  const { profile } = useAuth();
  
  if (!profile) return false;

  // Fallback for owner if no role assigned yet
  if (profile.role === 'owner') return true;

  // If there's an agency_role with permissions matrix
  if (profile.agency_role?.permissions) {
    if (profile.role === 'owner') return true;
    
    return !!profile.agency_role.permissions[permissionKey];
  }

  // Fallback for admins locally managed
  if (profile.role === 'admin') return true;

  // Default block
  return false;
}
