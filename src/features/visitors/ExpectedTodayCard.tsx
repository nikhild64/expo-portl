import { Pressable, View } from 'react-native';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Avatar, Card, IconSymbol, StatusPill, Text } from '@/components';
import { formatFirstName, formatTimeRange, titleize } from '@/lib/format';
import type { PreApprovalWithCreator } from '@/queries/useVisitors';

interface Props {
  preApproval: PreApprovalWithCreator;
  onRevoke?: () => void;
}

export function ExpectedTodayCard({ preApproval, onRevoke }: Props) {
  const { t } = useTranslation();
  const creatorFirstName = formatFirstName(preApproval.profiles?.full_name, '');
  const typeLabel = creatorFirstName
    ? t('resident.preapprove.typeOfResident', { type: titleize(preApproval.type), resident: creatorFirstName })
    : titleize(preApproval.type);

  return (
    <Link href={`/(resident)/(home)/preapprove/${preApproval.id}/qr`} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('a11y.viewQrFor', { name: preApproval.visitor_name })}
        accessibilityHint={onRevoke ? t('resident.preapprove.longPressRevoke') : undefined}
        onLongPress={onRevoke}
        android_ripple={{ color: 'rgba(249,112,102,0.15)' }}
      >
        <Card variant="outlined" className="gap-sm">
          <View className="flex-row items-center gap-md">
            <Avatar name={preApproval.visitor_name} size="md" />
            <View className="flex-1 gap-xs">
              <Text variant="headline" numberOfLines={1}>
                {preApproval.visitor_name.split(' ')[0]}
              </Text>
              <Text variant="footnote" color="textSecondary" numberOfLines={1}>
                {typeLabel} · {preApproval.recurring ? t('resident.preapprove.multipleEntries') : formatTimeRange(preApproval.start_at, preApproval.end_at)}
              </Text>
            </View>
            <IconSymbol name="qr_code" color="coral" size={20} />
          </View>
          <StatusPill tone="info" label={titleize(preApproval.type)} />
        </Card>
      </Pressable>
    </Link>
  );
}
