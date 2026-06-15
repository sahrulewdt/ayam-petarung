"use client";

import { useEffect, useState, useCallback } from "react";

// ─── TYPES & INTERFACES ──────────────────────────────────────────────────────
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

type Screen = "main" | "dig" | "spin" | "tasks" | "shop" | "leaderboard";

interface LeaderEntry {
  name: string;
  eggs: number;
  maxTier: number;
  date: string;
}

interface TaskDef {
  id: string;
  label: string;
  type: "tap" | "merge" | "dig" | "earn";
  target: number;
  current: number;
  rewardEggs: number;
  rewardWorms: number;
  claimed: boolean;
}

// ─── DATA KONSTAN: 20 TIER AYAM PETARUNG ──────────────────────────────────────
const CHICKEN_TIERS: ChickenTier[] = [
  { tier: 1, name: "Ayam Kampung", emoji: "🐣", rarity: "Biasa", rarityColor: "#9ca3af", badgeColor: "#4b5563", idlePerSec: 1 },
  { tier: 2, name: "Ayam Broiler", emoji: "🐥", rarity: "Biasa", rarityColor: "#9ca3af", badgeColor: "#4b5563", idlePerSec: 3 },
  { tier: 3, name: "Ayam Petelur", emoji: "🐓", rarity: "Biasa", rarityColor: "#9ca3af", badgeColor: "#4b5563", idlePerSec: 8 },
  { tier: 4, name: "Ayam Pelung", emoji: "🐔", rarity: "Unik", rarityColor: "#3b82f6", badgeColor: "#1d4ed8", idlePerSec: 20 },
  { tier: 5, name: "Ayam Serama", emoji: "🪶", rarity: "Unik", rarityColor: "#3b82f6", badgeColor: "#1d4ed8", idlePerSec: 45 },
  { tier: 6, name: "Ayam Ketawa", emoji: "😄", rarity: "Unik", rarityColor: "#3b82f6", badgeColor: "#1d4ed8", idlePerSec: 100 },
  { tier: 7, name: "Ayam Cemani", emoji: "🖤", rarity: "Langka", rarityColor: "#a855f7", badgeColor: "#6b21a8", idlePerSec: 220 },
  { tier: 8, name: "Ayam Bangkok", emoji: "🥊", rarity: "Langka", rarityColor: "#a855f7", badgeColor: "#6b21a8", idlePerSec: 500 },
  { tier: 9, name: "Ayam Kate", emoji: "📐", rarity: "Langka", rarityColor: "#a855f7", badgeColor: "#6b21a8", idlePerSec: 1100 },
  { tier: 10, name: "Ayam Kalkun", emoji: "🦃", rarity: "Epik", rarityColor: "#f97316", badgeColor: "#c2410c", idlePerSec: 2500 },
  { tier: 11, name: "Ayam Jago Pasar", emoji: "🏪", rarity: "Epik", rarityColor: "#f97316", badgeColor: "#c2410c", idlePerSec: 5500 },
  { tier: 12, name: "Ayam Jago Juara", emoji: "🏆", rarity: "Epik", rarityColor: "#f97316", badgeColor: "#c2410c", idlePerSec: 12000 },
  { tier: 13, name: "Ayam Berbakat", emoji: "🌟", rarity: "Mistik", rarityColor: "#ec4899", badgeColor: "#be185d", idlePerSec: 28000 },
  { tier: 14, name: "Ayam Siluman", emoji: "🔮", rarity: "Mistik", rarityColor: "#ec4899", badgeColor: "#be185d", idlePerSec: 60000 },
  { tier: 15, name: "Ayam Emas Mulia", emoji: "🪙", rarity: "Mistik", rarityColor: "#ec4899", badgeColor: "#be185d", idlePerSec: 135000 },
  { tier: 16, name: "Ayam Phoenix", emoji: "🔥", rarity: "Legendaris", rarityColor: "#ef4444", badgeColor: "#b91c1c", idlePerSec: 300000 },
  { tier: 17, name: "Ayam Naga Geni", emoji: "🐉", rarity: "Legendaris", rarityColor: "#ef4444", badgeColor: "#b91c1c", idlePerSec: 700000 },
  { tier: 18, name: "Ayam Kosmik Space", emoji: "🌌", rarity: "Legendaris", rarityColor: "#ef4444", badgeColor: "#b91c1c", idlePerSec: 1600000 },
  { tier: 19, name: "Ayam Penguasa Jagat", emoji: "👑", rarity: "Ilahi", rarityColor: "#eab308", badgeColor: "#a16207", idlePerSec: 3800000 },
  { tier: 20, name: "Ayam Dewa Nusantara", emoji: "🕉️", rarity: "Ilahi", rarityColor: "#eab308", badgeColor: "#a16207", idlePerSec: 9000000 },
];

export default function GameAyamPetarung() {
  // ─── STATES UTAMA GAME ──────────────────────────────────────────────────────
  const [eggs, setEggs] = useState<number>(100);
  const [worms, setWorms] = useState<number>(10);
  const [claws, setClaws] = useState<number>(5);
  const [screen, setScreen] = useState<Screen>("main");

  // Grid Kandang (16 Kotak / 4x4)
  const [grid, setGrid] = useState<(GridCell | null)[]>(Array(16).fill(null));
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [nextId, setNextId] = useState<number>(1);

  // Fitur Otomatis & Boost
  const [autoMergeTickets, setAutoMergeTickets] = useState<number>(1);
  const [autoGenTickets, setAutoGenTickets] = useState<number>(1);
  const [autoMergeActive, setAutoMergeActive] = useState<boolean>(false);
  const [autoGenerateActive, setAutoGenerateActive] = useState<boolean>(false);
  const [boostActive, setBoostActive] = useState<boolean>(false);
  
  const [autoMergeTime, setAutoMergeTime] = useState<number>(0);
  const [autoGenTime, setAutoGenTime] = useState<number>(0);
  const [boostTime, setBoostTime] = useState<number>(0);

  // Notifikasi Singkat (Toast)
  const [toast, setToast] = useState<string | null>(null);
  const [bgMusic, setBgMusic] = useState<boolean>(true);
  const [playerName, setPlayerName] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [lastSpinDate, setLastSpinDate] = useState<string>("");
  const [checkedInToday, setCheckedInToday] = useState<boolean>(false);
  const [checkInDay, setCheckInDay] = useState<number>(1);

  // Misi Harian
  const [tasks, setTasks] = useState<TaskDef[]>([
    { id: "t1", label: "Menetaskan Ayam 5 Kali", type: "tap", target: 5, current: 0, rewardEggs: 100, rewardWorms: 2, claimed: false },
    { id: "t2", label: "Melakukan Merge Ayam 3 Kali", type: "merge", target: 3, current: 0, rewardEggs: 150, rewardWorms: 3, claimed: false },
    { id: "t3", label: "Gali Tanah Scratch 2 Kali", type: "dig", target: 2, current: 0, rewardEggs: 120, rewardWorms: 2, claimed: false },
  ]);

  // Tampilkan Notifikasi
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Tambah progress misi
  const progressTask = useCallback((type: "tap" | "merge" | "dig") => {
    setTasks(prev => prev.map(t => {
      if (t.type === type && t.current < t.target) {
        return { ...t, current: t.current + 1 };
      }
      return t;
    }));
  }, []);

  // ─── LOGIKA GAME UTAMA (MENETASKAN & MERGE) ─────────────────────────────────
  const generateChicken = useCallback(() => {
    if (eggs < 30) {
      showToast("🥚 Telur tidak cukup! Butuh 30 telur.");
      return false;
    }
    
    const emptyIndex = grid.findIndex(cell => cell === null);
    if (emptyIndex === -1) {
      showToast("🚫 Kandang Penuh! Silakan gabungkan ayam yang sama.");
      return false;
    }

    setEggs(prev => prev - 30);
    const newGrid = [...grid];
    newGrid[emptyIndex] = { tier: 1, id: nextId };
    setGrid(newGrid);
    setNextId(prev => prev + 1);
    progressTask("tap");
    return true;
  }, [eggs, grid, nextId, progressTask]);

  const handleCellClick = (index: number) => {
    if (selectedCell === null) {
      if (grid[index] !== null) {
        setSelectedCell(index);
      }
    } else {
      if (selectedCell === index) {
        setSelectedCell(null);
      } else if (grid[index] === null) {
        // Pindahkan posisi ayam ke kotak kosong
        const newGrid = [...grid];
        newGrid[index] = newGrid[selectedCell];
        newGrid[selectedCell] = null;
        setGrid(newGrid);
        setSelectedCell(null);
      } else {
        // Proses Penggabungan (Merge)
        const src = grid[selectedCell];
        const dest = grid[index];

        if (src && dest && src.tier === dest.tier) {
          if (src.tier >= 20) {
            showToast("👑 Ayam Anda sudah mencapai Tingkat Dewa Tertinggi!");
            setSelectedCell(null);
            return;
          }
          const nextTier = (src.tier + 1) as TierId;
          const newGrid = [...grid];
          newGrid[index] = { tier: nextTier, id: src.id };
          newGrid[selectedCell] = null;
          setGrid(newGrid);
          setSelectedCell(null);
          showToast(`✨ Sukses Merge menjadi ${CHICKEN_TIERS[nextTier - 1].name} (Tier ${nextTier})!`);
          progressTask("merge");
        } else {
          setSelectedCell(index);
        }
      }
    }
  };

  // Aktivasi Item Otomatis
  const useAutoMerge = () => {
    if (autoMergeActive) return;
    if (autoMergeTickets <= 0) {
      showToast("🎟️ Anda tidak memiliki Tiket Auto Merge. Beli di Shop!");
      return;
    }
    setAutoMergeTickets(p => p - 1);
    setAutoMergeTime(60);
    setAutoMergeActive(true);
    showToast("🤖 Auto Merge Aktif selama 1 menit!");
  };

  const useAutoGenerate = () => {
    if (autoGenerateActive) return;
    if (autoGenTickets <= 0) {
      showToast("🎟️ Anda tidak memiliki Tiket Auto Tetas. Beli di Shop!");
      return;
    }
    setAutoGenTickets(p => p - 1);
    setAutoGenTime(60);
    setAutoGenerateActive(true);
    showToast("🤖 Auto Tetas Aktif selama 1 menit!");
  };

  // ─── LOOP UTAMA GAME (DENGAN INTERVAL DETIK) ────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Hitung Pendapatan Telur Otomatis
      let totalIdle = 0;
      grid.forEach(cell => {
        if (cell) {
          totalIdle += CHICKEN_TIERS[cell.tier - 1].idlePerSec;
        }
      });
      if (boostActive) totalIdle *= 2;
      if (totalIdle > 0) {
        setEggs(prev => prev + totalIdle);
      }

      // 2. Logika Hitung Mundur Waktu Aktif Boost & Otomatisasi
      if (boostActive) {
        setBoostTime(p => {
          if (p <= 1) { setBoostActive(false); return 0; }
          return p - 1;
        });
      }

      if (autoGenerateActive) {
        setAutoGenTime(p => {
          if (p <= 1) { setAutoGenerateActive(false); return 0; }
          return p - 1;
        });
        generateChicken();
      }

      if (autoMergeActive) {
        setAutoMergeTime(p => {
          if (p <= 1) { setAutoMergeActive(false); return 0; }
          return p - 1;
        });
        
        // Scan grid untuk otomatis menggabungkan ayam ber-tier sama
        setGrid(currentGrid => {
          const nextGrid = [...currentGrid];
          let mergedAsuatu = false;
          for (let i = 0; i < nextGrid.length; i++) {
            for (let j = i + 1; j < nextGrid.length; j++) {
              const a = nextGrid[i];
              const b = nextGrid[j];
              if (a && b && a.tier === b.tier && a.tier < 20) {
                nextGrid[j] = { tier: (a.tier + 1) as TierId, id: a.id };
                nextGrid[i] = null;
                mergedAsuatu = true;
                break;
              }
            }
            if (mergedAsuatu) break;
          }
          if (mergedAsuatu) progressTask("merge");
          return nextGrid;
        });
      }

    }, 1000);
    return () => clearInterval(interval);
  }, [grid, boostActive, autoGenerateActive, autoMergeActive, generateChicken, progressTask]);

  // Memuat data leaderboard lokal
  useEffect(() => {
    const saved = localStorage.getItem("ayam_leaderboard");
    if (saved) setLeaderboard(JSON.parse(saved));
  }, []);

  // ─── LOGIKA MENU SCRATCH / DIG ─────────────────────────────────────────────
  const handleScratch = () => {
    if (claws <= 0) {
      showToast("🐾 Ceker ayam habis! Isi ulang di Shop.");
      return;
    }
    setClaws(p => p - 1);
    progressTask("dig");
    const luck = Math.random();
    if (luck > 0.6) {
      setWorms(p => p + 3);
      showToast("🎁 Beruntung! Dapat galian berisi +3 🪱 Cacing!");
    } else {
      setEggs(p => p + 150);
      showToast("🥚 Mantap! Menemukan harta karun +150 Telur!");
    }
  };

  // ─── LOGIKA MENU RODA BERHADIAH (SPIN) ──────────────────────────────────────
  const handleSpin = () => {
    const todayStr = new Date().toDateString();
    if (lastSpinDate === todayStr) {
      showToast("⏰ Anda sudah memutar roda hari ini. Kembali besok!");
      return;
    }
    setLastSpinDate(todayStr);
    const options = ["EGGS", "WORMS", "BOOST", "CLAWS"];
    const result = options[Math.floor(Math.random() * options.length)];

    if (result === "EGGS") {
      setEggs(p => p + 300);
      showToast("🎡 Roda berhenti di: Hadiah Utama +300 🥚 Telur!");
    } else if (result === "WORMS") {
      setWorms(p => p + 5);
      showToast("🎡 Roda berhenti di: +5 🪱 Cacing Gratis!");
    } else if (result === "BOOST") {
      setBoostActive(true);
      setBoostTime(300);
      showToast("🎡 Roda berhenti di: Super Boost X2 Selama 5 Menit!");
    } else {
      setClaws(p => p + 3);
      showToast("🎡 Roda berhenti di: +3 🐾 Ceker Energi!");
    }
  };

  // ─── LOGIKA MENU MISI / TASKS ──────────────────────────────────────────────
  const handleCheckIn = () => {
    if (checkedInToday) {
      showToast("📅 Hari ini Anda sudah absen.");
      return;
    }
    const reward = checkInDay * 100;
    setEggs(p => p + reward);
    setCheckedInToday(true);
    setCheckInDay(p => (p >= 7 ? 1 : p + 1));
    showToast(`📅 Absen sukses hari ke-${checkInDay}, klaim +${reward} 🥚 Telur!`);
  };

  const claimTaskReward = (id: string, re: number, rw: number) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, claimed: true } : t)));
    setEggs(p => p + re);
    setWorms(p => p + rw);
    showToast(`🎁 Hadiah misi diklaim! +${re} 🥚 Telur & +${rw} 🪱 Cacing.`);
  };

  // ─── LOGIKA MENU TOKO / SHOP ───────────────────────────────────────────────
  const buyItem = (type: string, cost: number, currency: "eggs" | "worms") => {
    if (currency === "eggs" && eggs < cost) {
      showToast("🥚 Telur Anda kurang.");
      return;
    }
    if (currency === "worms" && worms < cost) {
      showToast("🪱 Cacing Anda kurang.");
      return;
    }

    if (currency === "eggs") setEggs(p => p - cost);
    if (currency === "worms") setWorms(p => p - cost);

    if (type === "merge_ticket") setAutoMergeTickets(p => p + 1);
    if (type === "gen_ticket") setAutoGenTickets(p => p + 1);
    if (type === "boost") { setBoostActive(true); setBoostTime(300); }
    if (type === "buy_worms") setWorms(p => p + 5);
    if (type === "buy_claws") setClaws(p => p + 3);

    showToast("🛍️ Pembelian Berhasil!");
  };

  // ─── LOGIKA LEADERBOARD ────────────────────────────────────────────────────
  const saveLeaderboard = () => {
    if (!playerName.trim()) {
      showToast("✍️ Isi nama Anda terlebih dahulu.");
      return;
    }
    let maxT = 1;
    grid.forEach(c => { if (c && c.tier > maxT) maxT = c.tier; });

    const entry: LeaderEntry = {
      name: playerName,
      eggs: eggs,
      maxTier: maxT,
      date: new Date().toLocaleDateString("id-ID")
    };

    const nextList = [...leaderboard, entry].sort((a, b) => b.eggs - a.eggs).slice(0, 7);
    setLeaderboard(nextList);
    localStorage.setItem("ayam_leaderboard", JSON.stringify(nextList));
    setPlayerName("");
    showToast("💾 Skor Anda berhasil disimpan!");
  };

  const clearLeaderboard = () => {
    setLeaderboard([]);
    localStorage.removeItem("ayam_leaderboard");
    showToast("🗑️ Peringkat dibersihkan.");
  };

  return (
    <main style={{ minHeight: "100vh", background: "#0c0c14", color: "#fff", fontFamily: "Arial, sans-serif", paddingBottom: 90 }}>
      
      {/* HEADER ATAS: SUMBER DAYA & MUSIK */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 20px", background: "#11111f", borderBottom: "2px solid #22223b", sticky: "top" }}>
        <div style={{ display: "flex", gap: 15, fontSize: 13, fontWeight: "bold" }}>
          <span style={{ color: "#fbbf24" }}>🥚 {eggs.toLocaleString()}</span>
          <span style={{ color: "#a855f7" }}>🪱 {worms}</span>
          <span style={{ color: "#f43f5e" }}>🐾 {claws}</span>
        </div>
        <button onClick={() => setBgMusic(!bgMusic)} style={{ background: "none", border: "none", color: "#6b7280", fontSize: 18, cursor: "pointer" }}>
          {bgMusic ? "🔊" : "🔇"}
        </button>
      </div>

      {/* TOAST POPUP NOTIFIKASI */}
      {toast && (
        <div style={{ position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)", background: "#3b82f6", color: "#fff", padding: "10px 20px", borderRadius: 10, fontSize: 13, zIndex: 99, fontWeight: "bold", boxShadow: "0 4px 10px rgba(0,0,0,0.5)" }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth: 480, margin: "0 auto", padding: 20 }}>
        
        {/* ─── 1. LAYAR UTAMA (HOME + KANDANG BOX) ────────────────────────────── */}
        {screen === "main" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}>
            
            {/* BOX ATAS: PENGATUR AUTOMATION & TETAS */}
            <div style={{ textAlign: "center", background: "#1e1e38", padding: 20, borderRadius: 15, width: "100%" }}>
              <h1 style={{ margin: "0 0 5px 0", fontSize: 22, color: "#fbbf24", fontWeight: 900 }}>AYAM PETARUNG</h1>
              <p style={{ margin: "0 0 15px 0", fontSize: 11, color: "#a7a7d1" }}>Evolusi Ayam Terkuat Nusantara</p>
              
              <button onClick={generateChicken} style={{ background: "linear-gradient(135deg, #fbbf24, #d97706)", border: "none", borderRadius: "50%", width: 100, height: 100, fontSize: 42, cursor: "pointer", boxShadow: "0 6px 15px rgba(217,119,6,0.4)", marginBottom: 10, transition: "all 0.1s" }}>
                🐣
              </button>
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 15 }}>Biaya Tetas: 30 🥚 Telur</div>

              {boostActive && <div style={{ background: "#ef4444", color: "#fff", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: "bold", display: "inline-block", marginBottom: 15 }}>🔥 BOOST X2 AKTIF ({boostTime}s)</div>}

              {/* Kontrol Tiket Otomatis */}
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button onClick={useAutoGenerate} style={bStyle(autoGenerateActive ? "#ef4444" : "#10b981", "#059669")}>
                  {autoGenerateActive ? `Tetas On (${autoGenTime}s)` : `Auto Tetas (${autoGenTickets})`}
                </button>
                <button onClick={useAutoMerge} style={bStyle(autoMergeActive ? "#ef4444" : "#10b981", "#059669")}>
                  {autoMergeActive ? `Merge On (${autoMergeTime}s)` : `Auto Merge (${autoMergeTickets})`}
                </button>
              </div>
            </div>

            {/* BOX KANDANG GRID SEKARANG DI HALAMAN UTAMA */}
            <div style={{ background: "#111122", padding: 15, borderRadius: 15, width: "100%", borderWidth: 1, borderColor: "#2d2d50", borderStyle: "solid" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 15, color: "#fff" }}>🧺 Area Kandang Ternak</h3>
                <span style={{ fontSize: 11, color: "#9ca3af" }}>Gabungkan 2 Ayam yang sama</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, background: "#18182c", padding: 10, borderRadius: 12 }}>
                {grid.map((cell, index) => {
                  const tier = cell ? CHICKEN_TIERS[cell.tier - 1] : null;
                  const isSelected = selectedCell === index;

                  return (
                    <div
                      key={index}
                      onClick={() => handleCellClick(index)}
                      style={{
                        aspectRatio: "1/1",
                        background: isSelected ? "#2563eb" : cell ? "#22223f" : "#131324",
                        border: isSelected ? "2px solid #60a5fa" : "1px solid #2e2e54",
                        borderRadius: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        cursor: "pointer"
                      }}
                    >
                      {tier ? (
                        <>
                          <span style={{ fontSize: 28 }}>{tier.emoji}</span>
                          <span style={{ position: "absolute", bottom: 4, right: 4, background: tier.badgeColor, color: "#fff", fontSize: 9, fontWeight: "bold", padding: "1px 4px", borderRadius: 4 }}>
                            T{tier.tier}
                          </span>
                        </>
                      ) : (
                        <span style={{ color: "#252542", fontSize: 11 }}>+</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DAFTAR 20 TIER AYAM SEBAGAI PANDUAN PEMAIN */}
            <div style={{ background: "#111122", padding: 15, borderRadius: 15, width: "100%", maxHeight: 250, overflowY: "auto", borderWidth: 1, borderColor: "#2d2d50", borderStyle: "solid" }}>
              <h4 style={{ margin: "0 0 10px 0", fontSize: 14, color: "#fbbf24" }}>📜 Daftar Tingkatan (20 Tier Ayam)</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {CHICKEN_TIERS.map(t => (
                  <div key={t.tier} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "#18182c", borderRadius: 8, fontSize: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: "bold", color: t.rarityColor, width: 25 }}>T{t.tier}</span>
                      <span>{t.emoji} {t.name}</span>
                    </div>
                    <span style={{ fontSize: 11, color: "#a7a7d1" }}>+{t.idlePerSec} 🥚/dtk</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ─── 2. LAYAR SCRATCH (DIG) ────────────────────────────────────────── */}
        {screen === "dig" && (
          <div style={{ background: "#1e1e38", padding: 20, borderRadius: 15, textAlign: "center" }}>
            <h2 style={{ color: "#f43f5e", margin: "0 0 10px 0" }}>🐾 Garuk Tanah Keberuntungan</h2>
            <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 20 }}>Gunakan energi ceker ayam untuk menggali tanah berhadiah.</p>
            
            <div style={{ background: "#111122", padding: 30, borderRadius: 12, marginBottom: 20, cursor: "pointer", border: "2px dashed #f43f5e" }} onClick={handleScratch}>
              <span style={{ fontSize: 40 }}>⛏️</span>
              <div style={{ fontWeight: "bold", marginTop: 10, fontSize: 14 }}>KLIK UNTUK MENGGALI</div>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 5 }}>Biaya: 1 🐾 Ceker</div>
            </div>
          </div>
        )}

        {/* ─── 3. LAYAR SPIN WHEEL ───────────────────────────────────────────── */}
        {screen === "spin" && (
          <div style={{ background: "#1e1e38", padding: 20, borderRadius: 15, textAlign: "center" }}>
            <h2 style={{ color: "#3b82f6", margin: "0 0 10px 0" }}>🎡 Roda Keberuntungan Harian</h2>
            <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 25 }}>Dapatkan hadiah acak gratis setiap harinya!</p>
            
            <button onClick={handleSpin} style={{ ...bStyle("#3b82f6", "#2563eb"), padding: "15px 40px", fontSize: 15, letterSpacing: 1 }}>
              🎡 SPIN SEKARANG
            </button>
          </div>
        )}

        {/* ─── 4. LAYAR MISI (TASKS & CHECKIN) ────────────────────────────────── */}
        {screen === "tasks" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 25 }}>
            {/* Kalender Check-In */}
            <div style={{ background: "#1e1e38", padding: 20, borderRadius: 15 }}>
              <h3 style={{ margin: "0 0 5px 0", color: "#fbbf24" }}>📅 Absen Harian</h3>
              <p style={{ margin: "0 0 15px 0", fontSize: 11, color: "#9ca3af" }}>Klaim telur gratis yang makin banyak setiap hari.</p>
              <button onClick={handleCheckIn} disabled={checkedInToday} style={{ ...bStyle(checkedInToday ? "#374151" : "#eab308", "#a16207"), width: "100%", marginBottom: 10 }}>
                {checkedInToday ? "Sudah Absen Hari Ini" : "Absen Sekarang"}
              </button>
            </div>

            {/* Daftar Misi */}
            <div style={{ background: "#1e1e38", padding: 20, borderRadius: 15 }}>
              <h3 style={{ margin: "0 0 15px 0" }}>🎯 Misi Harian</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {tasks.map(t => {
                  const isDone = t.current >= t.target;
                  return (
                    <div key={t.id} style={{ background: "#111122", padding: 12, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: "bold" }}>{t.label}</div>
                        <div style={{ fontSize: 11, color: isDone ? "#10b981" : "#9ca3af", marginTop: 4 }}>
                          Progress: {t.current} / {t.target}
                        </div>
                      </div>
                      <button onClick={() => claimTaskReward(t.id, t.rewardEggs, t.rewardWorms)} disabled={!isDone || t.claimed} style={bStyle(t.claimed ? "#374151" : isDone ? "#10b981" : "#1f2937", isDone && !t.claimed ? "#059669" : "#111827")}>
                        {t.claimed ? "Selesai" : "Klaim"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── 5. LAYAR TOKO (SHOP) ─────────────────────────────────────────── */}
        {screen === "shop" && (
          <div style={{ background: "#1e1e38", padding: 20, borderRadius: 15 }}>
            <h2 style={{ color: "#a855f7", margin: "0 0 5px 0" }}>🛍️ Toko Kebutuhan Ternak</h2>
            <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 20px 0" }}>Belanja peralatan canggih dan asupan makanan berkualitas.</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: "#111122", padding: 12, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: "bold" }}>🎟️ Tiket Auto-Merge</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>Gabung otomatis (1 Menit)</div>
                </div>
                <button onClick={() => buyItem("merge_ticket", 5, "worms")} style={bStyle("#a855f7", "#7e22ce")}>5 🪱</button>
              </div>

              <div style={{ background: "#111122", padding: 12, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: "bold" }}>🎟️ Tiket Auto-Tetas</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>Menetas otomatis (1 Menit)</div>
                </div>
                <button onClick={() => buyItem("gen_ticket", 5, "worms")} style={bStyle("#a855f7", "#7e22ce")}>5 🪱</button>
              </div>

              <div style={{ background: "#111122", padding: 12, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: "bold" }}>🔥 Pakan Boost X2</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>Double pendapatan (5 Menit)</div>
                </div>
                <button onClick={() => buyItem("boost", 10, "worms")} style={bStyle("#a855f7", "#7e22ce")}>10 🪱</button>
              </div>

              <div style={{ background: "#111122", padding: 12, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: "bold" }}>📦 Paket 5 Cacing Premium</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>Untuk modal beli asupan otomatis</div>
                </div>
                <button onClick={() => buyItem("buy_worms", 40, "eggs")} style={bStyle("#fbbf24", "#b45309")}>40 🥚</button>
              </div>

              <div style={{ background: "#111122", padding: 12, borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: "bold" }}>📦 Paket 3 Ceker Energi</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>Tiket untuk main Scratch Gali</div>
                </div>
                <button onClick={() => buyItem("buy_claws", 40, "eggs")} style={bStyle("#fbbf24", "#b45309")}>40 🥚</button>
              </div>
            </div>
          </div>
        )}

        {/* ─── 6. LAYAR LEADERBOARD ────────────────────────────────────────── */}
        {screen === "leaderboard" && (
          <div style={{ background: "#1e1e38", padding: 20, borderRadius: 15, display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <h2 style={{ margin: "0 0 5px 0", color: "#fbbf24" }}>🏆 Peringkat Peternak</h2>
              <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>Catat nama dan amankan skor telur terbanyak Anda.</p>
            </div>

            {/* Simpan Skor */}
            <div style={{ display: "flex", gap: 10 }}>
              <input type="text" placeholder="Ketik nama peternak..." value={playerName} onChange={e => setPlayerName(e.target.value)} maxLength={12} style={{ flex: 1, background: "#111122", border: "1px solid #2d2d50", borderRadius: 10, padding: "10px 15px", color: "#fff", fontSize: 13 }} />
              <button onClick={saveLeaderboard} style={bStyle("#10b981", "#059669")}>💾 Simpan</button>
            </div>

            {/* List Score */}
            <div style={{ background: "#111122", borderRadius: 12, padding: 10 }}>
              {leaderboard.length === 0 ? (
                <div style={{ textAlign: "center", padding: 20, fontSize: 12, color: "#6b7280" }}>Belum ada data rekor peringkat.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {leaderboard.map((entry, idx) => {
                    return (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: idx === 0 ? "#1e1e40" : "#15152b", borderRadius: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontWeight: "bold", color: idx === 0 ? "#fbbf24" : "#9ca3af", width: 15 }}>{idx + 1}</span>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: "bold" }}>{entry.name}</div>
                            <div style={{ fontSize: 10, color: "#6b7280" }}>{entry.date} - T{entry.maxTier}</div>
                          </div>
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

            {leaderboard.length > 0 && (
              <button onClick={clearLeaderboard} style={{ ...bStyle("#1e1e40", "#3d3d6e"), fontSize: 12 }}>
                🗑️ Reset Leaderboard
              </button>
            )}
          </div>
        )}

      </div>

      {/* NAVIGASI MENU BAWAH (FIXED FOOTER) */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#11111f", borderTop: "2px solid #22223b", display: "flex", justifyContent: "space-around", padding: "12px 10px", zIndex: 90 }}>
        <button onClick={() => setScreen("main")} style={{ background: "none", border: "none", color: screen === "main" ? "#fbbf24" : "#6b7280", fontSize: 11, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 20 }}>🏠</span>Home
        </button>
        <button onClick={() => setScreen("dig")} style={{ background: "none", border: "none", color: screen === "dig" ? "#f43f5e" : "#6b7280", fontSize: 11, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 20 }}>⛏️</span>Scratch
        </button>
        <button onClick={() => setScreen("spin")} style={{ background: "none", border: "none", color: screen === "spin" ? "#3b82f6" : "#6b7280", fontSize: 11, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 20 }}>🎡</span>Spin
        </button>
        <button onClick={() => setScreen("tasks")} style={{ background: "none", border: "none", color: screen === "tasks" ? "#10b981" : "#6b7280", fontSize: 11, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 20 }}>🎯</span>Misi
        </button>
        <button onClick={() => setScreen("shop")} style={{ background: "none", border: "none", color: screen === "shop" ? "#a855f7" : "#6b7280", fontSize: 11, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 20 }}>🛍️</span>Shop
        </button>
        <button onClick={() => setScreen("leaderboard")} style={{ background: "none", border: "none", color: screen === "leaderboard" ? "#fbbf24" : "#6b7280", fontSize: 11, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 20 }}>🏆</span>Rank
        </button>
      </div>

    </main>
  );
}

// ─── HELPER STYLE TOMBOL ─────────────────────────────────────────────────────
function bStyle(bg: string, border: string): React.CSSProperties {
  return {
    background: bg,
    border: `1px solid ${border}`,
    color: "#fff",
    borderRadius: 10,
    padding: "10px 16px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s"
  };
}