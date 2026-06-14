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
  }, [
    eggs,
    energy,
    coopLevel,
    chickenType,
  ]);

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
    if (
      chickenType === "COMMON" &&
      eggs >= 500
    ) {
      setEggs((prev) => prev - 500);
      setChickenType("RARE");
      return;
    }

    if (
      chickenType === "RARE" &&
      eggs >= 5000
    ) {
      setEggs((prev) => prev - 5000);
      setChickenType("EPIC");
      return;
    }

    if (
      chickenType === "EPIC" &&
      eggs >= 50000
    ) {
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

  return (
    <main className="min-h-screen bg-[#04153A] text-white p-4">

      <div className="max-w-md mx-auto">

        <div className="border-4 border-yellow-500 rounded-2xl p-4 text-center bg-[#07204D] shadow-xl">
          <h1 className="text-4xl font-black text-yellow-400">
            AYAM PETARUNG
          </h1>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">

          <div className="bg-[#081B46] border border-yellow-500 rounded-xl p-3 text-center">
            <div className="text-xs text-yellow-300">
              EARN
            </div>

            <div className="text-2xl font-bold">
              +{eggsPerTap}
            </div>
          </div>

          <div className="bg-[#081B46] border border-cyan-500 rounded-xl p-3 text-center">
            <div className="text-xs text-cyan-300">
              KANDANG
            </div>

            <div className="text-2xl font-bold">
              Lv.{coopLevel}
            </div>
          </div>

          <div className="bg-[#081B46] border border-red-500 rounded-xl p-3 text-center">
            <div className="text-xs text-red-300">
              AUTO
            </div>

            <div className="text-2xl font-bold">
              {
                COOP_LEVELS[
                  coopLevel as keyof typeof COOP_LEVELS
                ].productionPerMinute
              }
            </div>
          </div>

        </div>

        <div className="text-center mt-6">
          <div className="text-yellow-300 text-xl font-bold">
            🥚 TELUR
          </div>

          <div className="text-6xl font-black text-yellow-400">
            {eggs.toLocaleString()}
          </div>
        </div>

        <div className="text-center mt-4">
          <span className="bg-red-700 px-4 py-2 rounded-xl font-bold">
            {CHICKEN_TYPES[chickenType].name}
          </span>
        </div>

        <div className="relative flex justify-center mt-6">

          {floating && (
            <div className="absolute -top-10 text-3xl font-bold text-yellow-300 animate-bounce">
              +{eggsPerTap}
            </div>
          )}

          <button
            onClick={tapChicken}
            className="active:scale-95 transition"
          >
            <div className="w-72 h-72 rounded-full border-8 border-yellow-400 bg-[#081B46] flex items-center justify-center shadow-2xl">

              <img
                src="/images/chicken.png"
                alt="Chicken"
                className="w-56"
              />

            </div>
          </button>

        </div>

        <div className="text-center text-4xl font-black text-yellow-400 mt-2">
          TAP DISINI
        </div>

        <div className="bg-[#081B46] border border-yellow-500 rounded-xl p-4 mt-6">

          <div className="font-bold">
            ⚡ Energi {energy}/{MAX_ENERGY}
          </div>

          <div className="w-full bg-slate-900 rounded-full h-4 mt-3">

            <div
              className="bg-cyan-400 h-4 rounded-full"
              style={{
                width: `${(energy / MAX_ENERGY) * 100}%`,
              }}
            />

          </div>

        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">

          <button
            onClick={upgradeChicken}
            className="bg-gradient-to-b from-red-500 to-red-800 rounded-2xl p-4 font-black text-yellow-300"
          >
            UPGRADE AYAM

            <div className="text-sm mt-2">
              {nextChickenCost.toLocaleString()} 🥚
            </div>
          </button>

          <button
            onClick={upgradeCoop}
            className="bg-gradient-to-b from-blue-500 to-blue-800 rounded-2xl p-4 font-black text-yellow-300"
          >
            UPGRADE KANDANG

            <div className="text-sm mt-2">
              {coopCost.toLocaleString()} 🥚
            </div>
          </button>

        </div>

      </div>

    </main>
  );
}