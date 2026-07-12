import { View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  IconSymbol,
  ListRow,
  Screen,
  Sheet,
  SkeletonCard,
  SkeletonRow,
  StatusPill,
  Text,
  useSheet,
  type IconName,
} from '@/components';

const typographyVariants = [
  'display',
  'titleLarge',
  'title',
  'headline',
  'body',
  'callout',
  'subhead',
  'footnote',
  'caption',
] as const;

const iconNames: IconName[] = [
  'home',
  'notifications',
  'person',
  'settings',
  'check_circle',
  'cancel',
  'schedule',
  'info',
  'add',
  'close',
  'arrow_back',
  'arrow_forward',
  'search',
  'filter_list',
  'more_vert',
  'chevron_right',
  'phone',
  'message',
  'share',
  'edit',
  'delete',
  'qr_code',
  'qr_code_scanner',
  'photo_camera',
  'campaign',
  'poll',
  'construction',
  'water_drop',
  'lightbulb',
  'directions_car',
  'local_shipping',
  'shopping_bag',
  'restaurant',
  'apartment',
  'lock',
  'visibility',
  'visibility_off',
  'fingerprint',
  'star',
  'favorite',
  'thumb_up',
  'error_outline',
  'warning_amber',
  'inbox',
  'history',
  'menu',
  'verified_user',
  'groups',
  'credit_card',
  'calendar_today',
] as const;

const buttonVariants = ['filled', 'tonal', 'outlined', 'text', 'danger'] as const;
const buttonSizes = ['sm', 'md', 'lg'] as const;
const cardVariants = ['elevated', 'filled', 'outlined'] as const;
const cardAccents = ['none', 'warning', 'danger', 'success'] as const;

const formSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

type FormValues = z.infer<typeof formSchema>;

export default function Playground() {
  const sheet = useSheet();
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: { email: '' },
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });

  return (
    <Screen scroll>
      <Text variant="display">Design system</Text>
      <Text color="textSecondary">Community Warmth primitives for Portl.</Text>

      <Text variant="title">Typography</Text>
      <Card className="gap-sm">
        {typographyVariants.map((variant) => (
          <Text key={variant} variant={variant}>
            {variant} - The quick brown fox
          </Text>
        ))}
      </Card>

      <Text variant="title">Icons</Text>
      <Card>
        <View className="flex-row flex-wrap gap-md">
          {iconNames.map((name) => (
            <IconSymbol key={name} name={name} color="coral" />
          ))}
        </View>
      </Card>

      <Text variant="title">Buttons</Text>
      {buttonVariants.map((variant) => (
        <Card key={variant} className="gap-sm">
          <Text variant="headline">{variant}</Text>
          {buttonSizes.map((size) => (
            <Button key={`${variant}-${size}`} label={`${variant} ${size}`} variant={variant} size={size} icon="add" full />
          ))}
          <Button label={`${variant} right icon`} variant={variant} icon="arrow_forward" iconPosition="right" />
          <Button label={`${variant} loading`} variant={variant} loading />
          <Button label={`${variant} disabled`} variant={variant} disabled />
        </Card>
      ))}

      <Text variant="title">Cards</Text>
      {cardVariants.map((variant) => (
        <View key={variant} className="gap-sm">
          {cardAccents.map((accent) => (
            <Card key={`${variant}-${accent}`} variant={variant} accent={accent}>
              <Text variant="headline">{variant}</Text>
              <Text color="textSecondary">Accent: {accent}</Text>
            </Card>
          ))}
        </View>
      ))}

      <Text variant="title">Chips</Text>
      <View className="flex-row flex-wrap gap-sm">
        <Chip label="All" count={24} selected />
        <Chip label="Events" count={8} icon="campaign" />
        <Chip label="Maintenance" count={6} />
        <Chip label="Assist" variant="assist" icon="info" />
      </View>

      <Text variant="title">Fields</Text>
      <Card className="gap-base">
        <Field.Controlled control={control} name="email" label="Email" placeholder="you@portl.demo" />
        <Button label="Validate field" variant="outlined" onPress={handleSubmit(() => {})} />
      </Card>

      <Text variant="title">Status pills</Text>
      <View className="flex-row flex-wrap gap-sm">
        <StatusPill tone="success" label="Approved" icon="check_circle" />
        <StatusPill tone="warning" label="Pending" icon="schedule" />
        <StatusPill tone="danger" label="Rejected" icon="cancel" />
        <StatusPill tone="info" label="Info" icon="info" />
        <StatusPill tone="neutral" label="Draft" />
      </View>

      <Text variant="title">Avatars</Text>
      <View className="flex-row items-center gap-md">
        <Avatar name="Rohan Sharma" />
        <Avatar name="Priya" />
        <Avatar name="Arjun Mehta" size="lg" />
        <Avatar name="Bad Image" uri="https://invalid.portl.local/avatar.png" />
      </View>

      <Text variant="title">List rows</Text>
      <Card padding="none">
        <ListRow left={<Avatar name="Rohan Sharma" />} title="Rohan Sharma" subtitle="A-402" onPress={() => {}} />
        <ListRow
          left={<IconSymbol name="notifications" color="coral" />}
          title="Visitor approval"
          subtitle="Amazon Delivery"
          right={<StatusPill tone="success" label="Verified" />}
        />
        <ListRow title="No chevron" subtitle="Static row" showChevron={false} />
        <ListRow title="Forced chevron" subtitle="No action attached" showChevron />
      </Card>

      <Text variant="title">Sheet</Text>
      <Button label="Open sheet" variant="tonal" icon="menu" onPress={sheet.present} />
      <Sheet ref={sheet.ref}>
        <View className="gap-base">
          <Text variant="title">Bottom sheet</Text>
          <Text color="textSecondary">This validates BottomSheetModalProvider and themed sheet props.</Text>
          <Button label="Dismiss" onPress={sheet.dismiss} />
        </View>
      </Sheet>

      <Text variant="title">Skeleton</Text>
      <Card padding="none">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonCard />
      </Card>

      <Text variant="title">Empty state</Text>
      <EmptyState
        icon="notifications"
        title="No notifications yet"
        subtitle="Visitor requests will appear here"
        action={{ label: 'Refresh', onPress: () => {} }}
      />
    </Screen>
  );
}
