import i18n from '@/i18n';
import type { IconName } from '@/components/IconSymbol';
import { titleize } from '@/lib/format';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

type StatusEntry = {
  label: () => string;
  tone: StatusTone;
  icon?: IconName;
};

export function createStatusDisplay<T extends string>(
  config: Record<T, StatusEntry>,
  options?: { i18nPrefix?: string; titleizeFallback?: boolean },
) {
  const prefix = options?.i18nPrefix;

  return {
    label(status: T, labelOptions?: { uppercase?: boolean }) {
      const entry = config[status];
      const raw = entry?.label() ?? (prefix ? i18n.t(`${prefix}.${status}`, { defaultValue: titleize(status) }) : titleize(status));
      return labelOptions?.uppercase ? raw.toUpperCase() : raw;
    },
    tone(status: T): StatusTone {
      return config[status]?.tone ?? 'info';
    },
    icon(status: T): IconName | undefined {
      return config[status]?.icon;
    },
    display(status: T, labelOptions?: { uppercase?: boolean }) {
      return {
        label: this.label(status, labelOptions),
        tone: this.tone(status),
        icon: this.icon(status),
      };
    },
  };
}
