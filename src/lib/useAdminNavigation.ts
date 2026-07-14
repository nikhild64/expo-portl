import { adminHref } from '@/lib/adminRoutes';
import { createRoleNavigation, type RoleNavigation } from '@/lib/createRoleNavigation';

export const useAdminNavigation = createRoleNavigation(adminHref);
export type AdminNavigation = RoleNavigation;
