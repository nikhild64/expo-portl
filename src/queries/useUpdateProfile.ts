import { useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/types/database';

interface UpdateProfileInput {
  avatarUrl?: string | null;
  fullName: string;
  phone?: string | null;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const uid = useAuthStore.getState().session?.user.id;
      if (!uid) throw new Error('Sign in required');

      const { data, error } = await supabase
        .from('profiles')
        .update({
          avatar_url: input.avatarUrl,
          full_name: input.fullName,
          phone: input.phone ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', uid)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (profile: Tables<'profiles'>) => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      await useAuthStore.getState().refreshProfile();
      useAuthStore.setState({ profile });
    },
  });
}
