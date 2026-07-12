import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Screen, Text } from '@/components';
import { EntryTypeGrid } from '@/features/guard/EntryTypeGrid';

export default function AddVisitorScreen() {
  return (
    <Screen scroll safe={false} contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}>
      <View className="gap-xs">
        <Text variant="titleLarge">Who is at the gate?</Text>
        <Text variant="body" color="textSecondary">
          Choose an entry type to start a visitor approval.
        </Text>
      </View>
      <EntryTypeGrid compact />
      <Button
        label="Scan pre-approval QR"
        icon="qr_code_scanner"
        variant="outlined"
        onPress={() => router.push('/(guard)/(add)/scan' as never)}
      />
    </Screen>
  );
}
