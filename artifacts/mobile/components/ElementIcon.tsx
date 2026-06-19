import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Element } from '@/constants/types';
import { ELEMENT_COLORS, ELEMENT_EMOJIS } from '@/constants/gameData';

interface Props {
  element: Element;
  size?: number;
  showLabel?: boolean;
}

export function ElementIcon({ element, size = 28, showLabel = false }: Props) {
  const color = ELEMENT_COLORS[element];
  const emoji = ELEMENT_EMOJIS[element];
  return (
    <View style={styles.wrapper}>
      <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: color + '33', borderColor: color }]}>
        <Text style={{ fontSize: size * 0.52 }}>{emoji}</Text>
      </View>
      {showLabel && <Text style={[styles.label, { color }]}>{element}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 2,
  },
  circle: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
});
