import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { RARITY_COLORS, ELEMENT_EMOJIS, ELEMENT_COLORS } from '@/constants/gameData';
import { RarityBadge } from '@/components/RarityBadge';
import { StatBar } from '@/components/StatBar';
import { ElementIcon } from '@/components/ElementIcon';

const ROOSTER_IMAGES: Record<string, any> = {
  rooster_fire: require('@/assets/images/rooster_fire.png'),
  rooster_ice: require('@/assets/images/rooster_ice.png'),
  rooster_shadow: require('@/assets/images/rooster_shadow.png'),
};

const EVOLUTION_STAGES = ['Egg', 'Chick', 'Fighter', 'Elite', 'Legend', 'Mythic', 'Divine'];

const SKILL_COLORS: Record<string, string> = {
  Fire: '#FF6B35', Water: '#3B82F6', Nature: '#22C55E',
  Lightning: '#EAB308', Ice: '#67E8F9', Shadow: '#A855F7',
  Light: '#FDE047', Metal: '#9CA3AF',
};

export default function RoosterDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const { roosters, setSelectedTeam, selectedTeam } = useGame();

  const rooster = roosters.find(r => r.id === id);
  if (!rooster) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.foreground }]}>Rooster not found</Text>
      </View>
    );
  }

  const rarityColor = RARITY_COLORS[rooster.rarity];
  const evoIdx = EVOLUTION_STAGES.indexOf(rooster.evolutionStage);
  const isInTeam = selectedTeam.includes(rooster.id);

  function toggleTeam() {
    if (isInTeam) {
      setSelectedTeam(selectedTeam.filter(i => i !== rooster!.id));
    } else if (selectedTeam.length < 3) {
      setSelectedTeam([...selectedTeam, rooster!.id]);
    }
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Banner */}
      <View style={[styles.heroBanner, { backgroundColor: rarityColor + '18', borderBottomColor: rarityColor + '44' }]}>
        <Image
          source={ROOSTER_IMAGES[rooster.image || 'rooster_fire']}
          style={styles.heroImage}
          resizeMode="contain"
        />
        <View style={[styles.heroGlow, { shadowColor: rarityColor }]} />
      </View>

      {/* Identity */}
      <View style={[styles.identityCard, { backgroundColor: colors.card, borderColor: rarityColor }]}>
        <View style={styles.identityTop}>
          <View style={styles.identityLeft}>
            <RarityBadge rarity={rooster.rarity} />
            <Text style={[styles.roosterName, { color: colors.foreground }]}>{rooster.name}</Text>
            <Text style={[styles.roosterMeta, { color: colors.mutedForeground }]}>
              {rooster.class} · Level {rooster.level}
            </Text>
          </View>
          <ElementIcon element={rooster.element} size={44} showLabel />
        </View>

        {/* Evolution Progress */}
        <View style={styles.evoSection}>
          <Text style={[styles.evoTitle, { color: colors.mutedForeground }]}>EVOLUTION</Text>
          <View style={styles.evoRow}>
            {EVOLUTION_STAGES.map((stage, i) => (
              <View key={stage} style={styles.evoStep}>
                <View style={[styles.evoDot, {
                  backgroundColor: i <= evoIdx ? rarityColor : colors.secondary,
                  width: i === evoIdx ? 18 : 10,
                  height: i === evoIdx ? 18 : 10,
                  borderRadius: 9,
                }]} />
                {i === evoIdx && (
                  <Text style={[styles.evoLabel, { color: rarityColor }]}>{stage}</Text>
                )}
              </View>
            ))}
          </View>
          <View style={[styles.evoTrack, { backgroundColor: colors.secondary }]}>
            <View style={[styles.evoFill, {
              width: `${((evoIdx + 1) / EVOLUTION_STAGES.length) * 100}%` as any,
              backgroundColor: rarityColor,
            }]} />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={toggleTeam}
            style={[styles.actionBtn, {
              backgroundColor: isInTeam ? colors.primary : colors.secondary,
              borderColor: isInTeam ? colors.primary : colors.border,
            }]}
          >
            <Feather name={isInTeam ? 'check' : 'plus'} size={16} color={isInTeam ? '#fff' : colors.foreground} />
            <Text style={[styles.actionBtnText, { color: isInTeam ? '#fff' : colors.foreground }]}>
              {isInTeam ? 'In Team' : 'Add to Team'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/battle/arena' as any)}
            style={[styles.actionBtn, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}
          >
            <Feather name="zap" size={16} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>Battle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/breed' as any)}
            style={[styles.actionBtn, { backgroundColor: '#22C55E22', borderColor: '#22C55E' }]}
          >
            <Feather name="git-merge" size={16} color="#22C55E" />
            <Text style={[styles.actionBtnText, { color: '#22C55E' }]}>Breed</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Base Stats</Text>
        <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>Total: {Object.values(rooster.stats).reduce((a, b) => a + b, 0)}</Text>
      </View>
      <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <StatBar label="HP" value={rooster.stats.hp} max={6000} color="#22C55E" />
        <StatBar label="Attack" value={rooster.stats.attack} max={500} color="#FF6B35" />
        <StatBar label="Defense" value={rooster.stats.defense} max={500} color="#3B82F6" />
        <StatBar label="Speed" value={rooster.stats.speed} max={500} color="#EAB308" />
        <StatBar label="Critical" value={rooster.stats.critical} max={100} color="#FF4444" />
        <StatBar label="Accuracy" value={rooster.stats.accuracy} max={100} color="#A855F7" />
        <StatBar label="Dodge" value={rooster.stats.dodge} max={100} color="#14B8A6" />
        <StatBar label="Luck" value={rooster.stats.luck} max={100} color="#FFD700" />
      </View>

      {/* Skills */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Skills</Text>
      </View>
      <View style={{ paddingHorizontal: 16, gap: 8 }}>
        {rooster.skills.map((skill) => {
          const skillColor = SKILL_COLORS[skill.element];
          return (
            <View key={skill.id} style={[styles.skillCard, { backgroundColor: colors.card, borderColor: skillColor + '44' }]}>
              <View style={[styles.skillIcon, { backgroundColor: skillColor + '22' }]}>
                <Text style={{ fontSize: 18 }}>{ELEMENT_EMOJIS[skill.element]}</Text>
              </View>
              <View style={styles.skillInfo}>
                <View style={styles.skillTitleRow}>
                  <Text style={[styles.skillName, { color: colors.foreground }]}>{skill.name}</Text>
                  {skill.effect && (
                    <View style={[styles.effectBadge, { backgroundColor: skillColor + '22', borderColor: skillColor }]}>
                      <Text style={[styles.effectText, { color: skillColor }]}>{skill.effect}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.skillDesc, { color: colors.mutedForeground }]}>{skill.description}</Text>
              </View>
              <View style={styles.skillCost}>
                <Text style={[styles.skillDmg, { color: skill.damage > 0 ? '#FF6B35' : '#22C55E' }]}>
                  {skill.damage > 0 ? `${skill.damage}%` : 'Heal'}
                </Text>
                <View style={[styles.energyCost, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.energyText, { color: colors.accent }]}>⚡{skill.energyCost}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Body Parts */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Body Parts</Text>
      </View>
      <View style={[styles.bodyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {Object.entries(rooster.bodyParts).map(([part, value], i) => (
          <View
            key={part}
            style={[styles.bodyRow, i < Object.entries(rooster.bodyParts).length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
          >
            <Text style={[styles.bodyPart, { color: colors.mutedForeground }]}>{part.charAt(0).toUpperCase() + part.slice(1)}</Text>
            <Text style={[styles.bodyValue, { color: colors.foreground }]}>{value}</Text>
          </View>
        ))}
      </View>

      {/* Genes */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Genetics</Text>
        <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>D · R · H</Text>
      </View>
      <View style={[styles.genesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {(['A', 'B', 'C'] as const).map((g) => {
          const gene = rooster.genes[g];
          return (
            <View key={g} style={[styles.geneRow, g !== 'C' && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={[styles.geneLetter, { backgroundColor: rarityColor + '22' }]}>
                <Text style={[styles.geneLetterText, { color: rarityColor }]}>{g}</Text>
              </View>
              <View style={[styles.genePill, { backgroundColor: rarityColor + '22', borderColor: rarityColor }]}>
                <Text style={[styles.genePillText, { color: rarityColor }]}>{gene.dominant}</Text>
              </View>
              <View style={[styles.genePill, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.genePillText, { color: colors.mutedForeground }]}>{gene.recessive}</Text>
              </View>
              <View style={[styles.genePill, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.genePillText, { color: colors.border }]}>Hidden</Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 16, fontFamily: 'Inter_500Medium' },
  heroBanner: {
    height: 240, alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 2, overflow: 'hidden',
  },
  heroImage: { width: 200, height: 220, zIndex: 1 },
  heroGlow: {
    position: 'absolute', width: 200, height: 200,
    borderRadius: 100, shadowRadius: 60, shadowOpacity: 0.8,
    shadowOffset: { width: 0, height: 0 },
  },
  identityCard: { margin: 16, borderRadius: 16, borderWidth: 2, padding: 16, gap: 14 },
  identityTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  identityLeft: { gap: 6 },
  roosterName: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  roosterMeta: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  evoSection: { gap: 8 },
  evoTitle: { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.5 },
  evoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  evoStep: { alignItems: 'center', gap: 2 },
  evoDot: {},
  evoLabel: { fontSize: 8, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  evoTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  evoFill: { height: '100%', borderRadius: 2 },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 10, borderWidth: 1, gap: 5,
  },
  actionBtnText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, marginTop: 20, marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  sectionSub: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  statsCard: { marginHorizontal: 16, borderRadius: 12, borderWidth: 1, padding: 14 },
  skillCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, borderWidth: 1, padding: 12,
  },
  skillIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  skillInfo: { flex: 1, gap: 3 },
  skillTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  skillName: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  effectBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  effectText: { fontSize: 9, fontFamily: 'Inter_600SemiBold' },
  skillDesc: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  skillCost: { alignItems: 'center', gap: 4 },
  skillDmg: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  energyCost: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  energyText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  bodyCard: { marginHorizontal: 16, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  bodyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 11 },
  bodyPart: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  bodyValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  genesCard: { marginHorizontal: 16, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  geneRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
  geneLetter: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  geneLetterText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  genePill: { flex: 1, paddingVertical: 5, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  genePillText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
});
