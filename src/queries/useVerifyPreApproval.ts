import { useMutation } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type VerifyPreApprovalResult = {
  flat_id: string | null;
  pre_approval_id: string | null;
  reason: string;
  type: 'guest' | 'delivery' | 'cab' | 'service' | null;
  valid: boolean;
  visitor_name: string | null;
  visitor_phone: string | null;
};

export function useVerifyPreApproval() {
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc('verify_preapproval', { p_code: code });
      if (error) throw error;
      return (data?.[0] ?? {
        flat_id: null,
        pre_approval_id: null,
        reason: 'invalid_code',
        type: null,
        valid: false,
        visitor_name: null,
        visitor_phone: null,
      }) as VerifyPreApprovalResult;
    },
  });
}
