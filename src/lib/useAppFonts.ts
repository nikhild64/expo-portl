import { useFonts } from 'expo-font';

export function useAppFonts() {
  const [fontsLoaded, fontsError] = useFonts({
    'RobotoFlex-Regular': require('../../assets/fonts/RobotoFlex-Regular.ttf'),
    'RobotoFlex-Medium': require('../../assets/fonts/RobotoFlex-Medium.ttf'),
    'RobotoFlex-SemiBold': require('../../assets/fonts/RobotoFlex-SemiBold.ttf'),
    'RobotoFlex-Bold': require('../../assets/fonts/RobotoFlex-Bold.ttf'),
  });

  return { fontsLoaded, fontsError };
}
