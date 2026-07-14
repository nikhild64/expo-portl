import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

type Visitor = Tables<'visitors'>;

const HISTORY_STATUSES = new Set<Visitor['status']>(['approved', 'entered', 'exited', 'rejected', 'expired']);

function visitorListFilter(flatIds: string[]) {
  return flatIds.length === 1 ? `flat_id=eq.${flatIds[0]}` : `flat_id=in.(${flatIds.join(',')})`;
}

function upsertVisitor(list: Visitor[] | undefined, visitor: Visitor) {
  const existing = list ?? [];
  const index = existing.findIndex((row) => row.id === visitor.id);
  if (index >= 0) return existing.map((row, i) => (i === index ? visitor : row));
  return [visitor, ...existing];
}

function removeVisitor(list: Visitor[] | undefined, id: string) {
  return (list ?? []).filter((row) => row.id !== id);
}

export function useVisitorListRealtime(flatIds: string[] | undefined, enabled = true) {
  const queryClient = useQueryClient();
  const flatIdsRef = useRef(flatIds);
  flatIdsRef.current = flatIds;

  useEffect(() => {
    if (!enabled || !flatIds?.length) return;

    const filter = visitorListFilter(flatIds);

    const applyPatch = (payload: { eventType: string; new: Visitor; old: Visitor }) => {
      const ids = flatIdsRef.current;
      if (!ids?.length) return;

      const visitor = payload.eventType === 'DELETE' ? payload.old : payload.new;
      if (!ids.includes(visitor.flat_id)) return;

      const pendingKey = ['visitors', 'pending', ids];
      const historyKey = ['visitors', 'history', ids];

      if (payload.eventType === 'DELETE') {
        queryClient.setQueryData<Visitor[]>(pendingKey, (old) => removeVisitor(old, visitor.id));
        queryClient.setQueryData<Visitor[]>(historyKey, (old) => removeVisitor(old, visitor.id));
        return;
      }

      queryClient.setQueryData<Visitor>(['visitors', 'detail', visitor.id], visitor);

      if (visitor.status === 'pending') {
        queryClient.setQueryData<Visitor[]>(pendingKey, (old) => upsertVisitor(old, visitor));
        queryClient.setQueryData<Visitor[]>(historyKey, (old) => removeVisitor(old, visitor.id));
      } else if (HISTORY_STATUSES.has(visitor.status)) {
        queryClient.setQueryData<Visitor[]>(historyKey, (old) => upsertVisitor(old, visitor));
        queryClient.setQueryData<Visitor[]>(pendingKey, (old) => removeVisitor(old, visitor.id));
      }
    };

    const channel = supabase
      .channel(`visitor-lists-${filter}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visitors', filter }, (payload) =>
        applyPatch(payload as unknown as { eventType: string; new: Visitor; old: Visitor }),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, flatIds, queryClient]);
}
