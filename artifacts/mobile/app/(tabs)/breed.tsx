import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Modal, FlatList, Platform, Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { RARITY_COLORS, ELEMENT_EMOJIS } from '@/constants/gameData';
import { RarityBadge } from '@/components/RarityBadge';
import { ElementIcon } from '@/components/ElementIcon';
import { Rooster, Egg } from '@/constants/types';

const ROOSTER_IMAGES: Record<string, any> = {
  rooster_fire: require('@/assets/images/rooster_fire.png'),
  rooster_ice: require('@/assets/images/rooster_ice.png'),
  rooster_shadow: require('@/assets/images/rooster_shadow.png'),
};

const BREEDING_COST = { gold: 5000, crystal: 2 };
const HATCH_DURATION_MS = 24 * 60 * 60 * 1000;

function RoosterPicker({
  visible,
  onClose,
  onSelect,
  excludeId,
  roosters,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (r: Rooster) => void;
  excludeId?: string;
  roosters: Rooster[];
}) {
  const colors = useColors();
  const available = roosters.filter(r => r.id !== excludeId);
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.pickerTitle, { color: colors.foreground }]}>Choose Parent</Text>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={available}
          numColumns={2}
          contentContainerStyle={{ padding: 12, gap: 10 }}
          columnWrapperStyle={{ gap: 10 }}
          keyExtractor={r => r.id}
          renderItem={({ item }) => {
            const rarityColor = RARITY_COLORS[item.rarity];
            return (
              <TouchableOpacity
                onPress={() => { onSelect(item); onClose(); }}
                style={[styles.pickerCard, { backgroundColor: colors.card, borderColor: rarityColor }]}
                activeOpacity={0.8}
              >
                <Image source={ROOSTER_IMAGES[item.image || 'rooster_fire']} style={styles.pickerImage} resizeMode="contain" />
                <RarityBadge rarity={item.rarity} size="sm" />
                <Text style={[styles.pickerName, { color: colors.foreground }]} numberOfLines={1}>{item.name}</Text>
                <ElementIcon element={item.element} size={20} />
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
  );
}

function GeneRow({ label, gene, color }: { label: string; gene: { dominant: string; recessive: string; hidden: string }; color: string }) {
  const colors = useColors();
  return (
    <View style={styles.geneRow}>
      <Text style={[styles.geneLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[styles.geneDom, { backgroundColor: color + '33', borderColor: color }]}>
        <Text style={[styles.geneText, { color }]}>{gene.dominant}</Text>
      </View>
      <View style={[styles.geneRec, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.geneText, { color: colors.mutedForeground }]}>{gene.recessive}</Text>
      </View>
      <View style={[styles.geneHid, { backgroundColor: colors.secondary }]}>
        <Text style={[styles.geneText, { color: colors.border }]}>???</Text>
      </View>
    </View>
  );
}

export default function BreedScreen() {
  const colors = useColors();
  const { roosters, eggs, player, addEgg, updatePlayer } = useGame();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const [parentA, setParentA] = useState<Rooster | null>(roosters[0] || null);
  const [parentB, setParentB] = useState<Rooster | null>(roosters[1] || null);
  const [pickerOpen, setPickerOpen] = useState<'A' | 'B' | null>(null);
  const [breeding, setBreeding] = useState(false);

  function predictRarity(): string {
    if (!parentA || !parentB) return '—';
    const rarities = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Divine'];
    const avgIdx = Math.round((rarities.indexOf(parentA.rarity) + rarities.indexOf(parentB.rarity)) / 2);
    const mutate = Math.random() < 0.2;
    const finalIdx = mutate ? Math.min(avgIdx + 1, rarities.length - 1) : avgIdx;
    return rarities[finalIdx];
  }

  async function handleBreed() {
    if (!parentA || !parentB) return;
    if (player.gold < BREEDING_COST.gold || player.crystal < BREEDING_COST.crystal) {
      Alert.alert('Insufficient Resources', 'You need 5000 Gold and 2 Crystal to breed.');
      return;
    }
    setBreeding(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const egg: Egg = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      parentA: parentA.id,
      parentB: parentB.id,
      hatchTime: Date.now() + HATCH_DURATION_MS,
      startTime: Date.now(),
      rarity: predictRarity() as any,
    };
    addEgg(egg);
    updatePlayer({ gold: player.gold - BREEDING_COST.gold, crystal: player.crystal - BREEDING_COST.crystal });
    setTimeout(() => setBreeding(false), 800);
  }

  const canBreed = !!parentA && !!parentB && parentA.id !== parentB.id;
  const rarityColor = parentA ? RARITY_COLORS[parentA.rarity] : colors.border;

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Breeding Lab</Text>
          <View style={styles.headerCosts}>
            <Text style={[styles.costText, { color: colors.accent }]}>🪙 {BREEDING_COST.gold.toLocaleString()}</Text>
            <Text style={[styles.costText, { color: '#67E8F9' }]}>💠 {BREEDING_COST.crystal}</Text>
          </View>
        </View>

        {/* Parent Selectors */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Select Parents</Text>
        </View>
        <View style={styles.parentsRow}>
          {(['A', 'B'] as const).map((side) => {
            const parent = side === 'A' ? parentA : parentB;
            const rarCol = parent ? RARITY_COLORS[parent.rarity] : colors.border;
            return (
              <TouchableOpacity
                key={side}
                onPress={() => setPickerOpen(side)}
                style={[styles.parentSlot, { backgroundColor: colors.card, borderColor: rarCol }]}
                activeOpacity={0.8}
              >
                {parent ? (
                  <>
                    <View style={[styles.slotGlow, { backgroundColor: rarCol + '18' }]} />
                    <Image source={ROOSTER_IMAGES[parent.image || 'rooster_fire']} style={styles.parentImage} resizeMode="contain" />
                    <RarityBadge rarity={parent.rarity} size="sm" />
                    <Text style={[styles.parentName, { color: colors.foreground }]} numberOfLines={1}>{parent.name}</Text>
                    <ElementIcon element={parent.element} size={22} />
                    <Text style={[styles.parentLevel, { color: colors.mutedForeground }]}>Lv {parent.level} · {parent.class}</Text>
                    <Text style={[styles.parentBreeds, { color: colors.mutedForeground }]}>Bred {parent.breedCount}x</Text>
                  </>
                ) : (
                  <>
                    <Feather name="plus-circle" size={40} color={colors.mutedForeground} />
                    <Text style={[styles.parentEmpty, { color: colors.mutedForeground }]}>Select Parent {side}</Text>
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Genetics Preview */}
        {parentA && parentB && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Gene Preview</Text>
              <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>40% Father · 40% Mother · 20% Mutation</Text>
            </View>
            <View style={[styles.genesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.geneHeader}>
                <Text style={[styles.geneHeaderText, { color: colors.mutedForeground }]}>GENE</Text>
                <Text style={[styles.geneHeaderText, { color: colors.primary }]}>DOMINANT</Text>
                <Text style={[styles.geneHeaderText, { color: colors.mutedForeground }]}>RECESSIVE</Text>
                <Text style={[styles.geneHeaderText, { color: colors.border }]}>HIDDEN</Text>
              </View>
              <GeneRow label="A" gene={parentA.genes.A} color={colors.accent} />
              <GeneRow label="B" gene={parentA.genes.B} color={colors.primary} />
              <GeneRow label="C" gene={parentB.genes.C} color={'#A855F7'} />
            </View>

            {/* Expected Outcome */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Expected Outcome</Text>
            </View>
            <View style={[styles.outcomeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {[
                { label: 'Rarity', value: 'Epic (approx)', color: '#A855F7' },
                { label: 'Element', value: `${ELEMENT_EMOJIS[parentA.element]} ${parentA.element} or ${ELEMENT_EMOJIS[parentB.element]} ${parentB.element}`, color: colors.foreground },
                { label: 'Class', value: `${parentA.class} or ${parentB.class}`, color: colors.foreground },
                { label: 'Hatch Time', value: '24 hours', color: colors.foreground },
                { label: 'Mutation Chance', value: '20%', color: '#FFD700' },
              ].map((row) => (
                <View key={row.label} style={styles.outcomeRow}>
                  <Text style={[styles.outcomeLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                  <Text style={[styles.outcomeValue, { color: row.color }]}>{row.value}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Breed Button */}
        <TouchableOpacity
          onPress={handleBreed}
          disabled={!canBreed || breeding}
          style={[styles.breedBtn, {
            backgroundColor: canBreed ? colors.primary : colors.secondary,
            opacity: breeding ? 0.7 : 1,
          }]}
          activeOpacity={0.8}
        >
          <Feather name={breeding ? 'loader' : 'git-merge'} size={20} color="#fff" />
          <Text style={styles.breedBtnText}>{breeding ? 'Breeding...' : 'Start Breeding'}</Text>
        </TouchableOpacity>

        {/* Egg Inventory */}
        {eggs.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Egg Inventory</Text>
              <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>{eggs.length} eggs</Text>
            </View>
            <View style={{ paddingHorizontal: 16, gap: 10 }}>
              {eggs.map((egg) => {
                const elapsed = Date.now() - egg.startTime;
                const pct = Math.min(elapsed / HATCH_DURATION_MS, 1);
                const remaining = Math.max(0, egg.hatchTime - Date.now());
                const hrs = Math.floor(remaining / 3600000);
                const mins = Math.floor((remaining % 3600000) / 60000);
                const rarityCol = RARITY_COLORS[egg.rarity];
                return (
                  <View key={egg.id} style={[styles.eggCard, { backgroundColor: colors.card, borderColor: rarityCol }]}>
                    <Text style={{ fontSize: 36 }}>🥚</Text>
                    <View style={styles.eggInfo}>
                      <RarityBadge rarity={egg.rarity} size="sm" />
                      <Text style={[styles.eggTime, { color: colors.foreground }]}>
                        {pct >= 1 ? 'Ready to hatch!' : `${hrs}h ${mins}m remaining`}
                      </Text>
                      <View style={[styles.eggTrack, { backgroundColor: colors.secondary }]}>
                        <View style={[styles.eggFill, { width: `${pct * 100}%` as any, backgroundColor: rarityCol }]} />
                      </View>
                    </View>
                    {pct >= 1 && (
                      <TouchableOpacity style={[styles.hatchBtn, { backgroundColor: rarityCol }]}>
                        <Text style={styles.hatchBtnText}>Hatch</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <RoosterPicker
        visible={pickerOpen !== null}
        onClose={() => setPickerOpen(null)}
        onSelect={(r) => {
          if (pickerOpen === 'A') setParentA(r);
          else setParentB(r);
        }}
        excludeId={pickerOpen === 'A' ? parentB?.id : parentA?.id}
        roosters={roosters}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  headerCosts: { flexDirection: 'row', gap: 12 },
  costText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, marginTop: 20, marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  sectionSub: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  parentsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  parentSlot: {
    flex: 1, minHeight: 200, borderRadius: 16, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    padding: 12, gap: 6, overflow: 'hidden',
  },
  slotGlow: { ...StyleSheet.absoluteFillObject },
  parentImage: { width: 90, height: 100 },
  parentName: { fontSize: 13, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  parentLevel: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  parentBreeds: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  parentEmpty: { fontSize: 13, fontFamily: 'Inter_500Medium', marginTop: 8 },
  genesCard: { marginHorizontal: 16, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  geneHeader: {
    flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: '#ffffff08',
  },
  geneHeaderText: { flex: 1, fontSize: 9, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, textAlign: 'center' },
  geneRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 6 },
  geneLabel: { flex: 1, fontSize: 12, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  geneDom: { flex: 1, paddingVertical: 4, borderRadius: 6, borderWidth: 1, alignItems: 'center' },
  geneRec: { flex: 1, paddingVertical: 4, borderRadius: 6, alignItems: 'center' },
  geneHid: { flex: 1, paddingVertical: 4, borderRadius: 6, alignItems: 'center' },
  geneText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  outcomeCard: { marginHorizontal: 16, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  outcomeRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2E2050',
  },
  outcomeLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  outcomeValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  breedBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 16, marginTop: 20, paddingVertical: 16,
    borderRadius: 16, gap: 10,
  },
  breedBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  eggCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 14, borderWidth: 2, padding: 14,
  },
  eggInfo: { flex: 1, gap: 6 },
  eggTime: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  eggTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  eggFill: { height: '100%', borderRadius: 3 },
  hatchBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  hatchBtnText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' },
  pickerContainer: { flex: 1 },
  pickerHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
  },
  pickerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  pickerCard: {
    flex: 1, borderRadius: 14, borderWidth: 2, overflow: 'hidden',
    padding: 10, alignItems: 'center', gap: 6,
  },
  pickerImage: { width: '100%', height: 90 },
  pickerName: { fontSize: 12, fontFamily: 'Inter_700Bold', textAlign: 'center' },
});
