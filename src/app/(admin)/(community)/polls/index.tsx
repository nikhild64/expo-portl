
import { alert } from '@/lib/alert';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, Card, EmptyState, ListRow, Screen, ScreenLoading, StatusPill } from '@/components';
import { formatDateTime, titleize } from '@/lib/format';
import { useDeletePoll } from '@/queries/usePollMutations';
import { usePolls } from '@/queries/usePolls';
import { useAuthStore } from '@/stores/authStore';

export default function AdminPollsScreen() {
  const { t } = useTranslation();
  const societyId = useAuthStore((s) => s.profile?.society_id);
  const { data: active = [], isLoading } = usePolls(societyId, 'active');
  const { data: closed = [] } = usePolls(societyId, 'closed');
  const deletePoll = useDeletePoll();
  const polls = [...active, ...closed];

  if (isLoading) return <ScreenLoading safe={false} />;

  const remove = (id: string) => {
    alert(t('alert.titles.deletePoll'), t('alert.messages.pollDeletion'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deletePoll.mutate(id) },
    ]);
  };

  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <Button label={t('admin.community.newPoll')} icon="add" onPress={() => router.push('/(admin)/(community)/polls/new')} />
      <Card padding="none" className="overflow-hidden">
        {polls.map((poll) => {
          const isActive = new Date(poll.ends_at).getTime() > Date.now();
          return (
            <ListRow
              key={poll.id}
              title={poll.question}
              subtitle={`${titleize(poll.category)} - ${t('resident.community.endsAt', { time: formatDateTime(poll.ends_at) })}`}
              right={<StatusPill tone={isActive ? 'success' : 'neutral'} label={isActive ? t('common.active') : t('common.closed')} />}
              onPress={() => router.push(`/(admin)/(community)/polls/${poll.id}/edit`)}
            />
          );
        })}
        {!polls.length && <EmptyState icon="poll" title={t('admin.community.noPolls')} subtitle={t('admin.community.noPollsSub')} />}
      </Card>
      {!!polls.length && <Button label={t('admin.community.deleteLatestPoll')} variant="outlined" icon="delete" loading={deletePoll.isPending} onPress={() => remove(polls[0].id)} />}
    </Screen>
  );
}
