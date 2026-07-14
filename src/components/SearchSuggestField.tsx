import { Pressable, View } from 'react-native';
import type { ReactNode } from 'react';

import { Card } from '@/components/Card';
import { Field } from '@/components/Field';
import { IconSymbol } from '@/components/IconSymbol';
import { Text } from '@/components/Text';

interface Props<T> {
  closeLabel: string;
  emptyText: string;
  error?: string;
  getItemKey: (item: T) => string;
  isFetching: boolean;
  label: string;
  loadingText: string;
  minQueryLength?: number;
  onClear?: () => void;
  onQueryChange: (text: string) => void;
  onSelect: (item: T) => void;
  placeholder: string;
  query: string;
  renderSuggestion: (item: T) => ReactNode;
  results?: T[];
  selectedLabel?: string;
  value?: string;
}

export function SearchSuggestField<T>({
  closeLabel,
  emptyText,
  error,
  getItemKey,
  isFetching,
  label,
  loadingText,
  minQueryLength = 1,
  onClear,
  onQueryChange,
  onSelect,
  placeholder,
  query,
  renderSuggestion,
  results,
  selectedLabel,
  value,
}: Props<T>) {
  const showSuggestions = query.trim().length >= minQueryLength && (!value || query !== selectedLabel);

  return (
    <View className="gap-xs">
      <View className="relative">
        <Field
          label={label}
          placeholder={placeholder}
          value={query}
          error={error}
          onChangeText={(text) => {
            onQueryChange(text);
            if (value) onClear?.();
          }}
        />
        {!!value && (
          <Pressable
            className="absolute bottom-[14px] right-md"
            onPress={onClear}
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
          >
            <IconSymbol name="close" size={18} color="textTertiary" />
          </Pressable>
        )}
      </View>

      {showSuggestions && (
        <Card padding="none" variant="outlined" className="overflow-hidden">
          {isFetching && (
            <View className="px-base py-md">
              <Text variant="footnote" color="textSecondary">
                {loadingText}
              </Text>
            </View>
          )}
          {!isFetching && !results?.length && (
            <View className="px-base py-md">
              <Text variant="footnote" color="textSecondary">
                {emptyText}
              </Text>
            </View>
          )}
          {results?.map((item, index) => (
            <Pressable
              key={getItemKey(item)}
              className={`flex-row items-center gap-md px-base py-md${index > 0 ? ' border-t border-border' : ''}`}
              onPress={() => onSelect(item)}
            >
              {renderSuggestion(item)}
            </Pressable>
          ))}
        </Card>
      )}
    </View>
  );
}
