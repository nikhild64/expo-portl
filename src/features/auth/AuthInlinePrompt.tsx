import { router, type Href } from 'expo-router';

import { Text } from '@/components';

interface Props {
  prompt: string;
  linkLabel: string;
  href: Href;
}

/** Inline auth footer prompt + link that wraps instead of clipping in a flex row. */
export function AuthInlinePrompt({ prompt, linkLabel, href }: Props) {
  return (
    <Text variant="footnote" color="textSecondary" className="text-center">
      {prompt}{' '}
      <Text
        variant="footnote"
        color="coral"
        accessibilityRole="link"
        onPress={() => router.push(href)}
      >
        {linkLabel}
      </Text>
    </Text>
  );
}
