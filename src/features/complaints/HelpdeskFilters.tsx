import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Chip } from '@/components';

import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_CATEGORY_ICONS,
  type ComplaintCategoryFilter,
  type ComplaintStatusFilter,
} from './constants';

interface Props {
  statusFilter: ComplaintStatusFilter;
  category: ComplaintCategoryFilter;
  counts?: { active: number; resolved: number; all: number };
  onStatusChange: (filter: ComplaintStatusFilter) => void;
  onCategoryChange: (category: ComplaintCategoryFilter) => void;
}

export function HelpdeskFilters({
  statusFilter,
  category,
  counts,
  onStatusChange,
  onCategoryChange,
}: Props) {
  const { t } = useTranslation();

  const statusTabs: { label: string; value: ComplaintStatusFilter; count?: number }[] = useMemo(
    () => [
      { label: t('resident.complaints.filters.active'), value: 'active', count: counts?.active },
      { label: t('resident.complaints.filters.resolved'), value: 'resolved', count: counts?.resolved },
      { label: t('resident.complaints.filters.all'), value: 'all', count: counts?.all },
    ],
    [counts?.active, counts?.all, counts?.resolved, t],
  );

  return (
    <View className="gap-md">
      <View className="flex-row gap-sm">
        {statusTabs.map((tab) => (
          <Chip
            key={tab.value}
            label={tab.label}
            count={tab.count}
            selected={statusFilter === tab.value}
            onPress={() => onStatusChange(tab.value)}
            className="flex-1 justify-center"
          />
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        <Chip label={t('common.all')} selected={category === 'all'} onPress={() => onCategoryChange('all')} />
        {COMPLAINT_CATEGORIES.map((item) => (
          <Chip
            key={item}
            label={t(`resident.complaints.categories.${item}`)}
            icon={COMPLAINT_CATEGORY_ICONS[item]}
            selected={category === item}
            onPress={() => onCategoryChange(item)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
