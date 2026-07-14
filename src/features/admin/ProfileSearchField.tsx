import { useTranslation } from 'react-i18next';

import { SearchSuggestField } from '@/components';
import { SearchSuggestionRow } from '@/components/SearchSuggestionRow';
import { formatAssigneeLabel, formatAssigneeRole } from '@/lib/format';
import { useSearchFieldSelection } from '@/hooks/useSearchFieldSelection';
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

export function ProfileSearchField({
  label,
  onClear,
  onSelect,
  placeholder,
  roles,
  selectedLabel,
  societyId,
  value,
}: Props) {
  const { t } = useTranslation();
  const { query, setQuery } = useSearchFieldSelection(selectedLabel, value);
  const { data, isFetching } = useProfileSearch(societyId, query, roles);

  return (
    <SearchSuggestField
      closeLabel={t('common.close')}
      emptyText={t('admin.ops.noMatchingPeople')}
      getItemKey={(profile) => profile.id}
      isFetching={isFetching}
      label={label ?? t('admin.ops.assignToPerson')}
      loadingText={t('admin.ops.searchingPeople')}
      onClear={onClear}
      onQueryChange={setQuery}
      onSelect={(profile) => {
        setQuery(formatAssigneeLabel(profile));
        onSelect(profile);
      }}
      placeholder={placeholder ?? t('admin.ops.searchVisitor')}
      query={query}
      results={data}
      selectedLabel={selectedLabel}
      value={value}
      renderSuggestion={(profile) => (
        <SearchSuggestionRow
          icon={profile.kind === 'service_provider' ? 'construction' : 'person'}
          title={profile.full_name}
          subtitle={`${formatAssigneeRole(profile)}${profile.phone ? ` - ${profile.phone}` : ''}`}
        />
      )}
    />
  );
}
