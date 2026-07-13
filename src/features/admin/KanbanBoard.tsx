import { useMemo } from 'react';
import { ScrollView } from 'react-native';

import type { Tables } from '@/types/database';

import { KanbanColumn } from './KanbanColumn';

interface Props {
  complaints: Tables<'complaints'>[];
  onUpdateStatus: (id: string, status: Tables<'complaints'>['status']) => void;
}

export function KanbanBoard({ complaints, onUpdateStatus }: Props) {
  const columns = useMemo(() => [
    { title: 'New', items: complaints.filter((complaint) => complaint.status === 'new') },
    { title: 'In Progress', items: complaints.filter((complaint) => complaint.status === 'assigned' || complaint.status === 'in_progress') },
    { title: 'Resolved', items: complaints.filter((complaint) => complaint.status === 'resolved' || complaint.status === 'closed') },
  ], [complaints]);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingHorizontal: 16, paddingBottom: 96 }}>
      {columns.map((column) => (
        <KanbanColumn key={column.title} title={column.title} complaints={column.items} onUpdateStatus={onUpdateStatus} />
      ))}
    </ScrollView>
  );
}
