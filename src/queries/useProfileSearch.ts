import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type UserRole = Database['public']['Enums']['user_role'];

export type ProfileSearchResult = {
  full_name: string;
  id: string;
  kind: 'profile';
  phone: string | null;
  role: UserRole;
};

export type ServiceProviderSearchResult = {
  category: string;
  full_name: string;
  id: string;
  kind: 'service_provider';
  phone: string | null;
  role: 'service_provider';
  verified: boolean;
};

export type AssigneeSearchResult = ProfileSearchResult | ServiceProviderSearchResult;

function useDebouncedValue(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [delay, value]);

  return debounced;
}

export function useProfileSearch(societyId: string | null | undefined, query: string, roles?: UserRole[]) {
  const debounced = useDebouncedValue(query.trim());

  return useQuery({
    queryKey: ['profile-search', societyId, debounced, roles],
    enabled: !!societyId && debounced.length >= 1,
    queryFn: async () => {
      const escaped = debounced.replace(/[%_]/g, (char) => `\\${char}`);
      let profileRequest = supabase
        .from('profiles')
        .select('id, full_name, phone, role')
        .eq('society_id', societyId!)
        .eq('status', 'active')
        .or(`full_name.ilike.%${escaped}%,phone.ilike.%${escaped}%`)
        .order('full_name')
        .limit(20);

      if (roles?.length) profileRequest = profileRequest.in('role', roles);

      const serviceRequest = supabase
        .from('service_providers')
        .select('id, name, phone, category, verified')
        .eq('society_id', societyId!)
        .or(`name.ilike.%${escaped}%,phone.ilike.%${escaped}%,category.ilike.%${escaped}%`)
        .order('verified', { ascending: false })
        .order('name')
        .limit(20);

      const [profiles, services] = await Promise.all([profileRequest, serviceRequest]);
      if (profiles.error) throw profiles.error;
      if (services.error) throw services.error;

      const profileResults = (profiles.data ?? []).map((profile) => ({
        ...profile,
        kind: 'profile' as const,
      }));
      const serviceResults = (services.data ?? []).map((service) => ({
        category: service.category,
        full_name: service.name,
        id: service.id,
        kind: 'service_provider' as const,
        phone: service.phone,
        role: 'service_provider' as const,
        verified: service.verified,
      }));

      return [...profileResults, ...serviceResults].slice(0, 20) as AssigneeSearchResult[];
    },
  });
}
