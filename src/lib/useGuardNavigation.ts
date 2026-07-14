import { guardHref } from '@/lib/guardRoutes';
import { createRoleNavigation, type RoleNavigation } from '@/lib/createRoleNavigation';

export const useGuardNavigation = createRoleNavigation(guardHref);
export type GuardNavigation = RoleNavigation;
