import { Alert } from 'react-native';
import { router, type Href } from 'expo-router';

import { Button, Card, EmptyState, ListRow, Screen, SkeletonCard, StatusPill } from '@/components';
import { formatDateTime, titleize } from '@/lib/format';
import { useDeletePoll } from '@/queries/usePollMutations';
import { usePolls } from '@/queries/usePolls';
import { useAuthStore } from '@/stores/authStore';

export default function AdminPollsScreen() {
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: active = [], isLoading } = usePolls(societyId, 'active');
  const { data: closed = [] } = usePolls(societyId, 'closed');
  const deletePoll = useDeletePoll();
  const polls = [...active, ...closed];

  if (isLoading) return <SkeletonCard />;

  const remove = (id: string) => {
    Alert.alert('Delete poll?', 'Votes and comments linked to this poll may prevent deletion.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePoll.mutate(id) },
    ]);
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <Button label="New poll" icon="add" onPress={() => router.push('/(admin)/(community)/polls/new' as Href)} />
      <Card padding="none" className="overflow-hidden">
        {polls.map((poll) => (
          <ListRow
            key={poll.id}
            title={poll.question}
            subtitle={`${titleize(poll.category)} - Ends ${formatDateTime(poll.ends_at)}`}
            right={<StatusPill tone={new Date(poll.ends_at).getTime() > Date.now() ? 'success' : 'neutral'} label={new Date(poll.ends_at).getTime() > Date.now() ? 'Active' : 'Closed'} />}
            onPress={() => router.push(`/(admin)/(community)/polls/${poll.id}/edit` as Href)}
          />
        ))}
        {!polls.length && <EmptyState icon="poll" title="No polls yet" subtitle="Create the first community poll." />}
      </Card>
      {!!polls.length && <Button label="Delete latest poll" variant="outlined" icon="delete" loading={deletePoll.isPending} onPress={() => remove(polls[0].id)} />}
    </Screen>
  );
}
