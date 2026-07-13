import type { NavigationState, ParamListBase, RouteProp, TabNavigationState } from '@react-navigation/native';

type TabScreenListenerProps = {
  navigation: {
    getState: () => TabNavigationState<ParamListBase>;
    navigate: (name: string, params?: { screen?: string }) => void;
  };
  route: RouteProp<ParamListBase, string>;
};

function resetTabStack(
  navigation: TabScreenListenerProps['navigation'],
  tabRoute: TabNavigationState<ParamListBase>['routes'][number],
) {
  const stackState = tabRoute.state as NavigationState | undefined;
  if (stackState?.type !== 'stack' || stackState.routes.length <= 1) {
    return;
  }

  const rootScreen = stackState.routes[0]?.name;
  if (!rootScreen) return;

  navigation.navigate(tabRoute.name, { screen: rootScreen });
}

export function nativeTabScreenListeners(props: { route: RouteProp<ParamListBase, string> }) {
  const { navigation, route } = props as TabScreenListenerProps;

  return {
    // Only reset when the user re-taps the already-active tab.
    // Do NOT reset on focus — that breaks cross-tab deep links (e.g. Home avatar → Profile).
    tabPress: () => {
      const state = navigation.getState();
      const activeRoute = state.routes[state.index];
      if (activeRoute?.name === route.name) {
        resetTabStack(navigation, activeRoute);
      }
    },
  };
}
