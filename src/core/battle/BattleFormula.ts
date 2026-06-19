import { Rooster, Stats } from '../../types/game';
import { GameConfig } from '../../config/GameConfig';

/**
 * Battle formula responsibilities:
 * - hit chance calculation (accuracy vs dodge)
 * - critical roll
 * - damage formula (attack, defense, skills, elemental)
 * - shield absorption handling
 * - debuff damage (poison, burn)
 */

export interface AttackResult {
  hit: boolean;
  critical: boolean;
  damageBeforeShield: number;
  damageAfterShield: number;
  remainingShield: number;
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

export function hitChance(attackerAcc: number, targetDodge: number): number {
  // Convert percents to relative score and compute probability
  const acc = Math.max(0, attackerAcc);
  const dodge = Math.max(0, targetDodge);
  // Use soft formula to avoid absolute immunity
  const chance = acc / (acc + dodge + 10);
  return clamp01(chance);
}

export function rollHit(attackerAcc: number, targetDodge: number, rng = Math.random): boolean {
  return rng() < hitChance(attackerAcc, targetDodge);
}

export function rollCrit(critChancePercent: number, rng = Math.random): boolean {
  const p = clamp01(critChancePercent / 100);
  return rng() < p;
}

export function calculateRawDamage(attack: number, defense: number): number {
  // Simple physical damage curve with defense diminishing returns
  const dmg = attack - defense * GameConfig.combat.defenseEffectiveness;
  return Math.max(GameConfig.combat.minDamage, Math.floor(dmg));
}

export function applyElementalMultiplier(base: number, attackerElement: string | null, targetElement: string | null, multiplier = GameConfig.combat.elementalEffectiveness): number {
  // Placeholder: caller should supply effective multiplier map. For now we only return base.
  return Math.max(0, Math.floor(base * 1));
}

export function resolveAttack(attacker: Rooster, target: Rooster, targetShield = 0, rng = Math.random): AttackResult {
  const hit = rollHit(attacker.stats.accuracy, target.stats.dodge, rng);
  let critical = false;
  let raw = 0;
  let afterShield = 0;
  let remainingShield = targetShield;

  if (!hit) {
    return { hit: false, critical: false, damageBeforeShield: 0, damageAfterShield: 0, remainingShield };
  }

  critical = rollCrit(attacker.stats.crit, rng);

  raw = calculateRawDamage(attacker.stats.attack, target.stats.defense);

  if (critical) raw = Math.floor(raw * GameConfig.combat.critMultiplier);

  // Apply minimum damage
  raw = Math.max(GameConfig.combat.minDamage, raw);

  // Shield absorbs damage first
  if (remainingShield >= raw) {
    remainingShield = Math.floor(remainingShield - raw);
    afterShield = 0;
  } else {
    afterShield = Math.floor(raw - remainingShield);
    remainingShield = 0;
  }

  return {
    hit: true,
    critical,
    damageBeforeShield: raw,
    damageAfterShield: afterShield,
    remainingShield,
  };
}

// Example debuff resolves (poison/burn). Return damage per tick.
export function debuffTickDamage(baseDamage: number, type: 'poison' | 'burn', percent = 0.05): number {
  // default: 5% of attacker's baseDamage or minimum 1
  const dmg = Math.max(1, Math.floor(baseDamage * percent));
  return dmg;
}
