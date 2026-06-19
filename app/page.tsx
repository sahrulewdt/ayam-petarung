"use client";

import { useEffect, useMemo, useState } from "react";

type HeroClass = "Warrior" | "Archer" | "Sorceress" | "Cleric" | "Assassin";
type Gender = "Male" | "Female";
type Screen =
  | "character-create"
  | "home"
  | "dungeon"
  | "nest"
  | "arena"
  | "guild"
  | "inventory"
  | "skills";
type Rarity = "Common" | "Rare" | "Epic" | "Legendary";
type EquipmentSlot =
  | "Weapon"
  | "Helmet"
  | "Armor"
  | "Gloves"
  | "Shoes"
  | "Ring"
  | "Necklace";

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

const SAVE_KEY = "dragon-nest-character";
const DUNGEON_ENERGY_COST = 8;
const NEST_ENERGY_COST = 15;
const CLASS_LIST: HeroClass[] = [
  "Warrior",
  "Archer",
  "Sorceress",
  "Cleric",
  "Assassin",
];

const classStats: Record<
  HeroClass,
  { hp: number; attack: number; power: number; traits: string[] }
> = {
  Warrior: { hp: 1250, attack: 150, power: 720, traits: ["HP Tinggi", "Defense Tinggi"] },
  Archer: { hp: 900, attack: 220, power: 740, traits: ["Attack Tinggi", "Critical Tinggi"] },
  Sorceress: { hp: 820, attack: 260, power: 760, traits: ["Magic Damage Tinggi", "Area Skill"] },
  Cleric: { hp: 1180, attack: 165, power: 710, traits: ["Support", "Survival Tinggi"] },
  Assassin: { hp: 940, attack: 240, power: 755, traits: ["Burst Damage", "Mobilitas Tinggi"] },
};

const jobTree: Record<HeroClass, Job[]> = {
  Warrior: [
    { name: "Mercenary", levelRequired: 15 },
    { name: "Swordmaster", levelRequired: 15 },
    { name: "Barbarian", levelRequired: 45 },
    { name: "Destroyer", levelRequired: 45 },
    { name: "Moonlord", levelRequired: 45 },
    { name: "Gladiator", levelRequired: 45 },
  ],
  Archer: [
    { name: "Sharpshooter", levelRequired: 15 },
    { name: "Acrobat", levelRequired: 15 },
    { name: "Sniper", levelRequired: 45 },
    { name: "Artillery", levelRequired: 45 },
    { name: "Tempest", levelRequired: 45 },
    { name: "Windwalker", levelRequired: 45 },
  ],
  Sorceress: [
    { name: "Elemental Lord", levelRequired: 15 },
    { name: "Force User", levelRequired: 15 },
    { name: "Saleana", levelRequired: 45 },
    { name: "Elestra", levelRequired: 45 },
    { name: "Smasher", levelRequired: 45 },
    { name: "Majesty", levelRequired: 45 },
  ],
  Cleric: [
    { name: "Priest", levelRequired: 15 },
    { name: "Paladin", levelRequired: 15 },
    { name: "Saint", levelRequired: 45 },
    { name: "Inquisitor", levelRequired: 45 },
    { name: "Guardian", levelRequired: 45 },
    { name: "Crusader", levelRequired: 45 },
  ],
  Assassin: [
    { name: "Chaser", levelRequired: 15 },
    { name: "Bringer", levelRequired: 15 },
    { name: "Raven", levelRequired: 45 },
    { name: "Ripper", levelRequired: 45 },
    { name: "Light Fury", levelRequired: 45 },
    { name: "Abyss Walker", levelRequired: 45 },
  ],
};

const skillBook: Record<HeroClass, Skill[]> = {
  Warrior: [
    { name: "Slash", level: 1, damage: 140 },
    { name: "Dash", level: 1, damage: 90 },
    { name: "Whirlwind", level: 1, damage: 230 },
    { name: "Triple Slash", level: 1, damage: 310 },
  ],
  Archer: [
    { name: "Twin Shot", level: 1, damage: 150 },
    { name: "Somersault Kick", level: 1, damage: 120 },
    { name: "Piercing Arrow", level: 1, damage: 250 },
    { name: "Rain of Arrows", level: 1, damage: 330 },
  ],
  Sorceress: [
    { name: "Fireball", level: 1, damage: 180 },
    { name: "Glacial Spike", level: 1, damage: 160 },
    { name: "Poison Cloud", level: 1, damage: 240 },
    { name: "Meteor Storm", level: 1, damage: 370 },
  ],
  Cleric: [
    { name: "Holy Bolt", level: 1, damage: 130 },
    { name: "Block", level: 1, damage: 80 },
    { name: "Lightning Relic", level: 1, damage: 240 },
    { name: "Divine Combo", level: 1, damage: 300 },
  ],
  Assassin: [
    { name: "Fan of Edge", level: 1, damage: 160 },
    { name: "Shadow Hand", level: 1, damage: 140 },
    { name: "Applause", level: 1, damage: 260 },
    { name: "Izuna Drop", level: 1, damage: 340 },
  ],
};

const equipmentSlots: EquipmentSlot[] = [
  "Weapon",
  "Helmet",
  "Armor",
  "Gloves",
  "Shoes",
  "Ring",
  "Necklace",
];

const rarityColor: Record<Rarity, string> = {
  Common: "#94a3b8",
  Rare: "#38bdf8",
  Epic: "#a78bfa",
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

const nestRaids = [
  { name: "Minotaur Nest", requiredPower: 1450, rewardGold: 850, rewardExp: 180 },
  { name: "Cerberus Nest", requiredPower: 2300, rewardGold: 1450, rewardExp: 300 },
  { name: "Sea Dragon Nest", requiredPower: 3900, rewardGold: 2600, rewardExp: 520 },
  { name: "Black Dragon Nest", requiredPower: 5800, rewardGold: 4200, rewardExp: 760 },
];

const navItems: Array<{ id: Screen; icon: string; label: string }> = [
  { id: "home", icon: "🏠", label: "Home" },
  { id: "dungeon", icon: "⚔️", label: "Dungeon" },
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
    {
      id: 1,
      title: "Clear Dungeon 5 kali",
      target: 5,
      progress: 0,
      rewardGold: 1000,
      rewardExp: 220,
      claimed: false,
    },
    {
      id: 2,
      title: "Kalahkan Boss Stage 2 kali",
      target: 2,
      progress: 0,
      rewardGold: 1500,
      rewardExp: 340,
      claimed: false,
    },
    {
      id: 3,
      title: "Selesaikan Nest 1 kali",
      target: 1,
      progress: 0,
      rewardGold: 1800,
      rewardExp: 420,
      claimed: false,
    },
  ];
}

function compactNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return Math.floor(value).toString();
}

function expToNextLevel(level: number) {
  return 100 + level * 55;
}

function totalEquipmentPower(equipment: Partial<Record<EquipmentSlot, Equipment>>) {
  return Object.values(equipment).reduce((sum, item) => sum + (item?.power ?? 0), 0);
}

function totalCharacterPower(
  character: PlayerCharacter | null,
  equipment: Partial<Record<EquipmentSlot, Equipment>>,
  pet: Pet | null,
) {
  if (!character) return 0;
  return character.power + totalEquipmentPower(equipment) + (pet?.powerBonus ?? 0);
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

  return {
    character: { ...character, exp, level, hp, attack, power },
    leveled,
  };
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

function resolveDungeonRun(playerPower: number, requiredPower: number) {
  return {
    win: playerPower >= requiredPower || Math.random() > 0.3,
    lootDropped: Math.random() > 0.48,
  };
}

function resolveArenaRun(playerPower: number) {
  return {
    win: playerPower >= 1600 || Math.random() > 0.38,
    rankGain: Math.floor(70 + Math.random() * 140),
  };
}

function rollNestDamage(playerPower: number) {
  return Math.floor(playerPower * (1.6 + Math.random() * 1.1));
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
  const background = tone === "danger" ? "#7f1d1d" : tone === "quiet" ? "#1f2937" : "#0f766e";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minHeight: 42,
        border: "1px solid rgba(255,255,255,.14)",
        borderRadius: 8,
        background: disabled ? "#1f2937" : background,
        color: disabled ? "#64748b" : "#f8fafc",
        fontWeight: 850,
        padding: "10px 12px",
        width: "100%",
      }}
    >
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

function ProgressBar({ value }: { value: number }) {
  return (
    <div style={barTrack}>
      <div style={{ ...barFill, width: `${Math.max(0, Math.min(100, value))}%` }} />
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
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    window.queueMicrotask(() => {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (raw) {
        try {
          const data = JSON.parse(raw) as SaveData;
          setCharacter(data.character ?? null);
          setGold(data.gold ?? 900);
          setDiamond(data.diamond ?? 20);
          setEnergy(data.energy ?? 70);
          setEquipment(data.equipment ?? {});
          setInventory(data.inventory ?? []);
          setQuests(data.quests ?? createQuests());
          setSkills(data.skills ?? (data.character ? skillBook[data.character.class] : skillBook.Warrior));
          setPet(data.pet ?? null);
          setGuild(data.guild ?? null);
          setArenaRank(data.arenaRank ?? 12800);
          setTutorialDone(data.tutorialDone ?? false);
          setScreen(data.character ? "home" : "character-create");
        } catch {
          setScreen("character-create");
        }
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const data: SaveData = {
      character,
      gold,
      diamond,
      energy,
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
  }, [
    arenaRank,
    character,
    diamond,
    energy,
    equipment,
    gold,
    guild,
    inventory,
    loaded,
    pet,
    quests,
    skills,
    tutorialDone,
  ]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const playerPower = useMemo(
    () => totalCharacterPower(character, equipment, pet),
    [character, equipment, pet],
  );

  const expPercent = character ? (character.exp / expToNextLevel(character.level)) * 100 : 0;
  const availableJobs = character ? jobTree[character.class].filter((job) => character.level >= job.levelRequired) : [];

  function notify(message: string, tone: Toast["tone"] = "info") {
    setToast({ message, tone });
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
    setTutorialDone(false);
    setScreen("home");
    notify("Welcome Adventurer. Tutorial dimulai.", "success");
  }

  function applyExp(gainExp: number) {
    if (!character) return 0;
    const result = levelCharacter(character, gainExp);
    setCharacter(result.character);
    return result.leveled;
  }

  function advanceQuest(id: number, amount = 1) {
    setQuests((current) =>
      current.map((quest) =>
        quest.id === id && !quest.claimed
          ? { ...quest, progress: Math.min(quest.target, quest.progress + amount) }
          : quest,
      ),
    );
  }

  function runDungeon(stage: DungeonStage) {
    if (!character) return;
    if (energy < DUNGEON_ENERGY_COST) {
      notify("Energy tidak cukup untuk dungeon.", "error");
      return;
    }
    const { win, lootDropped } = resolveDungeonRun(playerPower, stage.requiredPower);
    setEnergy((value) => value - DUNGEON_ENERGY_COST);
    if (!win) {
      setGold((value) => value + Math.floor(stage.rewardGold * 0.25));
      notify("Dungeon gagal, tapi kamu membawa sedikit loot.", "info");
      return;
    }

    const goldReward = Math.floor(stage.rewardGold * (1 + (pet?.goldBonus ?? 0) / 100));
    const leveled = applyExp(stage.rewardExp);
    setGold((value) => value + goldReward);
    setDiamond((value) => value + (stage.bossStage ? 2 : 0));
    if (lootDropped || stage.bossStage) setInventory((items) => [createEquipment(), ...items]);
    advanceQuest(1);
    if (stage.bossStage) advanceQuest(2);
    notify(
      `${stage.name} clear: +${stage.rewardExp} EXP${leveled ? `, Level +${leveled}` : ""}.`,
      "success",
    );
  }

  function runNest(raid: (typeof nestRaids)[number]) {
    if (!character) return;
    if (energy < NEST_ENERGY_COST) {
      notify("Energy tidak cukup untuk Nest.", "error");
      return;
    }
    const damage = rollNestDamage(playerPower);
    const win = damage >= raid.requiredPower * 2 || playerPower >= raid.requiredPower;
    setEnergy((value) => value - NEST_ENERGY_COST);
    if (!win) {
      notify(`${raid.name} terlalu kuat. Damage ${compactNumber(damage)}.`, "error");
      return;
    }
    const leveled = applyExp(raid.rewardExp);
    setGold((value) => value + raid.rewardGold);
    setDiamond((value) => value + 3);
    setInventory((items) => [createEquipment("Ring"), createEquipment("Necklace"), ...items]);
    advanceQuest(3);
    notify(`${raid.name} clear: Epic Gear, Dragon Jade, Gold${leveled ? ", Level Up" : ""}.`, "success");
  }

  function claimQuest(quest: Quest) {
    if (quest.progress < quest.target || quest.claimed) return;
    const leveled = applyExp(quest.rewardExp);
    setGold((value) => value + quest.rewardGold);
    setQuests((current) =>
      current.map((item) => (item.id === quest.id ? { ...item, claimed: true } : item)),
    );
    notify(`Quest reward diklaim${leveled ? " dan level naik" : ""}.`, "success");
  }

  function equipItem(item: Equipment) {
    setEquipment((current) => ({ ...current, [item.slot]: item }));
    setInventory((items) => items.filter((candidate) => candidate.id !== item.id));
    notify(`${item.name} equipped.`, "success");
  }

  function trainSkill(skill: Skill) {
    if (gold < 250) {
      notify("Gold tidak cukup untuk upgrade skill.", "error");
      return;
    }
    setGold((value) => value - 250);
    setSkills((current) =>
      current.map((item) =>
        item.name === skill.name
          ? { ...item, level: item.level + 1, damage: item.damage + 55 }
          : item,
      ),
    );
    notify(`${skill.name} naik level.`, "success");
  }

  function advanceJob(job: Job) {
    if (!character || character.level < job.levelRequired) return;
    setCharacter({ ...character, job: job.name, power: character.power + 180, attack: character.attack + 35 });
    notify(`Job Advancement: ${job.name}.`, "success");
  }

  function enterArena() {
    if (!character) return;
    const { win, rankGain } = resolveArenaRun(playerPower);
    if (win) {
      setArenaRank((rank) => Math.max(1, rank - rankGain));
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
    setGuild({
      name: clean,
      tag: clean.slice(0, 4).toUpperCase(),
      level: 1,
      members: 12,
      donation: 0,
      raidDamage: 0,
    });
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
    setGuild((value) =>
      value
        ? {
            ...value,
            donation: value.donation + 300,
            level: Math.min(10, Math.floor((value.donation + 300) / 1500) + 1),
          }
        : value,
    );
    notify("Guild Donation berhasil.", "success");
  }

  function guildRaid() {
    if (!guild) return;
    const damage = Math.floor(playerPower * 1.35);
    setGuild((value) => (value ? { ...value, raidDamage: value.raidDamage + damage } : value));
    setGold((value) => value + 180);
    notify(`Guild Raid damage ${compactNumber(damage)}.`, "success");
  }

  function claimSupply() {
    setEnergy((value) => Math.min(100, value + 30));
    setGold((value) => value + 350);
    notify("Supply harian diklaim.", "success");
  }

  function finishTutorial() {
    setTutorialDone(true);
    notify("Tutorial selesai. Prairie Town terbuka.", "success");
  }

  function renderCharacterCreate() {
    return (
      <section style={panel}>
        <div style={cutscenePanel}>
          <div style={{ color: "#67e8f9", fontWeight: 900, fontSize: 12 }}>Welcome Adventurer</div>
          <h1 style={{ margin: "4px 0", fontSize: 26, lineHeight: 1.05 }}>Choose Your Class</h1>
          <div style={{ color: "#cbd5e1", fontSize: 13 }}>Create Your Hero, then begin the tutorial.</div>
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          <input
            value={nameInput}
            onChange={(event) => setNameInput(event.target.value)}
            placeholder="Character name"
            style={inputStyle}
          />

          <div style={classGrid}>
            {CLASS_LIST.map((className) => (
              <button
                key={className}
                onClick={() => setSelectedClass(className)}
                style={{
                  ...selectButton,
                  borderColor: selectedClass === className ? "#67e8f9" : "rgba(255,255,255,.12)",
                  background: selectedClass === className ? "#082f49" : "#111827",
                }}
              >
                <b>{className}</b>
                <span>{classStats[className].traits.join(" • ")}</span>
              </button>
            ))}
          </div>

          <div style={twoColumn}>
            <select value={selectedGender} onChange={(event) => setSelectedGender(event.target.value as Gender)} style={inputStyle}>
              <option>Male</option>
              <option>Female</option>
            </select>
            <select value={hair} onChange={(event) => setHair(event.target.value)} style={inputStyle}>
              <option>Short</option>
              <option>Long</option>
              <option>Ponytail</option>
              <option>Silver</option>
            </select>
            <select value={face} onChange={(event) => setFace(event.target.value)} style={inputStyle}>
              <option>Calm</option>
              <option>Brave</option>
              <option>Sharp</option>
              <option>Bright</option>
            </select>
            <select value={costume} onChange={(event) => setCostume(event.target.value)} style={inputStyle}>
              <option>Academy</option>
              <option>Mercenary</option>
              <option>Royal</option>
              <option>Shadow</option>
            </select>
          </div>

          <Button onClick={createCharacter}>Create Character</Button>
        </div>
      </section>
    );
  }

  function renderHome() {
    if (!character) return renderCharacterCreate();
    return (
      <>
        <section style={heroPanel}>
          <div>
            <div style={{ color: "#67e8f9", fontWeight: 900, fontSize: 12 }}>
              {character.gender} {character.class}
            </div>
            <h1 style={{ margin: "4px 0", fontSize: 26, lineHeight: 1.05 }}>{character.name}</h1>
            <div style={{ color: "#cbd5e1", fontSize: 13 }}>
              Lv {character.level} {character.job} • Power {compactNumber(playerPower)}
            </div>
          </div>
          <div style={{ fontSize: 50, lineHeight: 1 }}>{character.class === "Warrior" ? "🗡️" : character.class === "Archer" ? "🏹" : character.class === "Sorceress" ? "🔮" : character.class === "Cleric" ? "🛡️" : "🗡️"}</div>
        </section>

        <section style={gridThree}>
          <StatPill label="Gold" value={`🪙 ${compactNumber(gold)}`} />
          <StatPill label="Diamond" value={`💎 ${diamond}`} />
          <StatPill label="Energy" value={`⚡ ${energy}/100`} />
        </section>

        <section style={panel}>
          <div style={sectionTitle}>Character Progression</div>
          <ProgressBar value={expPercent} />
          <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 8 }}>
            EXP {character.exp}/{expToNextLevel(character.level)} • HP {compactNumber(character.hp + (pet?.hpBonus ?? 0))} • ATK {compactNumber(character.attack + (pet?.attackBonus ?? 0))}
          </div>
        </section>

        {!tutorialDone && (
          <section style={panel}>
            <div style={sectionTitle}>Tutorial</div>
            <div style={{ color: "#cbd5e1", fontSize: 13, marginBottom: 10 }}>
              Captain Deckard gives you a starter weapon and sends you to Prairie Town Stage 1.
            </div>
            <Button onClick={finishTutorial}>Start Adventure</Button>
          </section>
        )}

        <section style={panel}>
          <div style={sectionTitle}>Quests</div>
          <div style={{ display: "grid", gap: 8 }}>
            {quests.map((quest) => (
              <div key={quest.id} style={rowCard}>
                <div>
                  <div style={{ color: "#f8fafc", fontWeight: 900 }}>{quest.title}</div>
                  <div style={{ color: "#94a3b8", fontSize: 12 }}>
                    {quest.progress}/{quest.target} • {quest.rewardGold} Gold • {quest.rewardExp} EXP
                  </div>
                </div>
                <button
                  onClick={() => claimQuest(quest)}
                  disabled={quest.progress < quest.target || quest.claimed}
                  style={miniButton}
                >
                  {quest.claimed ? "Done" : "Claim"}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section style={panel}>
          <div style={sectionTitle}>Quick Actions</div>
          <div style={actionGrid}>
            <Button onClick={() => setScreen("dungeon")}>⚔️ Dungeon</Button>
            <Button onClick={() => setScreen("inventory")} tone="quiet">🎒 Equipment</Button>
            <Button onClick={() => setScreen("nest")}>🐉 Nest</Button>
            <Button onClick={claimSupply} tone="quiet">⚡ Supply</Button>
          </div>
        </section>
      </>
    );
  }

  function renderDungeon() {
    return (
      <section style={panel}>
        <div style={sectionTitle}>Story Dungeon</div>
        <div style={{ display: "grid", gap: 10 }}>
          {dungeonStages.map((stage) => (
            <div key={`${stage.chapter}-${stage.stage}`} style={rowCard}>
              <div>
                <div style={{ color: stage.bossStage ? "#fbbf24" : "#f8fafc", fontWeight: 900 }}>
                  Chapter {stage.chapter}: {stage.name}
                </div>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>
                  {stage.area} • Req {compactNumber(stage.requiredPower)} Power • +{stage.rewardExp} EXP
                </div>
              </div>
              <button onClick={() => runDungeon(stage)} style={miniButton}>
                Run
              </button>
            </div>
          ))}
        </div>
      </section>
    );
  }

  function renderNest() {
    return (
      <section style={panel}>
        <div style={sectionTitle}>Nest</div>
        <div style={{ display: "grid", gap: 10 }}>
          {nestRaids.map((raid) => (
            <div key={raid.name} style={rowCard}>
              <div>
                <div style={{ color: "#f8fafc", fontWeight: 900 }}>{raid.name}</div>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>
                  Req {compactNumber(raid.requiredPower)} • Epic Gear, Dragon Jade, Gold
                </div>
              </div>
              <button onClick={() => runNest(raid)} style={miniButton}>
                Raid
              </button>
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
                <div style={{ color: item ? rarityColor[item.rarity] : "#64748b", fontWeight: 900 }}>
                  {item ? item.name : "Empty"}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ ...sectionTitle, marginTop: 16 }}>Inventory</div>
        <div style={{ display: "grid", gap: 8 }}>
          {inventory.length === 0 && <div style={emptyState}>No loot yet. Run dungeon or Nest.</div>}
          {inventory.map((item) => (
            <div key={item.id} style={rowCard}>
              <div>
                <div style={{ color: rarityColor[item.rarity], fontWeight: 900 }}>{item.name}</div>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>
                  {item.slot} • +{item.power} Power • +{item.attack} ATK
                </div>
              </div>
              <button onClick={() => equipItem(item)} style={miniButton}>
                Equip
              </button>
            </div>
          ))}
        </div>

        {pet && (
          <>
            <div style={{ ...sectionTitle, marginTop: 16 }}>Pet</div>
            <div style={rowCard}>
              <div>
                <div style={{ color: rarityColor[pet.rarity], fontWeight: 900 }}>{pet.name}</div>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>
                  +{pet.powerBonus} Power • +{pet.attackBonus} ATK • +{pet.hpBonus} HP • Gold +{pet.goldBonus}%
                </div>
              </div>
            </div>
          </>
        )}
      </section>
    );
  }

  function renderSkills() {
    return (
      <section style={panel}>
        <div style={sectionTitle}>Skills & Job Advancement</div>
        <div style={{ display: "grid", gap: 8 }}>
          {skills.map((skill) => (
            <div key={skill.name} style={rowCard}>
              <div>
                <div style={{ color: "#f8fafc", fontWeight: 900 }}>{skill.name}</div>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>
                  Lv {skill.level} • Damage {skill.damage}
                </div>
              </div>
              <button onClick={() => trainSkill(skill)} style={miniButton}>
                Train
              </button>
            </div>
          ))}
        </div>

        <div style={{ ...sectionTitle, marginTop: 16 }}>Job Advancement</div>
        <div style={{ display: "grid", gap: 8 }}>
          {character &&
            jobTree[character.class].map((job) => (
              <div key={job.name} style={rowCard}>
                <div>
                  <div style={{ color: availableJobs.some((item) => item.name === job.name) ? "#f8fafc" : "#64748b", fontWeight: 900 }}>
                    {job.name}
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 12 }}>Level Required {job.levelRequired}</div>
                </div>
                <button
                  onClick={() => advanceJob(job)}
                  disabled={!availableJobs.some((item) => item.name === job.name)}
                  style={miniButton}
                >
                  Advance
                </button>
              </div>
            ))}
        </div>
      </section>
    );
  }

  function renderArena() {
    return (
      <section style={panel}>
        <div style={sectionTitle}>PvP Arena</div>
        <section style={gridThree}>
          <StatPill label="Rank" value={`#${arenaRank}`} />
          <StatPill label="Power" value={compactNumber(playerPower)} />
          <StatPill label="Class" value={character?.job ?? "-"} />
        </section>
        <Button onClick={enterArena}>Start Match</Button>
      </section>
    );
  }

  function renderGuild() {
    return (
      <section style={panel}>
        <div style={sectionTitle}>Guild</div>
        {!guild ? (
          <div style={{ display: "grid", gap: 10 }}>
            <input
              value={guildName}
              onChange={(event) => setGuildName(event.target.value)}
              placeholder="Guild name"
              style={inputStyle}
            />
            <Button onClick={createGuild}>Create Guild</Button>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={rowCard}>
              <div>
                <div style={{ color: "#f8fafc", fontWeight: 900 }}>
                  {guild.name} [{guild.tag}]
                </div>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>
                  Level {guild.level} • {guild.members} members • Damage {compactNumber(guild.raidDamage)}
                </div>
              </div>
            </div>
            <div style={actionGrid}>
              <Button onClick={guildRaid}>Guild Raid</Button>
              <Button onClick={donateGuild} tone="quiet">Guild Donation</Button>
            </div>
            <div style={rowCard}>
              <div>
                <div style={{ color: "#f8fafc", fontWeight: 900 }}>Guild Shop</div>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>Dragon Jade, guild potion, gear chest</div>
              </div>
              <button onClick={() => setInventory((items) => [createEquipment(), ...items])} style={miniButton}>
                Open
              </button>
            </div>
          </div>
        )}
      </section>
    );
  }

  function renderScreen() {
    if (!character || screen === "character-create") return renderCharacterCreate();
    if (screen === "home") return renderHome();
    if (screen === "dungeon") return renderDungeon();
    if (screen === "nest") return renderNest();
    if (screen === "inventory") return renderInventory();
    if (screen === "skills") return renderSkills();
    if (screen === "arena") return renderArena();
    if (screen === "guild") return renderGuild();
    return renderHome();
  }

  return (
    <main style={appShell}>
      <div style={phoneFrame}>
        <header style={topBar}>
          <div>
            <div style={{ fontSize: 11, color: "#38bdf8", fontWeight: 900 }}>Character RPG</div>
            <div style={{ color: "#f8fafc", fontWeight: 950 }}>Dragon Nest</div>
          </div>
          <div style={{ textAlign: "right", color: "#cbd5e1", fontSize: 12 }}>
            🪙 {compactNumber(gold)} &nbsp; 💎 {diamond} &nbsp; ⚡ {energy}
          </div>
        </header>

        <div style={content}>{renderScreen()}</div>

        {character && (
          <nav style={bottomNav}>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setScreen(item.id)}
                aria-label={item.label}
                title={item.label}
                style={{
                  ...navButton,
                  color: screen === item.id ? "#67e8f9" : "#94a3b8",
                  background: screen === item.id ? "#082f49" : "transparent",
                }}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 800 }}>{item.label}</span>
              </button>
            ))}
          </nav>
        )}

        {toast && (
          <div
            style={{
              ...toastStyle,
              borderColor:
                toast.tone === "success"
                  ? "#10b981"
                  : toast.tone === "error"
                    ? "#ef4444"
                    : "#38bdf8",
            }}
          >
            {toast.message}
          </div>
        )}
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
  paddingBottom: 96,
};

const panel: React.CSSProperties = {
  background: "#0b1220",
  border: "1px solid rgba(255,255,255,.11)",
  borderRadius: 8,
  padding: 14,
  marginTop: 12,
};

const cutscenePanel: React.CSSProperties = {
  background: "linear-gradient(135deg, #134e4a, #312e81 56%, #7f1d1d)",
  border: "1px solid rgba(255,255,255,.16)",
  borderRadius: 8,
  padding: 16,
};

const heroPanel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
  background: "linear-gradient(135deg, #164e63, #1e3a8a 52%, #4c1d95)",
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
  background: "linear-gradient(90deg, #22c55e, #38bdf8)",
  borderRadius: 999,
  transition: "width .25s ease",
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
  bottom: 86,
  background: "#020617",
  color: "#f8fafc",
  border: "1px solid",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 13,
  fontWeight: 800,
  boxShadow: "0 18px 40px rgba(0,0,0,.35)",
};
