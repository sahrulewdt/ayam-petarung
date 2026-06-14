"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── TYPES ───────────────────────────────────────────────────────────────────
type TierId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

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

type Screen = "main" | "farm" | "dig" | "spin" | "tasks" | "shop";

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
  { tier: 1,  name: "Ayam Kampung", emoji: "🐣", rarity: "Common",      rarityColor: "#9ca3af", badgeColor: "#6b7280", idlePerSec: 0.1   },
  { tier: 2,  name: "Ayam Sentul",  emoji: "🐥", rarity: "Uncommon",    rarityColor: "#4ade80", badgeColor: "#16a34a", idlePerSec: 0.3   },
  { tier: 3,  name: "Ayam Pelung",  emoji: "🐔", rarity: "Rare",        rarityColor: "#60a5fa", badgeColor: "#2563eb", idlePerSec: 0.8   },
  { tier: 4,  name: "Ayam Kedu",    emoji: "🦆", rarity: "Epic",        rarityColor: "#a78bfa", badgeColor: "#7c3aed", idlePerSec: 2.0   },
  { tier: 5,  name: "Ayam Gaok",    emoji: "🦅", rarity: "Epic+",       rarityColor: "#f472b6", badgeColor: "#be185d", idlePerSec: 5.0   },
  { tier: 6,  name: "Ayam Bangkok", emoji: "🦚", rarity: "Legendary",   rarityColor: "#fb923c", badgeColor: "#c2410c", idlePerSec: 12.0  },
  { tier: 7,  name: "Ayam Birma",   emoji: "🦜", rarity: "Legendary+",  rarityColor: "#34d399", badgeColor: "#047857", idlePerSec: 28.0  },
  { tier: 8,  name: "Ayam Saigon",  emoji: "🐲", rarity: "Mythic",      rarityColor: "#f87171", badgeColor: "#b91c1c", idlePerSec: 65.0  },
  { tier: 9,  name: "Ayam Bekisar", emoji: "🌟", rarity: "Ancient",     rarityColor: "#fde047", badgeColor: "#a16207", idlePerSec: 150.0 },
  { tier: 10, name: "Ayam Cemani",  emoji: "⚫", rarity: "Divine",      rarityColor: "#c084fc", badgeColor: "#7e22ce", idlePerSec: 350.0 },
];

const GRID_SIZE = 15;
const HATCH_COST = 30;
const BOOST_COST = 200;
const WORM_COST  = 50;
const BOOST_DURATION_MS = 5 * 60 * 1000;

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
  { id: "tap100",  label: "Tap 100x",             type: "tap",   target: 100, rewardEggs: 300, rewardWorms: 5  },
  { id: "merge3",  label: "Merge 3x",              type: "merge", target: 3,   rewardEggs: 200, rewardWorms: 8  },
  { id: "dig5",    label: "Gali 5x",               type: "dig",   target: 5,   rewardEggs: 150, rewardWorms: 10 },
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
  return CHICKEN_TIERS[tier - 1];
}

const SAVE_KEY = "ayam-petarung-v3";

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

      {/* Fence */}
      <div style={{ position: "absolute", bottom: 55, left: 0, right: 0, height: 32, pointerEvents: "none" }}>
        <div style={{ position: "absolute", bottom: 20, left: 0, right: 0, height: 5, background: "#a07040", borderRadius: 2 }} />
        <div style={{ position: "absolute", bottom: 9, left: 0, right: 0, height: 5, background: "#a07040", borderRadius: 2 }} />
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} style={{ position: "absolute", bottom: 0, left: i * 19, width: 11, height: 26, background: "#8b5c2a", borderRadius: "2px 2px 0 0" }} />
        ))}
      </div>

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
  const animName = `walk-${index}`;
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
  const [eggs, setEggs]           = useState<number>(50);
  const [worms, setWorms]         = useState<number>(10);
  const [grid, setGrid]           = useState<(GridCell | null)[]>(Array(GRID_SIZE).fill(null));
  const [screen, setScreen]       = useState<Screen>("main");
  const [selectedCell, setSelectedCell] = useState<number | null>(null);

  const [boostActive, setBoostActive]   = useState(false);
  const [boostEndTime, setBoostEndTime] = useState(0);
  const [autoMerge, setAutoMerge]       = useState(false);

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

  const audioCtxRef  = useRef<AudioContext | null>(null);
  const bgStopRef    = useRef<(() => void) | null>(null);
  const floatId      = useRef(0);
  const idleRef      = useRef({ grid, boostActive, boostEndTime });

  // Keep ref in sync for interval callbacks
  useEffect(() => { idleRef.current = { grid, boostActive, boostEndTime }; }, [grid, boostActive, boostEndTime]);

  // ── Load save ──
  useEffect(() => {
    const s = loadSave();
    if (!s) return;
    if (typeof s.eggs === "number")         setEggs(s.eggs);
    if (typeof s.worms === "number")        setWorms(s.worms);
    if (Array.isArray(s.grid))              setGrid(s.grid as (GridCell | null)[]);
    if (typeof s.boostEndTime === "number") {
      setBoostEndTime(s.boostEndTime as number);
      setBoostActive(Date.now() < (s.boostEndTime as number));
    }
    if (typeof s.autoMerge === "boolean")   setAutoMerge(s.autoMerge);
    if (typeof s.spinUsedToday === "boolean") setSpinUsedToday(s.spinUsedToday);
    if (typeof s.lastSpinDate === "string") setLastSpinDate(s.lastSpinDate);
    if (s.taskProgress)                     setTaskProgress(s.taskProgress as Record<string, number>);
    if (s.taskClaimed)                      setTaskClaimed(s.taskClaimed as Record<string, boolean>);
    if (typeof s.checkinDay === "number")   setCheckinDay(s.checkinDay);
    if (typeof s.checkinDate === "string")  setCheckinDate(s.checkinDate);
    if (typeof s.taps === "number")         setTaps(s.taps);
    if (typeof s.totalEarned === "number")  setTotalEarned(s.totalEarned);
  }, []);

  // ── Save ──
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        eggs, worms, grid, boostEndTime, autoMerge,
        spinUsedToday, lastSpinDate, taskProgress, taskClaimed,
        checkinDay, checkinDate, taps, totalEarned,
      }));
    } catch {}
  }, [eggs, worms, grid, boostEndTime, autoMerge, spinUsedToday, lastSpinDate, taskProgress, taskClaimed, checkinDay, checkinDate, taps, totalEarned]);

  // ── Reset spin daily ──
  useEffect(() => {
    if (lastSpinDate !== todayStr()) setSpinUsedToday(false);
  }, [lastSpinDate]);

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

  // ── Auto merge ──
  useEffect(() => {
    if (!autoMerge) return;
    const interval = setInterval(() => setGrid(g => autoMergeGrid(g)), 2000);
    return () => clearInterval(interval);
  }, [autoMerge]);

  // ── Music ──
  useEffect(() => {
    if (musicOn) startMusic();
    else stopMusic();
    return () => stopMusic();
  }, [musicOn]);

  function startMusic() {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      stopMusic();
      const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
      const seq   = [0, 2, 4, 5, 4, 2, 1, 0, 3, 4, 3, 2];
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
        gain.gain.setValueAtTime(0.07, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
        i++;
        const tid = setTimeout(playNext, 420);
        bgStopRef.current = () => { stopped = true; clearTimeout(tid); };
      }
      playNext();
    } catch {}
  }

  function stopMusic() {
    bgStopRef.current?.();
    bgStopRef.current = null;
  }

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
      if (a && b && a.tier === b.tier && a.tier < 10) {
        setGrid(g => {
          const n = [...g];
          n[selectedCell] = null;
          n[idx] = { tier: (a.tier + 1) as TierId, id: Date.now() };
          return n;
        });
        const newTier = getTier((a.tier + 1) as TierId);
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
      if (!arr[i] || arr[i]!.tier >= 10) continue;
      for (let j = i + 1; j < arr.length; j++) {
        if (!arr[j]) continue;
        if (arr[j]!.tier === arr[i]!.tier) {
          arr[j] = { tier: (arr[i]!.tier + 1) as TierId, id: Date.now() };
          arr[i] = null;
          return arr;
        }
      }
    }
    return arr;
  }

  // ── Dig ──
  function doDig() {
    if (worms < 1) { showToast("Cacing tidak cukup!", "err"); return; }
    if (isDigging) return;
    setWorms(w => w - 1);
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

  // ── Shop ──
  function buyBoost() {
    if (eggs < BOOST_COST) { showToast("Telur tidak cukup!", "err"); return; }
    setEggs(e => e - BOOST_COST);
    setBoostActive(true);
    setBoostEndTime(Date.now() + BOOST_DURATION_MS);
    showToast("Boost x2 aktif 5 menit! ⚡");
  }

  function buyAutoMerge() {
    if (autoMerge) { showToast("Auto-merge sudah aktif!"); return; }
    if (worms < 5) { showToast("Cacing tidak cukup!", "err"); return; }
    setWorms(w => w - 5);
    setAutoMerge(true);
    showToast("Auto-Merge aktif! 🤖");
  }

  function buyWorms() {
    if (eggs < WORM_COST) { showToast("Telur tidak cukup!", "err"); return; }
    setEggs(e => e - WORM_COST);
    setWorms(w => w + 5);
    showToast("+5 🪱 cacing dibeli!");
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

  // ─── NAV ITEMS ────────────────────────────────────────────────────────────
  const navItems: { key: Screen; label: string; emoji: string; bg: string; border: string }[] = [
    { key: "main",  label: "Home",     emoji: "🏠", bg: "#3a2210", border: "#8b5c2a" },
    { key: "farm",  label: "Kandang",  emoji: "🐔", bg: "#1a3010", border: "#4a7a1a" },
    { key: "dig",   label: "Menggali", emoji: "⛏️", bg: "#1a2a10", border: "#4a7a1a" },
    { key: "spin",  label: "Spin",     emoji: "🎡", bg: "#0a1a3a", border: "#185fa5" },
    { key: "tasks", label: "Misi",     emoji: "📋", bg: "#3a1a10", border: "#c07820" },
    { key: "shop",  label: "Shop",     emoji: "🛒", bg: "#2a1020", border: "#7c3aed" },
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
          <button onClick={() => setMusicOn(m => !m)} style={{ background: "none", border: "1px solid #3d3d6e", borderRadius: 8, color: musicOn ? "#fbbf24" : "#666", fontSize: 15, padding: "3px 7px", cursor: "pointer" }}>
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
          <span style={{ fontSize: 13, fontWeight: 700, color: "#86efac" }}>{totalIdle.toFixed(1)}/s</span>
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
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { label: "Per Detik",  val: `${totalIdle.toFixed(1)}🥚` },
                { label: "Ayam",       val: `${chickenCount}/${GRID_SIZE}` },
                { label: "Tier Maks",  val: maxTierInGrid > 0 ? getTier(maxTierInGrid as TierId).emoji + " " + maxTierInGrid : "—" },
              ].map(s => (
                <div key={s.label} style={{ background: "#111130", border: "1px solid #2d2d5e", borderRadius: 12, padding: "8px 6px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#fbbf24" }}>{s.val}</div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#9ca3af", letterSpacing: 2 }}>TOTAL TELUR</div>
              <div style={{ fontSize: 48, fontWeight: 900, color: "#fbbf24", lineHeight: 1 }}>{Math.floor(eggs).toLocaleString()}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>🥚</div>
            </div>

            <button onClick={tapMain} style={{
              width: 160, height: 160, borderRadius: "50%",
              background: "#111130", border: "4px solid #fbbf24",
              fontSize: 72, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              animation: "pulse 2s infinite",
            }}>
              🐓
            </button>
            <div style={{ fontSize: 13, color: "#9ca3af" }}>TAP untuk dapat telur!</div>

            <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => setScreen("farm")} style={bStyle("#14532d", "#166534")}>🐔 Kandang Merge</button>
              <button onClick={() => setScreen("dig")}  style={bStyle("#1e3a5f", "#1d4ed8")}>⛏️ Menggali</button>
            </div>

            {/* Tier legend */}
            {maxTierInGrid > 0 && (
              <div style={{ width: "100%", background: "#111130", border: "1px solid #1e1e40", borderRadius: 12, padding: 12 }}>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>Ayam yang sudah kamu punya:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {CHICKEN_TIERS.slice(0, maxTierInGrid).map(t => (
                    <span key={t.tier} style={{ background: "#1e1e40", border: `1px solid ${t.rarityColor}44`, borderRadius: 8, padding: "2px 7px", fontSize: 11 }}>
                      {t.emoji} <span style={{ color: t.rarityColor }}>{t.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
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

            {/* Grid 5×3 */}
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
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>Daftar tier ayam:</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {CHICKEN_TIERS.map(t => (
                  <div key={t.tier} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <span>{t.emoji}</span>
                    <span style={{ color: t.rarityColor, flex: 1 }}>{t.name}</span>
                    <span style={{ color: "#6b7280", fontSize: 10 }}>{t.rarity}</span>
                    <span style={{ color: "#fbbf24", fontSize: 10 }}>{t.idlePerSec}/s</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DIG */}
        {screen === "dig" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 13, color: "#9ca3af", textAlign: "center" }}>
              Habiskan 1 🪱 per gali. Dapat telur atau cacing!
            </div>
            <div style={{ fontSize: 48, animation: isDigging ? "digWiggle .3s infinite" : "none" }}>⛏️</div>
            <div style={{ fontSize: 40 }}>{isDigging ? "💨" : "🪹"}</div>

            {digResult && !isDigging && (
              <div style={{ background: "#111130", border: "1px solid #fbbf24", borderRadius: 16, padding: "12px 28px", textAlign: "center" }}>
                <div style={{ color: "#9ca3af", fontSize: 12 }}>Hasil galian:</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#fbbf24" }}>{digResult.label}</div>
              </div>
            )}

            <button onClick={doDig} disabled={isDigging || worms < 1} style={{ ...bStyle("#1e3a5f", "#2563eb"), fontSize: 16, padding: "14px 36px", opacity: isDigging || worms < 1 ? 0.5 : 1 }}>
              {isDigging ? "Menggali..." : `⛏️ Gali (1 🪱)`}
            </button>
            <div style={{ color: "#86efac", fontSize: 13 }}>🪱 Cacing: {Math.floor(worms)}</div>

            <div style={{ width: "100%", background: "#111130", border: "1px solid #1e1e40", borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>Kemungkinan reward:</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {DIG_REWARDS.map((r, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#d1d5db" }}>• {r.label} ({r.prob}%)</div>
                ))}
              </div>
            </div>
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
                title: "⚡ Boost x2 — 5 Menit",
                desc: `Semua income ×2 selama 5 menit\nSisa: ${boostActive ? `${Math.ceil((boostEndTime - Date.now()) / 1000)}s` : "—"}`,
                cost: `${BOOST_COST}🥚`,
                action: buyBoost,
                bg: "#b45309", bg2: "#92400e",
                done: false,
              },
              {
                title: "🤖 Auto-Merge",
                desc: "Merge otomatis setiap 2 detik (permanen sesi ini)",
                cost: "5🪱",
                action: buyAutoMerge,
                bg: "#7c3aed", bg2: "#6d28d9",
                done: autoMerge,
              },
              {
                title: "🪱 Beli 5 Cacing",
                desc: "Tambah 5 cacing untuk menggali",
                cost: `${WORM_COST}🥚`,
                action: buyWorms,
                bg: "#065f46", bg2: "#047857",
                done: false,
              },
            ].map((item, i) => (
              <div key={i} style={{ background: "#111130", border: "1px solid #2d2d5e", borderRadius: 14, padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10, whiteSpace: "pre-line" }}>{item.desc}</div>
                <button onClick={item.action} disabled={item.done} style={{ ...bStyle(item.bg, item.bg2), opacity: item.done ? 0.5 : 1 }}>
                  {item.done ? "✅ Aktif" : `Beli — ${item.cost}`}
                </button>
              </div>
            ))}

            <div style={{ background: "#111130", border: "1px solid #1e3a5f", borderRadius: 14, padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>📊 Statistik</div>
              <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 2.2 }}>
                Total tap: <b style={{ color: "#fbbf24" }}>{taps.toLocaleString()}</b><br />
                Total telur diperoleh: <b style={{ color: "#fbbf24" }}>{Math.floor(totalEarned).toLocaleString()}</b><br />
                Ayam di kandang: <b style={{ color: "#fbbf24" }}>{chickenCount}</b><br />
                Tier tertinggi: <b style={{ color: "#fbbf24" }}>{maxTierInGrid > 0 ? `${getTier(maxTierInGrid as TierId).emoji} ${getTier(maxTierInGrid as TierId).name}` : "—"}</b><br />
                Auto-merge: <b style={{ color: autoMerge ? "#86efac" : "#9ca3af" }}>{autoMerge ? "Aktif" : "Tidak aktif"}</b>
              </div>
            </div>
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
