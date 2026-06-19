import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { RARITY_COLORS, ARENA_RANKS } from '@/constants/gameData';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';

const ACHIEVEMENTS = [
  { id: 'a1', title: 'First Blood', desc: 'Win your first battle', icon: 'zap', color: '#FF6B35', done: true },
  { id: 'a2', title: 'Breeder', desc: 'Breed 10 roosters', icon: 'git-merge', color: '#22C55E', done: true },
  { id: 'a3', title: 'Collector', desc: 'Collect 10 roosters', icon: 'layers', color: '#3B82F6', done: true },
  { id: 'a4', title: 'Legendary', desc: 'Obtain a Legendary rooster', icon: 'star', color: '#FFD700', done: true },
  { id: 'a5', title: 'Champion', desc: 'Reach Diamond arena rank', icon: 'award', color: '#A855F7', done: true },
  { id: 'a6', title: 'Divine Hunt', desc: 'Obtain a Divine rooster', icon: 'sun', color: '#FF69B4', done: true },
  { id: 'a7', title: 'Arena King', desc: 'Reach Mythic rank', icon: 'shield', color: '#FF4444', done: false },
  { id: 'a8', title: 'Guild Master', desc: 'Lead a guild to level 10', icon: 'users', color: '#14B8A6', done: false },
];

export default function ProfileScreen() {
  const colors = useColors();
  const { player, roosters } = useGame();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const { isTelegram, user: tgUser } = useTelegramWebApp();

  const displayName = isTelegram && tgUser
    ? tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : '')
    : player.username;
  const displayHandle = isTelegram && tgUser?.username
    ? '@' + tgUser.username
    : null;

  const rankIdx = ARENA_RANKS.indexOf(player.arenaRank);
  const winRate = player.wins + player.losses > 0
    ? Math.round((player.wins / (player.wins + player.losses)) * 100)
    : 0;
  const divineCount = roosters.filter(r => r.rarity === 'Divine').length;
  const mythicCount = roosters.filter(r => r.rarity === 'Mythic').length;
  const legendaryCount = roosters.filter(r => r.rarity === 'Legendary').length;
  const expPct = player.exp / player.maxExp;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Profile</Text>
        <TouchableOpacity>
          <Feather name="settings" size={22} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Player Card */}
      <View style={[styles.playerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.avatarSection}>
          <View style={[styles.avatarRing, { borderColor: RARITY_COLORS['Divine'] }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + '33' }]}>
              <Text style={styles.avatarEmoji}>🐓</Text>
            </View>
          </View>
          <View style={styles.playerInfo}>
            <Text style={[styles.playerName, { color: colors.foreground }]}>{displayName}</Text>
            {displayHandle && (
              <Text style={[styles.playerGuild, { color: colors.mutedForeground }]}>{displayHandle}</Text>
            )}
            <Text style={[styles.playerGuild, { color: colors.accent }]}>{player.guildName} · Lv {player.guildLevel}</Text>
            <View style={[styles.rankPill, { backgroundColor: '#A855F7' + '22', borderColor: '#A855F7' }]}>
              <Text style={[styles.rankPillText, { color: '#A855F7' }]}>{player.arenaRank} Arena</Text>
            </View>
          </View>
        </View>

        {/* EXP Bar */}
        <View style={styles.expSection}>
          <View style={styles.expLabelRow}>
            <Text style={[styles.expLabel, { color: colors.mutedForeground }]}>Level {player.level}</Text>
            <Text style={[styles.expLabel, { color: colors.mutedForeground }]}>{player.exp.toLocaleString()} / {player.maxExp.toLocaleString()} XP</Text>
          </View>
          <View style={[styles.expTrack, { backgroundColor: colors.secondary }]}>
            <View style={[styles.expFill, { width: `${expPct * 100}%` as any, backgroundColor: colors.accent }]} />
          </View>
        </View>

        {/* Stats Grid */}
        <View style={[styles.statsGrid, { borderTopColor: colors.border }]}>
          {[
            { label: 'Total Battles', value: player.wins + player.losses },
            { label: 'Win Rate', value: `${winRate}%`, color: winRate > 60 ? '#22C55E' : colors.foreground },
            { label: 'Roosters', value: roosters.length },
            { label: 'Arena Pts', value: player.arenaPoints, color: '#A855F7' },
          ].map((stat, i) => (
            <View key={stat.label} style={[styles.statItem, i % 2 === 0 && { borderRightWidth: 1, borderRightColor: colors.border }]}>
              <Text style={[styles.statValue, { color: stat.color || colors.foreground }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Collection Summary */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Collection</Text>
      </View>
      <View style={[styles.collectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {[
          { label: 'Divine', count: divineCount, color: RARITY_COLORS['Divine'] },
          { label: 'Mythic', count: mythicCount, color: RARITY_COLORS['Mythic'] },
          { label: 'Legendary', count: legendaryCount, color: RARITY_COLORS['Legendary'] },
          { label: 'Total', count: roosters.length, color: colors.primary },
        ].map((item, i) => (
          <View
            key={item.label}
            style={[styles.collRow, i < 3 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
          >
            <View style={[styles.collDot, { backgroundColor: item.color }]} />
            <Text style={[styles.collLabel, { color: colors.foreground }]}>{item.label} Roosters</Text>
            <Text style={[styles.collCount, { color: item.color }]}>{item.count}</Text>
          </View>
        ))}
      </View>

      {/* Guild Info */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Guild</Text>
      </View>
      <View style={[styles.guildCard, { backgroundColor: colors.card, borderColor: '#22C55E' }]}>
        <View style={[styles.guildIcon, { backgroundColor: '#22C55E' + '22' }]}>
          <Text style={{ fontSize: 28 }}>🏯</Text>
        </View>
        <View style={styles.guildInfo}>
          <Text style={[styles.guildName, { color: colors.foreground }]}>{player.guildName}</Text>
          <Text style={[styles.guildLevel, { color: colors.mutedForeground }]}>Guild Level {player.guildLevel} · 24 Members</Text>
          <View style={[styles.guildRankPill, { backgroundColor: '#22C55E' + '22', borderColor: '#22C55E' }]}>
            <Text style={[styles.guildRankText, { color: '#22C55E' }]}>Rank #12 Guild War</Text>
          </View>
        </View>
        <TouchableOpacity>
          <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Achievements */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Achievements</Text>
        <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
          {ACHIEVEMENTS.filter(a => a.done).length}/{ACHIEVEMENTS.length}
        </Text>
      </View>
      <View style={[styles.achieveCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {ACHIEVEMENTS.map((ach, i) => (
          <View
            key={ach.id}
            style={[styles.achRow, i < ACHIEVEMENTS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
          >
            <View style={[styles.achIcon, {
              backgroundColor: ach.done ? ach.color + '22' : colors.secondary,
              borderColor: ach.done ? ach.color : colors.border,
            }]}>
              <Feather name={ach.icon as any} size={16} color={ach.done ? ach.color : colors.mutedForeground} />
            </View>
            <View style={styles.achInfo}>
              <Text style={[styles.achTitle, { color: ach.done ? colors.foreground : colors.mutedForeground }]}>{ach.title}</Text>
              <Text style={[styles.achDesc, { color: colors.mutedForeground }]}>{ach.desc}</Text>
            </View>
            {ach.done && <Feather name="check-circle" size={18} color={ach.color} />}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  playerCard: { margin: 16, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  avatarSection: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  avatarRing: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, padding: 3 },
  avatar: { flex: 1, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 36 },
  playerInfo: { flex: 1, gap: 5 },
  playerName: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  playerGuild: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  rankPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start' },
  rankPillText: { fontSize: 11, fontFamily: 'Inter_700Bold' },
  expSection: { paddingHorizontal: 16, paddingBottom: 14, gap: 6 },
  expLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  expLabel: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  expTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  expFill: { height: '100%', borderRadius: 3 },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    borderTopWidth: 1,
  },
  statItem: { width: '50%', paddingVertical: 14, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#2E2050' },
  statValue: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, marginTop: 20, marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  sectionSub: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  collectionCard: { marginHorizontal: 16, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  collRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  collDot: { width: 10, height: 10, borderRadius: 5 },
  collLabel: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium' },
  collCount: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  guildCard: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16,
    borderRadius: 14, borderWidth: 2, padding: 14, gap: 14,
  },
  guildIcon: { width: 56, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  guildInfo: { flex: 1, gap: 4 },
  guildName: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  guildLevel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  guildRankPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, alignSelf: 'flex-start' },
  guildRankText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  achieveCard: { marginHorizontal: 16, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  achRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  achIcon: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  achInfo: { flex: 1, gap: 2 },
  achTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  achDesc: { fontSize: 11, fontFamily: 'Inter_400Regular' },
});
