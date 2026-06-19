import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Rooster, Player, Egg, DailyQuest } from '@/constants/types';
import { SAMPLE_ROOSTERS, INITIAL_PLAYER, DAILY_QUESTS } from '@/constants/gameData';

interface GameContextType {
  player: Player;
  roosters: Rooster[];
  eggs: Egg[];
  dailyQuests: DailyQuest[];
  selectedTeam: string[];
  setSelectedTeam: (team: string[]) => void;
  addEgg: (egg: Egg) => void;
  hatchEgg: (eggId: string) => void;
  updatePlayer: (updates: Partial<Player>) => void;
  completeQuest: (questId: string) => void;
  recordBattleResult: (won: boolean) => void;
  isLoading: boolean;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<Player>(INITIAL_PLAYER);
  const [roosters, setRoosters] = useState<Rooster[]>(SAMPLE_ROOSTERS);
  const [eggs, setEggs] = useState<Egg[]>([]);
  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>(DAILY_QUESTS);
  const [selectedTeam, setSelectedTeam] = useState<string[]>(['r001', 'r002', 'r003']);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [savedPlayer, savedRoosters, savedEggs, savedTeam] = await Promise.all([
        AsyncStorage.getItem('lfr_player'),
        AsyncStorage.getItem('lfr_roosters'),
        AsyncStorage.getItem('lfr_eggs'),
        AsyncStorage.getItem('lfr_team'),
      ]);
      if (savedPlayer) setPlayer(JSON.parse(savedPlayer));
      if (savedRoosters) setRoosters(JSON.parse(savedRoosters));
      if (savedEggs) setEggs(JSON.parse(savedEggs));
      if (savedTeam) setSelectedTeam(JSON.parse(savedTeam));
    } catch (e) {
      // use defaults
    } finally {
      setIsLoading(false);
    }
  }

  async function saveData(key: string, value: unknown) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  function updatePlayer(updates: Partial<Player>) {
    const updated = { ...player, ...updates };
    setPlayer(updated);
    saveData('lfr_player', updated);
  }

  function addEgg(egg: Egg) {
    const updated = [...eggs, egg];
    setEggs(updated);
    saveData('lfr_eggs', updated);
  }

  function hatchEgg(eggId: string) {
    const updated = eggs.filter(e => e.id !== eggId);
    setEggs(updated);
    saveData('lfr_eggs', updated);
  }

  function completeQuest(questId: string) {
    const updated = dailyQuests.map(q =>
      q.id === questId ? { ...q, completed: true, progress: q.total } : q
    );
    setDailyQuests(updated);
  }

  function recordBattleResult(won: boolean) {
    const updated = {
      ...player,
      wins: won ? player.wins + 1 : player.wins,
      losses: won ? player.losses : player.losses + 1,
      gold: won ? player.gold + 500 : player.gold + 100,
      arenaPoints: won ? player.arenaPoints + 25 : Math.max(0, player.arenaPoints - 10),
    };
    setPlayer(updated);
    saveData('lfr_player', updated);
  }

  const handleSetSelectedTeam = (team: string[]) => {
    setSelectedTeam(team);
    saveData('lfr_team', team);
  };

  return (
    <GameContext.Provider value={{
      player,
      roosters,
      eggs,
      dailyQuests,
      selectedTeam,
      setSelectedTeam: handleSetSelectedTeam,
      addEgg,
      hatchEgg,
      updatePlayer,
      completeQuest,
      recordBattleResult,
      isLoading,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
