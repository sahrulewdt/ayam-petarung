"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── TYPES ───────────────────────────────────────────────────────────────────
type TierId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20;

interface ChickenTier {
  tier: TierId;
  name: string;
  emoji: string;
  rarity: string;
  rarityColor: string;
  badgeColor: string;
  idlePerSec: number;
}

interface GridCell {
  tier: TierId;
  id: number;
}

type Screen = "main" | "farm" | "dig" | "spin" | "tasks" | "shop" | "leaderboard";

interface LeaderEntry {
  name: string;
  eggs: number;
  maxTier: number;
  date: string;
}

interface Toast {
  msg: string;
  type?: "info" | "err" | "success";
}

interface FloatItem {
  id: number;
  text: string;
  x: number;
  y: number;
}

interface TaskDef {
  id: string;
  label: string;
  type: "tap" | "merge" | "dig" | "earn";
  target: number;
  rewardEggs: number;
  rewardWorms: number;
}

interface SpinReward {
  label: string;
  eggs: number;
  worms: number;
  boost?: boolean;
  prob: number;
}

interface DigReward {
  label: string;
  eggs: number;
  worms: number;
  prob: number;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CHICKEN_TIERS: ChickenTier[] = [
  { tier: 1,  name: "Kampung",        emoji: "🐣", rarity: "Bibit",          rarityColor: "#9ca3af", badgeColor: "#6b7280", idlePerSec: 0.1       },
  { tier: 2,  name: "Sentul",         emoji: "🐥", rarity: "Tangguh",        rarityColor: "#4ade80", badgeColor: "#16a34a", idlePerSec: 0.3       },
  { tier: 3,  name: "Kedu",           emoji: "🐔", rarity: "Pilihan",        rarityColor: "#60a5fa", badgeColor: "#2563eb", idlePerSec: 0.8       },
  { tier: 4,  name: "Ciparage",       emoji: "🦆", rarity: "Unggul",         rarityColor: "#a78bfa", badgeColor: "#7c3aed", idlePerSec: 2.0       },
  { tier: 5,  name: "Gaok",           emoji: "🦅", rarity: "Petarung",       rarityColor: "#f472b6", badgeColor: "#be185d", idlePerSec: 5.0       },
  { tier: 6,  name: "Pelung",         emoji: "🦚", rarity: "Jawara",         rarityColor: "#fb923c", badgeColor: "#c2410c", idlePerSec: 12.0      },
  { tier: 7,  name: "Bekisar",        emoji: "🦜", rarity: "Jagoan",         rarityColor: "#34d399", badgeColor: "#047857", idlePerSec: 28.0      },
  { tier: 8,  name: "Bangkok",        emoji: "🐉", rarity: "Champion",       rarityColor: "#f87171", badgeColor: "#b91c1c", idlePerSec: 65.0      },
  { tier: 9,  name: "Birma",          emoji: "🌟", rarity: "Elite",          rarityColor: "#fde047", badgeColor: "#a16207", idlePerSec: 150.0     },
  { tier: 10, name: "Saigon",         emoji: "⚫", rarity: "Master",         rarityColor: "#c084fc", badgeColor: "#7e22ce", idlePerSec: 350.0     },
  { tier: 11, name: "Wangkas",        emoji: "🔥", rarity: "Raja Arena",     rarityColor: "#ff4500", badgeColor: "#cc3700", idlePerSec: 800.0     },
  { tier: 12, name: "Pama",           emoji: "⚔️", rarity: "Panglima",       rarityColor: "#00ced1", badgeColor: "#008b8b", idlePerSec: 1800.0    },
  { tier: 13, name: "Magon",          emoji: "🛡️", rarity: "Legenda",        rarityColor: "#ffd700", badgeColor: "#b8860b", idlePerSec: 4000.0    },
  { tier: 14, name: "Bagon",          emoji: "👹", rarity: "Mythic",         rarityColor: "#8a2be2", badgeColor: "#4b0082", idlePerSec: 9000.0    },
  { tier: 15, name: "Kelso",          emoji: "⚡", rarity: "Ancient",        rarityColor: "#00ff7f", badgeColor: "#006400", idlePerSec: 20000.0   },
  { tier: 16, name: "Roundhead",      emoji: "🌪️", rarity: "Immortal",       rarityColor: "#1e90ff", badgeColor: "#0000cd", idlePerSec: 45000.0   },
  { tier: 17, name: "Hatch",          emoji: "🌋", rarity: "Titan",          rarityColor: "#ff1493", badgeColor: "#c71585", idlePerSec: 100000.0  },
  { tier: 18, name: "Shamo",          emoji: "👁️", rarity: "Divine",         rarityColor: "#fffafa", badgeColor: "#696969", idlePerSec: 250000.0  },
  { tier: 19, name: "Cemani",         emoji: "🌑", rarity: "Sang Sakti",     rarityColor: "#000000", badgeColor: "#2f4f4f", idlePerSec: 600000.0  },
  { tier: 20, name: "Ayam Dewa Nusantara", emoji: "👑", rarity: "Dewa Nusantara", rarityColor: "#ff00ff", badgeColor: "#8b008b", idlePerSec: 1500000.0 }
];

const GRID_SIZE = 15;
const HATCH_COST = 30;
const BOOST_COST_WORMS = 10;
const WORM_COST = 40;
const SHOVEL_COST_EGGS = 40;
const BOOST_DURATION_MS = 5 * 60 * 1000;

const AUTO_TICKET_COST = 5;
const AUTO_DUR_MS = 60000; // 1 Menit
const AUTO_MERGE_CD_MS = 30000; // 30 Detik Cooldown

const SPIN_REWARDS: SpinReward[] = [
  { label: "100 🥚",   eggs: 100,  worms: 0,  prob: 30 },
  { label: "250 🥚",   eggs: 250,  worms: 0,  prob: 20 },
  { label: "500 🥚",   eggs: 500,  worms: 0,  prob: 15 },
  { label: "1000 🥚",  eggs: 1000, worms: 0,  prob: 10 },
  { label: "5 🪱",     eggs: 0,    worms: 5,  prob: 10 },
  { label: "20 🪱",    eggs: 0,    worms: 20, prob: 5  },
  { label: "2000 🥚",  eggs: 2000, worms: 0,  prob: 5  },
  { label: "x2 Boost!",eggs: 0,    worms: 0,  boost: true, prob: 5 },
];

const DIG_REWARDS: DigReward[] = [
  { label: "50 🥚",   eggs: 50,   worms: 0,  prob: 35 },
  { label: "150 🥚",  eggs: 150,  worms: 0,  prob: 25 },
  { label: "300 🥚",  eggs: 300,  worms: 0,  prob: 15 },
  { label: "500 🥚",  eggs: 500,  worms: 0,  prob: 10 },
  { label: "3 🪱",    eggs: 0,    worms: 3,  prob: 8  },
  { label: "10 🪱",   eggs: 0,    worms: 10, prob: 4  },
  { label: "1000 🥚", eggs: 1000, worms: 0,  prob: 2  },
  { label: "30 🪱",   eggs: 0,    worms: 30, prob: 1  },
];

const DAILY_TASKS: TaskDef[] = [
  { id: "tap100",  label: "Generate Ayam 5x",      type: "tap",   target: 5,   rewardEggs: 300, rewardWorms: 5  },
  { id: "merge3",  label: "Merge 3x",              type: "merge", target: 3,   rewardEggs: 200, rewardWorms: 8  },
  { id: "dig5",    label: "Scratch 5x",            type: "dig",   target: 5,   rewardEggs: 150, rewardWorms: 10 },
  { id: "earn500", label: "Kumpulkan 500 🥚",      type: "earn",  target: 500, rewardEggs: 400, rewardWorms: 0  },
];

const CHECKIN_REWARDS = [100, 200, 350, 500, 750, 1000, 2000];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function weightedPick<T extends { prob: number }>(pool: T[]): T {
  const total = pool.reduce((s, r) => s + r.prob, 0);
  let rand = Math.random() * total;
  for (const r of pool) {
    rand -= r.prob;
    if (rand <= 0) return r;
  }
  return pool[pool.length - 1];
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getTier(tier: TierId): ChickenTier {
  return CHICKEN_TIERS[(tier - 1) % CHICKEN_TIERS.length];
}

const SAVE_KEY = "ayam-petarung-v4";
const LEADER_KEY = "ayam-petarung-leaderboard";

function loadSave(): Record<string, unknown> | null {
  try {
    const s = localStorage.getItem(SAVE_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

// ─── WALKER COMPONENT ─────────────────────────────────────────────────────────
interface WalkerProps {
  tiers: ChickenTier[];
}

function Yard({ tiers }: WalkerProps) {
  return (
    <div style={{ width: "100%", height: 230, position: "relative", overflow: "hidden" }}>
      {/* Sky */}
      <div style={{ position: "absolute", inset: 0, height: 90, background: "#87ceeb" }} />
      <div style={{ position: "absolute", top: 10, left: 14, width: 30, height: 30, background: "#f5c518", borderRadius: "50%" }} />
      <div style={{ position: "absolute", top: 14, left: 75, width: 48, height: 16, background: "#fff", borderRadius: 20, opacity: 0.85 }} />
      <div style={{ position: "absolute", top: 22, left: 210, width: 34, height: 13, background: "#fff", borderRadius: 20, opacity: 0.8 }} />
      <div style={{ position: "absolute", top: 9, left: 305, width: 26, height: 11, background: "#fff", borderRadius: 20, opacity: 0.75 }} />

      {/* Grass */}
      <div style={{ position: "absolute", top: 90, left: 0, right: 0, bottom: 55, background: "#7ab648" }} />

      {/* Trees */}
      <Tree left={14} topSize={32} trunkH={22} />
      <Tree left={48} topSize={22} trunkH={15} topColor="#1d5c10" />
      <Tree left={122} topSize={26} trunkH={18} />

      {/* Coop */}
      <div style={{ position: "absolute", bottom: 55, right: 12, width: 58 }}>
        <div style={{ width: 0, height: 0, borderLeft: "30px solid transparent", borderRight: "30px solid transparent", borderBottom: "26px solid #b94020", margin: "0 auto" }} />
        <div style={{ width: 58, height: 46, background: "#d4a45a", border: "2px solid #a07030", borderRadius: "3px 3px 0 0", position: "relative", marginTop: -1 }}>
          <div style={{ width: 12, height: 10, background: "#87ceeb", border: "1px solid #a07030", borderRadius: 2, position: "absolute", top: 7, left: 5 }} />
          <div style={{ width: 16, height: 20, background: "#5a3010", borderRadius: "8px 8px 0 0", position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)" }} />
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 101, right: 74, fontSize: 10, background: "rgba(40,15,0,.6)", color: "#ffd080", padding: "1px 5px", borderRadius: 7, fontWeight: 700 }}>
        Kandang
      </div>

      {/* Walkers */}
      {tiers.map((t, i) => (
        <Walker key={t.tier} tier={t} index={i} />
      ))}

      {/* Ground */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 55, background: "#c8a05a", borderTop: "3px solid #a07840" }} />
      <div style={{ position: "absolute", bottom: 2, left: 0, right: 0, display: "flex", gap: 10, padding: "0 10px" }}>
        <div style={{ height: 3, flex: 1, background: "#8b6030", borderRadius: 2, opacity: 0.4 }} />
        <div style={{ height: 3, flex: 2, background: "#8b6030", borderRadius: 2, opacity: 0.35 }} />
        <div style={{ height: 3, flex: 1, background: "#8b6030", borderRadius: 2, opacity: 0.4 }} />
      </div>
    </div>
  );
}

interface TreeProps {
  left: number;
  topSize: number;
  trunkH: number;
  topColor?: string;
}

function Tree({ left, topSize, trunkH, topColor = "#2d7a1a" }: TreeProps) {
  return (
    <div style={{ position: "absolute", bottom: 55, left, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: topSize, height: topSize, background: topColor, borderRadius: "50%" }} />
      <div style={{ width: 8, height: trunkH, background: "#6b3a1a", borderRadius: 2, marginTop: -6 }} />
    </div>
  );
}

const WALKER_PARAMS = [
  { goRight: true,  dur: 7,  delay: 0,   size: 24, bottom: 60 },
  { goRight: false, dur: 9,  delay: 1.5, size: 22, bottom: 66 },
  { goRight: true,  dur: 6,  delay: 3.0, size: 20, bottom: 62 },
  { goRight: false, dur: 11, delay: 0.5, size: 24, bottom: 68 },
  { goRight: true,  dur: 8,  delay: 2.0, size: 22, bottom: 64 },
  { goRight: false, dur: 13, delay: 4.0, size: 20, bottom: 70 },
  { goRight: true,  dur: 10, delay: 1.0, size: 24, bottom: 63 },
  { goRight: false, dur: 7,  delay: 2.5, size: 22, bottom: 67 },
  { goRight: true,  dur: 9,  delay: 3.5, size: 20, bottom: 61 },
  { goRight: false, dur: 12, delay: 0.8, size: 24, bottom: 65 },
];

interface WalkerItemProps {
  tier: ChickenTier;
  index: number;
}

function Walker({ tier, index }: WalkerItemProps) {
  const p = WALKER_PARAMS[index % WALKER_PARAMS.length];
  const animName = `walk-${tier.tier}`;
  const from = p.goRight ? "-30px" : "380px";
  const to   = p.goRight ? "380px"  : "-30px";

  return (
    <>
      <style>{`
        @keyframes ${animName} {
          0%   { left: ${from}; }
          100% { left: ${to}; }
        }
      `}</style>
      <div style={{
        position: "absolute",
        bottom: p.bottom,
        fontSize: p.size,
        lineHeight: 1,
        pointerEvents: "none",
        animation: `${animName} ${p.dur}s linear ${p.delay}s infinite`,
        transform: p.goRight ? "scaleX(1)" : "scaleX(-1)",
        userSelect: "none",
      }}>
        {tier.emoji}
      </div>
    </>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Home() {
  const [now, setNow]             = useState(Date.now());
  const [eggs, setEggs]           = useState<number>(50);
  const [worms, setWorms]         = useState<number>(10);
  const [cekers, setCekers]       = useState<number>(3);
  const [grid, setGrid]           = useState<(GridCell | null)[]>(Array(GRID_SIZE).fill(null));
  const [screen, setScreen]       = useState<Screen>("farm");
  const [selectedCell, setSelectedCell] = useState<number | null>(null);

  const [boostActive, setBoostActive]   = useState(false);
  const [boostEndTime, setBoostEndTime] = useState(0);

  // Auto Tickets States
  const [autoMergeTix, setAutoMergeTix] = useState(0);
  const [autoGenTix, setAutoGenTix]     = useState(0);
  const [autoMergeEnd, setAutoMergeEnd] = useState(0);
  const [autoMergeCD, setAutoMergeCD]   = useState(0);
  const [autoGenEnd, setAutoGenEnd]     = useState(0);

  const [spinUsedToday, setSpinUsedToday] = useState(false);
  const [lastSpinDate, setLastSpinDate]   = useState("");
  const [spinResult, setSpinResult]       = useState<SpinReward | null>(null);
  const [spinning, setSpinning]           = useState(false);
  const [spinAngle, setSpinAngle]         = useState(0);

  const [isDigging, setIsDigging]     = useState(false);
  const [digResult, setDigResult]     = useState<DigReward | null>(null);

  const [taskProgress, setTaskProgress] = useState<Record<string, number>>({});
  const [taskClaimed, setTaskClaimed]   = useState<Record<string, boolean>>({});
  const [checkinDay, setCheckinDay]     = useState(0);
  const [checkinDate, setCheckinDate]   = useState("");

  const [toast, setToast]   = useState<Toast | null>(null);
  const [floats, setFloats] = useState<FloatItem[]>([]);
  const [taps, setTaps]     = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);

  const [musicOn, setMusicOn] = useState(false);

  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [playerName, setPlayerName]   = useState("");
  const [nameInput, setNameInput]     = useState("");

  const audioCtxRef  = useRef<AudioContext | null>(null);
  const bgStopRef    = useRef<(() => void) | null>(null);
  const floatId      = useRef(0);
  const idleRef      = useRef({ grid, boostActive, boostEndTime, autoGenEnd, eggs });

  // Update clock per second for UI timers
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Sync ref
  useEffect(() => { 
    idleRef.current = { grid, boostActive, boostEndTime, autoGenEnd, eggs }; 
  }, [grid, boostActive, boostEndTime, autoGenEnd, eggs]);

  // ── Load save ──
  useEffect(() => {
    const s = loadSave();
    if (!s) return;
    if (typeof s.eggs === "number")         setEggs(s.eggs);
    if (typeof s.worms === "number")        setWorms(s.worms);
    if (typeof s.cekers === "number")       setCekers(s.cekers);
    if (Array.isArray(s.grid))              setGrid(s.grid as (GridCell | null)[]);
    if (typeof s.boostEndTime === "number") {
      setBoostEndTime(s.boostEndTime as number);
      setBoostActive(Date.now() < (s.boostEndTime as number));
    }
    
    // Load Tickets
    if (typeof s.autoMergeTix === "number") setAutoMergeTix(s.autoMergeTix);
    if (typeof s.autoGenTix === "number")   setAutoGenTix(s.autoGenTix);
    if (typeof s.autoMergeEnd === "number") setAutoMergeEnd(s.autoMergeEnd);
    if (typeof s.autoMergeCD === "number")  setAutoMergeCD(s.autoMergeCD);
    if (typeof s.autoGenEnd === "number")   setAutoGenEnd(s.autoGenEnd);

    if (typeof s.spinUsedToday === "boolean") setSpinUsedToday(s.spinUsedToday);
    if (typeof s.lastSpinDate === "string") setLastSpinDate(s.lastSpinDate);
    if (s.taskProgress)                     setTaskProgress(s.taskProgress as Record<string, number>);
    if (s.taskClaimed)                      setTaskClaimed(s.taskClaimed as Record<string, boolean>);
    if (typeof s.checkinDay === "number")   setCheckinDay(s.checkinDay);
    if (typeof s.checkinDate === "string")  setCheckinDate(s.checkinDate);
    if (typeof s.taps === "number")         setTaps(s.taps);
    if (typeof s.totalEarned === "number")  setTotalEarned(s.totalEarned);
    if (typeof s.playerName === "string")   setPlayerName(s.playerName);
    
    try {
      const lb = localStorage.getItem(LEADER_KEY);
      if (lb) setLeaderboard(JSON.parse(lb) as LeaderEntry[]);
    } catch {}
  }, []);

  // ── Save ──
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        eggs, worms, cekers, grid, boostEndTime,
        autoMergeTix, autoGenTix, autoMergeEnd, autoMergeCD, autoGenEnd,
        spinUsedToday, lastSpinDate, taskProgress, taskClaimed,
        checkinDay, checkinDate, taps, totalEarned, playerName,
      }));
    } catch {}
  }, [eggs, worms, cekers, grid, boostEndTime, autoMergeTix, autoGenTix, autoMergeEnd, autoMergeCD, autoGenEnd, spinUsedToday, lastSpinDate, taskProgress, taskClaimed, checkinDay, checkinDate, taps, totalEarned, playerName]);

  // ── Reset spin daily ──
  useEffect(() => {
    if (lastSpinDate !== todayStr()) setSpinUsedToday(false);
  }, [lastSpinDate]);

  // ── Audio Engine (SFX & Music) ──
  function initAudio() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }

  function playMergeSound() {
    if (!musicOn) return;
    try {
      const ctx = initAudio();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }

  useEffect(() => {
    if (musicOn) startMusic();
    else stopMusic();
    return () => stopMusic();
  }, [musicOn]);

  function startMusic() {
    try {
      const ctx = initAudio();
      stopMusic();
      const notes = [329.63, 392.00, 440.00, 523.25, 659.25, 587.33];
      const seq   = [0, 1, 2, 3, 4, 3, 2, 1, 0, 2, 4, 5];
      let i = 0;
      let stopped = false;
      function playNext() {
        if (stopped || !audioCtxRef.current) return;
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.value = notes[seq[i % seq.length]];
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.45);
        i++;
        const tid = setTimeout(playNext, 450);
        bgStopRef.current = () => { stopped = true; clearTimeout(tid); };
      }
      playNext();
    } catch {}
  }

  function stopMusic() {
    bgStopRef.current?.();
    bgStopRef.current = null;
  }

  // ── Idle income ──
  useEffect(() => {
    const interval = setInterval(() => {
      const { grid: g, boostActive: ba, boostEndTime: bet } = idleRef.current;
      const mult = ba && Date.now() < bet ? 2 : 1;
      const earned = g.reduce((s, c) => s + (c ? getTier(c.tier).idlePerSec * mult : 0), 0);
      if (earned <= 0) return;
      setEggs(e => e + earned);
      setTotalEarned(t => t + earned);
      trackTask("earn", earned);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Boost expiry ──
  useEffect(() => {
    if (!boostActive) return;
    const ms = boostEndTime - Date.now();
    if (ms <= 0) { setBoostActive(false); return; }
    const t = setTimeout(() => { setBoostActive(false); showToast("Boost habis!"); }, ms);
    return () => clearTimeout(t);
  }, [boostActive, boostEndTime]);

  // ── Auto Merge Loop ──
  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() < autoMergeEnd) {
        setGrid(g => autoMergeGrid(g));
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [autoMergeEnd, musicOn]);

  // ── Auto Generate Loop ──
  useEffect(() => {
    const interval = setInterval(() => {
      const { grid: g, autoGenEnd: ae, eggs: curEggs } = idleRef.current;
      if (Date.now() < ae && curEggs >= HATCH_COST) {
        const empty = g.findIndex(c => c === null);
        if (empty !== -1) {
          setEggs(e => e - HATCH_COST);
          setGrid(prev => {
            const n = [...prev];
            if (n[empty] === null) n[empty] = { tier: 1, id: Date.now() };
            return n;
          });
          setTaps(t => t + 1);
          trackTask("tap");
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Toast ──
  function showToast(msg: string, type: Toast["type"] = "info") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }

  // ── Float numbers ──
  function addFloat(text: string, x: number, y: number) {
    const id = floatId.current++;
    setFloats(f => [...f, { id, text, x, y }]);
    setTimeout(() => setFloats(f => f.filter(fi => fi.id !== id)), 900);
  }

  // ── Task tracking ──
  const trackTask = useCallback((type: TaskDef["type"], amount = 1) => {
    setTaskProgress(prev => {
      const next = { ...prev };
      DAILY_TASKS.forEach(t => {
        if (t.type === type) next[t.id] = (next[t.id] || 0) + amount;
      });
      return next;
    });
  }, []);

  // ── Tap main ──
  function tapMain(e: React.MouseEvent<HTMLButtonElement>) {
    const mult = boostActive && Date.now() < boostEndTime ? 2 : 1;
    const gain = mult;
    setEggs(eg => eg + gain);
    setTotalEarned(t => t + gain);
    setTaps(t => t + 1);
    trackTask("tap");
    trackTask("earn", gain);
    const rect = e.currentTarget.getBoundingClientRect();
    addFloat(`+${gain}🥚`, e.clientX - rect.left, e.clientY - rect.top);
  }

  // ── Hatch ──
  function hatchChicken() {
    if (eggs < HATCH_COST) { showToast("Telur tidak cukup!", "err"); return; }
    const empty = grid.findIndex(c => c === null);
    if (empty === -1) { showToast("Grid penuh!", "err"); return; }
    setEggs(e => e - HATCH_COST);
    setGrid(g => { const n = [...g]; n[empty] = { tier: 1, id: Date.now() }; return n; });
    trackTask("tap");
    showToast("Ayam baru menetas! 🐣");
  }

  // ── Merge grid ──
  function cellClick(idx: number) {
    if (selectedCell === null) {
      if (!grid[idx]) return;
      setSelectedCell(idx);
    } else {
      if (selectedCell === idx) { setSelectedCell(null); return; }
      const a = grid[selectedCell];
      const b = grid[idx];
      if (a && b && a.tier === b.tier && a.tier < 20) {
        setGrid(g => {
          const n = [...g];
          n[selectedCell] = null;
          n[idx] = { tier: (a.tier + 1) as TierId, id: Date.now() };
          return n;
        });
        const newTier = getTier((a.tier + 1) as TierId);
        playMergeSound();
        showToast(`Merge! ${newTier.emoji} ${newTier.name} (${newTier.rarity})`);
        trackTask("merge");
      } else if (!b) {
        setGrid(g => {
          const n = [...g];
          n[idx] = a;
          n[selectedCell] = null;
          return n;
        });
      } else {
        setSelectedCell(idx);
        return;
      }
      setSelectedCell(null);
    }
  }

  function autoMergeGrid(g: (GridCell | null)[]): (GridCell | null)[] {
    const arr = [...g];
    for (let i = 0; i < arr.length; i++) {
      if (!arr[i] || arr[i]!.tier >= 20) continue;
      for (let j = i + 1; j < arr.length; j++) {
        if (!arr[j]) continue;
        if (arr[j]!.tier === arr[i]!.tier) {
          arr[j] = { tier: (arr[i]!.tier + 1) as TierId, id: Date.now() };
          arr[i] = null;
          playMergeSound();
          trackTask("merge");
          return arr;
        }
      }
    }
    return arr;
  }

  // ── Scratch (Dig) ──
  function doDig() {
    if (cekers < 1) { showToast("Ceker tidak cukup!", "err"); return; }
    if (isDigging) return;
    setCekers(c => c - 1);
    setDigResult(null);
    setIsDigging(true);
    setTimeout(() => {
      const r = weightedPick(DIG_REWARDS);
      setEggs(e => e + r.eggs);
      setWorms(w => w + r.worms);
      if (r.eggs) { setTotalEarned(t => t + r.eggs); trackTask("earn", r.eggs); }
      setDigResult(r);
      trackTask("dig");
      setIsDigging(false);
    }, 1500);
  }

  // ── Spin ──
  function doSpin() {
    if (spinUsedToday) { showToast("Spin harian sudah digunakan!", "err"); return; }
    if (spinning) return;
    setSpinning(true);
    setSpinResult(null);
    const result = weightedPick(SPIN_REWARDS);
    const idx    = SPIN_REWARDS.indexOf(result);
    const sectors = SPIN_REWARDS.length;
    const deg = 360 * 5 + (360 - (idx / sectors) * 360) - 180 / sectors;
    setSpinAngle(prev => prev + deg);
    setTimeout(() => {
      setEggs(e => e + result.eggs);
      setWorms(w => w + result.worms);
      if (result.boost) { setBoostActive(true); setBoostEndTime(Date.now() + BOOST_DURATION_MS); }
      if (result.eggs)  { setTotalEarned(t => t + result.eggs); trackTask("earn", result.eggs); }
      setSpinResult(result);
      setSpinUsedToday(true);
      setLastSpinDate(todayStr());
      setSpinning(false);
    }, 3200);
  }

  // ── Daily tasks ──
  function claimTask(task: TaskDef) {
    const prog = taskProgress[task.id] || 0;
    if (prog < task.target) { showToast("Misi belum selesai!", "err"); return; }
    if (taskClaimed[task.id]) { showToast("Sudah diklaim!", "err"); return; }
    setEggs(e => e + task.rewardEggs);
    setWorms(w => w + task.rewardWorms);
    if (task.rewardEggs) setTotalEarned(t => t + task.rewardEggs);
    setTaskClaimed(c => ({ ...c, [task.id]: true }));
    showToast(`+${task.rewardEggs}🥚 ${task.rewardWorms > 0 ? `+${task.rewardWorms}🪱` : ""} diklaim!`);
  }

  function doCheckin() {
    const today = todayStr();
    if (checkinDate === today) { showToast("Sudah check-in hari ini!", "err"); return; }
    const nextDay = checkinDay < 6 ? checkinDay + 1 : 0;
    const reward  = CHECKIN_REWARDS[nextDay] ?? CHECKIN_REWARDS[0];
    setEggs(e => e + reward);
    setTotalEarned(t => t + reward);
    setCheckinDay(nextDay);
    setCheckinDate(today);
    showToast(`Check-in hari ${nextDay + 1}: +${reward}🥚!`, "success");
  }

  // ── Auto Tickets Handlers ──
  function triggerAutoMerge() {
    if (autoMergeTix <= 0) { showToast("Tiket Auto-Merge habis!", "err"); return; }
    if (now < autoMergeEnd) { showToast("Auto-Merge masih aktif!", "err"); return; }
    if (now < autoMergeCD) { showToast(`Cooldown! Tunggu ${Math.ceil((autoMergeCD - now)/1000)}s`, "err"); return; }
    setAutoMergeTix(t => t - 1);
    setAutoMergeEnd(Date.now() + AUTO_DUR_MS);
    setAutoMergeCD(Date.now() + AUTO_DUR_MS + AUTO_MERGE_CD_MS);
    showToast("Auto-Merge Aktif! (1 Menit) 🤖", "success");
  }

  function triggerAutoGen() {
    if (autoGenTix <= 0) { showToast("Tiket Auto-Gen habis!", "err"); return; }
    if (now < autoGenEnd) { showToast("Auto-Generate masih aktif!", "err"); return; }
    setAutoGenTix(t => t - 1);
    setAutoGenEnd(Date.now() + AUTO_DUR_MS);
    showToast("Auto-Generate Aktif! (1 Menit) 🐣", "success");
  }

  // ── Shop ──
  function buyBoost() {
    if (worms < BOOST_COST_WORMS) { showToast("Cacing tidak cukup!", "err"); return; }
    setWorms(w => w - BOOST_COST_WORMS);
    setBoostActive(true);
    setBoostEndTime(Date.now() + BOOST_DURATION_MS);
    showToast("Boost x2 aktif 5 menit! ⚡");
  }

  function buyAutoMergeTix() {
    if (worms < AUTO_TICKET_COST) { showToast("Cacing tidak cukup!", "err"); return; }
    setWorms(w => w - AUTO_TICKET_COST);
    setAutoMergeTix(t => t + 1);
    showToast("+1 Tiket Auto-Merge dibeli! 🎫");
  }

  function buyAutoGenTix() {
    if (worms < AUTO_TICKET_COST) { showToast("Cacing tidak cukup!", "err"); return; }
    setWorms(w => w - AUTO_TICKET_COST);
    setAutoGenTix(t => t + 1);
    showToast("+1 Tiket Auto-Generate dibeli! 🎫");
  }

  function buyWorms() {
    if (eggs < WORM_COST) { showToast("Telur tidak cukup!", "err"); return; }
    setEggs(e => e - WORM_COST);
    setWorms(w => w + 5);
    showToast("+5 🪱 cacing dibeli!");
  }

  function buyCekers() {
    if (eggs < SHOVEL_COST_EGGS) { showToast("Telur tidak cukup!", "err"); return; }
    setEggs(e => e - SHOVEL_COST_EGGS);
    setCekers(c => c + 3);
    showToast("+3 🐾 ceker ayam dibeli!");
  }

  function clearGrid() {
    setGrid(Array(GRID_SIZE).fill(null));
    showToast("Kandang dikosongkan!", "info");
  }

  // ── Leaderboard ──
  function submitScore() {
    const name = nameInput.trim() || "Pemain";
    const entry: LeaderEntry = {
      name,
      eggs: Math.floor(totalEarned),
      maxTier: maxTierInGrid,
      date: todayStr(),
    };
    setPlayerName(name);
    setNameInput("");
    setLeaderboard(prev => {
      const filtered = prev.filter(e => e.name !== name);
      const updated  = [...filtered, entry].sort((a, b) => b.eggs - a.eggs).slice(0, 20);
      try { localStorage.setItem(LEADER_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
    showToast(`Skor ${name} disimpan! 🏆`, "success");
  }

  function clearLeaderboard() {
    setLeaderboard([]);
    try { localStorage.removeItem(LEADER_KEY); } catch {}
    showToast("Leaderboard direset!", "info");
  }

  // ── Derived values ──
  const totalIdle = grid.reduce((s, c) => {
    if (!c) return s;
    const base = getTier(c.tier).idlePerSec;
    return s + base * (boostActive && Date.now() < boostEndTime ? 2 : 1);
  }, 0);

  const maxTierInGrid = grid.reduce((m, c) => {
    if (c && c.tier > m) return c.tier;
    return m;
  }, 0);

  const walkingTiers = maxTierInGrid > 0
    ? CHICKEN_TIERS.slice(0, maxTierInGrid)
    : [];

  const chickenCount = grid.filter(Boolean).length;

  const isAmActive = now < autoMergeEnd;
  const isAmCD = now < autoMergeCD && !isAmActive;
  const isAgActive = now < autoGenEnd;

  // ─── NAV ITEMS ────────────────────────────────────────────────────────────
  const navItems: { key: Screen; label: string; emoji: string; bg: string; border: string }[] = [
    { key: "main",        label: "Home",       emoji: "🏠", bg: "#3a2210", border: "#8b5c2a" },
    { key: "farm",        label: "Kandang",    emoji: "🐔", bg: "#1a3010", border: "#4a7a1a" },
    { key: "dig",         label: "Scratch",    emoji: "🐾", bg: "#1a2a10", border: "#4a7a1a" },
    { key: "spin",        label: "Spin",       emoji: "🎡", bg: "#0a1a3a", border: "#185fa5" },
    { key: "tasks",       label: "Misi",       emoji: "📋", bg: "#3a1a10", border: "#c07820" },
    { key: "shop",        label: "Shop",       emoji: "🛒", bg: "#2a1020", border: "#7c3aed" },
    { key: "leaderboard", label: "Ranking",    emoji: "🏆", bg: "#1a1a00", border: "#a16207" },
  ];

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <main style={{ minHeight: "100vh", background: "#0a0a1a", color: "#f0e6c8", fontFamily: "system-ui,sans-serif", userSelect: "none" }}>
      <style>{`
        @keyframes floatUp { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-60px)} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
        @keyframes digWiggle { 0%,100%{transform:rotate(-12deg)} 50%{transform:rotate(12deg)} }
        .gbtn{transition:transform .1s,opacity .1s;cursor:pointer;}
        .gBtn:active{transform:scale(.93)!important;opacity:.85!important;}
        .mcell{transition:border-color .12s,transform .1s;}
        .mcell:active{transform:scale(.9);}
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "err" ? "#7f1d1d" : toast.type === "success" ? "#14532d" : "#1e3a5f",
          color: "#fff", padding: "8px 18px", borderRadius: 20, fontSize: 14,
          zIndex: 999, whiteSpace: "nowrap", pointerEvents: "none",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Float numbers */}
      {floats.map(f => (
        <div key={f.id} style={{
          position: "fixed", left: f.x, top: f.y, color: "#fbbf24",
          fontWeight: 700, fontSize: 18, pointerEvents: "none",
          animation: "floatUp .9s ease-out forwards", zIndex: 888,
        }}>
          {f.text}
        </div>
      ))}

      {/* ── TOP BAR ── */}
      <div style={{ background: "#111126", borderBottom: "1px solid #2d2d5e", padding: "8px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: "#fbbf24" }}>🐓 AYAM PETARUNG</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 13 }}>🥚 <b style={{ color: "#fbbf24" }}>{Math.floor(eggs).toLocaleString()}</b></span>
          <span style={{ fontSize: 13 }}>🪱 <b style={{ color: "#86efac" }}>{Math.floor(worms)}</b></span>
          <span style={{ fontSize: 13 }}>🐾 <b style={{ color: "#f97316" }}>{cekers}</b></span>
          <button onClick={() => { initAudio(); setMusicOn(m => !m); }} style={{ background: "none", border: "1px solid #3d3d6e", borderRadius: 8, color: musicOn ? "#fbbf24" : "#666", fontSize: 15, padding: "3px 7px", cursor: "pointer" }}>
            {musicOn ? "🔊" : "🔇"}
          </button>
        </div>
      </div>

      {/* ── YARD (always visible) ── */}
      <Yard tiers={walkingTiers} />

      {/* ── STAT BAR ── */}
      <div style={{ background: "#3a2210", padding: "7px 10px", display: "flex", alignItems: "center", gap: 8, borderTop: "2px solid #5a3418", borderBottom: "2px solid #5a3418" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#4a2e10", padding: "3px 10px", borderRadius: 20, border: "1.5px solid #8b5c2a" }}>
          <span style={{ fontSize: 17 }}>🥚</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#fbbf24" }}>{Math.floor(eggs).toLocaleString()}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#1a4a1a", padding: "3px 10px", borderRadius: 20, border: "1.5px solid #2d7a1a" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#86efac" }}>{totalIdle.toLocaleString()}/s</span>
          <span style={{ fontSize: 13 }}>🚀</span>
        </div>
        {boostActive && (
          <div style={{ background: "#b45309", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700, color: "#fef3c7" }}>⚡ x2</div>
        )}
        <div style={{ marginLeft: "auto", background: "#c07820", padding: "3px 9px", borderRadius: 12, border: "1.5px solid #f5c518", fontSize: 10, fontWeight: 700, color: "#fff5cc" }}>
          🏆 Bronze 1st ▶
        </div>
      </div>

      {/* ── NAV ── */}
      <div style={{ display: "flex", background: "#1a0e06", borderBottom: "1px solid #3a2210", overflowX: "auto" }}>
        {navItems.map(n => (
          <button key={n.key} onClick={() => setScreen(n.key)} style={{
            flex: "0 0 auto", padding: "8px 12px", background: screen === n.key ? "#2d1a08" : "none",
            border: "none", color: screen === n.key ? "#fbbf24" : "#a07840",
            fontWeight: screen === n.key ? 700 : 400, fontSize: 12, cursor: "pointer",
            borderBottom: screen === n.key ? "2px solid #fbbf24" : "2px solid transparent",
          }}>
            {n.emoji} {n.label}
          </button>
        ))}
      </div>

      {/* ── SCREENS ── */}
      <div style={{ padding: "14px 12px", maxWidth: 480, margin: "0 auto" }}>

        {/* HOME */}
        {screen === "main" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>

            {/* Stat cards */}
            <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ background: "#111130", border: "1px solid #2d2d5e", borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>Earn per Detik</div>
                <div style={{ fontWeight: 800, fontSize: 18, color: "#fbbf24" }}>{totalIdle.toLocaleString()} 🥚</div>
              </div>
              <div style={{ background: "#111130", border: "1px solid #2d2d5e", borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>Total Telur Dihasilkan</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#fbbf24" }}>{Math.floor(totalEarned).toLocaleString()} 🥚</div>
              </div>
            </div>

            {/* Fitur Otomatis */}
            <div style={{ width: "100%", background: "#111130", border: "1px solid #1e1e40", borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24", marginBottom: 8 }}>⚡ Fitur Otomatis</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                
                {/* Auto Merge */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1e1e40", padding: "10px", borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>🤖 Auto Merge</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>Tiket: <b style={{ color: "#fff" }}>{autoMergeTix}</b></div>
                  </div>
                  {isAmActive ? (
                    <div style={{ fontSize: 11, color: "#86efac", fontWeight: 700 }}>Aktif: {Math.ceil((autoMergeEnd - now)/1000)}s</div>
                  ) : isAmCD ? (
                    <div style={{ fontSize: 11, color: "#f87171", fontWeight: 700 }}>Cooldown: {Math.ceil((autoMergeCD - now)/1000)}s</div>
                  ) : (
                    <button onClick={triggerAutoMerge} style={{ ...bStyle("#7c3aed", "#6d28d9"), width: "auto", padding: "6px 12px", fontSize: 11 }}>Gunakan</button>
                  )}
                </div>

                {/* Auto Gen */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1e1e40", padding: "10px", borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>🐣 Auto Generate</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>Tiket: <b style={{ color: "#fff" }}>{autoGenTix}</b></div>
                  </div>
                  {isAgActive ? (
                    <div style={{ fontSize: 11, color: "#86efac", fontWeight: 700 }}>Aktif: {Math.ceil((autoGenEnd - now)/1000)}s</div>
                  ) : (
                    <button onClick={triggerAutoGen} style={{ ...bStyle("#059669", "#047857"), width: "auto", padding: "6px 12px", fontSize: 11 }}>Gunakan</button>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 10, color: "#6b7280", marginTop: 8, textAlign: "center" }}>Beli tiket tambahan menggunakan cacing di Menu Shop 🛒</div>
            </div>

            {/* Ayam di grid */}
            <div style={{ width: "100%", background: "#111130", border: "1px solid #1e1e40", borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>🐔 Ayam di Kandang ({chickenCount}/{GRID_SIZE})</div>
              {chickenCount === 0 ? (
                <div style={{ fontSize: 12, color: "#6b7280", textAlign: "center" }}>Belum ada ayam — generate dulu!</div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {CHICKEN_TIERS.map(t => {
                    const count = grid.filter(c => c && c.tier === t.tier).length;
                    if (count === 0) return null;
                    return (
                      <div key={t.tier} style={{ background: "#1e1e40", border: `1px solid ${t.rarityColor}55`, borderRadius: 8, padding: "3px 8px", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                        <span>{t.emoji}</span>
                        <span style={{ color: t.rarityColor, fontWeight: 700 }}>T{t.tier}</span>
                        <span style={{ color: "#fff", fontWeight: 800 }}>×{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Generate button */}
            <button onClick={hatchChicken} style={{
              width: 150, height: 150, borderRadius: "50%",
              background: "#111130", border: "4px solid #fbbf24",
              fontSize: 48, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
              animation: "pulse 2s infinite",
            }}>
              <span>🐣</span>
              <span style={{ fontSize: 12, color: "#fbbf24", fontWeight: 800 }}>Generate</span>
            </button>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>Tap untuk generate ayam manual! ({HATCH_COST}🥚)</div>

          </div>
        )}

        {/* FARM */}
        {screen === "farm" && (
          <div>
            <div style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>Pilih ayam → tap sel lain untuk merge</div>
              <button onClick={hatchChicken} style={{ ...bStyle("#7c2d12", "#b45309"), fontSize: 12, padding: "6px 12px", width: "auto" }}>
                +Ayam ({HATCH_COST}🥚)
              </button>
            </div>

            {/* Grid */}
            <div style={{ background: "#d4a45a", padding: 8, border: "3px solid #8b5c2a", borderRadius: 8, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 18px,rgba(139,92,42,.1) 18px,rgba(139,92,42,.1) 19px)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                {grid.map((cell, idx) => {
                  const ti = cell ? getTier(cell.tier) : null;
                  return (
                    <div
                      key={idx}
                      className="mcell"
                      onClick={() => cellClick(idx)}
                      style={{
                        aspectRatio: "1",
                        background: selectedCell === idx ? "#2d1b69" : cell ? "#e8c880" : "#c8a850",
                        border: `2px solid ${selectedCell === idx ? "#a78bfa" : ti ? ti.rarityColor + "88" : "#a07030"}`,
                        borderRadius: 10,
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", position: "relative",
                        opacity: cell ? 1 : 0.55,
                      }}
                    >
                      {cell && ti ? (
                        <>
                          <span style={{ fontSize: 22, lineHeight: 1 }}>{ti.emoji}</span>
                          <div style={{
                            position: "absolute", top: 2, right: 2, width: 14, height: 14,
                            borderRadius: "50%", background: ti.badgeColor,
                            fontSize: 8, fontWeight: 700, color: "#fff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>{cell.tier}</div>
                        </>
                      ) : (
                        <span style={{ fontSize: 16, color: "#a07030", opacity: 0.4 }}>+</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedCell !== null && grid[selectedCell] && (
              <div style={{ marginTop: 10, textAlign: "center", color: "#a78bfa", fontSize: 12 }}>
                {getTier(grid[selectedCell]!.tier).emoji} {getTier(grid[selectedCell]!.tier).name} dipilih — tap sel lain untuk merge/pindah
              </div>
            )}

            {/* Tier table */}
            <div style={{ marginTop: 12, background: "#111130", border: "1px solid #1e1e40", borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>Daftar lengkap 20 Tier Ayam:</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {CHICKEN_TIERS.map(t => (
                  <div key={t.tier} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <span style={{ minWidth: 20 }}>{t.emoji}</span>
                    <span style={{ color: t.rarityColor, flex: 1 }}>{t.name}</span>
                    <span style={{ color: "#6b7280", fontSize: 10 }}>{t.rarity}</span>
                    <span style={{ color: "#fbbf24", fontSize: 10 }}>{t.idlePerSec.toLocaleString()}/s</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SCRATCH */}
        {screen === "dig" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 13, color: "#9ca3af", textAlign: "center" }}>
              Habiskan 1 🐾 per scratch. Dapat telur atau cacing!
            </div>
            <div style={{ fontSize: 56, animation: isDigging ? "digWiggle .3s infinite" : "none" }}>🐾</div>
            <div style={{ fontSize: 40 }}>{isDigging ? "💨" : "🥚"}</div>

            {digResult && !isDigging && (
              <div style={{ background: "#111130", border: "1px solid #fbbf24", borderRadius: 16, padding: "12px 28px", textAlign: "center" }}>
                <div style={{ color: "#9ca3af", fontSize: 12 }}>Hasil scratch:</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#fbbf24" }}>{digResult.label}</div>
              </div>
            )}

            <button onClick={doDig} disabled={isDigging || cekers < 1} style={{ ...bStyle("#7c2d12", "#b45309"), fontSize: 16, padding: "14px 36px", opacity: isDigging || cekers < 1 ? 0.5 : 1 }}>
              {isDigging ? "Scratching..." : `🐾 Scratch (1 🐾 Ceker)`}
            </button>
            <div style={{ color: "#f97316", fontSize: 13 }}>🐾 Ceker Ayam: {cekers}</div>
          </div>
        )}

        {/* SPIN */}
        {screen === "spin" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 13, color: "#9ca3af" }}>Spin gratis 1x per hari!</div>
            <div style={{ position: "relative", width: 240, height: 240 }}>
              <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", fontSize: 22, zIndex: 2, color: "#fbbf24" }}>▼</div>
              <svg width="240" height="240" viewBox="0 0 240 240" style={{
                transform: `rotate(${spinAngle}deg)`,
                transition: spinning ? "transform 3.2s cubic-bezier(.17,.67,.12,1)" : "none",
                borderRadius: "50%",
              }}>
                {SPIN_REWARDS.map((r, i) => {
                  const sectors = SPIN_REWARDS.length;
                  const angle = (2 * Math.PI) / sectors;
                  const sa = i * angle - Math.PI / 2;
                  const ea = sa + angle;
                  const cx = 120, cy = 120, rad = 118;
                  const x1 = cx + rad * Math.cos(sa), y1 = cy + rad * Math.sin(sa);
                  const x2 = cx + rad * Math.cos(ea), y2 = cy + rad * Math.sin(ea);
                  const colors = ["#7c3aed","#1d4ed8","#047857","#b45309","#be185d","#0e7490","#dc2626","#4338ca"];
                  const mid = sa + angle / 2;
                  const tx = cx + rad * 0.65 * Math.cos(mid);
                  const ty = cy + rad * 0.65 * Math.sin(mid);
                  const rot = (mid * 180 / Math.PI) + 90;
                  return (
                    <g key={i}>
                      <path d={`M${cx},${cy} L${x1},${y1} A${rad},${rad} 0 0,1 ${x2},${y2} Z`}
                        fill={colors[i % colors.length]} stroke="#0a0a1a" strokeWidth="1.5" />
                      <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle"
                        fill="#fff" fontSize="9" fontWeight="700"
                        transform={`rotate(${rot}, ${tx}, ${ty})`}>{r.label}</text>
                    </g>
                  );
                })}
                <circle cx="120" cy="120" r="14" fill="#0a0a1a" stroke="#fbbf24" strokeWidth="2" />
              </svg>
            </div>
            {spinResult && !spinning && (
              <div style={{ background: "#111130", border: "1px solid #fbbf24", borderRadius: 16, padding: "12px 28px", textAlign: "center" }}>
                <div style={{ color: "#9ca3af", fontSize: 12 }}>Hasilmu:</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#fbbf24" }}>{spinResult.label}</div>
              </div>
            )}
            <button onClick={doSpin} disabled={spinUsedToday || spinning} style={{ ...bStyle("#7c3aed", "#6d28d9"), fontSize: 16, padding: "14px 36px", opacity: spinUsedToday || spinning ? 0.5 : 1 }}>
              {spinning ? "Berputar..." : spinUsedToday ? "Sudah Spin Hari Ini" : "🎡 SPIN SEKARANG"}
            </button>
          </div>
        )}

        {/* TASKS */}
        {screen === "tasks" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#fbbf24", marginBottom: 2 }}>📅 Check-in Harian</div>
            <div style={{ background: "#111130", border: "1px solid #2d2d5e", borderRadius: 14, padding: 14 }}>
              <div style={{ display: "flex", gap: 5, marginBottom: 10, flexWrap: "wrap" }}>
                {CHECKIN_REWARDS.map((r, i) => (
                  <div key={i} style={{
                    flex: "0 0 auto",
                    background: i < checkinDay ? "#1e3a5f" : i === checkinDay && checkinDate === todayStr() ? "#14532d" : "#1e1e40",
                    border: "1px solid #3d3d6e", borderRadius: 8, padding: "5px 7px", textAlign: "center", fontSize: 10, minWidth: 42,
                  }}>
                    <div style={{ color: "#9ca3af" }}>H{i + 1}</div>
                    <div style={{ color: "#fbbf24", fontWeight: 700 }}>{r}🥚</div>
                  </div>
                ))}
              </div>
              <button onClick={doCheckin} style={bStyle("#14532d", "#166534")}>
                {checkinDate === todayStr() ? "✅ Sudah Check-in" : "📅 Check-in Sekarang"}
              </button>
            </div>

            <div style={{ fontWeight: 700, fontSize: 15, color: "#fbbf24", marginTop: 4 }}>📋 Misi Harian</div>
            {DAILY_TASKS.map(task => {
              const prog    = taskProgress[task.id] || 0;
              const done    = prog >= task.target;
              const claimed = taskClaimed[task.id] || false;
              return (
                <div key={task.id} style={{ background: "#111130", border: `1px solid ${claimed ? "#14532d" : "#2d2d5e"}`, borderRadius: 14, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{task.label}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                        +{task.rewardEggs}🥚 {task.rewardWorms > 0 ? `+${task.rewardWorms}🪱` : ""}
                      </div>
                    </div>
                    <button onClick={() => claimTask(task)} disabled={!done || claimed} style={{ ...bStyle("#14532d", "#166534"), fontSize: 12, padding: "6px 12px", width: "auto", opacity: !done || claimed ? 0.5 : 1 }}>
                      {claimed ? "✅" : done ? "Klaim!" : `${Math.min(prog, task.target)}/${task.target}`}
                    </button>
                  </div>
                  <div style={{ width: "100%", background: "#1e1e40", borderRadius: 6, height: 6, marginTop: 10 }}>
                    <div style={{ width: `${Math.min(100, (prog / task.target) * 100)}%`, background: "#fbbf24", borderRadius: 6, height: 6, transition: "width .3s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SHOP */}
        {screen === "shop" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#fbbf24", marginBottom: 2 }}>🛒 Toko</div>
            {[
              {
                title: "🎫 Beli Tiket Auto-Merge",
                desc: "1 Tiket: Auto-Merge aktif selama 1 menit (Cooldown 30d)",
                cost: `${AUTO_TICKET_COST}🪱`,
                action: buyAutoMergeTix,
                bg: "#7c3aed", bg2: "#6d28d9",
              },
              {
                title: "🎫 Beli Tiket Auto-Generate",
                desc: "1 Tiket: Spawn ayam otomatis selama 1 menit (jika telur cukup)",
                cost: `${AUTO_TICKET_COST}🪱`,
                action: buyAutoGenTix,
                bg: "#059669", bg2: "#047857",
              },
              {
                title: "⚡ Boost x2 — 5 Menit",
                desc: `Semua income ×2 selama 5 menit\nSisa: ${boostActive ? `${Math.ceil((boostEndTime - Date.now()) / 1000)}s` : "—"}`,
                cost: `${BOOST_COST_WORMS}🪱`,
                action: buyBoost,
                bg: "#b45309", bg2: "#92400e",
              },
              {
                title: "🪱 Beli 5 Cacing",
                desc: "Beli stok cacing untuk tiket/boost",
                cost: `${WORM_COST}🥚`,
                action: buyWorms,
                bg: "#065f46", bg2: "#047857",
              },
              {
                title: "🐾 Beli 3 Ceker Ayam",
                desc: "Digunakan di menu Scratch untuk gali telur/cacing",
                cost: `${SHOVEL_COST_EGGS}🥚`,
                action: buyCekers,
                bg: "#7c2d12", bg2: "#b45309",
              },
            ].map((item, i) => (
              <div key={i} style={{ background: "#111130", border: "1px solid #2d2d5e", borderRadius: 14, padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10, whiteSpace: "pre-line" }}>{item.desc}</div>
                <button onClick={item.action} style={{ ...bStyle(item.bg, item.bg2) }}>
                  Beli — {item.cost}
                </button>
              </div>
            ))}

            <div style={{ background: "#111130", border: "1px solid #1e3a5f", borderRadius: 14, padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>📊 Statistik</div>
              <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 2.2 }}>
                Total generate ayam: <b style={{ color: "#fbbf24" }}>{taps.toLocaleString()}</b><br />
                Total telur diperoleh: <b style={{ color: "#fbbf24" }}>{Math.floor(totalEarned).toLocaleString()} 🥚</b><br />
                Ayam di kandang: <b style={{ color: "#fbbf24" }}>{chickenCount}</b><br />
                Tier tertinggi: <b style={{ color: "#fbbf24" }}>{maxTierInGrid > 0 ? `${getTier(maxTierInGrid as TierId).emoji} ${getTier(maxTierInGrid as TierId).name}` : "—"}</b><br />
                Ceker ayam: <b style={{ color: "#f97316" }}>{cekers} 🐾</b>
              </div>
            </div>
          </div>
        )}

        {/* LEADERBOARD */}
        {screen === "leaderboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#fbbf24" }}>🏆 Leaderboard Pemain</div>

            {/* Submit score card */}
            <div style={{ background: "#111130", border: "1px solid #a16207", borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 13, color: "#d1d5db", marginBottom: 8, fontWeight: 600 }}>
                {playerName ? `👤 Pemain: ${playerName}` : "Masukkan namamu dan simpan skor"}
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  placeholder={playerName || "Nama pemain..."}
                  maxLength={20}
                  style={{
                    flex: 1, background: "#1e1e40", border: "1px solid #3d3d6e",
                    borderRadius: 8, color: "#f0e6c8", padding: "8px 10px", fontSize: 13,
                    outline: "none",
                  }}
                />
                <button onClick={submitScore} style={{ ...bStyle("#a16207", "#d97706"), width: "auto", padding: "8px 16px", whiteSpace: "nowrap" }}>
                  💾 Simpan
                </button>
              </div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>
                Skormu sekarang: <b style={{ color: "#fbbf24" }}>{Math.floor(totalEarned).toLocaleString()} 🥚</b>
                {maxTierInGrid > 0 && <span>  |  Tier maks: <b style={{ color: getTier(maxTierInGrid as TierId).rarityColor }}>{getTier(maxTierInGrid as TierId).emoji} {getTier(maxTierInGrid as TierId).name}</b></span>}
              </div>
            </div>

            {/* Leaderboard table */}
            <div style={{ background: "#111130", border: "1px solid #1e1e40", borderRadius: 14, padding: 14 }}>
              {leaderboard.length === 0 ? (
                <div style={{ textAlign: "center", color: "#6b7280", fontSize: 13, padding: "20px 0" }}>
                  Belum ada pemain terdaftar.<br />Simpan skormu untuk masuk ranking!
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {leaderboard.map((entry, i) => {
                    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
                    const isMe  = entry.name === playerName;
                    const tier  = entry.maxTier > 0 ? getTier(entry.maxTier as TierId) : null;
                    return (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        background: isMe ? "#1e2a10" : "#0e0e28",
                        border: `1px solid ${isMe ? "#4a7a1a" : "#1e1e40"}`,
                        borderRadius: 10, padding: "8px 10px",
                      }}>
                        <span style={{ fontSize: 16, minWidth: 28, textAlign: "center" }}>{medal}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: isMe ? "#86efac" : "#f0e6c8" }}>
                            {entry.name}{isMe && " (Kamu)"}
                          </div>
                          <div style={{ fontSize: 10, color: "#6b7280" }}>{entry.date}</div>
                        </div>
                        {tier && (
                          <span style={{ fontSize: 11, color: tier.rarityColor, background: "#1e1e40", padding: "2px 6px", borderRadius: 6 }}>
                            {tier.emoji} T{entry.maxTier}
                          </span>
                        )}
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 800, fontSize: 13, color: "#fbbf24" }}>{entry.eggs.toLocaleString()}</div>
                          <div style={{ fontSize: 9, color: "#6b7280" }}>🥚 telur</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {leaderboard.length > 0 && (
              <button onClick={clearLeaderboard} style={{ ...bStyle("#1e1e40", "#3d3d6e"), fontSize: 12 }}>
                🗑️ Reset Leaderboard
              </button>
            )}
          </div>
        )}

      </div>
    </main>
  );
}

// ─── STYLE HELPER ─────────────────────────────────────────────────────────────
function bStyle(bg: string, border: string): React.CSSProperties {
  return {
    background: bg,
    border: `1px solid ${border}`,
    color: "#fff",
    borderRadius: 10,
    padding: "10px 18px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    width: "100%",
  };
}