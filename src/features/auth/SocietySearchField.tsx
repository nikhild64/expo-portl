import { useTranslation } from 'react-i18next';

import { SearchSuggestField } from '@/components';
import { SearchSuggestionRow } from '@/components/SearchSuggestionRow';
import { useSearchFieldSelection } from '@/hooks/useSearchFieldSelection';
import { useSocietySearch } from '@/queries/useSocietySearch';
import type { Database } from '@/types/database';

type Society = Database['public']['Tables']['societies']['Row'];

interface Props {
  label?: string;
  onClear?: () => void;
  onSelect: (society: Society) => void;
  placeholder?: string;
  selectedLabel?: string;
  value?: string;
}

export function SocietySearchField({
  label,
  onClear,
  onSelect,
  placeholder,
  selectedLabel,
  value,
}: Props) {
  const { t } = useTranslation();
  const { query, setQuery } = useSearchFieldSelection(selectedLabel, value);
  const { data, isFetching } = useSocietySearch(query);

  return (
    <SearchSuggestField
      closeLabel={t('common.close')}
      emptyText={t('auth.joinSociety.noSocietiesFound')}
      getItemKey={(society) => society.id}
      isFetching={isFetching}
      label={label ?? t('auth.joinSociety.searchByNameOrCity')}
      loadingText={t('auth.joinSociety.searchingSocieties')}
      minQueryLength={2}
      onClear={onClear}
      onQueryChange={setQuery}
      onSelect={(society) => {
        setQuery(society.name);
        onSelect(society);
      }}
      placeholder={placeholder ?? t('auth.placeholders.societySearch')}
      query={query}
      results={data}
      selectedLabel={selectedLabel}
      value={value}
      renderSuggestion={(society) => (
        <SearchSuggestionRow
          icon="apartment"
          title={society.name}
          subtitle={society.city ?? undefined}
        />
      )}
    />
  );
}
