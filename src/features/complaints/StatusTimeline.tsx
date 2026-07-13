import { View } from 'react-native';

import { IconSymbol, Text } from '@/components';
import { formatDateTime, titleize } from '@/lib/format';
import type { ComplaintUpdateWithProfile } from '@/queries/useComplaints';
import type { Tables } from '@/types/database';

const steps: { key: Tables<'complaints'>['status']; label: string }[] = [
  { key: 'new', label: 'Raised' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
];

const compactSteps = [
  { key: 'new', label: 'New' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
] as const;

function normalizedStatus(status: Tables<'complaints'>['status']) {
  if (status === 'closed') return 'resolved';
  if (status === 'assigned') return 'assigned';
  return status;
}

function statusIndex(status: Tables<'complaints'>['status']) {
  const normalized = normalizedStatus(status);
  return Math.max(0, steps.findIndex((step) => step.key === normalized));
}

function compactIndex(status: Tables<'complaints'>['status']) {
  const normalized = normalizedStatus(status);
  if (normalized === 'new') return 0;
  if (normalized === 'resolved') return 2;
  return 1;
}

function findStatusChangeTime(updates: ComplaintUpdateWithProfile[], status: string) {
  const match = updates.find(
    (update) =>
      update.kind === 'status_change' && update.body.toLowerCase().includes(status.replace('_', ' ')),
  );
  return match?.created_at ?? null;
}

interface Props {
  status: Tables<'complaints'>['status'];
  createdAt?: string;
  resolvedAt?: string | null;
  assigneeName?: string | null;
  updates?: ComplaintUpdateWithProfile[];
  compact?: boolean;
  dark?: boolean;
}

export function StatusTimeline({
  status,
  createdAt,
  resolvedAt,
  assigneeName,
  updates = [],
  compact = false,
  dark = false,
}: Props) {
  if (compact) {
    const currentIndex = compactIndex(status);

    return (
      <View className="gap-xs">
        <View className="h-1 flex-row overflow-hidden rounded-pill bg-surface-tertiary">
          <View className="bg-coral" style={{ flex: currentIndex + 1 }} />
          <View style={{ flex: compactSteps.length - currentIndex - 1 }} />
        </View>
        <View className="flex-row justify-between">
          {compactSteps.map((step, index) => (
            <Text
              key={step.key}
              variant="caption"
              color={index <= currentIndex ? 'coral' : 'textTertiary'}
            >
              {step.label}
            </Text>
          ))}
        </View>
      </View>
    );
  }

  const currentIndex = statusIndex(status);
  const assignedAt = findStatusChangeTime(updates, 'assigned') ?? (currentIndex >= 1 ? createdAt : null);
  const inProgressAt = findStatusChangeTime(updates, 'in progress') ?? (currentIndex >= 2 ? createdAt : null);
  const resolvedTime = resolvedAt ?? findStatusChangeTime(updates, 'resolved');

  const timestamps = [createdAt, assignedAt, inProgressAt, resolvedTime];
  const subtitles = [
    undefined,
    assigneeName ? `to ${assigneeName}` : undefined,
    undefined,
    status === 'resolved' || status === 'closed' ? undefined : 'Expected soon',
  ];

  return (
    <View className="gap-sm">
      <Text variant="caption" color={dark ? 'textSecondary' : 'textSecondary'}>
        STATUS
      </Text>
      <View className="flex-row">
        {steps.map((step, index) => {
          const reached = index < currentIndex;
          const current = index === currentIndex;
          const pending = index > currentIndex;

          return (
            <View key={step.key} className="flex-1 items-center gap-xs">
              <View
                className={`h-4 w-4 items-center justify-center rounded-pill ${
                  reached ? 'bg-success' : current ? 'border-2 border-coral bg-coral/20' : 'bg-surface-tertiary'
                }`}
              >
                {reached ? <IconSymbol name="check_circle" size={12} color="onPrimary" /> : null}
                {current ? <View className="h-2 w-2 rounded-pill bg-coral" /> : null}
              </View>
              <Text variant="caption" color={reached || current ? 'textPrimary' : 'textTertiary'} className="text-center">
                {step.label}
              </Text>
              {timestamps[index] ? (
                <Text variant="caption" color="textTertiary" className="text-center">
                  {formatDateTime(timestamps[index])}
                </Text>
              ) : pending ? (
                <Text variant="caption" color="textTertiary" className="text-center">
                  {subtitles[index] ?? titleize(step.key)}
                </Text>
              ) : subtitles[index] ? (
                <Text variant="caption" color="textTertiary" className="text-center">
                  {subtitles[index]}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}
