import { useState } from 'react';

import { View } from 'react-native';

import { useTranslation } from 'react-i18next';



import { Chip, Screen, ScreenEmpty, ScreenLoading } from '@/components';

import { LiveGateFeed } from '@/features/admin/LiveGateFeed';

import { useLiveGateFeed } from '@/queries/useAdminVisitors';

import { useAuthStore } from '@/stores/authStore';

import type { Tables } from '@/types/database';



type Filter = Tables<'visitors'>['status'] | 'all';

const filters: Filter[] = ['all', 'pending', 'entered', 'exited'];



export default function AdminGateScreen() {

  const { t } = useTranslation();

  const societyId = useAuthStore((s) => s.profile?.society_id);

  const [filter, setFilter] = useState<Filter>('all');

  const { data: visitors = [], isLoading, isError } = useLiveGateFeed(societyId);

  const filtered = filter === 'all' ? visitors : visitors.filter((visitor) => visitor.status === filter);



  const filterLabel = (item: Filter) => (item === 'all' ? t('common.all') : t(`status.${item}`));



  if (isLoading) return <ScreenLoading variant="tab" />;



  if (isError) {

    return (

      <ScreenEmpty

        safe={false}

        icon="warning_amber"

        title={t('alert.titles.updateFailed')}

        subtitle={t('common.pleaseTryAgain')}

      />

    );

  }



  return (

    <Screen scroll variant="tab">

      <View className="flex-row flex-wrap gap-sm">

        {filters.map((item) => (

          <Chip key={item} label={filterLabel(item)} selected={filter === item} onPress={() => setFilter(item)} />

        ))}

      </View>

      <LiveGateFeed visitors={filtered} />

    </Screen>

  );

}

