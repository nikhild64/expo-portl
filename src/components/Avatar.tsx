import { useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';

import { Text } from './Text';

const SIZES = { sm: 32, md: 40, lg: 56, xl: 80 } as const;
const BGS = ['#FFE1DB', '#FFD5CD', '#FFC9BF', '#F9BFB3'] as const;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || '?';
}

function bgFor(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return BGS[hash % BGS.length];
}

interface Props {
  name: string;
  uri?: string;
  size?: keyof typeof SIZES;
}

export function Avatar({ name, uri, size = 'md' }: Props) {
  const [errored, setErrored] = useState(false);
  const dim = SIZES[size];

  if (uri && !errored) {
    return (
      <Image
        source={{ uri }}
        style={{ width: dim, height: dim, borderRadius: dim / 2 }}
        onError={() => setErrored(true)}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      style={{
        width: dim,
        height: dim,
        borderRadius: dim / 2,
        backgroundColor: bgFor(name),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text variant={size === 'sm' ? 'footnote' : size === 'md' ? 'subhead' : 'title'} style={{ color: '#7C2D12' }}>
        {initials(name)}
      </Text>
    </View>
  );
}
