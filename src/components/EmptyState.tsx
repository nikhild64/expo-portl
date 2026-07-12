import { View } from 'react-native';

import { Button } from './Button';
import { IconSymbol, type IconName } from './IconSymbol';
import { Text } from './Text';

interface Props {
  icon: IconName;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
  className?: string;
}

export function EmptyState({ icon, title, subtitle, action, className }: Props) {
  return (
    <View className={`items-center gap-md p-xl${className ? ` ${className}` : ''}`}>
      <View className="w-16 h-16 rounded-pill bg-surface-secondary items-center justify-center">
        <IconSymbol name={icon} size={32} color="coral" />
      </View>
      <Text variant="title" className="text-center">
        {title}
      </Text>
      {subtitle && (
        <Text variant="body" color="textSecondary" className="text-center">
          {subtitle}
        </Text>
      )}
      {action && <Button label={action.label} onPress={action.onPress} />}
    </View>
  );
}
