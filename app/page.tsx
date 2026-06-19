"use client";

import { useEffect, useMemo, useState } from "react";

type HeroClass = "Warrior" | "Archer" | "Sorceress" | "Cleric" | "Assassin";
type Gender = "Male" | "Female";
type Screen =
  | "character-create"
  | "town"
  | "dungeon"
  | "battle"
  | "nest"
  | "arena"
  | "guild"
  | "inventory"
  | "skills";
type Rarity = "Common" | "Rare" | "Epic" | "Legendary";
type EquipmentSlot = "Weapon" | "Helmet" | "Armor" | "Gloves" | "Shoes" | "Ring" | "Necklace";
type SkillKind = "damage" | "heal";

interface PlayerCharacter {
  name: string;
  class: HeroClass;
  level: number;
  exp: number;
  power: number;
  hp: number;
  attack: number;
  gender: Gender;
  hair: string;
  face: string;
  costume: string;
  job: string;
}

interface Quest {
  id: number;
  title: string;
  target: number;
  progress: number;
  rewardGold: number;
  rewardExp: number;
  claimed: boolean;
}

interface Job {
  name: string;
  levelRequired: number;
}

interface Skill {
  name: string;
  level: number;
  damage: number;
  kind: SkillKind;
}

interface Monster {
  name: string;
  hp: number;
  attack: number;
  exp: number;
  gold: number;
  boss?: boolean;
}

interface Pet {
  name: string;
  rarity: Rarity;
  powerBonus: number;
  attackBonus: number;
  hpBonus: number;
  goldBonus: number;
}

interface Equipment {
  id: number;
  name: string;
  slot: EquipmentSlot;
  rarity: Rarity;
  power: number;
  hp: number;
  attack: number;
}

interface DungeonStage {
  chapter: number;
  area: string;
  stage: number;
  name: string;
  bossStage?: boolean;
  requiredPower: number;
  rewardGold: number;
  rewardExp: number;
}

interface NestRaid {
  name: string;
  requiredPower: number;
  rewardGold: number;
  rewardExp: number;
  boss: Monster;
}

interface BattleState {
  mode: "dungeon" | "nest" | "job";
  title: string;
  monsters: Monster[];
  monsterIndex: number;
  monsterHp: number;
  playerHp: number;
  maxPlayerHp: number;
  rewardGold: number;
  rewardExp: number;
  energyCost: number;
  log: string[];
  started: boolean;
  sourceStage?: DungeonStage;
  sourceRaid?: NestRaid;
  jobName?: string;
}

interface Guild {
  name: string;
  tag: string;
  level: number;
  members: number;
  donation: number;
  raidDamage: number;
}

interface SaveData {
  character: PlayerCharacter | null;
  gold: number;
  diamond: number;
  energy: number;
  lastEnergyAt: number;
  lastLogin: string;
  loginStreak: number;
  skillPoints: number;
  jobQuestClears: number;
  equipment: Partial<Record<EquipmentSlot, Equipment>>;
  inventory: Equipment[];
  quests: Quest[];
  skills: Skill[];
  pet: Pet | null;
  guild: Guild | null;
  arenaRank: number;
  tutorialDone: boolean;
}

type Toast = {
  message: string;
  tone: "success" | "error" | "info";
};

type BattleFx = {
  id: number;
  kind: "slash" | "skill" | "heal" | "hit";
  label: string;
};

const SAVE_KEY = "dragon-nest-character";
const DUNGEON_ENERGY_COST = 8;
const NEST_ENERGY_COST = 15;
const MAX_ENERGY = 100;
const ENERGY_REGEN_MS = 5 * 60 * 1000;
const CLASS_LIST: HeroClass[] = ["Warrior", "Archer", "Sorceress", "Cleric", "Assassin"];

const classStats: Record<HeroClass, { hp: number; attack: number; power: number; traits: string[] }> = {
  Warrior: { hp: 1250, attack: 150, power: 720, traits: ["HP Tinggi", "Defense Tinggi"] },
  Archer: { hp: 900, attack: 220, power: 740, traits: ["Attack Tinggi", "Critical Tinggi"] },
  Sorceress: { hp: 820, attack: 260, power: 760, traits: ["Magic Damage Tinggi", "Area Skill"] },
  Cleric: { hp: 1180, attack: 165, power: 710, traits: ["Support", "Survival Tinggi"] },
  Assassin: { hp: 940, attack: 240, power: 755, traits: ["Burst Damage", "Mobilitas Tinggi"] },
};

const jobTree: Record<HeroClass, Job[]> = {
  Warrior: [{ name: "Swordmaster", levelRequired: 15 }, { name: "Mercenary", levelRequired: 15 }],
  Archer: [{ name: "Sharpshooter", levelRequired: 15 }, { name: "Acrobat", levelRequired: 15 }],
  Sorceress: [{ name: "Elemental Lord", levelRequired: 15 }, { name: "Force User", levelRequired: 15 }],
  Cleric: [{ name: "Priest", levelRequired: 15 }, { name: "Paladin", levelRequired: 15 }],
  Assassin: [{ name: "Chaser", levelRequired: 15 }, { name: "Bringer", levelRequired: 15 }],
};

const advancedSkillBook: Record<string, Skill[]> = {
  Swordmaster: [
    { name: "Triple Slash", level: 1, damage: 340, kind: "damage" },
    { name: "Crescent Cleave", level: 1, damage: 420, kind: "damage" },
  ],
  Mercenary: [
    { name: "Whirlwind", level: 1, damage: 390, kind: "damage" },
    { name: "Battle Howl", level: 1, damage: 260, kind: "heal" },
  ],
  Sharpshooter: [{ name: "Rain of Arrows", level: 1, damage: 390, kind: "damage" }],
  Acrobat: [{ name: "Spiral Kick", level: 1, damage: 360, kind: "damage" }],
  "Elemental Lord": [{ name: "Meteor Storm", level: 1, damage: 460, kind: "damage" }],
  "Force User": [{ name: "Gravity Blast", level: 1, damage: 410, kind: "damage" }],
  Priest: [{ name: "Heal", level: 1, damage: 340, kind: "heal" }],
  Paladin: [{ name: "Divine Combo", level: 1, damage: 360, kind: "damage" }],
  Chaser: [{ name: "Izuna Drop", level: 1, damage: 390, kind: "damage" }],
  Bringer: [{ name: "Shadow Heal", level: 1, damage: 320, kind: "heal" }],
};

const skillBook: Record<HeroClass, Skill[]> = {
  Warrior: [
    { name: "Slash", level: 1, damage: 140, kind: "damage" },
    { name: "Dash", level: 1, damage: 90, kind: "damage" },
    { name: "Whirlwind", level: 1, damage: 230, kind: "damage" },
    { name: "Heal", level: 1, damage: 170, kind: "heal" },
  ],
  Archer: [
    { name: "Twin Shot", level: 1, damage: 150, kind: "damage" },
    { name: "Somersault Kick", level: 1, damage: 120, kind: "damage" },
    { name: "Piercing Arrow", level: 1, damage: 250, kind: "damage" },
    { name: "First Aid", level: 1, damage: 150, kind: "heal" },
  ],
  Sorceress: [
    { name: "Fireball", level: 1, damage: 180, kind: "damage" },
    { name: "Glacial Spike", level: 1, damage: 160, kind: "damage" },
    { name: "Poison Cloud", level: 1, damage: 240, kind: "damage" },
    { name: "Mana Heal", level: 1, damage: 145, kind: "heal" },
  ],
  Cleric: [
    { name: "Holy Bolt", level: 1, damage: 130, kind: "damage" },
    { name: "Block", level: 1, damage: 80, kind: "damage" },
    { name: "Lightning Relic", level: 1, damage: 240, kind: "damage" },
    { name: "Heal", level: 1, damage: 220, kind: "heal" },
  ],
  Assassin: [
    { name: "Fan of Edge", level: 1, damage: 160, kind: "damage" },
    { name: "Shadow Hand", level: 1, damage: 140, kind: "damage" },
    { name: "Applause", level: 1, damage: 260, kind: "damage" },
    { name: "Shadow Heal", level: 1, damage: 150, kind: "heal" },
  ],
};

const equipmentSlots: EquipmentSlot[] = ["Weapon", "Helmet", "Armor", "Gloves", "Shoes", "Ring", "Necklace"];

const rarityColor: Record<Rarity, string> = {
  Common: "#94a3b8",
  Rare: "#38bdf8",
  Epic: "#e879f9",
  Legendary: "#f59e0b",
};

const rarityScale: Record<Rarity, number> = {
  Common: 1,
  Rare: 1.35,
  Epic: 1.9,
  Legendary: 2.7,
};

const dungeonStages: DungeonStage[] = [
  ...createChapter(1, "Prairie Town", 620),
  ...createChapter(2, "Forest Ruins", 1080),
  ...createChapter(3, "Mana Ridge", 1720),
  ...createChapter(4, "Ancient Temple", 2450),
];

const nestRaids: NestRaid[] = [
  {
    name: "Minotaur Nest",
    requiredPower: 1450,
    rewardGold: 850,
    rewardExp: 180,
    boss: { name: "Minotaur Guardian", hp: 1900, attack: 155, exp: 180, gold: 850, boss: true },
  },
  {
    name: "Cerberus Nest",
    requiredPower: 2300,
    rewardGold: 1450,
    rewardExp: 300,
    boss: { name: "Cerberus", hp: 3200, attack: 225, exp: 300, gold: 1450, boss: true },
  },
  {
    name: "Sea Dragon Nest",
    requiredPower: 3900,
    rewardGold: 2600,
    rewardExp: 520,
    boss: { name: "Sea Dragon", hp: 5600, attack: 360, exp: 520, gold: 2600, boss: true },
  },
  {
    name: "Black Dragon Nest",
    requiredPower: 5800,
    rewardGold: 4200,
    rewardExp: 760,
    boss: { name: "Black Dragon", hp: 8200, attack: 520, exp: 760, gold: 4200, boss: true },
  },
];

const navItems: Array<{ id: Screen; icon: string; label: string }> = [
  { id: "town", icon: "🏰", label: "Town" },
  { id: "dungeon", icon: "⚔️", label: "Portal" },
  { id: "nest", icon: "🐉", label: "Nest" },
  { id: "inventory", icon: "🎒", label: "Gear" },
  { id: "skills", icon: "✨", label: "Skills" },
  { id: "arena", icon: "🏆", label: "PvP" },
  { id: "guild", icon: "🛡️", label: "Guild" },
];

function createChapter(chapter: number, area: string, basePower: number): DungeonStage[] {
  return [1, 2, 3, 4].map((stage) => ({
    chapter,
    area,
    stage,
    name: stage === 4 ? `${area} Boss Stage` : `${area} Stage ${stage}`,
    bossStage: stage === 4,
    requiredPower: basePower + stage * 170 + chapter * 90,
    rewardGold: 180 + chapter * 120 + stage * 55,
    rewardExp: 45 + chapter * 25 + stage * 20,
  }));
}

function createQuests(): Quest[] {
  return [
    { id: 1, title: "Clear Dungeon 5 kali", target: 5, progress: 0, rewardGold: 1000, rewardExp: 220, claimed: false },
    { id: 2, title: "Kalahkan Boss Stage 2 kali", target: 2, progress: 0, rewardGold: 1500, rewardExp: 340, claimed: false },
    { id: 3, title: "Selesaikan Nest 1 kali", target: 1, progress: 0, rewardGold: 1800, rewardExp: 420, claimed: false },
  ];
}

function compactNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return Math.floor(value).toString();
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function previousDayKey(key: string) {
  const date = new Date(`${key}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return todayKey(date);
}

function expToNextLevel(level: number) {
  return 100 + level * 55;
}

function totalEquipmentPower(equipment: Partial<Record<EquipmentSlot, Equipment>>) {
  return Object.values(equipment).reduce((sum, item) => sum + (item?.power ?? 0), 0);
}

function totalCharacterPower(character: PlayerCharacter | null, equipment: Partial<Record<EquipmentSlot, Equipment>>, pet: Pet | null) {
  if (!character) return 0;
  return character.power + totalEquipmentPower(equipment) + (pet?.powerBonus ?? 0);
}

function totalHp(character: PlayerCharacter | null, equipment: Partial<Record<EquipmentSlot, Equipment>>, pet: Pet | null) {
  if (!character) return 0;
  return character.hp + Object.values(equipment).reduce((sum, item) => sum + (item?.hp ?? 0), 0) + (pet?.hpBonus ?? 0);
}

function totalAttack(character: PlayerCharacter | null, equipment: Partial<Record<EquipmentSlot, Equipment>>, pet: Pet | null) {
  if (!character) return 0;
  return character.attack + Object.values(equipment).reduce((sum, item) => sum + (item?.attack ?? 0), 0) + (pet?.attackBonus ?? 0);
}

function levelCharacter(character: PlayerCharacter, gainedExp: number) {
  let exp = character.exp + gainedExp;
  let level = character.level;
  let hp = character.hp;
  let attack = character.attack;
  let power = character.power;
  let leveled = 0;

  while (exp >= expToNextLevel(level)) {
    exp -= expToNextLevel(level);
    level += 1;
    power += 50;
    hp += 100;
    attack += 20;
    leveled += 1;
  }

  return { character: { ...character, exp, level, hp, attack, power }, leveled };
}

function randomRarity(): Rarity {
  const roll = Math.random();
  if (roll > 0.94) return "Legendary";
  if (roll > 0.74) return "Epic";
  if (roll > 0.42) return "Rare";
  return "Common";
}

function randomOf<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function createEquipment(slot?: EquipmentSlot): Equipment {
  const pickedSlot = slot ?? randomOf(equipmentSlots);
  const rarity = randomRarity();
  const scale = rarityScale[rarity];
  const prefix = rarity === "Legendary" ? "Dragon" : rarity === "Epic" ? "Epic" : rarity === "Rare" ? "Rare" : "Iron";
  return {
    id: Date.now() + Math.floor(Math.random() * 10000),
    name: `${prefix} ${pickedSlot}`,
    slot: pickedSlot,
    rarity,
    power: Math.floor(110 * scale + Math.random() * 80),
    hp: Math.floor(60 * scale + Math.random() * 45),
    attack: Math.floor(18 * scale + Math.random() * 18),
  };
}

function createMonsters(stage: DungeonStage): Monster[] {
  const scale = stage.chapter + stage.stage * 0.35;
  const mobs: Monster[] = [
    { name: "Goblin Scout", hp: Math.floor(360 * scale), attack: Math.floor(45 * scale), exp: 22, gold: 60 },
    { name: stage.chapter > 2 ? "Orc Raider" : "Goblin Fighter", hp: Math.floor(460 * scale), attack: Math.floor(55 * scale), exp: 28, gold: 75 },
  ];
  if (stage.bossStage) {
    mobs.push({
      name: stage.chapter >= 4 ? "Temple Dragon" : stage.chapter >= 2 ? "Orc Warlord" : "Minotaur Captain",
      hp: Math.floor(920 * scale),
      attack: Math.floor(82 * scale),
      exp: stage.rewardExp,
      gold: stage.rewardGold,
      boss: true,
    });
  } else {
    mobs.push({ name: "Orc Guard", hp: Math.floor(540 * scale), attack: Math.floor(62 * scale), exp: 34, gold: 90 });
  }
  return mobs;
}

function starterPet(characterClass: HeroClass): Pet {
  return {
    name: `${characterClass} Spirit`,
    rarity: "Rare",
    powerBonus: 160,
    attackBonus: 18,
    hpBonus: 90,
    goldBonus: 8,
  };
}

function Button({
  children,
  onClick,
  disabled,
  tone = "primary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "primary" | "danger" | "quiet";
}) {
  const background = tone === "danger" ? "#7f1d1d" : tone === "quiet" ? "#263245" : "#0f766e";
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...buttonStyle, background: disabled ? "#1f2937" : background, color: disabled ? "#64748b" : "#f8fafc" }}>
      {children}
    </button>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div style={statPill}>
      <div style={{ color: "#94a3b8", fontSize: 11 }}>{label}</div>
      <div style={{ color: "#f8fafc", fontWeight: 900 }}>{value}</div>
    </div>
  );
}

function ProgressBar({ value, tone = "normal" }: { value: number; tone?: "normal" | "danger" | "boss" }) {
  const background = tone === "danger" ? "linear-gradient(90deg, #ef4444, #f97316)" : tone === "boss" ? "linear-gradient(90deg, #dc2626, #f59e0b)" : "linear-gradient(90deg, #22c55e, #38bdf8)";
  return (
    <div style={barTrack}>
      <div style={{ ...barFill, background, width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

function classVisual(className?: HeroClass) {
  if (className === "Archer") return { weapon: "bow", color: "#22d3ee", accent: "#a7f3d0" };
  if (className === "Sorceress") return { weapon: "orb", color: "#c084fc", accent: "#f0abfc" };
  if (className === "Cleric") return { weapon: "shield", color: "#facc15", accent: "#93c5fd" };
  if (className === "Assassin") return { weapon: "blade", color: "#fb7185", accent: "#c4b5fd" };
  return { weapon: "sword", color: "#38bdf8", accent: "#f97316" };
}

function monsterVisual(monster: Monster) {
  return monster.boss ? { scale: "boss", color: "#dc2626", accent: "#f59e0b" } : { scale: "mob", color: "#7c3aed", accent: "#22c55e" };
}

function BattleArena({
  character,
  monster,
  fx,
  playerHpPercent,
  monsterHpPercent,
  statusLabel,
}: {
  character: PlayerCharacter | null;
  monster: Monster;
  fx: BattleFx | null;
  playerHpPercent: number;
  monsterHpPercent: number;
  statusLabel?: string;
}) {
  const hero = classVisual(character?.class);
  const enemy = monsterVisual(monster);
  const lowHp = playerHpPercent < 35;
  const monsterLowHp = monsterHpPercent < 35;

  return (
    <div className="game-arena" aria-label="Battle arena">
      <div className="arena-sky" />
      <div className="arena-rain arena-rain-one" />
      <div className="arena-rain arena-rain-two" />
      <div className="arena-floor">
        <span />
        <span />
        <span />
      </div>

      <div className={`hero-sprite ${fx?.kind === "slash" || fx?.kind === "skill" ? "hero-attacking" : ""} ${fx?.kind === "hit" ? "hero-hurt" : ""} ${lowHp ? "sprite-danger" : ""}`}>
        <div className="sprite-shadow" />
        <div className="hero-aura" style={{ background: hero.color }} />
        <div className="hero-body" style={{ background: hero.color }}>
          <span className="hero-head" />
          <span className={`hero-weapon hero-${hero.weapon}`} style={{ borderColor: hero.accent, background: hero.accent }} />
        </div>
        <div className="name-plate">{character?.name ?? "Hero"}</div>
      </div>

      <div className={`monster-sprite monster-${enemy.scale} ${fx?.kind === "slash" || fx?.kind === "skill" ? "monster-hit" : ""} ${fx?.kind === "hit" ? "monster-attacking" : ""} ${monsterLowHp ? "sprite-danger" : ""}`}>
        <div className="sprite-shadow" />
        <div className="monster-body" style={{ background: enemy.color }}>
          <span className="monster-eye left" />
          <span className="monster-eye right" />
          <span className="monster-horn horn-left" style={{ borderBottomColor: enemy.accent }} />
          <span className="monster-horn horn-right" style={{ borderBottomColor: enemy.accent }} />
        </div>
        <div className="name-plate">{monster.name}</div>
      </div>

      {fx && fx.kind !== "heal" && (
        <div key={fx.id} className={`battle-fx ${fx.kind === "skill" ? "fx-orb" : "fx-slash"}`}>
          <span>{fx.label}</span>
        </div>
      )}

      {fx?.kind === "heal" && (
        <div key={fx.id} className="heal-fx">
          <span>{fx.label}</span>
        </div>
      )}

      {statusLabel && <div className="battle-status">{statusLabel}</div>}
    </div>
  );
}

export default function DragonNestCharacterRpg() {
  const [screen, setScreen] = useState<Screen>("character-create");
  const [character, setCharacter] = useState<PlayerCharacter | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [selectedClass, setSelectedClass] = useState<HeroClass>("Warrior");
  const [selectedGender, setSelectedGender] = useState<Gender>("Male");
  const [hair, setHair] = useState("Short");
  const [face, setFace] = useState("Calm");
  const [costume, setCostume] = useState("Academy");
  const [gold, setGold] = useState(900);
  const [diamond, setDiamond] = useState(20);
  const [energy, setEnergy] = useState(70);
  const [lastEnergyAt, setLastEnergyAt] = useState(() => Date.now());
  const [lastLogin, setLastLogin] = useState("");
  const [loginStreak, setLoginStreak] = useState(0);
  const [skillPoints, setSkillPoints] = useState(0);
  const [jobQuestClears, setJobQuestClears] = useState(0);
  const [equipment, setEquipment] = useState<Partial<Record<EquipmentSlot, Equipment>>>({});
  const [inventory, setInventory] = useState<Equipment[]>([]);
  const [quests, setQuests] = useState<Quest[]>(() => createQuests());
  const [skills, setSkills] = useState<Skill[]>(skillBook.Warrior);
  const [pet, setPet] = useState<Pet | null>(null);
  const [guild, setGuild] = useState<Guild | null>(null);
  const [guildName, setGuildName] = useState("");
  const [arenaRank, setArenaRank] = useState(12800);
  const [tutorialDone, setTutorialDone] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [battleFx, setBattleFx] = useState<BattleFx | null>(null);
  const [loaded, setLoaded] = useState(false);

  const playerPower = useMemo(() => totalCharacterPower(character, equipment, pet), [character, equipment, pet]);
  const playerMaxHp = useMemo(() => totalHp(character, equipment, pet), [character, equipment, pet]);
  const playerAttack = useMemo(() => totalAttack(character, equipment, pet), [character, equipment, pet]);
  const expPercent = character ? (character.exp / expToNextLevel(character.level)) * 100 : 0;
  const jobQuestReady = !!character && character.level >= 15 && jobQuestClears > 0;

  useEffect(() => {
    window.queueMicrotask(() => {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (raw) {
        try {
          const data = JSON.parse(raw) as Partial<SaveData>;
          setCharacter(data.character ?? null);
          setGold(data.gold ?? 900);
          setDiamond(data.diamond ?? 20);
          setEnergy(data.energy ?? 70);
          setLastEnergyAt(data.lastEnergyAt ?? Date.now());
          setLastLogin(data.lastLogin ?? "");
          setLoginStreak(data.loginStreak ?? 0);
          setSkillPoints(data.skillPoints ?? 0);
          setJobQuestClears(data.jobQuestClears ?? 0);
          setEquipment(data.equipment ?? {});
          setInventory(data.inventory ?? []);
          setQuests(data.quests ?? createQuests());
          setSkills(data.skills ?? (data.character ? skillBook[data.character.class] : skillBook.Warrior));
          setPet(data.pet ?? null);
          setGuild(data.guild ?? null);
          setArenaRank(data.arenaRank ?? 12800);
          setTutorialDone(data.tutorialDone ?? false);
          setScreen(data.character ? "town" : "character-create");
        } catch {
          setScreen("character-create");
        }
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.queueMicrotask(() => {
      const now = Date.now();
      setEnergy((current) => {
        if (current >= MAX_ENERGY) {
          setLastEnergyAt(now);
          return current;
        }
        const gained = Math.floor((now - lastEnergyAt) / ENERGY_REGEN_MS);
        if (gained <= 0) return current;
        setLastEnergyAt(lastEnergyAt + gained * ENERGY_REGEN_MS);
        return Math.min(MAX_ENERGY, current + gained);
      });
    });
    const timer = window.setInterval(() => {
      setEnergy((current) => {
        if (current >= MAX_ENERGY) {
          setLastEnergyAt(Date.now());
          return current;
        }
        const gained = Math.floor((Date.now() - lastEnergyAt) / ENERGY_REGEN_MS);
        if (gained <= 0) return current;
        setLastEnergyAt((value) => value + gained * ENERGY_REGEN_MS);
        return Math.min(MAX_ENERGY, current + gained);
      });
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [lastEnergyAt, loaded]);

  useEffect(() => {
    if (!loaded || !character) return;
    const today = todayKey();
    if (lastLogin === today) return;
    const streak = lastLogin && previousDayKey(lastLogin) === today ? loginStreak + 1 : 1;
    window.queueMicrotask(() => {
      setLastLogin(today);
      setLoginStreak(streak);
      setGold((value) => value + 100);
      if (streak % 7 === 0) {
        setInventory((items) => [createEquipment(), createEquipment(), ...items]);
        notify("Daily Login Day 7: Epic Chest dibuka.", "success");
      } else {
        notify(`Daily Login Day ${streak}: +100 Gold.`, "success");
      }
    });
  }, [character, lastLogin, loaded, loginStreak]);

  useEffect(() => {
    if (!loaded) return;
    const data: SaveData = {
      character,
      gold,
      diamond,
      energy,
      lastEnergyAt,
      lastLogin,
      loginStreak,
      skillPoints,
      jobQuestClears,
      equipment,
      inventory,
      quests,
      skills,
      pet,
      guild,
      arenaRank,
      tutorialDone,
    };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }, [arenaRank, character, diamond, energy, equipment, gold, guild, inventory, jobQuestClears, lastEnergyAt, lastLogin, loaded, loginStreak, pet, quests, skillPoints, skills, tutorialDone]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!battleFx) return;
    const timer = window.setTimeout(() => setBattleFx(null), 720);
    return () => window.clearTimeout(timer);
  }, [battleFx]);

  function notify(message: string, tone: Toast["tone"] = "info") {
    setToast({ message, tone });
  }

  function playBattleFx(kind: BattleFx["kind"], label: string) {
    setBattleFx({ id: Date.now(), kind, label });
  }

  function createCharacter() {
    const cleanName = nameInput.trim();
    if (cleanName.length < 3) {
      notify("Nama character minimal 3 karakter.", "error");
      return;
    }
    const base = classStats[selectedClass];
    const newCharacter: PlayerCharacter = {
      name: cleanName,
      class: selectedClass,
      level: 1,
      exp: 0,
      power: base.power,
      hp: base.hp,
      attack: base.attack,
      gender: selectedGender,
      hair,
      face,
      costume,
      job: selectedClass,
    };
    setCharacter(newCharacter);
    setSkills(skillBook[selectedClass]);
    setPet(starterPet(selectedClass));
    setInventory([createEquipment("Weapon"), createEquipment("Armor")]);
    setSkillPoints(0);
    setTutorialDone(false);
    setScreen("town");
    notify("Welcome Adventurer. Saint Haven terbuka.", "success");
  }

  function applyExp(gainExp: number) {
    if (!character) return 0;
    const result = levelCharacter(character, gainExp);
    setCharacter(result.character);
    if (result.leveled > 0) setSkillPoints((value) => value + result.leveled);
    return result.leveled;
  }

  function advanceQuest(id: number, amount = 1) {
    setQuests((current) =>
      current.map((quest) => (quest.id === id && !quest.claimed ? { ...quest, progress: Math.min(quest.target, quest.progress + amount) } : quest)),
    );
  }

  function spendEnergy(cost: number) {
    if (energy < cost) {
      notify("Energy tidak cukup.", "error");
      return false;
    }
    setEnergy((value) => value - cost);
    setLastEnergyAt(Date.now());
    return true;
  }

  function startDungeon(stage: DungeonStage) {
    if (!character || !spendEnergy(DUNGEON_ENERGY_COST)) return;
    const monsters = createMonsters(stage);
    setBattle({
      mode: "dungeon",
      title: stage.name,
      monsters,
      monsterIndex: 0,
      monsterHp: monsters[0].hp,
      playerHp: playerMaxHp,
      maxPlayerHp: playerMaxHp,
      rewardGold: stage.rewardGold,
      rewardExp: stage.rewardExp,
      energyCost: DUNGEON_ENERGY_COST,
      log: [`Masuk ${stage.name}. ${monsters[0].name} muncul.`],
      started: true,
      sourceStage: stage,
    });
    setBattleFx(null);
    setScreen("battle");
  }

  function startNest(raid: NestRaid) {
    if (!character || !spendEnergy(NEST_ENERGY_COST)) return;
    setBattle({
      mode: "nest",
      title: raid.name,
      monsters: [raid.boss],
      monsterIndex: 0,
      monsterHp: raid.boss.hp,
      playerHp: playerMaxHp,
      maxPlayerHp: playerMaxHp,
      rewardGold: raid.rewardGold,
      rewardExp: raid.rewardExp,
      energyCost: NEST_ENERGY_COST,
      log: [`${raid.boss.name} turun ke arena Nest.`],
      started: true,
      sourceRaid: raid,
    });
    setBattleFx(null);
    setScreen("battle");
  }

  function startJobQuest(job: Job) {
    if (!character || character.level < job.levelRequired) return;
    setBattle({
      mode: "job",
      title: `${job.name} Advancement Quest`,
      monsters: [{ name: "Job Trial Boss", hp: 2800, attack: 210, exp: 180, gold: 500, boss: true }],
      monsterIndex: 0,
      monsterHp: 2800,
      playerHp: playerMaxHp,
      maxPlayerHp: playerMaxHp,
      rewardGold: 500,
      rewardExp: 180,
      energyCost: 0,
      log: [`Master Class membuka trial ${job.name}.`],
      started: true,
      jobName: job.name,
    });
    setBattleFx(null);
    setScreen("battle");
  }

  function completeBattle(current: BattleState) {
    const goldReward = Math.floor(current.rewardGold * (1 + (pet?.goldBonus ?? 0) / 100));
    const leveled = applyExp(current.rewardExp);
    setGold((value) => value + goldReward);
    if (current.mode === "dungeon") {
      advanceQuest(1);
      if (current.sourceStage?.bossStage) {
        advanceQuest(2);
        setDiamond((value) => value + 2);
      }
      if (Math.random() > 0.42 || current.sourceStage?.bossStage) setInventory((items) => [createEquipment(), ...items]);
      notify(`${current.title} clear: +${current.rewardExp} EXP${leveled ? ", Level Up" : ""}.`, "success");
      setScreen("dungeon");
    }
    if (current.mode === "nest") {
      advanceQuest(3);
      setDiamond((value) => value + 3);
      setInventory((items) => [createEquipment("Ring"), createEquipment("Necklace"), ...items]);
      notify(`${current.title} clear: boss reward diterima.`, "success");
      setScreen("nest");
    }
    if (current.mode === "job") {
      setJobQuestClears((value) => value + 1);
      notify("Job Advancement Quest selesai. Pilih job di Skill Tree.", "success");
      setScreen("skills");
    }
    setBattle(null);
    setBattleFx(null);
  }

  function monsterTurn(nextBattle: BattleState, incomingLog: string[]) {
    const monster = nextBattle.monsters[nextBattle.monsterIndex];
    const blocked = Math.random() < Math.min(0.35, playerPower / 16000);
    const damage = blocked ? Math.floor(monster.attack * 0.35) : monster.attack;
    const playerHp = Math.max(0, nextBattle.playerHp - damage);
    const log = [...incomingLog, `${monster.name} menyerang ${damage} damage${blocked ? " (block)" : ""}.`].slice(-5);
    window.setTimeout(() => playBattleFx("hit", blocked ? "BLOCK" : `${damage}`), 360);
    if (playerHp <= 0) {
      setBattle({ ...nextBattle, playerHp, log: [...log, "Kamu tumbang. Upgrade gear atau skill dulu."].slice(-5) });
      notify("Battle gagal.", "error");
      return;
    }
    setBattle({ ...nextBattle, playerHp, log });
  }

  function dealDamage(rawDamage: number, source: string) {
    if (!battle) return;
    const monster = battle.monsters[battle.monsterIndex];
    const damage = Math.max(1, Math.floor(rawDamage * (0.9 + Math.random() * 0.22)));
    const remainingHp = Math.max(0, battle.monsterHp - damage);
    const log = [`${source} mengenai ${monster.name}: ${damage} damage.`, ...battle.log].slice(0, 5);
    playBattleFx(source === "Attack" ? "slash" : "skill", `${damage}`);

    if (remainingHp > 0) {
      monsterTurn({ ...battle, monsterHp: remainingHp }, log);
      return;
    }

    const nextIndex = battle.monsterIndex + 1;
    if (nextIndex >= battle.monsters.length) {
      completeBattle({ ...battle, monsterHp: 0, log: [`${monster.name} kalah.`, ...log] });
      return;
    }

    const nextMonster = battle.monsters[nextIndex];
    setBattle({
      ...battle,
      monsterIndex: nextIndex,
      monsterHp: nextMonster.hp,
      log: [`${monster.name} kalah. ${nextMonster.name} muncul.`, ...log].slice(0, 5),
    });
  }

  function basicAttack() {
    dealDamage(playerAttack, "Attack");
  }

  function castSkill(skill: Skill) {
    if (!battle) return;
    if (skill.kind === "heal") {
      const heal = Math.floor(skill.damage + playerAttack * 0.35);
      const playerHp = Math.min(battle.maxPlayerHp, battle.playerHp + heal);
      playBattleFx("heal", `+${heal}`);
      monsterTurn({ ...battle, playerHp }, [`${skill.name} memulihkan ${heal} HP.`, ...battle.log].slice(0, 5));
      return;
    }
    dealDamage(skill.damage + playerAttack * 0.7, skill.name);
  }

  function claimQuest(quest: Quest) {
    if (quest.progress < quest.target || quest.claimed) return;
    const leveled = applyExp(quest.rewardExp);
    setGold((value) => value + quest.rewardGold);
    setQuests((current) => current.map((item) => (item.id === quest.id ? { ...item, claimed: true } : item)));
    notify(`Quest reward diklaim${leveled ? " dan level naik" : ""}.`, "success");
  }

  function equipItem(item: Equipment) {
    setEquipment((current) => ({ ...current, [item.slot]: item }));
    setInventory((items) => items.filter((candidate) => candidate.id !== item.id));
    notify(`${item.name} equipped.`, "success");
  }

  function trainSkill(skill: Skill) {
    if (skillPoints < 1) {
      notify("Skill Point tidak cukup. Level up untuk +1 SP.", "error");
      return;
    }
    setSkillPoints((value) => value - 1);
    setSkills((current) => current.map((item) => (item.name === skill.name ? { ...item, level: item.level + 1, damage: item.damage + 55 } : item)));
    notify(`${skill.name} naik ke Lv ${skill.level + 1}.`, "success");
  }

  function advanceJob(job: Job) {
    if (!character || character.level < job.levelRequired) return;
    if (!jobQuestReady) {
      notify("Selesaikan Job Advancement Quest dulu.", "error");
      return;
    }
    setCharacter({ ...character, job: job.name, power: character.power + 180, attack: character.attack + 35 });
    setSkills((current) => [...current, ...(advancedSkillBook[job.name] ?? [])]);
    setJobQuestClears((value) => Math.max(0, value - 1));
    notify(`Job Advancement: ${job.name}. Skill baru terbuka.`, "success");
  }

  function enterArena() {
    if (!character) return;
    const win = playerPower >= 1600 || Math.random() > 0.38;
    playBattleFx(win ? "slash" : "hit", win ? "CRIT" : "COUNTER");
    if (win) {
      setArenaRank((rank) => Math.max(1, rank - Math.floor(70 + Math.random() * 140)));
      setGold((value) => value + 260);
      notify("PvP menang. Ranking naik.", "success");
    } else {
      setArenaRank((rank) => rank + 35);
      notify("PvP kalah tipis. Upgrade gear dan skill.", "error");
    }
  }

  function createGuild() {
    const clean = guildName.trim();
    if (clean.length < 3) {
      notify("Nama Guild minimal 3 karakter.", "error");
      return;
    }
    setGuild({ name: clean, tag: clean.slice(0, 4).toUpperCase(), level: 1, members: 12, donation: 0, raidDamage: 0 });
    setGuildName("");
    notify(`Guild ${clean} dibuat.`, "success");
  }

  function donateGuild() {
    if (!guild) return;
    if (gold < 300) {
      notify("Gold tidak cukup untuk Guild Donation.", "error");
      return;
    }
    setGold((value) => value - 300);
    setGuild((value) => (value ? { ...value, donation: value.donation + 300, level: Math.min(10, Math.floor((value.donation + 300) / 1500) + 1) } : value));
    notify("Guild Donation berhasil.", "success");
  }

  function guildRaid() {
    if (!guild) return;
    const damage = Math.floor(playerPower * 1.35);
    playBattleFx("skill", `${compactNumber(damage)}`);
    setGuild((value) => (value ? { ...value, raidDamage: value.raidDamage + damage } : value));
    setGold((value) => value + 180);
    notify(`Guild Raid damage ${compactNumber(damage)}.`, "success");
  }

  function claimSupply() {
    setEnergy((value) => Math.min(MAX_ENERGY, value + 30));
    setGold((value) => value + 350);
    notify("Supply harian diklaim.", "success");
  }

  function renderCharacterCreate() {
    return (
      <section style={panel}>
        <div style={cutscenePanel}>
          <div style={{ color: "#7dd3fc", fontWeight: 900, fontSize: 12 }}>Welcome Adventurer</div>
          <h1 style={{ margin: "4px 0", fontSize: 26, lineHeight: 1.05 }}>Choose Your Class</h1>
          <div style={{ color: "#dbeafe", fontSize: 13 }}>Create your hero, then start from Saint Haven.</div>
        </div>
        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          <input value={nameInput} onChange={(event) => setNameInput(event.target.value)} placeholder="Character name" style={inputStyle} />
          <div style={classGrid}>
            {CLASS_LIST.map((className) => (
              <button key={className} onClick={() => setSelectedClass(className)} style={{ ...selectButton, borderColor: selectedClass === className ? "#67e8f9" : "rgba(255,255,255,.12)", background: selectedClass === className ? "#083344" : "#111827" }}>
                <b>{className}</b>
                <span>{classStats[className].traits.join(" • ")}</span>
              </button>
            ))}
          </div>
          <div style={twoColumn}>
            <select value={selectedGender} onChange={(event) => setSelectedGender(event.target.value as Gender)} style={inputStyle}><option>Male</option><option>Female</option></select>
            <select value={hair} onChange={(event) => setHair(event.target.value)} style={inputStyle}><option>Short</option><option>Long</option><option>Ponytail</option><option>Silver</option></select>
            <select value={face} onChange={(event) => setFace(event.target.value)} style={inputStyle}><option>Calm</option><option>Brave</option><option>Sharp</option><option>Bright</option></select>
            <select value={costume} onChange={(event) => setCostume(event.target.value)} style={inputStyle}><option>Academy</option><option>Mercenary</option><option>Royal</option><option>Shadow</option></select>
          </div>
          <Button onClick={createCharacter}>Create Character</Button>
        </div>
      </section>
    );
  }

  function renderTown() {
    if (!character) return renderCharacterCreate();
    return (
      <>
        <section style={townPanel}>
          <div>
            <div style={{ color: "#facc15", fontWeight: 900, fontSize: 12 }}>Saint Haven</div>
            <h1 style={{ margin: "4px 0", fontSize: 28, lineHeight: 1.05 }}>{character.name}</h1>
            <div style={{ color: "#e2e8f0", fontSize: 13 }}>Lv {character.level} {character.job} • Power {compactNumber(playerPower)}</div>
          </div>
          <div style={{ fontSize: 52, lineHeight: 1 }}>{character.class === "Archer" ? "🏹" : character.class === "Sorceress" ? "🔮" : character.class === "Cleric" ? "🛡️" : "🗡️"}</div>
        </section>

        <section style={gridThree}>
          <StatPill label="Gold" value={`🪙 ${compactNumber(gold)}`} />
          <StatPill label="Diamond" value={`💎 ${diamond}`} />
          <StatPill label="Energy" value={`⚡ ${energy}/${MAX_ENERGY}`} />
        </section>

        <section style={panel}>
          <div style={sectionTitle}>Character</div>
          <ProgressBar value={expPercent} />
          <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 8 }}>EXP {character.exp}/{expToNextLevel(character.level)} • HP {compactNumber(playerMaxHp)} • ATK {compactNumber(playerAttack)} • SP {skillPoints}</div>
        </section>

        <section style={panel}>
          <div style={sectionTitle}>Equipped Gear</div>
          <div style={slotGrid}>
            {equipmentSlots.map((slot) => {
              const item = equipment[slot];
              return (
                <div key={slot} style={statPill}>
                  <div style={{ color: "#94a3b8", fontSize: 11 }}>{slot}</div>
                  <div style={{ color: item ? rarityColor[item.rarity] : "#64748b", fontWeight: 900 }}>{item ? item.name : "Empty"}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section style={panel}>
          <div style={sectionTitle}>Quest NPC</div>
          <div style={{ display: "grid", gap: 8 }}>
            {quests.map((quest) => (
              <div key={quest.id} style={rowCard}>
                <div>
                  <div style={{ color: "#f8fafc", fontWeight: 900 }}>{quest.title}</div>
                  <div style={{ color: "#94a3b8", fontSize: 12 }}>{quest.progress}/{quest.target} • {quest.rewardGold} Gold • {quest.rewardExp} EXP</div>
                </div>
                <button onClick={() => claimQuest(quest)} disabled={quest.progress < quest.target || quest.claimed} style={miniButton}>{quest.claimed ? "Done" : "Claim"}</button>
              </div>
            ))}
          </div>
        </section>

        <section style={panel}>
          <div style={sectionTitle}>Town Actions</div>
          <div style={actionGrid}>
            <Button onClick={() => setScreen("dungeon")}>Dungeon Portal</Button>
            <Button onClick={() => setScreen("skills")} tone="quiet">Skill Tree</Button>
            <Button onClick={() => setScreen("nest")}>Nest Board</Button>
            <Button onClick={claimSupply} tone="quiet">Daily Supply</Button>
          </div>
        </section>
      </>
    );
  }

  function renderDungeon() {
    return (
      <section style={panel}>
        <div style={sectionTitle}>Dungeon Portal</div>
        <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 10 }}>Pilih stage, lalu monster akan muncul satu per satu di arena.</div>
        <div style={{ display: "grid", gap: 10 }}>
          {dungeonStages.map((stage) => (
            <div key={`${stage.chapter}-${stage.stage}`} style={rowCard}>
              <div>
                <div style={{ color: stage.bossStage ? "#fbbf24" : "#f8fafc", fontWeight: 900 }}>Chapter {stage.chapter}: {stage.name}</div>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>{stage.area} • Req {compactNumber(stage.requiredPower)} Power • Energy {DUNGEON_ENERGY_COST}</div>
              </div>
              <button onClick={() => startDungeon(stage)} style={miniButton}>Enter</button>
            </div>
          ))}
        </div>
      </section>
    );
  }

  function renderBattle() {
    if (!battle) return renderDungeon();
    const monster = battle.monsters[battle.monsterIndex];
    const monsterPercent = (battle.monsterHp / monster.hp) * 100;
    const hpPercent = (battle.playerHp / battle.maxPlayerHp) * 100;
    return (
      <section style={panel}>
        <div style={battleHero}>
          <div>
            <div style={{ color: monster.boss ? "#fbbf24" : "#67e8f9", fontWeight: 900, fontSize: 12 }}>{battle.title}</div>
            <h1 style={{ margin: "4px 0", fontSize: 24 }}>{monster.name}</h1>
            <div style={{ color: "#cbd5e1", fontSize: 12 }}>Wave {battle.monsterIndex + 1}/{battle.monsters.length}</div>
          </div>
          <div style={{ fontSize: 54 }}>{monster.boss ? "🐲" : "👹"}</div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={barLabel}><span>{monster.name} HP</span><span>{compactNumber(battle.monsterHp)}/{compactNumber(monster.hp)}</span></div>
          <ProgressBar value={monsterPercent} tone={monster.boss ? "boss" : "danger"} />
        </div>
        <BattleArena
          character={character}
          monster={monster}
          fx={battleFx}
          playerHpPercent={hpPercent}
          monsterHpPercent={monsterPercent}
          statusLabel={battleFx ? battleFx.label : "Ready"}
        />
        <div style={{ marginTop: 12 }}>
          <div style={barLabel}><span>{character?.name} HP</span><span>{compactNumber(battle.playerHp)}/{compactNumber(battle.maxPlayerHp)}</span></div>
          <ProgressBar value={hpPercent} />
        </div>

        <div style={{ ...actionGrid, marginTop: 14 }}>
          <Button onClick={basicAttack} disabled={battle.playerHp <= 0}>Attack</Button>
          {skills.slice(0, 3).map((skill) => (
            <Button key={skill.name} onClick={() => castSkill(skill)} disabled={battle.playerHp <= 0} tone={skill.kind === "heal" ? "quiet" : "primary"}>{skill.name}</Button>
          ))}
          {battle.playerHp <= 0 && <Button onClick={() => { setBattle(null); setBattleFx(null); }} tone="danger">Leave Battle</Button>}
        </div>

        <div style={{ ...sectionTitle, marginTop: 16 }}>Battle Log</div>
        <div style={{ display: "grid", gap: 6 }}>
          {battle.log.map((line, index) => <div key={`${line}-${index}`} style={logLine}>{line}</div>)}
        </div>
      </section>
    );
  }

  function renderNest() {
    return (
      <section style={panel}>
        <div style={sectionTitle}>Nest Board</div>
        <div style={{ display: "grid", gap: 10 }}>
          {nestRaids.map((raid) => (
            <div key={raid.name} style={rowCard}>
              <div>
                <div style={{ color: "#f8fafc", fontWeight: 900 }}>{raid.name}</div>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>Boss {raid.boss.name} • HP {compactNumber(raid.boss.hp)} • Energy {NEST_ENERGY_COST}</div>
              </div>
              <button onClick={() => startNest(raid)} style={miniButton}>Raid</button>
            </div>
          ))}
        </div>
      </section>
    );
  }

  function renderInventory() {
    return (
      <section style={panel}>
        <div style={sectionTitle}>Equipment</div>
        <div style={slotGrid}>
          {equipmentSlots.map((slot) => {
            const item = equipment[slot];
            return (
              <div key={slot} style={statPill}>
                <div style={{ color: "#94a3b8", fontSize: 11 }}>{slot}</div>
                <div style={{ color: item ? rarityColor[item.rarity] : "#64748b", fontWeight: 900 }}>{item ? item.name : "Empty"}</div>
              </div>
            );
          })}
        </div>
        <div style={{ ...sectionTitle, marginTop: 16 }}>Inventory</div>
        <div style={{ display: "grid", gap: 8 }}>
          {inventory.length === 0 && <div style={emptyState}>No loot yet. Clear dungeon or Nest.</div>}
          {inventory.map((item) => (
            <div key={item.id} style={rowCard}>
              <div>
                <div style={{ color: rarityColor[item.rarity], fontWeight: 900 }}>{item.name}</div>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>{item.slot} • +{item.power} Power • +{item.attack} ATK • +{item.hp} HP</div>
              </div>
              <button onClick={() => equipItem(item)} style={miniButton}>Equip</button>
            </div>
          ))}
        </div>
      </section>
    );
  }

  function renderSkills() {
    return (
      <section style={panel}>
        <div style={sectionTitle}>Skill Tree</div>
        <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 10 }}>Skill Points: {skillPoints} • Setiap level memberi +1 SP.</div>
        <div style={{ display: "grid", gap: 8 }}>
          {skills.map((skill) => (
            <div key={skill.name} style={rowCard}>
              <div>
                <div style={{ color: skill.kind === "heal" ? "#86efac" : "#f8fafc", fontWeight: 900 }}>{skill.name}</div>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>Lv {skill.level} • {skill.kind === "heal" ? "Heal" : "Damage"} {skill.damage}</div>
              </div>
              <button onClick={() => trainSkill(skill)} style={miniButton}>+1 SP</button>
            </div>
          ))}
        </div>

        <div style={{ ...sectionTitle, marginTop: 16 }}>Job Advancement</div>
        <div style={{ display: "grid", gap: 8 }}>
          {character &&
            jobTree[character.class].map((job) => (
              <div key={job.name} style={rowCard}>
                <div>
                  <div style={{ color: character.level >= job.levelRequired ? "#f8fafc" : "#64748b", fontWeight: 900 }}>{character.class} → {job.name}</div>
                  <div style={{ color: "#94a3b8", fontSize: 12 }}>Need Lv {job.levelRequired} • Quest clear {jobQuestClears}</div>
                </div>
                <div style={{ display: "grid", gap: 6, minWidth: 86 }}>
                  <button onClick={() => startJobQuest(job)} disabled={character.level < job.levelRequired} style={miniButton}>Quest</button>
                  <button onClick={() => advanceJob(job)} disabled={!jobQuestReady} style={miniButton}>Change</button>
                </div>
              </div>
            ))}
        </div>
      </section>
    );
  }

  function renderArena() {
    const arenaMonster: Monster = { name: "Arena Rival", hp: 2600, attack: 230, exp: 0, gold: 0 };
    return (
      <section style={panel}>
        <div style={sectionTitle}>PvP Arena</div>
        <section style={gridThree}>
          <StatPill label="Rank" value={`#${arenaRank}`} />
          <StatPill label="Power" value={compactNumber(playerPower)} />
          <StatPill label="Class" value={character?.job ?? "-"} />
        </section>
        <BattleArena
          character={character}
          monster={arenaMonster}
          fx={battleFx}
          playerHpPercent={battleFx?.kind === "hit" ? 68 : 100}
          monsterHpPercent={battleFx?.kind === "slash" ? 42 : 100}
          statusLabel={battleFx ? (battleFx.kind === "hit" ? "Counter!" : "Opening Strike!") : "Waiting for match"}
        />
        <Button onClick={enterArena}>Start Match</Button>
      </section>
    );
  }

  function renderGuild() {
    const guildMonster: Monster = { name: "Guild Raid Boss", hp: 4800, attack: 310, exp: 0, gold: 0, boss: true };
    return (
      <section style={panel}>
        <div style={sectionTitle}>Guild</div>
        {!guild ? (
          <div style={{ display: "grid", gap: 10 }}>
            <input value={guildName} onChange={(event) => setGuildName(event.target.value)} placeholder="Guild name" style={inputStyle} />
            <Button onClick={createGuild}>Create Guild</Button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={rowCard}>
              <div>
                <div style={{ color: "#f8fafc", fontWeight: 900 }}>{guild.name} [{guild.tag}]</div>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>Level {guild.level} • {guild.members} members • Damage {compactNumber(guild.raidDamage)}</div>
              </div>
            </div>
            <div style={actionGrid}>
              <Button onClick={guildRaid}>Guild Raid</Button>
              <Button onClick={donateGuild} tone="quiet">Guild Donation</Button>
            </div>
            <BattleArena
              character={character}
              monster={guildMonster}
              fx={battleFx}
              playerHpPercent={100}
              monsterHpPercent={battleFx?.kind === "skill" ? 58 : 100}
              statusLabel={battleFx ? "Guild Burst!" : "Raid training ground"}
            />
          </div>
        )}
      </section>
    );
  }

  function renderScreen() {
    if (!character || screen === "character-create") return renderCharacterCreate();
    if (screen === "town") return renderTown();
    if (screen === "dungeon") return renderDungeon();
    if (screen === "battle") return renderBattle();
    if (screen === "nest") return renderNest();
    if (screen === "inventory") return renderInventory();
    if (screen === "skills") return renderSkills();
    if (screen === "arena") return renderArena();
    if (screen === "guild") return renderGuild();
    return renderTown();
  }

  return (
    <main style={appShell}>
      <div style={phoneFrame}>
        <header style={topBar}>
          <div>
            <div style={{ fontSize: 11, color: "#38bdf8", fontWeight: 900 }}>Telegram Mini RPG</div>
            <div style={{ color: "#f8fafc", fontWeight: 950 }}>Dragon Nest Adventure</div>
          </div>
          <div style={{ textAlign: "right", color: "#cbd5e1", fontSize: 12 }}>🪙 {compactNumber(gold)} &nbsp; 💎 {diamond} &nbsp; ⚡ {energy}</div>
        </header>

        <div style={content}>{renderScreen()}</div>

        {character && (
          <nav style={bottomNav}>
            {navItems.map((item) => (
              <button key={item.id} onClick={() => setScreen(item.id)} aria-label={item.label} title={item.label} style={{ ...navButton, color: screen === item.id ? "#67e8f9" : "#94a3b8", background: screen === item.id ? "#083344" : "transparent" }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 800 }}>{item.label}</span>
              </button>
            ))}
          </nav>
        )}

        {toast && <div style={{ ...toastStyle, borderColor: toast.tone === "success" ? "#10b981" : toast.tone === "error" ? "#ef4444" : "#38bdf8" }}>{toast.message}</div>}
      </div>
    </main>
  );
}

const appShell: React.CSSProperties = {
  minHeight: "100vh",
  background: "#020617",
  color: "#f8fafc",
  display: "flex",
  justifyContent: "center",
  padding: "16px 8px",
};

const phoneFrame: React.CSSProperties = {
  width: "100%",
  maxWidth: 430,
  minHeight: "calc(100vh - 32px)",
  background: "#07111f",
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 18,
  overflow: "hidden",
  position: "relative",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 22px 70px rgba(0,0,0,.42)",
};

const topBar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "14px 16px",
  borderBottom: "1px solid rgba(255,255,255,.1)",
  background: "#0b1220",
};

const content: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: 14,
  paddingBottom: 102,
};

const panel: React.CSSProperties = {
  background: "#0b1220",
  border: "1px solid rgba(255,255,255,.11)",
  borderRadius: 8,
  padding: 14,
  marginTop: 12,
};

const cutscenePanel: React.CSSProperties = {
  background: "linear-gradient(135deg, #134e4a, #4338ca 56%, #7f1d1d)",
  border: "1px solid rgba(255,255,255,.16)",
  borderRadius: 8,
  padding: 16,
};

const townPanel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
  background: "linear-gradient(135deg, #155e75, #374151 48%, #713f12)",
  border: "1px solid rgba(255,255,255,.16)",
  borderRadius: 8,
  padding: 16,
};

const battleHero: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
  background: "linear-gradient(135deg, #7f1d1d, #312e81 52%, #0f766e)",
  border: "1px solid rgba(255,255,255,.16)",
  borderRadius: 8,
  padding: 16,
};

const sectionTitle: React.CSSProperties = {
  color: "#f8fafc",
  fontWeight: 900,
  fontSize: 15,
  marginBottom: 10,
};

const gridThree: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 8,
  marginTop: 12,
  marginBottom: 12,
};

const twoColumn: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
};

const actionGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
};

const classGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
};

const slotGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
};

const statPill: React.CSSProperties = {
  background: "#111827",
  border: "1px solid rgba(255,255,255,.1)",
  borderRadius: 8,
  padding: "8px 10px",
  minWidth: 0,
};

const rowCard: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  background: "#111827",
  border: "1px solid rgba(255,255,255,.1)",
  borderRadius: 8,
  padding: 12,
};

const selectButton: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 8,
  color: "#f8fafc",
  padding: 10,
  minHeight: 78,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: 5,
  textAlign: "left",
  fontSize: 12,
};

const buttonStyle: React.CSSProperties = {
  minHeight: 42,
  border: "1px solid rgba(255,255,255,.14)",
  borderRadius: 8,
  fontWeight: 850,
  padding: "10px 12px",
  width: "100%",
};

const miniButton: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.14)",
  borderRadius: 8,
  background: "#155e75",
  color: "#f8fafc",
  fontWeight: 900,
  minWidth: 70,
  minHeight: 38,
  padding: "8px 10px",
};

const inputStyle: React.CSSProperties = {
  background: "#111827",
  border: "1px solid rgba(255,255,255,.14)",
  borderRadius: 8,
  color: "#f8fafc",
  minHeight: 42,
  padding: "0 12px",
  outline: "none",
};

const emptyState: React.CSSProperties = {
  color: "#94a3b8",
  background: "#111827",
  border: "1px dashed rgba(255,255,255,.14)",
  borderRadius: 8,
  padding: 12,
  fontSize: 13,
};

const barTrack: React.CSSProperties = {
  height: 12,
  background: "#111827",
  borderRadius: 999,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,.1)",
};

const barFill: React.CSSProperties = {
  height: "100%",
  borderRadius: 999,
  transition: "width .25s ease",
};

const barLabel: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  color: "#cbd5e1",
  fontSize: 12,
  fontWeight: 800,
  marginBottom: 6,
};

const logLine: React.CSSProperties = {
  color: "#cbd5e1",
  background: "#111827",
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 12,
};

const bottomNav: React.CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 4,
  padding: "8px 8px 10px",
  background: "#0b1220",
  borderTop: "1px solid rgba(255,255,255,.1)",
};

const navButton: React.CSSProperties = {
  border: 0,
  borderRadius: 8,
  minHeight: 48,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 2,
};

const toastStyle: React.CSSProperties = {
  position: "absolute",
  left: 14,
  right: 14,
  bottom: 92,
  background: "#020617",
  color: "#f8fafc",
  border: "1px solid",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 13,
  fontWeight: 800,
  boxShadow: "0 18px 40px rgba(0,0,0,.35)",
};
