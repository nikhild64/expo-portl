import { renderHook, waitFor } from '@testing-library/react-native';

import { createQueryWrapper } from '@/queries/__testUtils/queryTestUtils';

import { escapeIlike, useDebouncedSearchQuery } from './search';

jest.mock('@/hooks/useDebouncedValue', () => ({
  useDebouncedValue: (value: string) => value,
}));

describe('escapeIlike', () => {
  it('escapes ILIKE wildcard characters', () => {
    expect(escapeIlike('100%')).toBe('100\\%');
    expect(escapeIlike('flat_1')).toBe('flat\\_1');
    expect(escapeIlike('path\\to')).toBe('path\\\\to');
  });

  it('leaves normal search text unchanged', () => {
    expect(escapeIlike('Tower A 402')).toBe('Tower A 402');
  });
});

describe('useDebouncedSearchQuery', () => {
  it('runs the query when trimmed input meets minLength', async () => {
    const queryFn = jest.fn(async (term: string) => [`result:${term}`]);

    const { result } = renderHook(
      () =>
        useDebouncedSearchQuery({
          query: '  tower  ',
          queryKeyPrefix: ['search', 'towers'],
          queryFn,
        }),
      { wrapper: createQueryWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryFn).toHaveBeenCalledWith('tower');
    expect(result.current.data).toEqual(['result:tower']);
  });

  it('stays disabled until minLength is reached', () => {
    const queryFn = jest.fn();

    const { result } = renderHook(
      () =>
        useDebouncedSearchQuery({
          query: '',
          queryKeyPrefix: ['search', 'towers'],
          minLength: 2,
          queryFn,
        }),
      { wrapper: createQueryWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(queryFn).not.toHaveBeenCalled();
  });

  it('respects an explicit enabled flag', async () => {
    const queryFn = jest.fn(async () => ['ok']);

    const { result } = renderHook(
      () =>
        useDebouncedSearchQuery({
          query: 'abc',
          queryKeyPrefix: ['search', 'disabled'],
          enabled: false,
          queryFn,
        }),
      { wrapper: createQueryWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(queryFn).not.toHaveBeenCalled();
  });
});
