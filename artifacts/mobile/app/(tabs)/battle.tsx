import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { RARITY_COLORS } from '@/constants/gameData';
import { ElementIcon } from '@/components/ElementIcon';

const ROOSTER_IMAGES: Record<string, any> = {
  rooster_fire: require('@/assets/images/rooster_fire.png'),
  rooster_ice: require('@/assets/images/rooster_ice.png'),
  rooster_shadow: require('@/assets/images/rooster_shadow.png'),
};

const BATTLE_MODES = [
  {
    id: 'story',
    title: 'Story Mode',
    subtitle: 'Chapter 42 · Stage 7',
    icon: 'book-open',
    color: '#3B82F6',
    badge: 'PvE',
    description: '1000 stages across 100 chapters',
    progress: 417,
    total: 1000,
  },
  {
    id: 'dungeon',
    title: 'Dungeon',
    subtitle: 'Gold Dungeon · Opens in 2h',
    icon: 'layers',
    color: '#FFD700',
    badge: 'DAILY',
    description: 'Gold, XP, Rune & Artifact dungeons',
  },
  {
    id: 'arena',
    title: 'PvP Arena',
    subtitle: 'Diamond League',
    icon: 'award',
    color: '#A855F7',
    badge: 'RANKED',
    description: 'Battle real players for rank points',
  },
  {
    id: 'raid',
    title: 'World Raid',
    subtitle: 'Dragon King · 72% HP',
    icon: 'alert-octagon',
    color: '#FF6B35',
    badge: 'RAID',
    description: 'Cooperative boss fights',
  },
  {
    id: 'guild',
    title: 'Guild War',
    subtitle: 'Phoenix Clan · Season 3',
    icon: 'users',
    color: '#22C55E',
    badge: 'GUILD',
    description: 'Guild vs Guild strategic battles',
  },
];

const ARENA_RANKS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster', 'Legend', 'Mythic'];

export default function BattleScreen() {
  const colors = useColors();
  const { player, roosters, selectedTeam, setSelectedTeam } = useGame();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const [activeMode, setActiveMode] = useState<string | null>(null);

  const rankIdx = ARENA_RANKS.indexOf(player.arenaRank);
  const teamRoosters = roosters.filter(r => selectedTeam.includes(r.id));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Battle</Text>
        <View style={[styles.rankBadge, { backgroundColor: '#A855F7' + '22', borderColor: '#A855F7' }]}>
          <Text style={[styles.rankText, { color: '#A855F7' }]}>{player.arenaRank}</Text>
          <Text style={[styles.rankPts, { color: '#A855F7' }]}> · {player.arenaPoints} pts</Text>
        </View>
      </View>

      {/* Team Preview */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Battle Team</Text>
        <TouchableOpacity onPress={() => router.push('/collection' as any)}>
          <Text style={[styles.editTeam, { color: colors.primary }]}>Edit Team</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.teamCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.teamRow}>
          {teamRoosters.slice(0, 3).map((rooster, i) => (
            <View key={rooster.id} style={styles.teamSlot}>
              <View style={[styles.teamAvatarBorder, { borderColor: RARITY_COLORS[rooster.rarity] }]}>
                <Image
                  source={ROOSTER_IMAGES[rooster.image || 'rooster_fire']}
                  style={styles.teamAvatar}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.teamName, { color: colors.foreground }]} numberOfLines={1}>{rooster.name}</Text>
              <ElementIcon element={rooster.element} size={18} />
              <Text style={[styles.teamLevel, { color: colors.mutedForeground }]}>Lv {rooster.level}</Text>
            </View>
          ))}
          {Array.from({ length: Math.max(0, 3 - teamRoosters.length) }).map((_, i) => (
            <TouchableOpacity
              key={`empty-${i}`}
              onPress={() => router.push('/collection' as any)}
              style={[styles.teamSlotEmpty, { borderColor: colors.border }]}
            >
              <Feather name="plus" size={24} color={colors.mutedForeground} />
              <Text style={[styles.teamName, { color: colors.mutedForeground }]}>Add</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.teamStats}>
          <View style={styles.teamStat}>
            <Text style={[styles.teamStatVal, { color: colors.foreground }]}>{player.wins}</Text>
            <Text style={[styles.teamStatLabel, { color: colors.mutedForeground }]}>Wins</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.teamStat}>
            <Text style={[styles.teamStatVal, { color: colors.foreground }]}>{player.losses}</Text>
            <Text style={[styles.teamStatLabel, { color: colors.mutedForeground }]}>Losses</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.teamStat}>
            <Text style={[styles.teamStatVal, { color: colors.accent }]}>
              {player.wins + player.losses > 0 ? Math.round((player.wins / (player.wins + player.losses)) * 100) : 0}%
            </Text>
            <Text style={[styles.teamStatLabel, { color: colors.mutedForeground }]}>Win Rate</Text>
          </View>
        </View>
      </View>

      {/* Arena Rank Progress */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Arena Rank</Text>
      </View>
      <View style={[styles.rankCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.rankRow}>
          {ARENA_RANKS.map((rank, i) => (
            <View key={rank} style={styles.rankStep}>
              <View style={[styles.rankDot, {
                backgroundColor: i <= rankIdx ? '#A855F7' : colors.secondary,
                width: i === rankIdx ? 16 : 10,
                height: i === rankIdx ? 16 : 10,
                borderRadius: 8,
              }]} />
              {i === rankIdx && (
                <Text style={[styles.rankLabel, { color: '#A855F7' }]}>{rank}</Text>
              )}
            </View>
          ))}
        </View>
        <View style={[styles.rankTrack, { backgroundColor: colors.secondary }]}>
          <View style={[styles.rankFill, {
            width: `${((rankIdx + 1) / ARENA_RANKS.length) * 100}%` as any,
            backgroundColor: '#A855F7'
          }]} />
        </View>
      </View>

      {/* Battle Modes */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Choose Mode</Text>
      </View>
      <View style={{ paddingHorizontal: 16, gap: 10 }}>
        {BATTLE_MODES.map((mode) => (
          <TouchableOpacity
            key={mode.id}
            onPress={() => router.push('/battle/arena' as any)}
            style={[styles.modeCard, {
              backgroundColor: colors.card,
              borderColor: activeMode === mode.id ? mode.color : colors.border,
            }]}
            activeOpacity={0.8}
          >
            <View style={[styles.modeIconBg, { backgroundColor: mode.color + '22' }]}>
              <Feather name={mode.icon as any} size={24} color={mode.color} />
            </View>
            <View style={styles.modeInfo}>
              <View style={styles.modeTitleRow}>
                <Text style={[styles.modeTitle, { color: colors.foreground }]}>{mode.title}</Text>
                <View style={[styles.modeBadge, { backgroundColor: mode.color + '22', borderColor: mode.color }]}>
                  <Text style={[styles.modeBadgeText, { color: mode.color }]}>{mode.badge}</Text>
                </View>
              </View>
              <Text style={[styles.modeSubtitle, { color: colors.mutedForeground }]}>{mode.subtitle}</Text>
              <Text style={[styles.modeDesc, { color: colors.mutedForeground }]}>{mode.description}</Text>
              {'progress' in mode && (
                <View style={styles.modeProgress}>
                  <View style={[styles.modeTrack, { backgroundColor: colors.secondary }]}>
                    <View style={[styles.modeFill, {
                      width: `${((mode.progress || 0) / (mode.total || 1)) * 100}%` as any,
                      backgroundColor: mode.color,
                    }]} />
                  </View>
                  <Text style={[styles.modeProgressText, { color: colors.mutedForeground }]}>
                    {mode.progress}/{mode.total}
                  </Text>
                </View>
              )}
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
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
  rankBadge: {
    flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  rankText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  rankPts: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, marginTop: 20, marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  editTeam: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  teamCard: {
    marginHorizontal: 16, borderRadius: 14, borderWidth: 1, overflow: 'hidden',
  },
  teamRow: { flexDirection: 'row', padding: 16, gap: 8 },
  teamSlot: { flex: 1, alignItems: 'center', gap: 4 },
  teamAvatarBorder: {
    width: 68, height: 68, borderRadius: 34, borderWidth: 2,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  teamAvatar: { width: 68, height: 68 },
  teamSlotEmpty: {
    flex: 1, height: 68, borderRadius: 34, borderWidth: 2,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  teamName: { fontSize: 10, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  teamLevel: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  teamStats: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#2E2050' },
  teamStat: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  teamStatVal: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  teamStatLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: 2 },
  divider: { width: 1 },
  rankCard: {
    marginHorizontal: 16, borderRadius: 14, borderWidth: 1, padding: 16,
  },
  rankRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  rankStep: { alignItems: 'center', gap: 2 },
  rankDot: {},
  rankLabel: { fontSize: 9, fontFamily: 'Inter_700Bold' },
  rankTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  rankFill: { height: '100%', borderRadius: 3 },
  modeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 14, borderWidth: 1, padding: 14,
  },
  modeIconBg: {
    width: 50, height: 50, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  modeInfo: { flex: 1, gap: 3 },
  modeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modeTitle: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  modeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  modeBadgeText: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  modeSubtitle: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  modeDesc: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  modeProgress: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  modeTrack: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  modeFill: { height: '100%', borderRadius: 2 },
  modeProgressText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
});
