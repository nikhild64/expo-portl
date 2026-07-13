import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Card, Field, IconSymbol, Text } from '@/components';
import { titleize } from '@/lib/format';
import { useProfileSearch, type AssigneeSearchResult } from '@/queries/useProfileSearch';
import type { Database } from '@/types/database';

type UserRole = Database['public']['Enums']['user_role'];

interface Props {
  label?: string;
  onClear?: () => void;
  onSelect: (profile: AssigneeSearchResult) => void;
  placeholder?: string;
  roles?: UserRole[];
  selectedLabel?: string;
  societyId?: string | null;
  value?: string;
}

function profileLabel(profile: AssigneeSearchResult) {
  return `${profile.full_name} (${profile.kind === 'service_provider' ? titleize(profile.category) : titleize(profile.role)})`;
}

export function ProfileSearchField({
  label = 'Assign to',
  onClear,
  onSelect,
  placeholder = 'Search by name or phone',
  roles,
  selectedLabel,
  societyId,
  value,
}: Props) {
  const [query, setQuery] = useState(selectedLabel ?? '');
  const { data, isFetching } = useProfileSearch(societyId, query, roles);
  const showSuggestions = query.trim().length >= 1 && (!value || query !== selectedLabel);

  useEffect(() => {
    setQuery(selectedLabel ?? '');
  }, [selectedLabel, value]);

  return (
    <View className="gap-xs">
      <View className="relative">
        <Field
          label={label}
          placeholder={placeholder}
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            if (value) onClear?.();
          }}
        />
        {!!value && (
          <Pressable className="absolute bottom-[14px] right-md" onPress={onClear}>
            <IconSymbol name="close" size={18} color="textTertiary" />
          </Pressable>
        )}
      </View>

      {showSuggestions && (
        <Card padding="none" variant="outlined" className="overflow-hidden">
          {isFetching && (
            <View className="px-base py-md">
              <Text variant="footnote" color="textSecondary">
                Searching people and providers...
              </Text>
            </View>
          )}
          {!isFetching && !data?.length && (
            <View className="px-base py-md">
              <Text variant="footnote" color="textSecondary">
                No matching people or service providers found
              </Text>
            </View>
          )}
          {data?.map((profile, index) => (
            <Pressable
              key={profile.id}
              className={`flex-row items-center gap-md px-base py-md${index > 0 ? ' border-t border-border' : ''}`}
              onPress={() => {
                const nextLabel = profileLabel(profile);
                setQuery(nextLabel);
                onSelect(profile);
              }}
            >
              <IconSymbol name={profile.kind === 'service_provider' ? 'construction' : 'person'} size={20} color="coral" />
              <View className="flex-1">
                <Text variant="headline">{profile.full_name}</Text>
                <Text variant="footnote" color="textSecondary">
                  {profile.kind === 'service_provider' ? titleize(profile.category) : titleize(profile.role)}
                  {profile.phone ? ` - ${profile.phone}` : ''}
                </Text>
              </View>
              <IconSymbol name="check_circle" size={18} color="success" />
            </Pressable>
          ))}
        </Card>
      )}
    </View>
  );
}
