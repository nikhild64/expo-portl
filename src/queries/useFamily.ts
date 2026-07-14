import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { formatFlatLabel } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { TablesInsert } from '@/types/database';

export type FlatResidentMember = {
  profile_id: string;
  flat_id: string;
  flat_label: string;
  full_name: string;
  is_head: boolean;
  is_owner: boolean;
};

function flatResidentRole(link: Pick<FlatResidentMember, 'is_head' | 'is_owner'>): string {
  if (link.is_head) return 'Head of family';
  if (link.is_owner) return 'Owner';
  return 'Resident';
}

export function flatResidentSubtitle(member: FlatResidentMember): string {
  return `${member.flat_label} · ${flatResidentRole(member)}`;
}

export function useFlatResidents() {
  const uid = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['family', 'flat-residents', uid],
    enabled: !!uid,
    queryFn: async (): Promise<FlatResidentMember[]> => {
      if (!uid) return [];

      const { data: myFlats, error: myFlatsError } = await supabase
        .from('flat_residents')
        .select('flat_id')
        .eq('profile_id', uid);
      if (myFlatsError) throw myFlatsError;

      const flatIds = myFlats?.map((row) => row.flat_id) ?? [];
      if (!flatIds.length) return [];

      const { data, error } = await supabase
        .from('flat_residents')
        .select('profile_id, flat_id, is_head, is_owner, profiles(full_name, status), flats(number, towers(name))')
        .in('flat_id', flatIds)
        .neq('profile_id', uid);

      if (error) throw error;

      const byProfile = new Map<string, FlatResidentMember>();
      for (const row of data ?? []) {
        const profile = row.profiles as { full_name: string; status: string } | null;
        if (!profile || profile.status !== 'active') continue;

        const flat = row.flats as { number: string; towers: { name: string } | null } | null;
        const flatLabel = flat ? formatFlatLabel(flat.towers?.name, flat.number) : formatFlatLabel();
        const existing = byProfile.get(row.profile_id);

        if (existing) {
          if (!existing.flat_label.includes(flatLabel)) {
            existing.flat_label = `${existing.flat_label}, ${flatLabel}`;
          }
          existing.is_head = existing.is_head || row.is_head;
          existing.is_owner = existing.is_owner || row.is_owner;
          continue;
        }

        byProfile.set(row.profile_id, {
          profile_id: row.profile_id,
          flat_id: row.flat_id,
          flat_label: flatLabel,
          full_name: profile.full_name,
          is_head: row.is_head,
          is_owner: row.is_owner,
        });
      }

      return [...byProfile.values()].sort((a, b) => a.full_name.localeCompare(b.full_name));
    },
  });
}

export function useFamily() {
  const uid = useAuthStore((s) => s.session?.user.id);

  return useQuery({
    queryKey: ['family', uid],
    enabled: !!uid,
    queryFn: async () => {
      if (!uid) return [];

      const { data, error } = await supabase.from('family_members').select('*').eq('profile_id', uid).order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateFamilyMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TablesInsert<'family_members'>) => {
      const { error } = await supabase.from('family_members').insert(input);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['family'] }),
  });
}

export function useDeleteFamilyMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('family_members').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['family'] }),
  });
}
