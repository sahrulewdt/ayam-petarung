import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { RARITY_COLORS, ELEMENT_EMOJIS } from '@/constants/gameData';
import { ElementIcon } from '@/components/ElementIcon';
import { RarityBadge } from '@/components/RarityBadge';

const ROOSTER_IMAGES: Record<string, any> = {
  rooster_fire: require('@/assets/images/rooster_fire.png'),
  rooster_ice: require('@/assets/images/rooster_ice.png'),
  rooster_shadow: require('@/assets/images/rooster_shadow.png'),
};

export default function HomeScreen() {
  const colors = useColors();
  const { player, roosters, dailyQuests } = useGame();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const featuredRooster = roosters.find(r => r.rarity === 'Divine') || roosters[0];
  const completedQuests = dailyQuests.filter(q => q.completed).length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 120, paddingTop: topPad }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Banner */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.welcomeText, { color: colors.mutedForeground }]}>WELCOME BACK</Text>
          <Text style={[styles.username, { color: colors.foreground }]}>{player.username}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.levelBadge, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}>
            <Text style={[styles.levelText, { color: colors.primary }]}>LV {player.level}</Text>
          </View>
          <TouchableOpacity style={[styles.gemsBadge, { backgroundColor: colors.secondary }]}>
            <Text style={styles.gemsIcon}>💎</Text>
            <Text style={[styles.gemsValue, { color: colors.accent }]}>{player.gems}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Currency Row */}
      <View style={[styles.currencyRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {[
          { icon: '🪙', value: player.gold.toLocaleString(), label: 'Gold' },
          { icon: '💠', value: player.crystal.toLocaleString(), label: 'Crystal' },
          { icon: '⚔️', value: player.arenaPoints.toString(), label: 'Arena Pts' },
        ].map((item) => (
          <View key={item.label} style={styles.currencyItem}>
            <Text style={styles.currencyIcon}>{item.icon}</Text>
            <Text style={[styles.currencyValue, { color: colors.foreground }]}>{item.value}</Text>
            <Text style={[styles.currencyLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Featured Rooster */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Featured Champion</Text>
        <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>⚡ Season Legendary</Text>
      </View>
      <TouchableOpacity
        onPress={() => router.push(`/rooster/${featuredRooster.id}` as any)}
        style={[styles.featuredCard, { backgroundColor: colors.card, borderColor: RARITY_COLORS[featuredRooster.rarity] }]}
        activeOpacity={0.85}
      >
        <View style={[styles.featuredGlow, { backgroundColor: RARITY_COLORS[featuredRooster.rarity] + '18' }]} />
        <View style={styles.featuredContent}>
          <View style={styles.featuredInfo}>
            <RarityBadge rarity={featuredRooster.rarity} />
            <Text style={[styles.featuredName, { color: colors.foreground }]}>{featuredRooster.name}</Text>
            <Text style={[styles.featuredClass, { color: colors.mutedForeground }]}>
              {featuredRooster.class} · Lv {featuredRooster.level}
            </Text>
            <ElementIcon element={featuredRooster.element} size={32} showLabel />
            <View style={styles.featuredStats}>
              <Text style={[styles.statChip, { color: colors.fire || '#FF6B35' }]}>ATK {featuredRooster.stats.attack}</Text>
              <Text style={[styles.statChip, { color: colors.teal || '#14B8A6' }]}>HP {featuredRooster.stats.hp}</Text>
              <Text style={[styles.statChip, { color: colors.accent }]}>SPD {featuredRooster.stats.speed}</Text>
            </View>
          </View>
          <Image
            source={ROOSTER_IMAGES[featuredRooster.image || 'rooster_fire']}
            style={styles.featuredImage}
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>

      {/* Quick Actions */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Battle</Text>
      </View>
      <View style={styles.quickActions}>
        {[
          { label: 'Story\nMode', icon: 'book', color: colors.primary, route: '/battle' },
          { label: 'Arena\nPvP', icon: 'award', color: colors.accent, route: '/battle' },
          { label: 'Dungeon\nRun', icon: 'layers', color: '#A855F7', route: '/battle' },
          { label: 'Raid\nBoss', icon: 'alert-octagon', color: '#FF6B35', route: '/battle' },
        ].map((action) => (
          <TouchableOpacity
            key={action.label}
            onPress={() => router.push(action.route as any)}
            style={[styles.quickBtn, { backgroundColor: action.color + '22', borderColor: action.color }]}
            activeOpacity={0.75}
          >
            <Feather name={action.icon as any} size={22} color={action.color} />
            <Text style={[styles.quickLabel, { color: action.color }]}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Daily Quests */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Daily Quests</Text>
        <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>{completedQuests}/{dailyQuests.length} done</Text>
      </View>
      <View style={[styles.questsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {dailyQuests.map((quest, i) => (
          <View
            key={quest.id}
            style={[
              styles.questRow,
              i < dailyQuests.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
            ]}
          >
            <View style={[styles.questCheck, {
              backgroundColor: quest.completed ? colors.primary : 'transparent',
              borderColor: quest.completed ? colors.primary : colors.border
            }]}>
              {quest.completed && <Feather name="check" size={12} color="#fff" />}
            </View>
            <View style={styles.questInfo}>
              <Text style={[styles.questTitle, {
                color: quest.completed ? colors.mutedForeground : colors.foreground,
                textDecorationLine: quest.completed ? 'line-through' : 'none',
              }]}>{quest.title}</Text>
              <View style={[styles.questTrack, { backgroundColor: colors.secondary }]}>
                <View style={[styles.questFill, {
                  width: `${(quest.progress / quest.total) * 100}%` as any,
                  backgroundColor: quest.completed ? colors.mutedForeground : colors.primary
                }]} />
              </View>
              <Text style={[styles.questProgress, { color: colors.mutedForeground }]}>
                {quest.progress}/{quest.total} · {quest.reward}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  welcomeText: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 2 },
  username: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  levelBadge: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  levelText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  gemsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  gemsIcon: { fontSize: 14 },
  gemsValue: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  currencyRow: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: 12,
    borderRadius: 12, borderWidth: 1, overflow: 'hidden',
  },
  currencyItem: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
  },
  currencyIcon: { fontSize: 20 },
  currencyValue: { fontSize: 14, fontFamily: 'Inter_700Bold', marginTop: 2 },
  currencyLabel: { fontSize: 10, fontFamily: 'Inter_500Medium', marginTop: 1 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, marginTop: 20, marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  sectionSub: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  featuredCard: {
    marginHorizontal: 16, borderRadius: 16, borderWidth: 2,
    overflow: 'hidden', minHeight: 160,
  },
  featuredGlow: { ...StyleSheet.absoluteFillObject },
  featuredContent: {
    flexDirection: 'row', alignItems: 'center',
    paddingLeft: 16, paddingVertical: 16,
  },
  featuredInfo: { flex: 1, gap: 6 },
  featuredName: { fontSize: 20, fontFamily: 'Inter_700Bold', marginTop: 4 },
  featuredClass: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  featuredStats: { flexDirection: 'row', gap: 8, marginTop: 4 },
  statChip: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  featuredImage: { width: 130, height: 150, marginRight: -4 },
  quickActions: {
    flexDirection: 'row', paddingHorizontal: 16, gap: 10,
  },
  quickBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    borderRadius: 12, borderWidth: 1, gap: 6,
  },
  quickLabel: {
    fontSize: 10, fontFamily: 'Inter_700Bold',
    textAlign: 'center', letterSpacing: 0.5,
  },
  questsCard: {
    marginHorizontal: 16, borderRadius: 12, borderWidth: 1,
    overflow: 'hidden',
  },
  questRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, gap: 12,
  },
  questCheck: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  questInfo: { flex: 1, gap: 4 },
  questTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  questTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  questFill: { height: '100%', borderRadius: 2 },
  questProgress: { fontSize: 11, fontFamily: 'Inter_400Regular' },
});
