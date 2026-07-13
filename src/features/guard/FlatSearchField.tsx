import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, Field, IconSymbol, Text } from '@/components';
import { formatFlatLabel } from '@/lib/format';
import { useFlatSearch, type FlatSearchResult } from '@/queries/useFlatSearch';

interface Props {
  error?: string;
  fieldLabel?: string;
  label?: string;
  onClear?: () => void;
  onSelect: (flat: FlatSearchResult) => void;
  placeholder?: string;
  societyId?: string | null;
  value?: string;
}

function flatLabel(flat: FlatSearchResult) {
  const label = formatFlatLabel(flat.tower_name, flat.number, 'Flat');
  return `${label}${flat.primary_resident ? ` (${flat.primary_resident})` : ''}`;
}

export function FlatSearchField({
  error,
  fieldLabel,
  label,
  onClear,
  onSelect,
  placeholder,
  societyId,
  value,
}: Props) {
  const { t } = useTranslation();
  const resolvedFieldLabel = fieldLabel ?? t('guard.home.flatSearch');
  const resolvedPlaceholder = placeholder ?? t('guard.home.flatSearch');
  const [query, setQuery] = useState(label ?? '');
  const { data, isFetching } = useFlatSearch(societyId, query);
  const showSuggestions = query.trim().length >= 1 && (!value || query !== label);

  useEffect(() => {
    setQuery(label ?? '');
  }, [label]);

  return (
    <View className="gap-xs">
      <View className="relative">
        <Field
          label={resolvedFieldLabel}
          placeholder={resolvedPlaceholder}
          value={query}
          error={error}
          onChangeText={(text) => {
            setQuery(text);
            if (value) onClear?.();
          }}
        />
        {!!value && (
          <Pressable className="absolute bottom-[14px] right-md" onPress={onClear} accessibilityRole="button" accessibilityLabel={t('common.close')}>
            <IconSymbol name="close" size={18} color="textTertiary" />
          </Pressable>
        )}
      </View>

      {showSuggestions && (
        <Card padding="none" variant="outlined" className="overflow-hidden">
          {isFetching && (
            <View className="px-base py-md">
              <Text variant="footnote" color="textSecondary">
                {t('guard.home.searchingFlats')}
              </Text>
            </View>
          )}
          {!isFetching && !data?.length && (
            <View className="px-base py-md">
              <Text variant="footnote" color="textSecondary">
                {t('guard.home.noFlatsFound')}
              </Text>
            </View>
          )}
          {data?.map((flat, index) => (
            <Pressable
              key={flat.id}
              className={`flex-row items-center gap-md px-base py-md${index > 0 ? ' border-t border-border' : ''}`}
              onPress={() => {
                const nextLabel = flatLabel(flat);
                setQuery(nextLabel);
                onSelect(flat);
              }}
            >
              <IconSymbol name="apartment" size={20} color="coral" />
              <View className="flex-1">
                <Text variant="headline">
                  {formatFlatLabel(flat.tower_name, flat.number, 'Flat')}
                </Text>
                <Text variant="footnote" color="textSecondary">
                  {flat.primary_resident ?? t('format.notSet')}
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
