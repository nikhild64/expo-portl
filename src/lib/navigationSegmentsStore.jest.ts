import { getNavigationSegments, setNavigationSegments } from './navigationSegmentsStore';

describe('navigationSegmentsStore', () => {
  afterEach(() => {
    setNavigationSegments([]);
  });

  it('stores and returns the latest route segments', () => {
    setNavigationSegments(['(resident)', '(home)']);
    expect(getNavigationSegments()).toEqual(['(resident)', '(home)']);
  });
});
