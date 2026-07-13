import { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Screen, SegmentedControl } from '@/components';
import { CommunityDirectoryPanel } from '@/features/community/CommunityDirectoryPanel';
import { CommunityNoticesPanel } from '@/features/community/CommunityNoticesPanel';
import { CommunityPollsPanel } from '@/features/community/CommunityPollsPanel';

export type CommunityTab = 'notices' | 'polls' | 'directory';

function parseTab(value: string | string[] | undefined): CommunityTab {
  if (value === 'polls' || value === 'directory') return value;
  return 'notices';
}

export default function CommunityScreen() {
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<CommunityTab>(() => parseTab(tabParam));

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <SegmentedControl
        segments={[
          { label: 'Notices', value: 'notices' as const },
          { label: 'Polls', value: 'polls' as const },
          { label: 'Directory', value: 'directory' as const },
        ]}
        value={tab}
        onChange={setTab}
      />

      <Animated.View key={tab} entering={FadeIn.duration(180)} className="gap-lg">
        {tab === 'notices' && <CommunityNoticesPanel />}
        {tab === 'polls' && <CommunityPollsPanel />}
        {tab === 'directory' && <CommunityDirectoryPanel />}
      </Animated.View>
    </Screen>
  );
}
