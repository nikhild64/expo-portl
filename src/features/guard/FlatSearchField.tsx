import { useTranslation } from 'react-i18next';

import { SearchSuggestField } from '@/components';
import { SearchSuggestionRow } from '@/components/SearchSuggestionRow';
import { formatFlatLabel } from '@/lib/format';
import { useSearchFieldSelection } from '@/hooks/useSearchFieldSelection';
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
  const { query, setQuery } = useSearchFieldSelection(label, value);
  const { data, isFetching } = useFlatSearch(societyId, query);

  return (
    <SearchSuggestField
      closeLabel={t('common.close')}
      emptyText={t('guard.home.noFlatsFound')}
      error={error}
      getItemKey={(flat) => flat.id}
      isFetching={isFetching}
      label={fieldLabel ?? t('guard.home.flatSearch')}
      loadingText={t('guard.home.searchingFlats')}
      onClear={onClear}
      onQueryChange={setQuery}
      onSelect={(flat) => {
        const selectedLabel = `${formatFlatLabel(flat.tower_name, flat.number)}${flat.primary_resident ? ` (${flat.primary_resident})` : ''}`;
        setQuery(selectedLabel);
        onSelect(flat);
      }}
      placeholder={placeholder ?? t('guard.home.flatSearch')}
      query={query}
      results={data}
      selectedLabel={label}
      value={value}
      renderSuggestion={(flat) => (
        <SearchSuggestionRow
          icon="apartment"
          title={formatFlatLabel(flat.tower_name, flat.number)}
          subtitle={flat.primary_resident ?? t('format.notSet')}
        />
      )}
    />
  );
}
