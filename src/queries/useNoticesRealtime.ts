import { useRealtimeTable } from '@/queries/useRealtimeTable';
import { useAuthStore } from '@/stores/authStore';

/** App-wide notices subscription so lists refresh even off the Community tab. */
export function useNoticesRealtime() {
  const societyId = useAuthStore((s) => s.profile?.society_id);

  useRealtimeTable({
    enabled: !!societyId,
    event: 'INSERT',
    filter: `society_id=eq.${societyId}`,
    invalidateKeys: [['notices']],
    table: 'notices',
  });
}
