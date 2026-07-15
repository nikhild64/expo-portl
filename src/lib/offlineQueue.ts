import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

import { invalidateGuardActivity } from '@/lib/guardQueries';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

const QUEUE_KEY_PREFIX = 'portl:offline-mutation-queue';

export type OfflineMutation =
  | {
      id: string;
      type: 'approve_visitor';
      payload: { visitorId: string; instructions?: string | null };
      createdAt: string;
    }
  | {
      id: string;
      type: 'reject_visitor';
      payload: { visitorId: string };
      createdAt: string;
    }
  | {
      id: string;
      type: 'mark_exit';
      payload: { visitorId: string };
      createdAt: string;
    };

type OfflineMutationInput = Omit<OfflineMutation, 'id' | 'createdAt'>;

const listeners = new Set<(count: number) => void>();
let draining = false;

function newQueueId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function queueKey() {
  const userId = useAuthStore.getState().session?.user.id;
  return userId ? `${QUEUE_KEY_PREFIX}:${userId}` : null;
}

function notify(count: number) {
  for (const listener of listeners) {
    listener(count);
  }
}

export async function isDeviceOffline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return !(state.isConnected && state.isInternetReachable !== false);
}

async function readQueue(): Promise<OfflineMutation[]> {
  const key = queueKey();
  if (!key) return [];

  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as OfflineMutation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeQueue(queue: OfflineMutation[]) {
  const key = queueKey();
  if (!key) return;

  await AsyncStorage.setItem(key, JSON.stringify(queue));
  notify(queue.length);
}

export function subscribePendingCount(listener: (count: number) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function getPendingCount(): Promise<number> {
  return (await readQueue()).length;
}

function dedupeKey(item: OfflineMutationInput) {
  if (item.type === 'mark_exit') return `mark_exit:${item.payload.visitorId}`;
  if (item.type === 'approve_visitor') return `approve_visitor:${item.payload.visitorId}`;
  return `reject_visitor:${item.payload.visitorId}`;
}

export async function enqueueIfOffline(item: OfflineMutationInput): Promise<boolean> {
  if (!(await isDeviceOffline())) return false;

  const queue = await readQueue();
  const key = dedupeKey(item);
  const withoutDuplicate = queue.filter((entry) => dedupeKey(entry) !== key);
  const next: OfflineMutation = {
    ...item,
    id: newQueueId(),
    createdAt: new Date().toISOString(),
  } as OfflineMutation;

  await writeQueue([...withoutDuplicate, next]);
  return true;
}

export async function clearOfflineQueue() {
  const key = queueKey();
  if (key) await AsyncStorage.removeItem(key);
  notify(0);
}

async function replayMutation(item: OfflineMutation): Promise<boolean> {
  const userId = useAuthStore.getState().session?.user.id ?? null;

  if (item.type === 'approve_visitor') {
    const { data, error } = await supabase
      .from('visitors')
      .update({
        decided_at: new Date().toISOString(),
        decided_by: userId,
        resident_instructions: item.payload.instructions ?? null,
        status: 'approved',
      })
      .eq('id', item.payload.visitorId)
      .select('status')
      .single();

    return !error && data?.status === 'approved';
  }

  if (item.type === 'reject_visitor') {
    const { data, error } = await supabase
      .from('visitors')
      .update({
        decided_at: new Date().toISOString(),
        decided_by: userId,
        status: 'rejected',
      })
      .eq('id', item.payload.visitorId)
      .select('status')
      .single();

    return !error && data?.status === 'rejected';
  }

  const { data, error } = await supabase
    .from('visitors')
    .update({ exited_at: new Date().toISOString(), status: 'exited' })
    .eq('id', item.payload.visitorId)
    .select('status')
    .single();

  return !error && data?.status === 'exited';
}

export async function drainOfflineQueue(): Promise<void> {
  if (draining) return;
  if (await isDeviceOffline()) return;
  if (!useAuthStore.getState().session) return;

  draining = true;
  try {
    let queue = await readQueue();
    if (!queue.length) return;

    const remaining: OfflineMutation[] = [];
    let synced = false;

    for (const item of queue) {
      try {
        const ok = await replayMutation(item);
        if (ok) {
          synced = true;
          continue;
        }
        console.warn('[offline-queue] dropped failed replay', item.type, item.payload);
      } catch (error) {
        console.warn('[offline-queue] replay threw', item.type, error);
        remaining.push(item);
      }
    }

    await writeQueue(remaining);

    if (synced) {
      await queryClient.invalidateQueries({ queryKey: ['visitors'] });
      await invalidateGuardActivity(queryClient);
    }
  } finally {
    draining = false;
  }
}
