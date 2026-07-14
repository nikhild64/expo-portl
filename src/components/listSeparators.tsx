import { View } from 'react-native';

export function HairlineSeparator() {
  return <View className="h-px bg-border ml-16" />;
}

export function MediumGapSeparator() {
  return <View className="h-md" />;
}

export function SmallGapSeparator() {
  return <View style={{ height: 12 }} />;
}
