import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { RARITY_COLORS, ELEMENT_EMOJIS, RARITY_ORDER } from '@/constants/gameData';
import { RarityBadge } from '@/components/RarityBadge';
import { ElementIcon } from '@/components/ElementIcon';
import { Rooster } from '@/constants/types';

const ROOSTER_IMAGES: Record<string, any> = {
  rooster_fire: require('@/assets/images/rooster_fire.png'),
  rooster_ice: require('@/assets/images/rooster_ice.png'),
  rooster_shadow: require('@/assets/images/rooster_shadow.png'),
};

const FILTERS = ['All', 'Divine', 'Mythic', 'Legendary', 'Epic', 'Rare', 'Common'];
const CLASS_FILTERS = ['All', 'Guardian', 'Warrior', 'Assassin', 'Mage', 'Support', 'Berserker'];

export default function CollectionScreen() {
  const colors = useColors();
  const { roosters } = useGame();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [rarityFilter, setRarityFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'rarity' | 'level' | 'attack'>('rarity');

  const filtered = roosters
    .filter(r => rarityFilter === 'All' || r.rarity === rarityFilter)
    .filter(r => classFilter === 'All' || r.class === classFilter)
    .sort((a, b) => {
      if (sortBy === 'rarity') return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity);
      if (sortBy === 'level') return b.level - a.level;
      return b.stats.attack - a.stats.attack;
    });

  const renderCard = ({ item }: { item: Rooster }) => {
    const rarityColor = RARITY_COLORS[item.rarity];
    return (
      <TouchableOpacity
        onPress={() => router.push(`/rooster/${item.id}` as any)}
        style={[styles.card, { backgroundColor: colors.card, borderColor: rarityColor }]}
        activeOpacity={0.8}
      >
        <View style={[styles.cardGlow, { backgroundColor: rarityColor + '14' }]} />
        <Image
          source={ROOSTER_IMAGES[item.image || 'rooster_fire']}
          style={styles.cardImage}
          resizeMode="contain"
        />
        <View style={styles.cardBody}>
          <RarityBadge rarity={item.rarity} size="sm" />
          <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.cardClass, { color: colors.mutedForeground }]}>{item.class}</Text>
          <View style={styles.cardBottom}>
            <ElementIcon element={item.element} size={22} />
            <Text style={[styles.cardLevel, { color: colors.accent }]}>LV {item.level}</Text>
          </View>
          <View style={styles.cardStats}>
            <Text style={[styles.miniStat, { color: colors.fire || '#FF6B35' }]}>ATK {item.stats.attack}</Text>
            <Text style={[styles.miniStat, { color: '#14B8A6' }]}>HP {item.stats.hp}</Text>
          </View>
        </View>
        {item.evolutionStage === 'Divine' || item.evolutionStage === 'Mythic' ? (
          <View style={[styles.stagePip, { backgroundColor: rarityColor }]}>
            <Text style={styles.stageText}>{item.evolutionStage[0]}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Roosters</Text>
        <Text style={[styles.headerCount, { color: colors.mutedForeground }]}>{roosters.length} collected</Text>
      </View>

      {/* Rarity Filter */}
      <View style={[styles.filterWrap, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <FlatList
          data={FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
          keyExtractor={i => i}
          renderItem={({ item }) => {
            const active = rarityFilter === item;
            const color = item === 'All' ? colors.primary : RARITY_COLORS[item] || colors.primary;
            return (
              <TouchableOpacity
                onPress={() => setRarityFilter(item)}
                style={[styles.filterChip, {
                  backgroundColor: active ? color + '33' : colors.secondary,
                  borderColor: active ? color : colors.border,
                }]}
              >
                <Text style={[styles.filterText, { color: active ? color : colors.mutedForeground }]}>{item}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Sort Row */}
      <View style={[styles.sortRow, { backgroundColor: colors.background }]}>
        <Text style={[styles.sortLabel, { color: colors.mutedForeground }]}>Sort:</Text>
        {(['rarity', 'level', 'attack'] as const).map(s => (
          <TouchableOpacity
            key={s}
            onPress={() => setSortBy(s)}
            style={[styles.sortChip, {
              backgroundColor: sortBy === s ? colors.primary + '22' : 'transparent',
              borderColor: sortBy === s ? colors.primary : colors.border,
            }]}
          >
            <Text style={[styles.sortText, { color: sortBy === s ? colors.primary : colors.mutedForeground }]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Grid */}
      <FlatList
        data={filtered}
        numColumns={2}
        renderItem={renderCard}
        keyExtractor={r => r.id}
        contentContainerStyle={{ padding: 12, gap: 10, paddingBottom: 120 }}
        columnWrapperStyle={{ gap: 10 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No roosters match this filter</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  headerCount: { fontSize: 13, fontFamily: 'Inter_500Medium', paddingBottom: 2 },
  filterWrap: { borderBottomWidth: 1, paddingVertical: 10 },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  filterText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  sortRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 8, gap: 8,
  },
  sortLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  sortChip: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1,
  },
  sortText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  card: {
    flex: 1, borderRadius: 14, borderWidth: 2,
    overflow: 'hidden', minHeight: 210,
  },
  cardGlow: { ...StyleSheet.absoluteFillObject },
  cardImage: { width: '100%', height: 120 },
  cardBody: { padding: 10, gap: 4 },
  cardName: { fontSize: 13, fontFamily: 'Inter_700Bold', marginTop: 2 },
  cardClass: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  cardLevel: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  cardStats: { flexDirection: 'row', gap: 8, marginTop: 2 },
  miniStat: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  stagePip: {
    position: 'absolute', top: 8, right: 8,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  stageText: { fontSize: 10, color: '#fff', fontFamily: 'Inter_700Bold' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
});
