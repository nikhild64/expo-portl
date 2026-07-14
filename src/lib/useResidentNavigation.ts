import { residentHref } from '@/lib/residentRoutes';
import { createRoleNavigation, type RoleNavigation } from '@/lib/createRoleNavigation';

/** Navigate within the active resident tab stack. */
export const useResidentNavigation = createRoleNavigation(residentHref);
export type ResidentNavigation = RoleNavigation;
