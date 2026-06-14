"use client";

import { useEffect, useState } from "react";

const MAX_ENERGY = 1000;

const CHICKEN_TYPES = {
  COMMON: {
    name: "Common",
    eggsPerTap: 1,
  },
  RARE: {
    name: "Rare",
    eggsPerTap: 3,
  },
  EPIC: {
    name: "Epic",
    eggsPerTap: 7,
  },
  LEGENDARY: {
    name: "Legendary",
    eggsPerTap: 15,
  },
};

const COOP_LEVELS = {
  1: {
    productionPerMinute: 0,
    cost: 1000,
  },
  2: {
    productionPerMinute: 1,
    cost: 3000,
  },
  3: {
    productionPerMinute: 3,
    cost: 10000,
  },
  4: {
    productionPerMinute: 10,
    cost: 0,
  },
};

type ChickenType =
  | "COMMON"
  | "RARE"
  | "EPIC"
  | "LEGENDARY";

export default function Home() {
  const [eggs, setEggs] = useState(0);
  const [energy, setEnergy] = useState(MAX_ENERGY);
  const [coopLevel, setCoopLevel] = useState(1);
  const [floating, setFloating] = useState(false);

  const [chickenType, setChickenType] =
    useState<ChickenType>("COMMON");

  const eggsPerTap =
    CHICKEN_TYPES[chickenType].eggsPerTap;

  useEffect(() => {
    const save =
      localStorage.getItem("ayam-petarung");

    if (!save) return;

    const data = JSON.parse(save);

    setEggs(data.eggs || 0);
    setEnergy(data.energy || MAX_ENERGY);
    setCoopLevel(data.coopLevel || 1);
    setChickenType(
      data.chickenType || "COMMON"
    );
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "ayam-petarung",
      JSON.stringify({
        eggs,
        energy,
        coopLevel,
        chickenType,
      })
    );
  }, [eggs, energy, coopLevel, chickenType]);

  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy((prev) =>
        Math.min(MAX_ENERGY, prev + 1)
      );
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const production =
        COOP_LEVELS[
          coopLevel as keyof typeof COOP_LEVELS
        ].productionPerMinute;

      setEggs((prev) => prev + production);
    }, 60000);

    return () => clearInterval(interval);
  }, [coopLevel]);

  const tapChicken = () => {
    if (energy <= 0) return;

    setEggs((prev) => prev + eggsPerTap);
    setEnergy((prev) => prev - 1);

    setFloating(true);

    setTimeout(() => {
      setFloating(false);
    }, 500);
  };

  const upgradeChicken = () => {
    if (chickenType === "COMMON" && eggs >= 500) {
      setEggs((prev) => prev - 500);
      setChickenType("RARE");
      return;
    }

    if (chickenType === "RARE" && eggs >= 5000) {
      setEggs((prev) => prev - 5000);
      setChickenType("EPIC");
      return;
    }

    if (chickenType === "EPIC" && eggs >= 50000) {
      setEggs((prev) => prev - 50000);
      setChickenType("LEGENDARY");
      return;
    }

    alert("Telur tidak cukup atau sudah MAX");
  };

  const upgradeCoop = () => {
    if (coopLevel >= 4) {
      alert("Kandang sudah MAX");
      return;
    }

    const cost =
      COOP_LEVELS[
        coopLevel as keyof typeof COOP_LEVELS
      ].cost;

    if (eggs < cost) {
      alert("Telur tidak cukup");
      return;
    }

    setEggs((prev) => prev - cost);
    setCoopLevel((prev) => prev + 1);
  };

  const nextChickenCost =
    chickenType === "COMMON"
      ? 500
      : chickenType === "RARE"
      ? 5000
      : chickenType === "EPIC"
      ? 50000
      : 0;

  const coopCost =
    coopLevel < 4
      ? COOP_LEVELS[
          coopLevel as keyof typeof COOP_LEVELS
        ].cost
      : 0;

  const nextChickenType: Record<ChickenType, ChickenType | null> = {
    COMMON: "RARE",
    RARE: "EPIC",
    EPIC: "LEGENDARY",
    LEGENDARY: null,
  };

  const nextChicken = nextChickenType[chickenType];
  const nextChickenEggsPerTap = nextChicken
    ? CHICKEN_TYPES[nextChicken].eggsPerTap
    : null;

  const nextCoopLevel = coopLevel < 4 ? coopLevel + 1 : null;
  const nextCoopProduction = nextCoopLevel
    ? COOP_LEVELS[nextCoopLevel as keyof typeof COOP_LEVELS].productionPerMinute
    : null;

  return (
    <main className="h-screen bg-[#04153A] text-white p-2 overflow-hidden flex flex-col">

      <div className="max-w-md mx-auto w-full flex flex-col gap-2 flex-1">

        {/* Header */}
        <div className="border-2 border-yellow-500 rounded-xl px-3 py-1.5 text-center bg-[#07204D] shadow-xl">
          <h1 className="text-2xl font-black text-yellow-400">
            AYAM PETARUNG
          </h1>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-3 gap-2">

          <div className="bg-[#081B46] border border-yellow-500 rounded-xl p-2 text-center">
            <div className="text-[10px] text-yellow-300 leading-tight">
              EARN PER TAP
            </div>
            <div className="text-xl font-bold">
              +{eggsPerTap}
            </div>
          </div>

          <div className="bg-[#081B46] border border-cyan-500 rounded-xl p-2 text-center">
            <div className="text-[10px] text-cyan-300 leading-tight">
              KANDANG
            </div>
            <div className="text-xl font-bold">
              Lv.{coopLevel}
            </div>
          </div>

          <div className="bg-[#081B46] border border-red-500 rounded-xl p-2 text-center">
            <div className="text-[10px] text-red-300 leading-tight">
              AUTO/MIN
            </div>
            <div className="text-xl font-bold">
              {
                COOP_LEVELS[
                  coopLevel as keyof typeof COOP_LEVELS
                ].productionPerMinute
              }
            </div>
          </div>

        </div>

        {/* Egg Count */}
        <div className="text-center">
          <div className="text-yellow-300 text-sm font-bold">
            🥚 TELUR
          </div>
          <div className="text-5xl font-black text-yellow-400 leading-none">
            {eggs.toLocaleString()}
          </div>
        </div>

        {/* Chicken Type Badge */}
        <div className="text-center">
          <span className="bg-red-700 px-3 py-1 rounded-xl font-bold text-sm">
            {CHICKEN_TYPES[chickenType].name}
          </span>
        </div>

        {/* Chicken Button */}
        <div className="relative flex justify-center flex-1 items-center">

          {floating && (
            <div className="absolute top-0 text-2xl font-bold text-yellow-300 animate-bounce z-10">
              +{eggsPerTap}
            </div>
          )}

          <button
            onClick={tapChicken}
            className="active:scale-95 transition"
          >
            <div className="w-44 h-44 rounded-full border-[6px] border-yellow-400 bg-[#081B46] flex items-center justify-center shadow-2xl">
              <img
                src={`/images/chicken-${chickenType.toLowerCase()}.png`}
                alt={`${CHICKEN_TYPES[chickenType].name} Chicken`}
                className="w-32"
              />
            </div>
          </button>

        </div>

        <div className="text-center text-2xl font-black text-yellow-400 -mt-1">
          TAP DISINI
        </div>

        {/* Energy Bar */}
        <div className="bg-[#081B46] border border-yellow-500 rounded-xl p-2.5">
          <div className="font-bold text-sm">
            ⚡ Energi {energy}/{MAX_ENERGY}
          </div>
          <div className="w-full bg-slate-900 rounded-full h-3 mt-1.5">
            <div
              className="bg-cyan-400 h-3 rounded-full"
              style={{
                width: `${(energy / MAX_ENERGY) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Upgrade Buttons */}
        <div className="grid grid-cols-2 gap-3 pb-2">

          <button
            onClick={upgradeChicken}
            className="bg-gradient-to-b from-red-500 to-red-800 rounded-xl p-3 font-black text-yellow-300 text-sm"
          >
            UPGRADE AYAM
            {nextChicken ? (
              <>
                <div className="text-[10px] font-normal text-yellow-100 mt-1">
                  {CHICKEN_TYPES[chickenType].name} → {CHICKEN_TYPES[nextChicken].name}
                </div>
                <div className="text-[10px] font-normal text-yellow-100">
                  +{eggsPerTap} → +{nextChickenEggsPerTap} per tap
                </div>
                <div className="text-xs mt-1">
                  {nextChickenCost.toLocaleString()} 🥚
                </div>
              </>
            ) : (
              <div className="text-xs mt-1 font-normal text-yellow-100">
                Sudah MAX
              </div>
            )}
          </button>

          <button
            onClick={upgradeCoop}
            className="bg-gradient-to-b from-blue-500 to-blue-800 rounded-xl p-3 font-black text-yellow-300 text-sm"
          >
            UPGRADE KANDANG
            {nextCoopLevel ? (
              <>
                <div className="text-[10px] font-normal text-yellow-100 mt-1">
                  Lv.{coopLevel} → Lv.{nextCoopLevel}
                </div>
                <div className="text-[10px] font-normal text-yellow-100">
                  Auto {COOP_LEVELS[coopLevel as keyof typeof COOP_LEVELS].productionPerMinute} → {nextCoopProduction}/min
                </div>
                <div className="text-xs mt-1">
                  {coopCost.toLocaleString()} 🥚
                </div>
              </>
            ) : (
              <div className="text-xs mt-1 font-normal text-yellow-100">
                Sudah MAX
              </div>
            )}
          </button>

        </div>

      </div>

    </main>
  );
}
