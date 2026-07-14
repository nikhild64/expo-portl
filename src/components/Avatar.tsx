import { useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { useCSSVariable } from 'uniwind';

import { isLocalUri, storageObjectPath, useSignedUrl } from '@/lib/storage';

import { Text } from './Text';

const SIZES = { sm: 32, md: 40, lg: 56, xl: 80, '2xl': 144 } as const;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || '?';
}

function bgFor(name: string, palette: readonly string[]) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}

interface Props {
  imageUri?: string;
  name: string;
  storageBucket?: string;
  uri?: string | null;
  size?: keyof typeof SIZES;
}

export function Avatar({ imageUri: prefetchedImageUri, name, storageBucket, uri, size = 'md' }: Props) {
  const [errored, setErrored] = useState(false);
  const dim = SIZES[size];
  const coralLight = useCSSVariable('--color-coral-light') as string;
  const surfaceTertiary = useCSSVariable('--color-surface-tertiary') as string;
  const bgPalette = [coralLight, surfaceTertiary, coralLight, surfaceTertiary] as const;
  const resolvedUri = uri ?? undefined;
  const objectPath = storageBucket && resolvedUri && !prefetchedImageUri ? storageObjectPath(resolvedUri, storageBucket) : null;
  const { data: signedUrl } = useSignedUrl(storageBucket ?? '', objectPath);
  const imageUri =
    prefetchedImageUri ??
    (objectPath && isLocalUri(objectPath) ? objectPath : signedUrl ?? (storageBucket ? undefined : resolvedUri));

  if (imageUri && !errored) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={{ width: dim, height: dim, borderRadius: dim / 2 }}
        onError={() => setErrored(true)}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      className="items-center justify-center"
      style={{
        width: dim,
        height: dim,
        borderRadius: dim / 2,
        backgroundColor: bgFor(name, bgPalette),
      }}
    >
      <Text
        variant={size === 'sm' ? 'footnote' : size === 'md' ? 'subhead' : size === '2xl' ? 'titleLarge' : 'title'}
        color="coral"
      >
        {initials(name)}
      </Text>
    </View>
  );
}
