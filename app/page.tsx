"use client";

import { useEffect, useState } from "react";

const MAX_ENERGY = 1000;

const CHICKEN_TYPES = {
  COMMON: {
    name: "Common",
    eggsPerTap: 1,
    upgradeCost: 500,
  },

  RARE: {
    name: "Rare",
    eggsPerTap: 3,
    upgradeCost: 5000,
  },

  EPIC: {
    name: "Epic",
    eggsPerTap: 7,
    upgradeCost: 50000,
  },

  LEGENDARY: {
    name: "Legendary",
    eggsPerTap: 15,
    upgradeCost: 0,
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

  const [chickenType, setChickenType] =
    useState<ChickenType>("COMMON");

  const [floating, setFloating] = useState(false);

  const eggsPerTap =
    CHICKEN_TYPES[chickenType].eggsPerTap;

  // LOAD SAVE
  useEffect(() => {
    const save = localStorage.getItem(
      "ayam-petarung"
    );

    if (!save) return;

    const data = JSON.parse(save);

    setEggs(data.eggs || 0);
    setEnergy(data.energy || MAX_ENERGY);
    setCoopLevel(data.coopLevel || 1);
    setChickenType(
      data.chickenType || "COMMON"
    );
  }, []);

  // SAVE
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

  // ENERGY REGEN
  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy((prev) =>
        Math.min(MAX_ENERGY, prev + 1)
      );
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // AUTO FARM
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
    }, 400);
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

    alert("Telur tidak cukup atau sudah maksimal");
  };

  const upgradeCoop = () => {
    if (coopLevel >= 4) {
      alert("Kandang sudah maksimal");
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-200 to-green-500 p-4">
      <div className="max-w-md mx-auto">

        <h1 className="text-center text-4xl font-bold mb-6">
          🐔 Ayam Petarung
        </h1>

        <div className="bg-white rounded-xl p-4 shadow mb-4">
          <div className="text-3xl font-bold">
            🥚 {eggs.toLocaleString()}
          </div>

          <div className="mt-3">
            ⚡ {energy}/{MAX_ENERGY}
          </div>

          <div className="w-full bg-gray-200 h-3 rounded-full mt-2">
            <div
              className="bg-yellow-400 h-3 rounded-full"
              style={{
                width: `${(energy / MAX_ENERGY) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow mb-4">
          <div>
            🐔 Ayam:
            {" "}
            {CHICKEN_TYPES[chickenType].name}
          </div>

          <div className="mt-2">
            🥚 Per Tap:
            {" "}
            {eggsPerTap}
          </div>

          <div className="mt-2">
            🏠 Kandang Lv.{coopLevel}
          </div>

          <div className="mt-2">
            ⏱ Auto:
            {" "}
            {
              COOP_LEVELS[
                coopLevel as keyof typeof COOP_LEVELS
              ].productionPerMinute
            }
            {" "}
            telur/menit
          </div>
        </div>

        <div className="relative flex justify-center my-10">
          {floating && (
            <div className="absolute -top-10 text-2xl font-bold">
              +{eggsPerTap} 🥚
            </div>
          )}

          <button
            onClick={tapChicken}
            className="text-[140px] active:scale-90 transition"
          >
            🐔
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">

          <button
            onClick={upgradeChicken}
            className="bg-yellow-400 rounded-xl p-4 font-bold shadow"
          >
            Upgrade Ayam
          </button>

          <button
            onClick={upgradeCoop}
            className="bg-blue-400 rounded-xl p-4 font-bold shadow"
          >
            Upgrade Kandang
          </button>

        </div>

      </div>
    </main>
  );
}