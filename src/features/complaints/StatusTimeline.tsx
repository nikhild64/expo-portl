import { useMemo } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { IconSymbol, Text } from '@/components';
import { formatDateTime } from '@/lib/format';
import type { ComplaintUpdateWithProfile } from '@/queries/useComplaints';
import type { Tables } from '@/types/database';

function normalizedStatus(status: Tables<'complaints'>['status']) {
  if (status === 'closed') return 'resolved';
  if (status === 'assigned') return 'assigned';
  return status;
}

function statusIndex(status: Tables<'complaints'>['status']) {
  const normalized = normalizedStatus(status);
  const keys: Tables<'complaints'>['status'][] = ['new', 'assigned', 'in_progress', 'resolved'];
  return Math.max(0, keys.findIndex((step) => step === normalized));
}

function compactIndex(status: Tables<'complaints'>['status']) {
  const normalized = normalizedStatus(status);
  if (normalized === 'new') return 0;
  if (normalized === 'resolved') return 2;
  return 1;
}

function findStatusChangeTime(updates: ComplaintUpdateWithProfile[], status: string) {
  const needle = status.replace('_', ' ');
  const match = updates.find(
    (update) => update.kind === 'status_change' && update.body.toLowerCase().includes(needle),
  );
  return match?.created_at ?? null;
}

function stepCaption(
  stepKey: Tables<'complaints'>['status'],
  timestamp: string | null | undefined,
  pending: boolean,
  status: Tables<'complaints'>['status'],
  t: (key: string) => string,
): string | null {
  if (timestamp) return formatDateTime(timestamp);
  if (pending && stepKey === 'resolved' && status !== 'resolved' && status !== 'closed') {
    return t('resident.complaints.timeline.expectedSoon');
  }
  return null;
}

interface Props {
  status: Tables<'complaints'>['status'];
  createdAt?: string;
  resolvedAt?: string | null;
  updates?: ComplaintUpdateWithProfile[];
  compact?: boolean;
  dark?: boolean;
}

export function StatusTimeline({
  status,
  createdAt,
  resolvedAt,
  updates = [],
  compact = false,
  dark = false,
}: Props) {
  const { t } = useTranslation();

  const steps = useMemo(
    () =>
      [
        { key: 'new' as const, label: t('resident.complaints.timeline.raised') },
        { key: 'assigned' as const, label: t('resident.complaints.timeline.assigned') },
        { key: 'in_progress' as const, label: t('resident.complaints.timeline.inProgress') },
        { key: 'resolved' as const, label: t('resident.complaints.timeline.resolved') },
      ],
    [t],
  );

  const compactSteps = useMemo(
    () =>
      [
        { key: 'new' as const, label: t('resident.complaints.timeline.new') },
        { key: 'in_progress' as const, label: t('resident.complaints.timeline.inProgress') },
        { key: 'resolved' as const, label: t('resident.complaints.timeline.resolved') },
      ],
    [t],
  );

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
  const terminal = status === 'resolved' || status === 'closed';
  const completedThrough = terminal ? steps.length : currentIndex;
  const timestamps = [
    createdAt ?? null,
    findStatusChangeTime(updates, 'assigned'),
    findStatusChangeTime(updates, 'in progress'),
    resolvedAt ?? findStatusChangeTime(updates, 'resolved'),
  ];

  return (
    <View className="gap-sm">
      <Text variant="caption" color={dark ? 'textSecondary' : 'textSecondary'}>
        {t('resident.complaints.status')}
      </Text>
      <View className="flex-row">
        {steps.map((step, index) => {
          const reached = index < completedThrough;
          const current = !terminal && index === currentIndex;
          const pending = index > completedThrough;
          const caption = stepCaption(step.key, timestamps[index], pending, status, t);

          return (
            <View key={step.key} className="flex-1 items-center gap-xs">
              <View
                className={`h-4 w-4 items-center justify-center rounded-pill ${
                  reached ? 'bg-success' : current ? 'border-2 border-coral bg-coral/20' : 'bg-surface-tertiary'
                }`}
              >
                {reached ? <IconSymbol name="check_circle" size={12} color="onPrimary" /> : null}
                {current && !reached ? <View className="h-2 w-2 rounded-pill bg-coral" /> : null}
              </View>
              <Text variant="caption" color={reached || current ? 'textPrimary' : 'textTertiary'} className="text-center">
                {step.label}
              </Text>
              {caption ? (
                <Text variant="caption" color="textTertiary" className="text-center">
                  {caption}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}
