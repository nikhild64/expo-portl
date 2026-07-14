import { useEffect, useState } from 'react';

export function useSearchFieldSelection(selectedLabel?: string, value?: string) {
  const [query, setQuery] = useState(selectedLabel ?? '');

  useEffect(() => {
    setQuery(selectedLabel ?? '');
  }, [selectedLabel, value]);

  return { query, setQuery };
}
