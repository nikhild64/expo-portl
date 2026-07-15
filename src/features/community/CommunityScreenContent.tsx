import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Screen, SegmentedControl } from '@/components';
import { CommunityDirectoryPanel } from '@/features/community/CommunityDirectoryPanel';
import { CommunityNoticesPanel } from '@/features/community/CommunityNoticesPanel';
import { CommunityPollsPanel } from '@/features/community/CommunityPollsPanel';

export type CommunityTab = 'notices' | 'polls' | 'directory';

interface Props {
  initialTab?: CommunityTab;
}

export function CommunityScreenContent({ initialTab = 'notices' }: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<CommunityTab>(initialTab);

  return (
    <Screen safe={false} className="flex-1">
      <View className="flex-1 gap-lg px-base pt-sm">
        <SegmentedControl
          segments={[
            { label: t('resident.community.notices'), value: 'notices' as const },
            { label: t('resident.community.polls'), value: 'polls' as const },
            { label: t('resident.community.directory'), value: 'directory' as const },
          ]}
          value={tab}
          onChange={setTab}
        />

        <Animated.View key={tab} entering={FadeIn.duration(180)} className="flex-1">
          {tab === 'notices' && <CommunityNoticesPanel />}
          {tab === 'polls' && (
            <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 96 }} keyboardShouldPersistTaps="handled">
              <CommunityPollsPanel />
            </ScrollView>
          )}
          {tab === 'directory' && (
            <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 96 }} keyboardShouldPersistTaps="handled">
              <CommunityDirectoryPanel />
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Screen>
  );
}
