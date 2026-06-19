import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Animated, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { RARITY_COLORS, ELEMENT_EMOJIS, ELEMENT_COLORS } from '@/constants/gameData';
import { Rooster, Skill } from '@/constants/types';

const ROOSTER_IMAGES: Record<string, any> = {
  rooster_fire: require('@/assets/images/rooster_fire.png'),
  rooster_ice: require('@/assets/images/rooster_ice.png'),
  rooster_shadow: require('@/assets/images/rooster_shadow.png'),
};

const ENEMY_TEAM: Rooster[] = [
  {
    id: 'e001', name: 'Chaos Warlord', rarity: 'Legendary', class: 'Berserker', element: 'Shadow',
    level: 70, evolutionStage: 'Legend',
    stats: { hp: 3800, attack: 360, defense: 200, speed: 300, critical: 50, accuracy: 88, dodge: 30, energy: 10, luck: 30 },
    baseStats: { hp: 3000, attack: 280, defense: 160, speed: 240, critical: 38, accuracy: 80, dodge: 22, energy: 10, luck: 22 },
    skills: [
      { id: 'es1', name: 'Dark Slash', element: 'Shadow', damage: 100, energyCost: 2, description: 'Shadow blade attack' },
      { id: 'es2', name: 'Chaos Surge', element: 'Shadow', damage: 180, energyCost: 5, effect: 'Fear', description: 'Massive surge of chaos energy' },
    ],
    bodyParts: { head: 'Shadow Head', beak: 'Iron Beak', wings: 'Storm Wings', legs: 'Shadow Legs', tail: 'Phoenix Tail' },
    genes: { A: { dominant: 'Shadow', recessive: 'Fire', hidden: 'Lightning' }, B: { dominant: 'Berserker', recessive: 'Warrior', hidden: 'Assassin' }, C: { dominant: 'Legendary', recessive: 'Epic', hidden: 'Rare' } },
    image: 'rooster_shadow', acquiredAt: '', breedCount: 0,
  },
  {
    id: 'e002', name: 'Frost Tyrant', rarity: 'Epic', class: 'Guardian', element: 'Ice',
    level: 60, evolutionStage: 'Elite',
    stats: { hp: 5000, attack: 220, defense: 420, speed: 180, critical: 20, accuracy: 85, dodge: 12, energy: 10, luck: 20 },
    baseStats: { hp: 3800, attack: 170, defense: 330, speed: 140, critical: 14, accuracy: 78, dodge: 8, energy: 10, luck: 14 },
    skills: [
      { id: 'es3', name: 'Ice Peck', element: 'Ice', damage: 75, energyCost: 2, effect: 'Freeze', description: 'Freezing peck' },
      { id: 'es4', name: 'Glacier Wall', element: 'Ice', damage: 0, energyCost: 4, effect: 'Shield', description: 'Massive ice shield' },
    ],
    bodyParts: { head: 'Phoenix Head', beak: 'Iron Beak', wings: 'Angel Wings', legs: 'Titan Legs', tail: 'Ice Tail' },
    genes: { A: { dominant: 'Ice', recessive: 'Water', hidden: 'Metal' }, B: { dominant: 'Guardian', recessive: 'Warrior', hidden: 'Support' }, C: { dominant: 'Epic', recessive: 'Rare', hidden: 'Common' } },
    image: 'rooster_ice', acquiredAt: '', breedCount: 0,
  },
  {
    id: 'e003', name: 'Thunder Striker', rarity: 'Epic', class: 'Assassin', element: 'Lightning',
    level: 58, evolutionStage: 'Elite',
    stats: { hp: 2600, attack: 380, defense: 140, speed: 450, critical: 60, accuracy: 86, dodge: 42, energy: 10, luck: 38 },
    baseStats: { hp: 2000, attack: 290, defense: 100, speed: 360, critical: 48, accuracy: 79, dodge: 34, energy: 10, luck: 28 },
    skills: [
      { id: 'es5', name: 'Thunder Peck', element: 'Lightning', damage: 90, energyCost: 2, description: 'Shocking strike' },
      { id: 'es6', name: 'Chain Bolt', element: 'Lightning', damage: 120, energyCost: 4, effect: 'Shock', description: 'Chain lightning' },
    ],
    bodyParts: { head: 'Thunder Head', beak: 'Iron Beak', wings: 'Storm Wings', legs: 'Shadow Legs', tail: 'Phoenix Tail' },
    genes: { A: { dominant: 'Lightning', recessive: 'Fire', hidden: 'Shadow' }, B: { dominant: 'Assassin', recessive: 'Warrior', hidden: 'Berserker' }, C: { dominant: 'Epic', recessive: 'Rare', hidden: 'Common' } },
    image: 'rooster_fire', acquiredAt: '', breedCount: 0,
  },
];

interface BattleFighter {
  rooster: Rooster;
  currentHp: number;
  energy: number;
  status: string | null;
  isAlive: boolean;
}

function createFighter(r: Rooster): BattleFighter {
  return { rooster: r, currentHp: r.stats.hp, energy: 3, status: null, isAlive: true };
}

function HpBar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct = Math.max(0, current / max);
  const hpColor = pct > 0.5 ? '#22C55E' : pct > 0.25 ? '#EAB308' : '#FF4444';
  return (
    <View style={hpStyles.track}>
      <View style={[hpStyles.fill, { width: `${pct * 100}%` as any, backgroundColor: hpColor }]} />
    </View>
  );
}

const hpStyles = StyleSheet.create({
  track: { height: 8, backgroundColor: '#1A1530', borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});

export default function ArenaScreen() {
  const colors = useColors();
  const router = useRouter();
  const { roosters, selectedTeam, recordBattleResult } = useGame();

  const myRoosters = roosters.filter(r => selectedTeam.includes(r.id)).slice(0, 3);
  const [myFighters, setMyFighters] = useState<BattleFighter[]>(() => myRoosters.map(createFighter));
  const [enemyFighters, setEnemyFighters] = useState<BattleFighter[]>(() => ENEMY_TEAM.map(createFighter));
  const [activeMyIdx, setActiveMyIdx] = useState(0);
  const [activeEnemyIdx, setActiveEnemyIdx] = useState(0);
  const [turn, setTurn] = useState(1);
  const [log, setLog] = useState<string[]>(['Battle begins! Choose your attack!']);
  const [phase, setPhase] = useState<'select' | 'resolve' | 'end'>('select');
  const [winner, setWinner] = useState<'player' | 'enemy' | null>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const myFighter = myFighters[activeMyIdx];
  const enemyFighter = enemyFighters[activeEnemyIdx];

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  function calcDamage(attacker: BattleFighter, skill: Skill, defender: BattleFighter): number {
    const base = (attacker.rooster.stats.attack * (skill.damage / 100));
    const critRoll = Math.random() * 100 < attacker.rooster.stats.critical;
    const critMult = critRoll ? 1.5 : 1;
    const def = defender.rooster.stats.defense * 0.4;
    const raw = Math.max(10, Math.round(base * critMult - def));
    const variance = 0.85 + Math.random() * 0.3;
    return Math.round(raw * variance);
  }

  function advanceActiveEnemy(fighters: BattleFighter[], current: number): number {
    let next = current;
    for (let i = 1; i <= fighters.length; i++) {
      const idx = (current + i) % fighters.length;
      if (fighters[idx].isAlive) { next = idx; break; }
    }
    return next;
  }

  async function useSkill(skill: Skill) {
    if (phase !== 'select') return;
    if (myFighter.energy < skill.energyCost) {
      Alert.alert('Not enough energy!', `Need ${skill.energyCost} energy`);
      return;
    }
    setPhase('resolve');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const newLog: string[] = [];
    const newMyFighters = [...myFighters];
    const newEnemyFighters = [...enemyFighters];
    let newActiveMyIdx = activeMyIdx;
    let newActiveEnemyIdx = activeEnemyIdx;

    if (skill.damage > 0) {
      const dmg = calcDamage(myFighter, skill, enemyFighters[activeEnemyIdx]);
      newEnemyFighters[activeEnemyIdx] = {
        ...newEnemyFighters[activeEnemyIdx],
        currentHp: Math.max(0, newEnemyFighters[activeEnemyIdx].currentHp - dmg),
      };
      if (newEnemyFighters[activeEnemyIdx].currentHp <= 0) {
        newEnemyFighters[activeEnemyIdx].isAlive = false;
        newLog.push(`${enemyFighters[activeEnemyIdx].rooster.name} was defeated!`);
        shake();
        newActiveEnemyIdx = advanceActiveEnemy(newEnemyFighters, activeEnemyIdx);
      }
      newLog.push(`Your ${myFighter.rooster.name} used ${skill.name} for ${dmg} damage!${skill.effect ? ` [${skill.effect}]` : ''}`);
    } else {
      const healAmt = Math.round(myFighter.rooster.stats.hp * 0.2);
      newMyFighters[activeMyIdx] = {
        ...newMyFighters[activeMyIdx],
        currentHp: Math.min(myFighter.rooster.stats.hp, myFighter.currentHp + healAmt),
      };
      newLog.push(`${myFighter.rooster.name} used ${skill.name} and restored ${healAmt} HP!`);
    }

    newMyFighters[activeMyIdx] = {
      ...newMyFighters[activeMyIdx],
      energy: Math.max(0, newMyFighters[activeMyIdx].energy - skill.energyCost),
    };

    const allEnemyDead = newEnemyFighters.every(f => !f.isAlive);
    if (allEnemyDead) {
      setMyFighters(newMyFighters);
      setEnemyFighters(newEnemyFighters);
      setLog(prev => [...newLog, 'You WIN! 🏆']);
      setWinner('player');
      setPhase('end');
      recordBattleResult(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }

    const aliveEnemy = newEnemyFighters[newActiveEnemyIdx];
    if (aliveEnemy && aliveEnemy.isAlive && aliveEnemy.rooster.skills.length > 0) {
      const enemySkill = aliveEnemy.rooster.skills[Math.floor(Math.random() * aliveEnemy.rooster.skills.length)];
      if (enemySkill.damage > 0) {
        const eDmg = calcDamage(aliveEnemy, enemySkill, newMyFighters[activeMyIdx]);
        newMyFighters[activeMyIdx] = {
          ...newMyFighters[activeMyIdx],
          currentHp: Math.max(0, newMyFighters[activeMyIdx].currentHp - eDmg),
        };
        if (newMyFighters[activeMyIdx].currentHp <= 0) {
          newMyFighters[activeMyIdx].isAlive = false;
          newLog.push(`${myFighter.rooster.name} was defeated!`);
          shake();
          newActiveMyIdx = advanceActiveEnemy(newMyFighters, activeMyIdx);
        }
        newLog.push(`Enemy ${aliveEnemy.rooster.name} used ${enemySkill.name} for ${eDmg} damage!`);
      }
    }

    const allMyDead = newMyFighters.every(f => !f.isAlive);
    if (allMyDead) {
      setMyFighters(newMyFighters);
      setEnemyFighters(newEnemyFighters);
      setLog(prev => [...newLog, 'You LOSE... Try again!']);
      setWinner('enemy');
      setPhase('end');
      recordBattleResult(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    newMyFighters[activeMyIdx] = {
      ...newMyFighters[activeMyIdx],
      energy: Math.min(10, newMyFighters[activeMyIdx].energy + 2),
    };

    setMyFighters(newMyFighters);
    setEnemyFighters(newEnemyFighters);
    setActiveMyIdx(newActiveMyIdx);
    setActiveEnemyIdx(newActiveEnemyIdx);
    setTurn(t => t + 1);
    setLog(prev => [...newLog.reverse(), ...prev]);
    setPhase('select');
  }

  const myColor = RARITY_COLORS[myFighter?.rooster.rarity] || colors.primary;
  const enemyColor = RARITY_COLORS[enemyFighter?.rooster.rarity] || '#FF4444';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Enemy Side */}
      <View style={styles.side}>
        {enemyFighters.map((f, i) => (
          <View key={f.rooster.id} style={styles.teamRow}>
            <Animated.View style={[
              styles.fighterCard,
              {
                backgroundColor: i === activeEnemyIdx ? colors.card : colors.background,
                borderColor: i === activeEnemyIdx ? RARITY_COLORS[f.rooster.rarity] : colors.border,
                opacity: f.isAlive ? 1 : 0.35,
              },
              i === activeEnemyIdx && { transform: [{ translateX: shakeAnim }] }
            ]}>
              <Image
                source={ROOSTER_IMAGES[f.rooster.image || 'rooster_fire']}
                style={styles.fighterImg}
                resizeMode="contain"
              />
              <View style={styles.fighterInfo}>
                <Text style={[styles.fighterName, { color: colors.foreground }]} numberOfLines={1}>{f.rooster.name}</Text>
                <HpBar current={f.currentHp} max={f.rooster.stats.hp} color="#FF4444" />
                <Text style={[styles.hpText, { color: colors.mutedForeground }]}>{f.currentHp}/{f.rooster.stats.hp}</Text>
              </View>
              {!f.isAlive && (
                <View style={[styles.defeatedBadge, { backgroundColor: '#FF444488' }]}>
                  <Text style={styles.defeatedText}>KO</Text>
                </View>
              )}
            </Animated.View>
          </View>
        ))}
      </View>

      {/* VS Divider */}
      <View style={[styles.vsDivider, { borderColor: colors.border }]}>
        <Text style={[styles.vsText, { color: colors.mutedForeground }]}>TURN {turn}</Text>
      </View>

      {/* My Side */}
      <View style={styles.side}>
        {myFighters.map((f, i) => (
          <View key={f.rooster.id} style={styles.teamRow}>
            <View style={[
              styles.fighterCard,
              {
                backgroundColor: i === activeMyIdx ? colors.card : colors.background,
                borderColor: i === activeMyIdx ? RARITY_COLORS[f.rooster.rarity] : colors.border,
                opacity: f.isAlive ? 1 : 0.35,
              }
            ]}>
              <Image
                source={ROOSTER_IMAGES[f.rooster.image || 'rooster_fire']}
                style={styles.fighterImg}
                resizeMode="contain"
              />
              <View style={styles.fighterInfo}>
                <View style={styles.fighterNameRow}>
                  <Text style={[styles.fighterName, { color: colors.foreground }]} numberOfLines={1}>{f.rooster.name}</Text>
                  <Text style={[styles.energyLabel, { color: colors.accent }]}>⚡{f.energy}/10</Text>
                </View>
                <HpBar current={f.currentHp} max={f.rooster.stats.hp} color="#22C55E" />
                <Text style={[styles.hpText, { color: colors.mutedForeground }]}>{f.currentHp}/{f.rooster.stats.hp}</Text>
              </View>
              {!f.isAlive && (
                <View style={[styles.defeatedBadge, { backgroundColor: '#FF444488' }]}>
                  <Text style={styles.defeatedText}>KO</Text>
                </View>
              )}
            </View>

            {i === activeMyIdx && phase === 'select' && (
              <TouchableOpacity
                onPress={() => {
                  const nextIdx = (i + 1) % myFighters.filter(f => f.isAlive).length;
                  setActiveMyIdx(nextIdx);
                }}
                style={styles.switchBtn}
              >
                <Feather name="refresh-cw" size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Battle Log */}
      <View style={[styles.logCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.logText, { color: colors.mutedForeground }]} numberOfLines={2}>
          {log[0]}
        </Text>
      </View>

      {/* Skill Cards / Actions */}
      {phase === 'end' ? (
        <View style={styles.endSection}>
          <View style={[styles.resultBadge, {
            backgroundColor: winner === 'player' ? '#22C55E22' : '#FF444422',
            borderColor: winner === 'player' ? '#22C55E' : '#FF4444',
          }]}>
            <Text style={[styles.resultText, { color: winner === 'player' ? '#22C55E' : '#FF4444' }]}>
              {winner === 'player' ? '🏆 VICTORY!' : '💀 DEFEAT'}
            </Text>
          </View>
          <View style={styles.endBtns}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.endBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            >
              <Feather name="home" size={18} color={colors.foreground} />
              <Text style={[styles.endBtnText, { color: colors.foreground }]}>Exit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setMyFighters(myRoosters.map(createFighter));
                setEnemyFighters(ENEMY_TEAM.map(createFighter));
                setActiveMyIdx(0);
                setActiveEnemyIdx(0);
                setTurn(1);
                setLog(['Battle begins! Choose your attack!']);
                setPhase('select');
                setWinner(null);
              }}
              style={[styles.endBtn, { backgroundColor: colors.primary }]}
            >
              <Feather name="refresh-cw" size={18} color="#fff" />
              <Text style={[styles.endBtnText, { color: '#fff' }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.skillsRow}
        >
          {myFighter?.isAlive && myFighter.rooster.skills.map((skill) => {
            const sc = ELEMENT_COLORS[skill.element];
            const canUse = myFighter.energy >= skill.energyCost && phase === 'select';
            return (
              <TouchableOpacity
                key={skill.id}
                onPress={() => useSkill(skill)}
                disabled={!canUse}
                style={[styles.skillBtn, {
                  backgroundColor: canUse ? sc + '22' : colors.secondary,
                  borderColor: canUse ? sc : colors.border,
                  opacity: canUse ? 1 : 0.5,
                }]}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 20 }}>{ELEMENT_EMOJIS[skill.element]}</Text>
                <Text style={[styles.skillBtnName, { color: canUse ? sc : colors.mutedForeground }]}>{skill.name}</Text>
                <Text style={[styles.skillBtnDmg, { color: colors.foreground }]}>
                  {skill.damage > 0 ? `${skill.damage}%` : 'Heal'}
                </Text>
                <View style={[styles.skillEnergy, { backgroundColor: sc + '33' }]}>
                  <Text style={[styles.skillEnergyText, { color: sc }]}>⚡{skill.energyCost}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 12 },
  side: { gap: 8, marginVertical: 8 },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fighterCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 2, padding: 10, gap: 10, overflow: 'hidden',
  },
  fighterImg: { width: 52, height: 52 },
  fighterInfo: { flex: 1, gap: 4 },
  fighterNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fighterName: { fontSize: 13, fontFamily: 'Inter_700Bold', flex: 1 },
  energyLabel: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  hpText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  defeatedBadge: {
    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
    alignItems: 'center', justifyContent: 'center', borderRadius: 10,
  },
  defeatedText: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#fff' },
  switchBtn: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  vsDivider: {
    borderTopWidth: 1, borderBottomWidth: 1,
    alignItems: 'center', paddingVertical: 6,
  },
  vsText: { fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 2 },
  logCard: {
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 10, marginVertical: 8,
  },
  logText: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  skillsRow: { paddingVertical: 8, gap: 10, paddingHorizontal: 4 },
  skillBtn: {
    width: 100, alignItems: 'center', padding: 12,
    borderRadius: 14, borderWidth: 2, gap: 4,
  },
  skillBtnName: { fontSize: 11, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  skillBtnDmg: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  skillEnergy: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  skillEnergyText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  endSection: { paddingVertical: 16, alignItems: 'center', gap: 16 },
  resultBadge: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16, borderWidth: 2 },
  resultText: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  endBtns: { flexDirection: 'row', gap: 12 },
  endBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, borderWidth: 1,
  },
  endBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
});
