import { sheetTransition, stackTransition, themedStackScreenOptions } from './stackScreenOptions';

describe('stackScreenOptions', () => {
  it('defines a fade push transition', () => {
    expect(stackTransition).toMatchObject({
      animation: 'fade',
      animationDuration: 280,
      fullScreenGestureEnabled: true,
      gestureEnabled: true,
    });
  });

  it('defines a form sheet transition', () => {
    expect(sheetTransition).toMatchObject({
      animation: 'fade',
      presentation: 'formSheet',
      sheetAllowedDetents: [0.92, 1],
      sheetGrabberVisible: true,
    });
  });

  it('merges themed header and content styles', () => {
    const options = themedStackScreenOptions('#111111', '#FFFFFF');

    expect(options).toMatchObject({
      ...stackTransition,
      contentStyle: { backgroundColor: '#111111' },
      headerLargeStyle: { backgroundColor: '#111111' },
      headerStyle: { backgroundColor: '#111111' },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: { color: '#FFFFFF' },
      headerLargeTitleShadowVisible: false,
      headerShadowVisible: false,
    });
  });
});
