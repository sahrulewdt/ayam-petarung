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

// Menghapus "farm" dari daftar screen sesuai permintaan
type Screen = "main" | "dig" | "spin" | "tasks" | "shop" | "leaderboard";

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
  boost: boolean;
  chance: number;
}

// ─── DATA CONSTANTS ──────────────────────────────────────────────────────────
const CHICKEN_TIERS: Record<TierId, ChickenTier> = {
  1: { tier: 1, name: "Ayam Kampung", emoji: "🐔", rarity: "Common", rarityColor: "#9ca3af", badgeColor: "#4b5563", idlePerSec: 1 },
  2: { tier: 2, name: "Ayam Negeri", emoji: "🐤", rarity: "Common", rarityColor: "#9ca3af", badgeColor: "#4b5563", idlePerSec: 3 },
  3: { tier: 3, name: "Ayam Pelung", emoji: "🐓", rarity: "Uncommon", rarityColor: "#10b981", badgeColor: "#065f46", idlePerSec: 8 },
  4: { tier: 4, name: "Ayam Kedu", emoji: "🐦", rarity: "Uncommon", rarityColor: "#10b981", badgeColor: "#065f46", idlePerSec: 20 },
  5: { tier: 5, name: "Ayam Nunukan", emoji: "🦅", rarity: "Rare", rarityColor: "#3b82f6", badgeColor: "#1e3a8a", idlePerSec: 50 },
  6: { tier: 6, name: "Ayam Ketawa", emoji: "😂", rarity: "Rare", rarityColor: "#3b82f6", badgeColor: "#1e3a8a", idlePerSec: 120 },
  7: { tier: 7, name: "Ayam Bali", emoji: "🏝️", rarity: "Epic", rarityColor: "#a855f7", badgeColor: "#581c87", idlePerSec: 300 },
  8: { tier: 8, name: "Ayam Serama", emoji: "✨", rarity: "Epic", rarityColor: "#a855f7", badgeColor: "#581c87", idlePerSec: 750 },
  9: { tier: 9, name: "Ayam Cemani", emoji: "🖤", rarity: "Legendary", rarityColor: "#f59e0b", badgeColor: "#78350f", idlePerSec: 2000 },
  10: { tier: 10, name: "Ayam Bangkok", emoji: "🥊", rarity: "Legendary", rarityColor: "#f59e0b", badgeColor: "#78350f", idlePerSec: 5000 },
  11: { tier: 11, name: "Ayam Shamo", emoji: "🥷", rarity: "Mythic", rarityColor: "#ec4899", badgeColor: "#701a75", idlePerSec: 12500 },
  12: { tier: 12, name: "Ayam Brahma", emoji: "👑", rarity: "Mythic", rarityColor: "#ec4899", badgeColor: "#701a75", idlePerSec: 30000 },
  13: { tier: 13, name: "Ayam Phoenix", emoji: "🔥", rarity: "Divine", rarityColor: "#ef4444", badgeColor: "#7f1d1d", idlePerSec: 75000 },
  14: { tier: 14, name: "Ayam Onagadori", emoji: "🐉", rarity: "Divine", rarityColor: "#ef4444", badgeColor: "#7f1d1d", idlePerSec: 200000 },
  15: { tier: 15, name: "Ayam Gaib Keraton", emoji: "🔮", rarity: "Cosmic", rarityColor: "#06b6d4", badgeColor: "#164e63", idlePerSec: 500000 },
  16: { tier: 16, name: "Ayam Petir Selaras", emoji: "⚡", rarity: "Cosmic", rarityColor: "#06b6d4", badgeColor: "#164e63", idlePerSec: 1250000 },
  17: { tier: 17, name: "Ayam Khodam Perkasa", emoji: "🔱", rarity: "Anomalous", rarityColor: "#6366f1", badgeColor: "#312e81", idlePerSec: 3500000 },
  18: { tier: 18, name: "Ayam Jagat Raya", emoji: "🌌", rarity: "Anomalous", rarityColor: "#6366f1", badgeColor: "#312e81", idlePerSec: 10000000 },
  19: { tier: 19, name: "Ayam Sang Pencipta Telur", emoji: "🥚", rarity: "Transcendent", rarityColor: "#f43f5e", badgeColor: "#4c0519", idlePerSec: 30000000 },
  20: { tier: 20, name: "Ayam Dewa Nusantara", emoji: "🇮🇩", rarity: "Transcendent", rarityColor: "#f43f5e", badgeColor: "#4c0519", idlePerSec: 100000000 },
};

const TASKS_DEFS: TaskDef[] = [
  { id: "t1", label: "Generate Ayam Manual (5x)", type: "tap", target: 5, rewardEggs: 150, rewardWorms: 2 },
  { id: "t2", label: "Lakukan Merge Ayam (3x)", type: "merge", target: 3, rewardEggs: 200, rewardWorms: 3 },
  { id: "t3", label: "Lakukan Gali Scratch (5x)", type: "dig", target: 5, rewardEggs: 300, rewardWorms: 4 },
  { id: "t4", label: "Kumpulkan 500 Pasif Telur", type: "earn", target: 500, rewardEggs: 500, rewardWorms: 5 },
];

const SPIN_REWARDS: SpinReward[] = [
  { label: "50 Telur", eggs: 50, worms: 0, boost: false, chance: 30 },
  { label: "200 Telur", eggs: 200, worms: 0, boost: false, chance: 25 },
  { label: "500 Telur", eggs: 500, worms: 0, boost: false, chance: 15 },
  { label: "2 Cacing", eggs: 0, worms: 2, boost: false, chance: 15 },
  { label: "5 Cacing", eggs: 0, worms: 5, boost: false, chance: 10 },
  { label: "Boost x2 (5m)", eggs: 0, worms: 0, boost: true, chance: 5 },
];

export default function GamePage() {
  // ─── CORE GAME STATES ──────────────────────────────────────────────────────
  const [screen, setScreen] = useState<Screen>("main");
  const [eggs, setEggs] = useState<number>(100);
  const [worms, setWorms] = useState<number>(10);
  const [scratchers, setScratchers] = useState<number>(5);
  const [maxTierUnlocked, setMaxTierUnlocked] = useState<number>(1);

  // Grid 15 Kotak (Sekarang diakses langsung di Home Menu)
  const [grid, setGrid] = useState<(GridCell | null)[]>(Array(15).fill(null));
  const [selectedCell, setSelectedCell] = useState<number | null>(null);

  // Boosts & Auto Tickets
  const [boostTime, setBoostTime] = useState<number>(0); // s
  const [autoMergeTime, setAutoMergeTime] = useState<number>(0); // s
  const [autoGenTime, setAutoGenTime] = useState<number>(0); // s
  const [autoMergeCooldown, setAutoMergeCooldown] = useState<number>(0); // s

  // Daily Checkin & Tasks Progress
  const [lastCheckIn, setLastCheckIn] = useState<string>("");
  const [checkInStreak, setCheckInStreak] = useState<number>(0);
  const [taskProgress, setTaskProgress] = useState<Record<string, number>>({ t1: 0, t2: 0, t3: 0, t4: 0 });
  const [taskClaimed, setTaskClaimed] = useState<Record<string, boolean>>({ t1: false, t2: false, t3: false, t4: false });

  // Wheel Spin & Scratch
  const [lastSpinDate, setLastSpinDate] = useState<string>("");
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [spinAngle, setSpinAngle] = useState<number>(0);

  // Leaderboard & Metadata
  const [playerName, setPlayerName] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);
  const [floats, setFloats] = useState<FloatItem[]>([]);
  const [audioOn, setAudioOn] = useState<boolean>(false);

  // Refs untuk audio sintetis
  const audioCtxRef = useRef<AudioContext | null>(null);

  // ─── INITIAL LOAD & AUTO SAVE ──────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("petarung_v4_save");
      if (saved) {
        try {
          const d = JSON.parse(saved);
          if (d.eggs !== undefined) setEggs(d.eggs);
          if (d.worms !== undefined) setWorms(d.worms);
          if (d.scratchers !== undefined) setScratchers(d.scratchers);
          if (d.maxTierUnlocked !== undefined) setMaxTierUnlocked(d.maxTierUnlocked);
          if (d.grid !== undefined) setGrid(d.grid);
          if (d.lastCheckIn !== undefined) setLastCheckIn(d.lastCheckIn);
          if (d.checkInStreak !== undefined) setCheckInStreak(d.checkInStreak);
          if (d.taskProgress !== undefined) setTaskProgress(d.taskProgress);
          if (d.taskClaimed !== undefined) setTaskClaimed(d.taskClaimed);
          if (d.lastSpinDate !== undefined) setLastSpinDate(d.lastSpinDate);
          if (d.playerName !== undefined) setPlayerName(d.playerName);
        } catch (_) {}
      }
      const savedLeader = localStorage.getItem("petarung_v4_leader");
      if (savedLeader) {
        try { setLeaderboard(JSON.parse(savedLeader)); } catch (_) {}
      }
    }
  }, []);

  useEffect(() => {
    const d = { eggs, worms, scratchers, maxTierUnlocked, grid, lastCheckIn, checkInStreak, taskProgress, taskClaimed, lastSpinDate, playerName };
    localStorage.setItem("petarung_v4_save", JSON.stringify(d));
  }, [eggs, worms, scratchers, maxTierUnlocked, grid, lastCheckIn, checkInStreak, taskProgress, taskClaimed, lastSpinDate, playerName]);

  // ─── PROCEDURAL AUDIO (SOUND EFFECT GENERATOR) ─────────────────────────────
  const playTone = useCallback((freq: number, type: OscillatorType, duration: number) => {
    if (!audioOn) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (_) {}
  }, [audioOn]);

  // ─── NOTIFICATION UTILS ────────────────────────────────────────────────────
  const triggerToast = useCallback((msg: string, type: Toast["type"] = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const spawnFloat = useCallback((text: string, x: number, y: number) => {
    const id = Date.now() + Math.random();
    setFloats(f => [...f, { id, text, x, y }]);
    setTimeout(() => {
      setFloats(f => f.filter(item => item.id !== id));
    }, 1000);
  }, []);

  // ─── CALCULATE PASIVE INCOME ────────────────────────────────────────────────
  const getIncomePerSecond = useCallback(() => {
    let base = 0;
    grid.forEach(cell => {
      if (cell) {
        base += CHICKEN_TIERS[cell.tier].idlePerSec;
      }
    });
    return boostTime > 0 ? base * 2 : base;
  }, [grid, boostTime]);

  // GAME LOOP INTERVAL (1 TICK PER SECOND)
  useEffect(() => {
    const timer = setInterval(() => {
      // Pasif income
      const inc = getIncomePerSecond();
      if (inc > 0) {
        setEggs(e => e + inc);
        setTaskProgress(tp => ({ ...tp, t4: (tp.t4 || 0) + inc }));
      }

      // Hitung mundur timer
      setBoostTime(t => (t > 0 ? t - 1 : 0));
      setAutoMergeTime(t => (t > 0 ? t - 1 : 0));
      setAutoGenTime(t => (t > 0 ? t - 1 : 0));
      setAutoMergeCooldown(t => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [getIncomePerSecond]);

  // LOGIKA AUTO GENERATE (Setiap 1 detik jika aktif)
  useEffect(() => {
    if (autoGenTime <= 0) return;
    const gTimer = setInterval(() => {
      triggerGenerateChicken(true);
    }, 1000);
    return () => clearInterval(gTimer);
  }, [autoGenTime, eggs, grid]);

  // LOGIKA AUTO MERGE (Setiap 1.5 detik jika aktif)
  useEffect(() => {
    if (autoMergeTime <= 0) return;
    const mTimer = setInterval(() => {
      // Cari dua sel dengan tier sama untuk di-merge otomatis
      let done = false;
      for (let i = 0; i < grid.length; i++) {
        if (done) break;
        const c1 = grid[i];
        if (!c1) continue;
        for (let j = i + 1; j < grid.length; j++) {
          const c2 = grid[j];
          if (c2 && c2.tier === c1.tier && c1.tier < 20) {
            // Lakukan Merge otomatis
            setGrid(g => {
              const next = [...g];
              const nextTier = (c1.tier + 1) as TierId;
              next[i] = { tier: nextTier, id: Date.now() + Math.random() };
              next[j] = null;
              return next;
            });
            if (c1.tier + 1 > maxTierUnlocked) {
              setMaxTierUnlocked(c1.tier + 1);
            }
            setTaskProgress(tp => ({ ...tp, t2: (tp.t2 || 0) + 1 }));
            playTone(400 + c1.tier * 30, "triangle", 0.15);
            done = true;
            break;
          }
        }
      }
    }, 1500);
    return () => clearInterval(mTimer);
  }, [autoMergeTime, grid, maxTierUnlocked, playTone]);

  // ─── ACTION HANDLERS ───────────────────────────────────────────────────────
  const triggerGenerateChicken = (isAuto = false) => {
    const cost = 30;
    if (!isAuto && eggs < cost) {
      triggerToast("Telur tidak cukup untuk menetaskan ayam!", "err");
      return;
    }

    // Cari slot grid kosong
    const emptyIdx = grid.findIndex(c => c === null);
    if (emptyIdx === -1) {
      if (!isAuto) triggerToast("Kandang penuh! Silakan gabungkan ayam.", "err");
      return;
    }

    if (!isAuto) {
      setEggs(e => e - cost);
      setTaskProgress(tp => ({ ...tp, t1: (tp.t1 || 0) + 1 }));
    } else {
      if (eggs < cost) return; // batalkan jika auto tapi telur habis
      setEggs(e => e - cost);
    }

    setGrid(g => {
      const next = [...g];
      next[emptyIdx] = { tier: 1, id: Date.now() + Math.random() };
      return next;
    });
    playTone(300, "sine", 0.1);
  };

  const handleCellClick = (idx: number) => {
    const cell = grid[idx];

    if (selectedCell === null) {
      if (cell) setSelectedCell(idx);
    } else {
      if (selectedCell === idx) {
        setSelectedCell(null);
        return;
      }

      const fromCell = grid[selectedCell];
      if (!fromCell) {
        setSelectedCell(null);
        return;
      }

      if (!cell) {
        // Pindahkan ayam ke slot kosong
        setGrid(g => {
          const next = [...g];
          next[idx] = fromCell;
          next[selectedCell] = null;
          return next;
        });
        setSelectedCell(null);
        playTone(250, "sine", 0.08);
      } else if (cell.tier === fromCell.tier && cell.tier < 20) {
        // Gabungkan / Merge ayam ke tier yang lebih tinggi
        const nextTier = (cell.tier + 1) as TierId;
        setGrid(g => {
          const next = [...g];
          next[idx] = { tier: nextTier, id: Date.now() + Math.random() };
          next[selectedCell] = null;
          return next;
        });
        if (nextTier > maxTierUnlocked) {
          setMaxTierUnlocked(nextTier);
          triggerToast(`Hebat! Kamu membuka Ayam ${CHICKEN_TIERS[nextTier].name} (Tier ${nextTier})!`, "success");
        }
        setTaskProgress(tp => ({ ...tp, t2: (tp.t2 || 0) + 1 }));
        setSelectedCell(null);
        playTone(500, "triangle", 0.2);
      } else {
        // Tukar posisi jika tier berbeda
        setGrid(g => {
          const next = [...g];
          next[selectedCell] = cell;
          next[idx] = fromCell;
          return next;
        });
        setSelectedCell(null);
      }
    }
  };

  const startScratch = () => {
    if (scratchers <= 0) {
      triggerToast("Kamu tidak memiliki ceker ayam galian!", "err");
      return;
    }
    setScratchers(s => s - 1);
    setTaskProgress(tp => ({ ...tp, t3: (tp.t3 || 0) + 1 }));

    const roll = Math.random();
    if (roll < 0.6) {
      const eAmt = Math.floor(Math.random() * 80) + 20;
      setEggs(e => e + eAmt);
      triggerToast(`Kamu menggali halaman dan menemukan 🥚 ${eAmt} Telur!`, "success");
      playTone(600, "sine", 0.1);
    } else if (roll < 0.9) {
      const wAmt = Math.floor(Math.random() * 3) + 1;
      setWorms(w => w + wAmt);
      triggerToast(`Kamu menggali tumpukan tanah dan mendapat 🪱 ${wAmt} Cacing!`, "success");
      playTone(700, "sine", 0.12);
    } else {
      setEggs(e => e + 1000);
      triggerToast("Luar Biasa! Kamu menemukan peti kuno berisi 🥚 1000 Telur!", "success");
      playTone(900, "triangle", 0.3);
    }
  };

  const spinWheel = () => {
    const today = new Date().toDateString();
    if (lastSpinDate === today) {
      triggerToast("Kamu sudah memutar spin hari ini. Kembali besok!", "err");
      return;
    }
    if (isSpinning) return;

    setIsSpinning(true);
    // Hitung distribusi probabilitas rewards
    const rand = Math.random() * 100;
    let sum = 0;
    let rewardIdx = 0;
    for (let i = 0; i < SPIN_REWARDS.length; i++) {
      sum += SPIN_REWARDS[i].chance;
      if (rand <= sum) {
        rewardIdx = i;
        break;
      }
    }

    const sectorAngle = 360 / SPIN_REWARDS.length;
    const baseRotations = 5 * 360; 
    const targetAngle = baseRotations + (360 - (rewardIdx * sectorAngle + sectorAngle / 2));

    setSpinAngle(targetAngle);

    setTimeout(() => {
      const r = SPIN_REWARDS[rewardIdx];
      if (r.eggs > 0) setEggs(e => e + r.eggs);
      if (r.worms > 0) setWorms(w => w + r.worms);
      if (r.boost) setBoostTime(t => t + 300);

      setLastSpinDate(today);
      setIsSpinning(false);
      triggerToast(`Selamat! Kamu mendapatkan: ${r.label}`, "success");
      playTone(800, "triangle", 0.25);
    }, 3500);
  };

  const claimDailyCheckIn = () => {
    const today = new Date().toDateString();
    if (lastCheckIn === today) {
      triggerToast("Kamu sudah check-in hari ini!", "err");
      return;
    }

    const nextStreak = checkInStreak >= 7 ? 1 : checkInStreak + 1;
    const reward = nextStreak * 100;
    setEggs(e => e + reward);
    setCheckInStreak(nextStreak);
    setLastCheckIn(today);
    triggerToast(`Check-in Hari ke-${nextStreak} sukses! +🥚 ${reward} Telur.`, "success");
    playTone(650, "sine", 0.15);
  };

  const claimTask = (id: string) => {
    const t = TASKS_DEFS.find(item => item.id === id);
    if (!t) return;
    const prog = taskProgress[id] || 0;
    if (prog < t.target) {
      triggerToast("Target misi belum tercapai!", "err");
      return;
    }
    if (taskClaimed[id]) {
      triggerToast("Hadiah misi ini sudah diambil!", "err");
      return;
    }

    setTaskClaimed(prev => ({ ...prev, [id]: true }));
    if (t.rewardEggs > 0) setEggs(e => e + t.rewardEggs);
    if (t.rewardWorms > 0) setWorms(w => w + t.rewardWorms);
    triggerToast(`Misi Selesai! Mengklaim +🥚${t.rewardEggs} & +🪱${t.rewardWorms}`, "success");
    playTone(750, "triangle", 0.2);
  };

  const buyShopItem = (type: string, costWorms: number, costEggs: number) => {
    if (costWorms > 0 && worms < costWorms) {
      triggerToast("Cacing premium tidak mencukupi!", "err");
      return;
    }
    if (costEggs > 0 && eggs < costEggs) {
      triggerToast("Telur tidak mencukupi!", "err");
      return;
    }

    setWorms(w => w - costWorms);
    setEggs(e => e - costEggs);

    if (type === "auto_merge") {
      setAutoMergeTime(t => t + 60);
      triggerToast("Membeli Tiket Auto-Merge 1 Menit!", "success");
    } else if (type === "auto_gen") {
      setAutoGenTime(t => t + 60);
      triggerToast("Membeli Tiket Auto-Generate 1 Menit!", "success");
    } else if (type === "boost_2x") {
      setBoostTime(t => t + 300);
      triggerToast("Mengaktifkan Boost Pendapatan x2 (5 Menit)!", "success");
    } else if (type === "buy_worms") {
      setWorms(w => w + 5);
      triggerToast("Berhasil menukar Telur dengan 5 Cacing!", "success");
    } else if (type === "buy_scratchers") {
      setScratchers(s => s + 3);
      triggerToast("Berhasil menukar Telur dengan 3 Tiket Ceker!", "success");
    }
    playTone(500, "sine", 0.1);
  };

  const saveToLeaderboard = () => {
    if (!playerName.trim()) {
      triggerToast("Ketik nama petarungmu terlebih dahulu!", "err");
      return;
    }
    const newEntry: LeaderEntry = {
      name: playerName,
      eggs: eggs,
      maxTier: maxTierUnlocked,
      date: new Date().toLocaleDateString(),
    };
    const nextList = [...leaderboard, newEntry].sort((a, b) => b.eggs - a.eggs).slice(0, 10);
    setLeaderboard(nextList);
    localStorage.setItem("petarung_v4_leader", JSON.stringify(nextList));
    triggerToast("Skor berhasil dipublikasikan ke Peringkat Lokal!", "success");
  };

  // Menghapus fungsi clearLeaderboard karena tombolnya dihapus

  const triggerMainTap = (e: React.MouseEvent<HTMLButtonElement>) => {
    const gain = 1;
    setEggs(prev => prev + gain);
    setTaskProgress(tp => ({ ...tp, t4: (tp.t4 || 0) + gain }));

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    spawnFloat(`+${gain}`, x, y);
    playTone(450, "sine", 0.05);
  };

  const handleToggleAutoMergeButton = () => {
    if (autoMergeTime > 0) return;
    if (autoMergeCooldown > 0) {
      triggerToast(`Auto-Merge sedang Cooldown selama ${autoMergeCooldown}d`, "err");
      return;
    }
    setAutoMergeTime(60);
    setAutoMergeCooldown(30);
    triggerToast("Otomatisasi Penggabungan Kandang Aktif (60 detik)", "info");
  };

  // ─── STYLES HELPER ─────────────────────────────────────────────────────────
  const bStyle = (bg: string, border: string): React.CSSProperties => ({
    background: bg,
    border: `1px solid ${border}`,
    color: "#fff",
    borderRadius: 10,
    padding: "10px 18px",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease",
  });

  const topBarItem = {
    background: "#1e1e40",
    padding: "6px 12px",
    borderRadius: 8,
    border: "1px solid #3d3d6e",
    fontSize: 13,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    gap: 5,
  };

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a16", color: "#fff", fontFamily: "sans-serif", padding: 15 }}>
      <div style={{ maxWidth: 500, margin: "0 auto", display: "flex", flexDirection: "column", gap: 15 }}>
        
        {/* TOAST PANEL */}
        {toast && (
          <div style={{
            position: "fixed", top: 15, left: "50%", transform: "translateX(-50%)",
            background: toast.type === "err" ? "#ef4444" : toast.type === "success" ? "#10b981" : "#3b82f6",
            padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, zIndex: 9999, boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
          }}>
            {toast.msg}
          </div>
        )}

        {/* TOP HUB HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#111126", padding: 12, borderRadius: 12, border: "1px solid #27274a" }}>
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#fbbf24", letterSpacing: 0.5 }}>🐔 PETARUNG v4</h1>
          <button onClick={() => setAudioOn(!audioOn)} style={{ background: audioOn ? "#10b981" : "#4b5563", border: "none", color: "#fff", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            {audioOn ? "🔊 AUDIO ON" : "🔇 AUDIO MUTED"}
          </button>
        </div>

        {/* SCOREBAR INDIKATOR */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <div style={topBarItem}>🥚 <span style={{ color: "#fbbf24" }}>{Math.floor(eggs).toLocaleString()}</span></div>
          <div style={topBarItem}>🪱 <span style={{ color: "#a78bfa" }}>{worms}</span></div>
          <div style={topBarItem}>🐾 <span style={{ color: "#38bdf8" }}>{scratchers}</span></div>
        </div>

        {/* STATUS TIMERS BAR */}
        {(boostTime > 0 || autoMergeTime > 0 || autoGenTime > 0) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, background: "#111126", padding: 8, borderRadius: 8, fontSize: 11 }}>
            {boostTime > 0 && <span style={{ color: "#fbbf24", background: "#78350f", padding: "2px 6px", borderRadius: 4 }}>🚀 Boost 2x: {boostTime}s</span>}
            {autoMergeTime > 0 && <span style={{ color: "#34d399", background: "#064e3b", padding: "2px 6px", borderRadius: 4 }}>🤖 AutoMerge: {autoMergeTime}s</span>}
            {autoGenTime > 0 && <span style={{ color: "#60a5fa", background: "#1e3a8a", padding: "2px 6px", borderRadius: 4 }}>🐣 AutoGen: {autoGenTime}s</span>}
          </div>
        )}

        {/* REVENUE INDICATOR PASIF */}
        <div style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", background: "#111126", padding: "6px 12px", borderRadius: 8 }}>
          Pendapatan Pasif Kandang: <b style={{ color: "#fbbf24" }}>+{getIncomePerSecond().toLocaleString()}</b> telur/detik
        </div>

        {/* NAVIGASI BAR MENU - Menghapus menu "Kandang" */}
        <div style={{ display: "flex", overflowX: "auto", gap: 6, paddingBottom: 4 }}>
          {(["main", "dig", "spin", "tasks", "shop", "leaderboard"] as Screen[]).map(sc => (
            <button key={sc} onClick={() => setScreen(sc)} style={{
              background: screen === sc ? "#fbbf24" : "#111126",
              color: screen === sc ? "#000" : "#9ca3af",
              border: screen === sc ? "1px solid #fbbf24" : "1px solid #27274a",
              padding: "8px 14px", borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: "pointer", textTransform: "uppercase"
            }}>
              {sc === "main" ? "🏠 Home" : sc === "dig" ? "🐾 Scratch" : sc === "spin" ? "🎡 Spin" : sc === "tasks" ? "📋 Misi" : sc === "shop" ? "🛒 Shop" : "🏆 Rank"}
            </button>
          ))}
        </div>

        {/* SCREEN UTAMA - 🏠 HOME MENU */}
        {screen === "main" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            {/* PANEL INTERAKSI GENERATE MANUAL */}
            <div style={{ background: "#111126", borderRadius: 16, border: "1px solid #27274a", padding: 20, textAlign: "center", position: "relative" }}>
              <button onClick={triggerMainTap} style={{
                width: 110, height: 110, borderRadius: "50%", background: "radial-gradient(circle, #fbbf24 0%, #d97706 100%)",
                border: "4px solid #fff", cursor: "pointer", position: "relative", outline: "none", boxShadow: "0 8px 20px rgba(217,119,6,0.4)",
                display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2
              }}>
                <span style={{ fontSize: 32 }}>🐣</span>
                <span style={{ color: "#fff", fontWeight: 900, fontSize: 11, textShadow: "1px 1px 2px #000" }}>GENERATE</span>
              </button>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>Biaya Menetaskan Manual: 30 Telur</div>

              {/* RENDER FLOATING TEXTS */}
              {floats.map(f => (
                <span key={f.id} style={{
                  position: "absolute", left: f.x, top: f.y, color: "#fbbf24", fontWeight: 900, fontSize: 16,
                  pointerEvents: "none", animation: "fadeOutUp 1s ease forwards"
                }}>{f.text}</span>
              ))}
            </div>

            {/* INTEGRASI FITUR OTOMATIS */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={handleToggleAutoMergeButton} style={{
                ...bStyle(autoMergeTime > 0 ? "#059669" : "#1e1e40", "#3d3d6e"),
                opacity: autoMergeCooldown > 0 && autoMergeTime === 0 ? 0.6 : 1, fontSize: 12
              }}>
                {autoMergeTime > 0 ? `🤖 AutoMerge (${autoMergeTime}s)` : autoMergeCooldown > 0 ? `⌛ CD (${autoMergeCooldown}s)` : "🤖 Aktifkan AutoMerge"}
              </button>
              <button onClick={() => triggerGenerateChicken(false)} style={{ ...bStyle("#b45309", "#d97706"), fontSize: 12 }}>
                ➕ Teteskan Langsung (🥚30)
              </button>
            </div>

            {/* PEMINDAHAN: GRID 15 KOTAK KANDANG KE HOME MENU */}
            <div style={{ background: "#111126", borderRadius: 16, border: "1px solid #27274a", padding: 15 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#9ca3af", marginBottom: 10, textAlign: "center" }}>
                🏘️ AREA KANDANG & PENGGABUNGAN AYAM
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                {grid.map((cell, idx) => {
                  const isSelected = selectedCell === idx;
                  const dataInfo = cell ? CHICKEN_TIERS[cell.tier] : null;

                  return (
                    <div key={idx} onClick={() => handleCellClick(idx)} style={{
                      aspectRatio: "1", background: isSelected ? "#3b82f6" : "#0d0d1f",
                      border: isSelected ? "2px solid #fff" : "1px solid #27274a", borderRadius: 12,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", position: "relative", transition: "all 0.15s ease",
                      boxShadow: isSelected ? "0 0 10px #3b82f6" : "none"
                    }}>
                      {dataInfo ? (
                        <>
                          <span style={{ fontSize: 24 }}>{dataInfo.emoji}</span>
                          <span style={{
                            position: "absolute", bottom: 4, right: 4, background: dataInfo.badgeColor,
                            color: "#fff", fontSize: 9, fontWeight: 900, padding: "1px 4px", borderRadius: 4
                          }}>T{dataInfo.tier}</span>
                        </>
                      ) : (
                        <span style={{ color: "#22223b", fontSize: 11, fontWeight: 700 }}>{idx + 1}</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: 11, color: "#6b7280", margin: "8px 0 0 0", textAlign: "center" }}>
                💡 <i>Pilih ayam bertier sama untuk melakukan evolusi penggabungan (Merge).</i>
              </p>
            </div>

            {/* PEMINDAHAN: DAFTAR 20 TIER AYAM KE HOME MENU */}
            <div style={{ background: "#111126", borderRadius: 16, border: "1px solid #27274a", padding: 15 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#9ca3af", marginBottom: 10 }}>📖 REKOR ENSIKLOPEDIA TIER AYAM</div>
              <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, paddingRight: 4 }}>
                {(Object.values(CHICKEN_TIERS) as ChickenTier[]).map(t => {
                  const isUnlocked = t.tier <= maxTierUnlocked;
                  return (
                    <div key={t.tier} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      background: isUnlocked ? "#181836" : "#0a0a16", opacity: isUnlocked ? 1 : 0.4,
                      padding: "6px 10px", borderRadius: 8, border: "1px solid #27274a"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{isUnlocked ? t.emoji : "❓"}</span>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: isUnlocked ? "#fff" : "#4b5563" }}>
                            {isUnlocked ? t.name : `Tier ${t.tier} Terkunci`}
                          </div>
                          <span style={{ fontSize: 9, color: t.rarityColor, fontWeight: 700 }}>{t.rarity}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#fbbf24" }}>+{t.idlePerSec}/s</div>
                        <div style={{ fontSize: 8, color: "#6b7280" }}>pasif telur</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SCREEN SCREEN LAINNYA TIDAK BERUBAH SECARA STRUKTUR LOGIKA */}

        {/* SCREEN INTERAKSI SCRATCH PANEL */}
        {screen === "dig" && (
          <div style={{ background: "#111126", borderRadius: 16, border: "1px solid #27274a", padding: 20, textAlign: "center" }}>
            <h2 style={{ margin: "0 0 5px 0", fontSize: 15 }}>🐾 GALIAN CEKER BERHADIAH</h2>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 15px 0" }}>Gunakan tiket ceker ayammu untuk mengeruk hadiah acak di pekarangan.</p>
            <div style={{ fontSize: 32, margin: "20px 0" }}>⛏️🪱🐾</div>
            <button onClick={startScratch} style={bStyle("#0284c7", "#0369a1")}>🐾 SCRATCH SEKARANG (Pakai 1 Ceker)</button>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 10 }}>Sisa Kesempatan Tiket Gali: {scratchers}</div>
          </div>
        )}

        {/* SCREEN INTERAKSI LUCKY SPIN WHEEL */}
        {screen === "spin" && (
          <div style={{ background: "#111126", borderRadius: 16, border: "1px solid #27274a", padding: 20, textAlign: "center" }}>
            <h2 style={{ margin: "0 0 5px 0", fontSize: 15 }}>🎡 RODA BERUNTUNG HARIAN</h2>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: "0 0 20px 0" }}>Dapatkan bonus spesial gratis satu kali setiap hari.</p>
            
            <div style={{ position: "relative", width: 200, height: 200, margin: "0 auto 20px auto" }}>
              <div style={{
                width: "100%", height: "100%", borderRadius: "50%", border: "6px solid #27274a",
                transform: `rotate(${spinAngle}deg)`, transition: isSpinning ? "transform 3.5s cubic-bezier(0.1, 0.8, 0.1, 1)" : "none",
                background: "conic-gradient(#3b82f6 0deg 60deg, #10b981 60deg 120deg, #f59e0b 120deg 180deg, #ec4899 180deg 240deg, #8b5cf6 240deg 300deg, #ef4444 300deg 360deg)"
              }} />
              <div style={{
                position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderTop: "20px solid #fff", zIndex: 10
              }} />
            </div>

            <button onClick={spinWheel} disabled={isSpinning} style={bStyle(isSpinning ? "#4b5563" : "#d97706", "#b45309")}>
              {isSpinning ? "🎰 BERPUTAR..." : "🎡 SPIN SEKARANG"}
            </button>
          </div>
        )}

        {/* SCREEN DAFTAR MISI TASKS */}
        {screen === "tasks" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            <div style={{ background: "#111126", borderRadius: 16, border: "1px solid #27274a", padding: 15 }}>
              <h2 style={{ margin: "0 0 5px 0", fontSize: 14 }}>📅 ABSEN HARIAN BERUNTUN (CHECK-IN)</h2>
              <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 12px 0" }}>Check-in harian untuk mendapatkan kelipatan 100 telur gratis.</p>
              <button onClick={claimDailyCheckIn} style={bStyle("#059669", "#065f46")}>📅 Check-in Sekarang</button>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>Rangkaian Streak Absen Anda: {checkInStreak} Hari</div>
            </div>

            <div style={{ background: "#111126", borderRadius: 16, border: "1px solid #27274a", padding: 15 }}>
              <h2 style={{ margin: "0 0 10px 0", fontSize: 14 }}>📋 DAFTAR TUGAS PETARUNG HARIAN</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {TASKS_DEFS.map(t => {
                  const prog = taskProgress[t.id] || 0;
                  const isDone = prog >= t.target;
                  const isClaimed = taskClaimed[t.id];

                  return (
                    <div key={t.id} style={{ background: "#181836", padding: 12, borderRadius: 10, border: "1px solid #27274a" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                        <span>{t.label}</span>
                        <span style={{ color: isDone ? "#10b981" : "#ef4444" }}>{Math.floor(prog)} / {t.target}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                        <span style={{ fontSize: 10, color: "#9ca3af" }}>Hadiah: 🥚{t.rewardEggs} | 🪱{t.rewardWorms}</span>
                        <button onClick={() => claimTask(t.id)} disabled={!isDone || isClaimed} style={{
                          background: isClaimed ? "#4b5563" : isDone ? "#10b981" : "#1f1f42",
                          border: "none", color: "#fff", padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 800, cursor: isDone && !isClaimed ? "pointer" : "default"
                        }}>
                          {isClaimed ? "✓ DIAMBIL" : isDone ? "KLAIM" : "BELUM SELESAI"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SCREEN INTERAKSI SHOP PENUKARAN VOUCHER */}
        {screen === "shop" && (
          <div style={{ background: "#111126", borderRadius: 16, border: "1px solid #27274a", padding: 15 }}>
            <h2 style={{ margin: "0 0 12px 0", fontSize: 14, textAlign: "center" }}>🛒 TOKO PENUKARAN & BOOST PETARUNG</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#181836", padding: 10, borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800 }}>🤖 Tiket Otomasi Gabung (Auto-Merge)</div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>Menggabungkan ayam secara otomatis selama 1 menit</div>
                </div>
                <button onClick={() => buyShopItem("auto_merge", 5, 0)} style={{ ...bStyle("#7c3aed", "#6d28d9"), padding: "6px 12px", fontSize: 11 }}>🪱 5 Cacing</button>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#181836", padding: 10, borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800 }}>🐣 Tiket Otomasi Tetes (Auto-Gen)</div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>Menetaskan ayam lapis 1 otomatis tiap detik selama 1 menit</div>
                </div>
                <button onClick={() => buyShopItem("auto_gen", 5, 0)} style={{ ...bStyle("#7c3aed", "#6d28d9"), padding: "6px 12px", fontSize: 11 }}>🪱 5 Cacing</button>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#181836", padding: 10, borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800 }}>🚀 Booster Pendapatan Ganda x2</div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>Menggandakan perolehan pasif telur selama 5 menit penuh</div>
                </div>
                <button onClick={() => buyShopItem("boost_2x", 10, 0)} style={{ ...bStyle("#7c3aed", "#6d28d9"), padding: "6px 12px", fontSize: 11 }}>🪱 10 Cacing</button>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#181836", padding: 10, borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800 }}>📦 Paket Suplemen 5 Cacing</div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>Tukarkan hasil telur terkumpul dengan cacing premium</div>
                </div>
                <button onClick={() => buyShopItem("buy_worms", 0, 40)} style={{ ...bStyle("#059669", "#065f46"), padding: "6px 12px", fontSize: 11 }}>🥚 40 Telur</button>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#181836", padding: 10, borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800 }}>🐾 Pasokan Alat Gali 3 Ceker Ayam</div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>Mendapatkan tiket ekstra untuk menu gali keberuntungan</div>
                </div>
                <button onClick={() => buyShopItem("buy_scratchers", 0, 40)} style={{ ...bStyle("#059669", "#065f46"), padding: "6px 12px", fontSize: 11 }}>🥚 40 Telur</button>
              </div>

            </div>
          </div>
        )}

        {/* SCREEN INTERAKSI LEADERBOARD RANKING */}
        {screen === "leaderboard" && (
          <div style={{ background: "#111126", borderRadius: 16, border: "1px solid #27274a", padding: 15, display: "flex", flexDirection: "column", gap: 15 }}>
            <h2 style={{ margin: 0, fontSize: 14, textAlign: "center" }}>🏆 PERINGKAT SKOR PETARUNG LOKAL</h2>
            
            <div style={{ display: "flex", gap: 6 }}>
              <input type="text" placeholder="Masukkan nama..." value={playerName} onChange={e => setPlayerName(e.target.value)} style={{
                flex: 1, background: "#0a0a16", border: "1px solid #27274a", borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 12
              }} />
              <button onClick={saveToLeaderboard} style={{ ...bStyle("#fbbf24", "#d97706"), color: "#000", padding: "8px 14px", fontSize: 12 }}>💾 Simpan</button>
            </div>

            <div style={{ background: "#0a0a16", borderRadius: 10, border: "1px solid #27274a", padding: 10 }}>
              {leaderboard.length === 0 ? (
                <div style={{ textAlign: "center", fontSize: 11, color: "#6b7280", padding: "10px 0" }}>Belum ada data skor yang terekam.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {leaderboard.map((entry, index) => {
                    const tier = CHICKEN_TIERS[entry.maxTier as TierId];
                    return (
                      <div key={index} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        background: "#111126", padding: "8px 12px", borderRadius: 8, border: "1px solid #1e1e40"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 900, color: index === 0 ? "#fbbf24" : index === 1 ? "#9ca3af" : index === 2 ? "#b45309" : "#fff" }}>
                            #{index + 1}
                          </span>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 800 }}>{entry.name}</div>
                            <div style={{ fontSize: 10, color: "#6b7280" }}>{entry.date}</div>
                          </div>
                          {tier && (
                            <span style={{ fontSize: 11, color: tier.rarityColor, background: "#1e1e40", padding: "2px 6px", borderRadius: 6 }}>
                              {tier.emoji} T{entry.maxTier}
                            </span>
                          )}
                        </div>
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

            {/* Tombol Reset Leaderboard telah dihapus sesuai instruksi Anda */}
          </div>
        )}

      </div>
      {/* GLOBAL KEYFRAME CSS ANIMATION UNTUK FLUIDITAS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeOutUp {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-40px); }
        }
      `}} />
    </main>
  );
}