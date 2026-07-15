import { useLocalSearchParams } from 'expo-router';

import {
  CommunityScreenContent,
  type CommunityTab,
} from '@/features/community/CommunityScreenContent';

function parseTab(value: string | string[] | undefined): CommunityTab {
  if (value === 'polls' || value === 'directory') return value;
  return 'notices';
}

export default function CommunityScreen() {
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>();
  return <CommunityScreenContent initialTab={parseTab(tabParam)} />;
}
