import { ScrollView, View } from 'react-native';

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
  const statusTabs: { label: string; value: ComplaintStatusFilter; count?: number }[] = [
    { label: 'Active', value: 'active', count: counts?.active },
    { label: 'Resolved', value: 'resolved', count: counts?.resolved },
    { label: 'All', value: 'all', count: counts?.all },
  ];

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
        <Chip label="All" selected={category === 'all'} onPress={() => onCategoryChange('all')} />
        {COMPLAINT_CATEGORIES.map((item) => (
          <Chip
            key={item}
            label={item}
            icon={COMPLAINT_CATEGORY_ICONS[item]}
            selected={category === item}
            onPress={() => onCategoryChange(item)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
