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

    alert(
      "Telur tidak cukup atau ayam sudah maksimal."
    );
  };

  const upgradeCoop = () => {
    if (coopLevel >= 4) {
      alert("Kandang sudah maksimal.");
      return;
    }

    const cost =
      COOP_LEVELS[
        coopLevel as keyof typeof COOP_LEVELS
      ].cost;

    if (eggs < cost) {
      alert("Telur tidak cukup.");
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

  const nextChickenName =
    chickenType === "COMMON"
      ? "Rare"
      : chickenType === "RARE"
      ? "Epic"
      : chickenType === "EPIC"
      ? "Legendary"
      : "MAX";

  const coopCost =
    coopLevel < 4
      ? COOP_LEVELS[
          coopLevel as keyof typeof COOP_LEVELS
        ].cost
      : 0;

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

          <div className="flex justify-between">
            <span>🐔 Status Ayam</span>

            <span
              className={`font-bold ${
                chickenType === "COMMON"
                  ? "text-gray-600"
                  : chickenType === "RARE"
                  ? "text-blue-600"
                  : chickenType === "EPIC"
                  ? "text-purple-600"
                  : "text-yellow-600"
              }`}
            >
              {
                CHICKEN_TYPES[chickenType].name
              }
            </span>
          </div>

          <div className="mt-2">
            🥚 Per Tap: <b>{eggsPerTap}</b>
          </div>

          <div className="mt-2">
            🏠 Kandang: <b>Lv.{coopLevel}</b>
          </div>

          <div className="mt-2">
            ⏱ Auto Farm:
            <b>
              {" "}
              {
                COOP_LEVELS[
                  coopLevel as keyof typeof COOP_LEVELS
                ].productionPerMinute
              }
            </b>
            {" "}
            telur/menit
          </div>

        </div>

        <div className="relative flex justify-center my-10">

          {floating && (
            <div className="absolute -top-10 text-2xl font-bold animate-bounce">
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
            disabled={
              chickenType === "LEGENDARY" ||
              eggs < nextChickenCost
            }
            className="bg-yellow-400 rounded-xl p-4 font-bold shadow disabled:opacity-50"
          >
            🐔 Upgrade Ayam

            <div className="text-sm mt-2">
              {chickenType ===
              "LEGENDARY"
                ? "MAX LEVEL"
                : `${CHICKEN_TYPES[chickenType].name} → ${nextChickenName}`}
            </div>

            {chickenType !==
              "LEGENDARY" && (
              <>
                <div className="text-sm mt-1">
                  Cost:
                  {" "}
                  {nextChickenCost.toLocaleString()}
                  {" "}
                  🥚
                </div>

                <div className="text-xs">
                  {eggs.toLocaleString()}
                  {" / "}
                  {nextChickenCost.toLocaleString()}
                </div>
              </>
            )}
          </button>

          <button
            onClick={upgradeCoop}
            disabled={
              coopLevel >= 4 ||
              eggs < coopCost
            }
            className="bg-blue-400 rounded-xl p-4 font-bold shadow disabled:opacity-50"
          >
            🏠 Upgrade Kandang

            <div className="text-sm mt-2">
              {coopLevel >= 4
                ? "MAX LEVEL"
                : `Lv.${coopLevel} → Lv.${coopLevel + 1}`}
            </div>

            {coopLevel < 4 && (
              <>
                <div className="text-sm mt-1">
                  Cost:
                  {" "}
                  {coopCost.toLocaleString()}
                  {" "}
                  🥚
                </div>

                <div className="text-xs">
                  {eggs.toLocaleString()}
                  {" / "}
                  {coopCost.toLocaleString()}
                </div>
              </>
            )}
          </button>

        </div>

      </div>
    </main>
  );
}