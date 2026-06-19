"use client";

import { useEffect, useMemo, useState } from "react";

type HeroClass = "Warrior" | "Archer" | "Sorceress" | "Cleric" | "Assassin";
type HeroRarity = "N" | "R" | "SR" | "SSR" | "UR";
type Element = "Fire" | "Ice" | "Light" | "Dark";
type Screen =
  | "home"
  | "dungeon"
  | "arena"
  | "guild"
  | "market"
  | "heroes"
  | "boss"
  | "summon";

interface Hero {
  id: number;
  name: string;
  class: HeroClass;
  rarity: HeroRarity;
  level: number;
  power: number;
  hp: number;
  attack: number;
  element: Element;
  shards: number;
}

type Equipment = {
  id: number;
  name: string;
  slot: "Weapon" | "Armor" | "Accessory";
  rarity: HeroRarity;
  bonusPower: number;
};

type Guild = {
  name: string;
  tag: string;
  level: number;
  members: number;
  donation: number;
  raidDamage: number;
};

type Boss = {
  name: string;
  element: Element;
  hp: number;
  maxHp: number;
};

type Toast = {
  message: string;
  tone: "success" | "error" | "info";
};

type SaveData = {
  gold: number;
  diamond: number;
  energy: number;
  heroes: Hero[];
  equipment: Equipment[];
  guild: Guild | null;
  arenaRank: number;
  boss: Boss;
};

const SAVE_KEY = "dragon-nest-telegram-mini-app";
const SUMMON_COST = 250;
const DUNGEON_ENERGY_COST = 8;
const BOSS_ENERGY_COST = 12;

const heroClasses: HeroClass[] = [
  "Warrior",
  "Archer",
  "Sorceress",
  "Cleric",
  "Assassin",
];

const bosses = ["Sea Dragon", "Black Dragon", "Red Dragon", "Green Dragon"];

const heroNames: Record<HeroClass, string[]> = {
  Warrior: ["Argenta Blade", "Velskud Guard", "Iron Saint", "Moonlord"],
  Archer: ["Windwalker", "Sniper Rose", "Tempest Lira", "Falcon Eye"],
  Sorceress: ["Elestra", "Saleana", "Majesty", "Smasher"],
  Cleric: ["Guardian", "Saint Noah", "Crusader", "Inquisitor"],
  Assassin: ["Raven", "Ripper", "Light Fury", "Abyss Walker"],
};

const rarityColor: Record<HeroRarity, string> = {
  N: "#94a3b8",
  R: "#7dd3fc",
  SR: "#a78bfa",
  SSR: "#f59e0b",
  UR: "#fb7185",
};

const rarityMultiplier: Record<HeroRarity, number> = {
  N: 0.8,
  R: 1,
  SR: 1.35,
  SSR: 2.1,
  UR: 3.25,
};

const elementIcon: Record<Element, string> = {
  Fire: "🔥",
  Ice: "❄️",
  Light: "✨",
  Dark: "🌑",
};

const navItems: Array<{ id: Screen; icon: string; label: string }> = [
  { id: "home", icon: "🏠", label: "Home" },
  { id: "dungeon", icon: "⚔️", label: "Adventure" },
  { id: "boss", icon: "🐉", label: "Nest Raid" },
  { id: "summon", icon: "🎁", label: "Summon" },
  { id: "heroes", icon: "🦸", label: "Heroes" },
  { id: "arena", icon: "🏆", label: "Arena" },
  { id: "guild", icon: "🛡️", label: "Guild" },
  { id: "market", icon: "🛒", label: "Market" },
];

const dungeonStages = [
  { name: "Crystal Stream", element: "Ice" as Element, power: 900, reward: 180 },
  { name: "Ancient Armory", element: "Light" as Element, power: 1600, reward: 320 },
  { name: "Dark Banquet", element: "Dark" as Element, power: 2800, reward: 540 },
  { name: "Molten Nest", element: "Fire" as Element, power: 4200, reward: 760 },
];

const marketOffers = [
  { name: "Adventurer Pack", price: 550, gives: "Weapon +320 Power" },
  { name: "Guild Supply", price: 900, gives: "Armor +520 Power" },
  { name: "Dragon Cache", price: 12, diamond: true, gives: "Accessory +900 Power" },
];

function randomOf<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function compactNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return Math.floor(value).toString();
}

function summonRarity(): HeroRarity {
  const roll = Math.random();
  if (roll < 0.05) return "UR";
  if (roll < 0.2) return "SSR";
  if (roll < 0.62) return "SR";
  return "R";
}

function createHero(rarity: HeroRarity = summonRarity()): Hero {
  const heroClass = randomOf(heroClasses);
  const mult = rarityMultiplier[rarity];
  const hp = Math.floor((820 + Math.random() * 360) * mult);
  const attack = Math.floor((145 + Math.random() * 95) * mult);
  return {
    id: Date.now() + Math.floor(Math.random() * 10_000),
    name: randomOf(heroNames[heroClass]),
    class: heroClass,
    rarity,
    level: 1,
    power: Math.floor(hp * 0.42 + attack * 2.5),
    hp,
    attack,
    element: randomOf(["Fire", "Ice", "Light", "Dark"]),
    shards: 0,
  };
}

function createEquipment(slot?: Equipment["slot"]): Equipment {
  const pickedSlot = slot ?? randomOf(["Weapon", "Armor", "Accessory"]);
  const rarity = randomOf(["R", "SR", "SSR"] as HeroRarity[]);
  return {
    id: Date.now() + Math.floor(Math.random() * 10_000),
    name: `${rarity} Dragon ${pickedSlot}`,
    slot: pickedSlot,
    rarity,
    bonusPower: Math.floor(220 * rarityMultiplier[rarity] + Math.random() * 180),
  };
}

function createBoss(): Boss {
  const name = randomOf(bosses);
  const maxHp = 120_000 + Math.floor(Math.random() * 60_000);
  return {
    name,
    element: name.includes("Sea")
      ? "Ice"
      : name.includes("Black")
        ? "Dark"
        : name.includes("Red")
          ? "Fire"
          : "Light",
    hp: maxHp,
    maxHp,
  };
}

function initialHeroes() {
  return [createHero("SR"), createHero("R"), createHero("R")];
}

function resolveDungeon(totalPower: number, stagePower: number) {
  return {
    victory: totalPower >= stagePower || Math.random() > 0.28,
    foundEquipment: Math.random() > 0.55,
  };
}

function rollBossDamage(totalPower: number) {
  return Math.max(4_000, Math.floor(totalPower * (1.8 + Math.random())));
}

function resolveArena(totalPower: number) {
  return {
    win: totalPower > 1800 || Math.random() > 0.35,
    rankGain: Math.floor(80 + Math.random() * 160),
  };
}

function rollGuildRaidDamage(totalPower: number) {
  return Math.floor(totalPower * (1.1 + Math.random()));
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
  const bg =
    tone === "danger"
      ? "#7f1d1d"
      : tone === "quiet"
        ? "#1f2937"
        : "#0f766e";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minHeight: 42,
        border: "1px solid rgba(255,255,255,.14)",
        borderRadius: 8,
        background: disabled ? "#1f2937" : bg,
        color: disabled ? "#64748b" : "#f8fafc",
        fontWeight: 800,
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
    <div
      style={{
        background: "#111827",
        border: "1px solid rgba(255,255,255,.1)",
        borderRadius: 8,
        padding: "8px 10px",
      }}
    >
      <div style={{ color: "#94a3b8", fontSize: 11 }}>{label}</div>
      <div style={{ color: "#f8fafc", fontWeight: 900 }}>{value}</div>
    </div>
  );
}

function HeroCard({ hero }: { hero: Hero }) {
  return (
    <div
      style={{
        background: "#0f172a",
        border: `1px solid ${rarityColor[hero.rarity]}66`,
        borderRadius: 8,
        padding: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <div>
          <div style={{ color: rarityColor[hero.rarity], fontWeight: 900 }}>
            {hero.rarity} {hero.name}
          </div>
          <div style={{ color: "#94a3b8", fontSize: 12 }}>
            {hero.class} • {elementIcon[hero.element]} {hero.element} • Lv {hero.level}
          </div>
        </div>
        <div style={{ color: "#facc15", fontWeight: 900 }}>
          {compactNumber(hero.power)}
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          marginTop: 10,
          color: "#cbd5e1",
          fontSize: 12,
        }}
      >
        <span>HP {compactNumber(hero.hp)}</span>
        <span>ATK {compactNumber(hero.attack)}</span>
      </div>
    </div>
  );
}

export default function DragonNestMiniApp() {
  const [screen, setScreen] = useState<Screen>("home");
  const [gold, setGold] = useState(1_800);
  const [diamond, setDiamond] = useState(35);
  const [energy, setEnergy] = useState(64);
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [guild, setGuild] = useState<Guild | null>(null);
  const [guildName, setGuildName] = useState("");
  const [arenaRank, setArenaRank] = useState(12_480);
  const [boss, setBoss] = useState<Boss>(() => createBoss());
  const [toast, setToast] = useState<Toast | null>(null);
  const [summonResult, setSummonResult] = useState<Hero | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    window.queueMicrotask(() => {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (raw) {
        try {
          const data = JSON.parse(raw) as SaveData;
          setGold(data.gold ?? 1_800);
          setDiamond(data.diamond ?? 35);
          setEnergy(data.energy ?? 64);
          setHeroes(data.heroes?.length ? data.heroes : initialHeroes());
          setEquipment(data.equipment ?? []);
          setGuild(data.guild ?? null);
          setArenaRank(data.arenaRank ?? 12_480);
          setBoss(data.boss ?? createBoss());
        } catch {
          setHeroes(initialHeroes());
        }
      } else {
        setHeroes(initialHeroes());
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const data: SaveData = {
      gold,
      diamond,
      energy,
      heroes,
      equipment,
      guild,
      arenaRank,
      boss,
    };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }, [arenaRank, boss, diamond, energy, equipment, gold, guild, heroes, loaded]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const totalPower = useMemo(
    () =>
      heroes.reduce((sum, hero) => sum + hero.power, 0) +
      equipment.reduce((sum, item) => sum + item.bonusPower, 0),
    [equipment, heroes],
  );

  const bestHero = useMemo(
    () => heroes.reduce<Hero | null>((best, hero) => (!best || hero.power > best.power ? hero : best), null),
    [heroes],
  );

  function notify(message: string, tone: Toast["tone"] = "info") {
    setToast({ message, tone });
  }

  function summonHero() {
    if (gold < SUMMON_COST) {
      notify("Gold tidak cukup untuk Hero Summon.", "error");
      return;
    }
    const hero = createHero();
    setGold((value) => value - SUMMON_COST);
    setHeroes((value) => [hero, ...value]);
    setSummonResult(hero);
    notify(`${hero.rarity} ${hero.name} bergabung.`, "success");
  }

  function runDungeon(stage: (typeof dungeonStages)[number]) {
    if (energy < DUNGEON_ENERGY_COST) {
      notify("Energy habis. Ambil supply harian dulu.", "error");
      return;
    }
    const { victory, foundEquipment } = resolveDungeon(totalPower, stage.power);
    setEnergy((value) => value - DUNGEON_ENERGY_COST);
    if (!victory) {
      setGold((value) => value + Math.floor(stage.reward * 0.35));
      notify("Party mundur, tapi membawa sebagian loot.", "info");
      return;
    }
    setGold((value) => value + stage.reward);
    setDiamond((value) => value + (stage.power >= 2800 ? 2 : 1));
    if (foundEquipment) setEquipment((value) => [createEquipment(), ...value]);
    notify(`Clear ${stage.name}: Gold, Diamond${foundEquipment ? ", Equipment" : ""}.`, "success");
  }

  function attackBoss() {
    if (energy < BOSS_ENERGY_COST) {
      notify("Butuh lebih banyak Energy untuk Nest Raid.", "error");
      return;
    }
    const damage = rollBossDamage(totalPower);
    const nextHp = Math.max(0, boss.hp - damage);
    setEnergy((value) => value - BOSS_ENERGY_COST);
    setBoss((value) => ({ ...value, hp: nextHp }));
    if (nextHp === 0) {
      setGold((value) => value + 1_800);
      setDiamond((value) => value + 8);
      setEquipment((value) => [createEquipment("Weapon"), ...value]);
      setHeroes((value) => value.map((hero, index) => (index === 0 ? { ...hero, shards: hero.shards + 15 } : hero)));
      notify("World Boss tumbang: Gold, Diamond, Equipment, Hero Shard.", "success");
    } else {
      notify(`${boss.name} menerima ${compactNumber(damage)} damage.`, "info");
    }
  }

  function resetBoss() {
    setBoss(createBoss());
    notify("Nest Raid baru dibuka.", "success");
  }

  function enterArena() {
    if (!bestHero) return;
    const { win, rankGain } = resolveArena(totalPower);
    if (win) {
      setArenaRank((value) => Math.max(1, value - rankGain));
      setGold((value) => value + 260);
      notify(`${bestHero.name} menang di PvP Arena.`, "success");
    } else {
      setArenaRank((value) => value + 40);
      notify("Arena kalah tipis. Upgrade party lalu coba lagi.", "error");
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
      members: 18,
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
    const damage = rollGuildRaidDamage(totalPower);
    setGuild((value) => (value ? { ...value, raidDamage: value.raidDamage + damage } : value));
    setGold((value) => value + 220);
    notify(`Guild Raid memberi ${compactNumber(damage)} damage.`, "success");
  }

  function buyMarketOffer(offer: (typeof marketOffers)[number]) {
    if (offer.diamond) {
      if (diamond < offer.price) {
        notify("Diamond tidak cukup.", "error");
        return;
      }
      setDiamond((value) => value - offer.price);
    } else {
      if (gold < offer.price) {
        notify("Gold tidak cukup.", "error");
        return;
      }
      setGold((value) => value - offer.price);
    }
    setEquipment((value) => [createEquipment(), ...value]);
    notify(`${offer.name} dibeli.`, "success");
  }

  function claimSupply() {
    setEnergy((value) => Math.min(100, value + 30));
    setGold((value) => value + 420);
    notify("Supply harian diklaim.", "success");
  }

  function renderScreen() {
    if (screen === "home") {
      return (
        <>
          <section style={heroPanel}>
            <div>
              <div style={{ color: "#67e8f9", fontWeight: 900, fontSize: 12 }}>
                Dragon Nest
              </div>
              <h1 style={{ margin: "4px 0", fontSize: 28, lineHeight: 1.05 }}>
                Mini App Telegram
              </h1>
              <div style={{ color: "#cbd5e1", fontSize: 13 }}>
                Party Power {compactNumber(totalPower)} • {heroes.length} Heroes
              </div>
            </div>
            <div style={{ fontSize: 54, lineHeight: 1 }}>🐉</div>
          </section>

          <section style={gridThree}>
            <StatPill label="Gold" value={`🪙 ${compactNumber(gold)}`} />
            <StatPill label="Diamond" value={`💎 ${compactNumber(diamond)}`} />
            <StatPill label="Energy" value={`⚡ ${energy}/100`} />
          </section>

          <section style={panel}>
            <div style={sectionTitle}>Quick Actions</div>
            <div style={actionGrid}>
              <Button onClick={() => setScreen("dungeon")}>⚔️ Adventure</Button>
              <Button onClick={() => setScreen("boss")}>🐉 Nest Raid</Button>
              <Button onClick={() => setScreen("summon")}>🎁 Hero Summon</Button>
              <Button onClick={claimSupply} tone="quiet">⚡ Claim Supply</Button>
            </div>
          </section>

          {bestHero && (
            <section style={panel}>
              <div style={sectionTitle}>Lead Hero</div>
              <HeroCard hero={bestHero} />
            </section>
          )}
        </>
      );
    }

    if (screen === "summon") {
      return (
        <section style={panel}>
          <div style={sectionTitle}>🎁 Hero Summon</div>
          <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 12 }}>
            Cost {SUMMON_COST} Gold • Rates: UR 5%, SSR 15%, SR 42%, R 38%
          </div>
          <Button onClick={summonHero} disabled={gold < SUMMON_COST}>
            Summon Hero
          </Button>
          {summonResult && (
            <div style={{ marginTop: 12 }}>
              <HeroCard hero={summonResult} />
            </div>
          )}
        </section>
      );
    }

    if (screen === "heroes") {
      return (
        <section style={panel}>
          <div style={sectionTitle}>🦸 Heroes</div>
          <div style={{ display: "grid", gap: 10 }}>
            {heroes.map((hero) => (
              <HeroCard key={hero.id} hero={hero} />
            ))}
          </div>
        </section>
      );
    }

    if (screen === "dungeon") {
      return (
        <section style={panel}>
          <div style={sectionTitle}>⚔️ Adventure Dungeon</div>
          <div style={{ display: "grid", gap: 10 }}>
            {dungeonStages.map((stage) => (
              <div key={stage.name} style={rowCard}>
                <div>
                  <div style={{ color: "#f8fafc", fontWeight: 900 }}>
                    {elementIcon[stage.element]} {stage.name}
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 12 }}>
                    Req {compactNumber(stage.power)} Power • Reward {stage.reward} Gold
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

    if (screen === "boss") {
      const hpPct = Math.round((boss.hp / boss.maxHp) * 100);
      return (
        <section style={panel}>
          <div style={sectionTitle}>🐉 World Boss</div>
          <div style={{ ...heroPanel, marginBottom: 12 }}>
            <div>
              <div style={{ color: rarityColor.UR, fontWeight: 900, fontSize: 22 }}>
                {boss.name}
              </div>
              <div style={{ color: "#cbd5e1", fontSize: 13 }}>
                {elementIcon[boss.element]} {boss.element} • Gold, Diamond, Equipment, Hero Shard
              </div>
            </div>
            <div style={{ fontSize: 44 }}>🐲</div>
          </div>
          <div style={barTrack}>
            <div style={{ ...barFill, width: `${hpPct}%` }} />
          </div>
          <div style={{ color: "#94a3b8", fontSize: 12, margin: "8px 0 12px" }}>
            HP {compactNumber(boss.hp)} / {compactNumber(boss.maxHp)}
          </div>
          <div style={actionGrid}>
            <Button onClick={attackBoss} disabled={boss.hp === 0}>
              ⚔️ Attack Raid
            </Button>
            <Button onClick={resetBoss} tone="quiet">
              🔄 New Boss
            </Button>
          </div>
        </section>
      );
    }

    if (screen === "arena") {
      return (
        <section style={panel}>
          <div style={sectionTitle}>🏆 PvP Arena</div>
          <section style={gridThree}>
            <StatPill label="Rank" value={`#${arenaRank}`} />
            <StatPill label="Power" value={compactNumber(totalPower)} />
            <StatPill label="Team" value={`${heroes.length}/5`} />
          </section>
          <Button onClick={enterArena}>Start Match</Button>
        </section>
      );
    }

    if (screen === "guild") {
      return (
        <section style={panel}>
          <div style={sectionTitle}>🛡️ Guild</div>
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
            <div style={{ display: "grid", gap: 12 }}>
              <div style={rowCard}>
                <div>
                  <div style={{ color: "#f8fafc", fontWeight: 900 }}>
                    {guild.name} [{guild.tag}]
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: 12 }}>
                    Level {guild.level} • {guild.members} members
                  </div>
                </div>
                <div style={{ color: "#facc15", fontWeight: 900 }}>
                  {compactNumber(guild.donation)}
                </div>
              </div>
              <div style={actionGrid}>
                <Button onClick={guildRaid}>Guild Raid</Button>
                <Button onClick={donateGuild} tone="quiet">Guild Donation</Button>
              </div>
              <div style={rowCard}>
                <div>
                  <div style={{ color: "#f8fafc", fontWeight: 900 }}>Guild Shop</div>
                  <div style={{ color: "#94a3b8", fontSize: 12 }}>
                    Member discount equipment supply
                  </div>
                </div>
                <button onClick={() => buyMarketOffer(marketOffers[0])} style={miniButton}>
                  Buy
                </button>
              </div>
            </div>
          )}
        </section>
      );
    }

    if (screen === "market") {
      return (
        <section style={panel}>
          <div style={sectionTitle}>🛒 Market</div>
          <div style={{ display: "grid", gap: 10 }}>
            {marketOffers.map((offer) => (
              <div key={offer.name} style={rowCard}>
                <div>
                  <div style={{ color: "#f8fafc", fontWeight: 900 }}>{offer.name}</div>
                  <div style={{ color: "#94a3b8", fontSize: 12 }}>{offer.gives}</div>
                </div>
                <button onClick={() => buyMarketOffer(offer)} style={miniButton}>
                  {offer.diamond ? "💎" : "🪙"} {offer.price}
                </button>
              </div>
            ))}
          </div>
          {equipment.length > 0 && (
            <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
              <div style={sectionTitle}>Equipment</div>
              {equipment.slice(0, 5).map((item) => (
                <div key={item.id} style={rowCard}>
                  <div>
                    <div style={{ color: rarityColor[item.rarity], fontWeight: 900 }}>
                      {item.name}
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: 12 }}>
                      {item.slot} • +{item.bonusPower} Power
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      );
    }
  }

  return (
    <main style={appShell}>
      <div style={phoneFrame}>
        <header style={topBar}>
          <div>
            <div style={{ fontSize: 11, color: "#38bdf8", fontWeight: 900 }}>
              Telegram Mini App
            </div>
            <div style={{ color: "#f8fafc", fontWeight: 950 }}>Dragon Nest</div>
          </div>
          <div style={{ textAlign: "right", color: "#cbd5e1", fontSize: 12 }}>
            🪙 {compactNumber(gold)} &nbsp; 💎 {diamond} &nbsp; ⚡ {energy}
          </div>
        </header>

        <div style={content}>{renderScreen()}</div>

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

const heroPanel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
  background: "linear-gradient(135deg, #164e63, #4c1d95 56%, #7f1d1d)",
  border: "1px solid rgba(255,255,255,.16)",
  borderRadius: 8,
  padding: 16,
};

const panel: React.CSSProperties = {
  background: "#0b1220",
  border: "1px solid rgba(255,255,255,.11)",
  borderRadius: 8,
  padding: 14,
  marginTop: 12,
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

const actionGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
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

const barTrack: React.CSSProperties = {
  height: 12,
  background: "#111827",
  borderRadius: 999,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,.1)",
};

const barFill: React.CSSProperties = {
  height: "100%",
  background: "linear-gradient(90deg, #ef4444, #f59e0b)",
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
