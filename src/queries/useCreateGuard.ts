import { useMutation, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

type CreateGuardInput = {
  email: string;
  fullName: string;
  password: string;
  phone?: string | null;
};

function mapCreateGuardError(error: string) {
  switch (error) {
    case 'invalid_email':
      return 'Enter a valid email address.';
    case 'invalid_name':
      return 'Enter the guard full name.';
    case 'invalid_password':
      return 'Password must be at least 8 characters.';
    case 'email_in_use':
      return 'That email is already registered.';
    case 'forbidden':
      return 'Only active society admins can create guard accounts.';
    default:
      return error;
  }
}

export function useCreateGuard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateGuardInput) => {
      const { data, error } = await supabase.functions.invoke('create-guard', {
        body: {
          email: input.email,
          fullName: input.fullName,
          password: input.password,
          phone: input.phone ?? null,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(mapCreateGuardError(String(data.error)));

      return data as { profileId: string; email: string; fullName: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-guards'] });
    },
  });
}
