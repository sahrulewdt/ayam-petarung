import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Rarity } from '@/constants/types';
import { RARITY_COLORS } from '@/constants/gameData';

interface Props {
  rarity: Rarity;
  size?: 'sm' | 'md';
}

export function RarityBadge({ rarity, size = 'md' }: Props) {
  const color = RARITY_COLORS[rarity];
  const isSmall = size === 'sm';
  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: color + '22' }, isSmall && styles.small]}>
      <Text style={[styles.text, { color }, isSmall && styles.smallText]}>{rarity.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: 'Inter_700Bold',
  },
  smallText: {
    fontSize: 8,
  },
});
