import { Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components';
import { HelpdeskList } from '@/features/complaints/HelpdeskList';
import { useResidentNavigation } from '@/lib/useResidentNavigation';

export default function ComplaintsScreen() {
  const { t } = useTranslation();
  const residentNav = useResidentNavigation();

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={() => residentNav.push('complaints/new')}
              accessibilityRole="button"
              accessibilityLabel={t('nav.screens.newComplaint')}
              hitSlop={8}
              className="p-sm"
            >
              <Text variant="body" color="coral">
                {t('nav.screens.newComplaint')}
              </Text>
            </Pressable>
          ),
        }}
      />
      <HelpdeskList
        scope="mine"
        onComplaintPress={(id) => residentNav.push('complaints', id)}
        onRaiseTicket={() => residentNav.push('complaints/new')}
      />
    </>
  );
}
