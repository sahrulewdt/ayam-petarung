"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── TYPES ───────────────────────────────────────────────────────────────────
type TierId = 1|2|3|4|5|6;
type Element = "Api"|"Air"|"Petir"|"Tanah"|"Angin";
type NFTRarity = "Common"|"Rare"|"Epic"|"Legendary"|"Mythic"|"Divine";
type EquipmentType = "Armor"|"Cakar"|"Sayap"|"Helm";
type SeasonRank = "Bronze"|"Silver"|"Gold"|"Diamond"|"Master"|"Grandmaster"|"Mythic";
type Screen = "home"|"farm"|"arena"|"clan"|"market"|"breed"|"boss"|"heroes"|"growth";

interface ChickenTier {
  tier: TierId; name: string; emoji: string;
  rarity: string; rarityColor: string; badgeColor: string; idlePerSec: number;
}
interface GridCell { tier: TierId; id: number; }
interface NFTStat { hp: number; attack: number; speed: number; critRate: number; }
interface NFTChicken {
  id: number; name: string; emoji: string; element: Element;
  rarity: NFTRarity; stats: NFTStat; breedCount: number; skills: string[];
  forSale?: boolean; salePrice?: number;
}
interface NFTEquipment {
  id: number; type: EquipmentType; rarity: NFTRarity;
  statBonus: Partial<NFTStat>; forSale?: boolean; salePrice?: number;
}
interface BattleLog { round: number; msg: string; }
interface Toast { msg: string; type?: "info"|"err"|"success"; }
interface FloatItem { id: number; text: string; x: number; y: number; }
interface ClanInfo {
  name: string; tag: string; level: number; members: number;
  trophies: number; donations: number; bossHP: number; maxBossHP: number;
  bossDefeated: boolean; lastBossDate: string;
}
interface MarketListing {
  id: number; seller: string; type: "chicken"|"equipment"|"egg";
  item: NFTChicken|NFTEquipment|null; eggAmount?: number;
  price: number; listedAt: string;
}
interface PvPDefense { nftIds: number[]; wins: number; losses: number; }
interface Hero { key: string; name: string; emoji: string; element: Element; rarity: NFTRarity; archetype: string; }
interface DailyLoginState { streak: number; lastClaim: string; claimedDays: number[]; }
interface ReferralState { code: string; invited: number; claimedMilestones: number[]; }
interface DailyReward { day: number; eggs: number; goldenEgg: number; guaranteed?: NFTRarity; label: string; }

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
// 6 clean rarity tiers (replaces the old 20-tier grind — clearer progression, less clutter)
const CHICKEN_TIERS: ChickenTier[] = [
  { tier:1, name:"Common",    emoji:"🐣", rarity:"Common",    rarityColor:"#9ca3af", badgeColor:"#6b7280", idlePerSec:0.2    },
  { tier:2, name:"Rare",      emoji:"🐥", rarity:"Rare",      rarityColor:"#60a5fa", badgeColor:"#2563eb", idlePerSec:1.5   },
  { tier:3, name:"Epic",      emoji:"🐔", rarity:"Epic",      rarityColor:"#a78bfa", badgeColor:"#7c3aed", idlePerSec:9.0   },
  { tier:4, name:"Legendary", emoji:"🔥", rarity:"Legendary", rarityColor:"#fbbf24", badgeColor:"#b45309", idlePerSec:55.0  },
  { tier:5, name:"Mythic",    emoji:"🐉", rarity:"Mythic",    rarityColor:"#8a2be2", badgeColor:"#4b0082", idlePerSec:320.0 },
  { tier:6, name:"Divine",    emoji:"👑", rarity:"Divine",    rarityColor:"#ff00ff", badgeColor:"#8b008b", idlePerSec:1800.0},
];

// ─── HERO COLLECTION: 100 unique Hero Ayam (20 archetypes × 5 elements) ───────
const HERO_ARCHETYPES: { name:string; emoji:string; rarity:NFTRarity }[] = [
  // Common (5)
  { name:"Kampung",  emoji:"🐣", rarity:"Common" },
  { name:"Sentul",   emoji:"🐥", rarity:"Common" },
  { name:"Kedu",     emoji:"🐔", rarity:"Common" },
  { name:"Pelung",   emoji:"🦚", rarity:"Common" },
  { name:"Bangkok",  emoji:"🐓", rarity:"Common" },
  // Rare (5)
  { name:"Bekisar",  emoji:"🦜", rarity:"Rare" },
  { name:"Birma",    emoji:"🌟", rarity:"Rare" },
  { name:"Saigon",   emoji:"⚫", rarity:"Rare" },
  { name:"Wangkas",  emoji:"🦅", rarity:"Rare" },
  { name:"Pama",     emoji:"🦢", rarity:"Rare" },
  // Epic (4)
  { name:"Magon",     emoji:"⚔️", rarity:"Epic" },
  { name:"Bagon",     emoji:"👹", rarity:"Epic" },
  { name:"Kelso",     emoji:"🛡️", rarity:"Epic" },
  { name:"Roundhead", emoji:"🌪️", rarity:"Epic" },
  // Legendary (3)
  { name:"Hatch",   emoji:"🌋", rarity:"Legendary" },
  { name:"Shamo",   emoji:"👁️", rarity:"Legendary" },
  { name:"Cemani",  emoji:"🌑", rarity:"Legendary" },
  // Mythic (2)
  { name:"Garuda",  emoji:"🦅", rarity:"Mythic" },
  { name:"Phoenix", emoji:"🔥", rarity:"Mythic" },
  // Divine (1)
  { name:"Dewa Nusantara", emoji:"👑", rarity:"Divine" },
];

const ELEMENTS: Element[] = ["Api","Air","Petir","Tanah","Angin"];
function generateHeroes():Hero[] {
  const heroes:Hero[]=[];
  for(const arch of HERO_ARCHETYPES){
    for(const el of ELEMENTS){
      heroes.push({
        key:`${arch.name}-${el}`,
        name:`${arch.name} ${el}`,
        emoji:arch.emoji,
        element:el,
        rarity:arch.rarity,
        archetype:arch.name,
      });
    }
  }
  return heroes;
}
const HEROES:Hero[] = generateHeroes(); // 20 archetypes × 5 elements = 100 unique heroes
function heroesByRarity(r:NFTRarity):Hero[] { return HEROES.filter(h=>h.rarity===r); }
function pickRandomHero(r:NFTRarity):Hero {
  const pool=heroesByRarity(r);
  return pool[Math.floor(Math.random()*pool.length)];
}

const GRID_SIZE = 15;
const HATCH_COST = 30;
const BOOST_DURATION_MS = 5 * 60 * 1000;
const BREED_EGG_COST = 80000;
const BREED_TOKEN_COST = 8;
const NFT_MINT_COST = 5000;

const ELEMENT_EMOJI: Record<Element,string> = { Api:"🔥",Air:"💧",Petir:"⚡",Tanah:"🌍",Angin:"🌪️" };
const ELEMENT_COLOR: Record<Element,string> = { Api:"#ef4444",Air:"#60a5fa",Petir:"#facc15",Tanah:"#a37c3a",Angin:"#86efac" };
const ELEMENT_COUNTER: Record<Element,Element> = { Api:"Angin",Angin:"Tanah",Tanah:"Petir",Petir:"Air",Air:"Api" };

// Elemental breeding combinations → unique hybrid names
const BREED_COMBOS: Record<string,{ name:string; emoji:string; bonus:string }> = {
  "Api+Petir":   { name:"Ayam Guntur Api",   emoji:"🌩️", bonus:"ATK +30%" },
  "Petir+Api":   { name:"Ayam Guntur Api",   emoji:"🌩️", bonus:"ATK +30%" },
  "Air+Tanah":   { name:"Ayam Lumpur Sakti", emoji:"🌊", bonus:"HP +40%"  },
  "Tanah+Air":   { name:"Ayam Lumpur Sakti", emoji:"🌊", bonus:"HP +40%"  },
  "Angin+Api":   { name:"Ayam Badai Neraka", emoji:"🌋", bonus:"CRIT +25%"},
  "Api+Angin":   { name:"Ayam Badai Neraka", emoji:"🌋", bonus:"CRIT +25%"},
  "Petir+Air":   { name:"Ayam Kilat Banjir", emoji:"⛈️", bonus:"SPD +35%" },
  "Air+Petir":   { name:"Ayam Kilat Banjir", emoji:"⛈️", bonus:"SPD +35%" },
  "Tanah+Angin": { name:"Ayam Debu Tornado", emoji:"🌀", bonus:"DEF +20%" },
  "Angin+Tanah": { name:"Ayam Debu Tornado", emoji:"🌀", bonus:"DEF +20%" },
};

const NFT_RARITY_COLOR: Record<NFTRarity,string> = {
  Common:"#9ca3af", Rare:"#60a5fa", Epic:"#a78bfa", Legendary:"#fbbf24", Mythic:"#8a2be2", Divine:"#ff00ff",
};
const NFT_RARITY_PROB = [
  { rarity:"Common" as NFTRarity, prob:48 },
  { rarity:"Rare"   as NFTRarity, prob:27 },
  { rarity:"Epic"   as NFTRarity, prob:15 },
  { rarity:"Legendary" as NFTRarity, prob:7 },
  { rarity:"Mythic" as NFTRarity, prob:2.5 },
  { rarity:"Divine" as NFTRarity, prob:0.5 },
];

const SEASONAL_RANKS: { rank:SeasonRank; emoji:string; minPts:number; color:string; reward:string }[] = [
  { rank:"Bronze",      emoji:"🥉", minPts:0,    color:"#cd7f32", reward:"500 🥚"           },
  { rank:"Silver",      emoji:"🥈", minPts:100,  color:"#c0c0c0", reward:"1.500 🥚"         },
  { rank:"Gold",        emoji:"🥇", minPts:300,  color:"#fbbf24", reward:"5.000 🥚"         },
  { rank:"Diamond",     emoji:"💎", minPts:600,  color:"#60a5fa", reward:"NFT Common 🃏"    },
  { rank:"Master",      emoji:"🏅", minPts:1000, color:"#a78bfa", reward:"NFT Rare 🃏"      },
  { rank:"Grandmaster", emoji:"👑", minPts:1500, color:"#ff4500", reward:"NFT Epic 🃏"      },
  { rank:"Mythic",      emoji:"⚜️", minPts:2200, color:"#ff00ff", reward:"NFT Legendary 🃏" },
];

const EQUIPMENT_EMOJI: Record<EquipmentType,string> = { Armor:"🛡️",Cakar:"🦅",Sayap:"🪶",Helm:"⛑️" };

const BOSS_DATA = {
  name:"Garuda Nusantara",
  emoji:"🦅",
  description:"Boss legendaris muncul setiap hari. Serang bersama clan-mu!",
  maxHP:1000000,
  color:"#ff4500",
};

const MOCK_MARKET_LISTINGS: MarketListing[] = [
  { id:1, seller:"Purnomo_ID", type:"chicken", item:{ id:101, name:"Bangkok", emoji:"🐉", element:"Api", rarity:"Epic", stats:{ hp:180, attack:120, speed:85, critRate:22 }, breedCount:1, skills:["Taji Api 🔥","Cakar Baja 🦾","Aura Legenda 👑"] }, price:25000, listedAt:"2025-01-15" },
  { id:2, seller:"BudiSantoso", type:"chicken", item:{ id:102, name:"Cemani", emoji:"🌑", element:"Tanah", rarity:"Legendary", stats:{ hp:280, attack:195, speed:110, critRate:35 }, breedCount:0, skills:["Pecuk Kilat ⚡","Sayap Badai 🌪️","Taji Api 🔥","Aura Legenda 👑"] }, price:150000, listedAt:"2025-01-15" },
  { id:3, seller:"SitiRahayu", type:"equipment", item:{ id:201, type:"Cakar", rarity:"Rare", statBonus:{ attack:18 } }, price:8000, listedAt:"2025-01-15" },
  { id:4, seller:"AhmadZaki", type:"egg", item:null, eggAmount:10000, price:9500, listedAt:"2025-01-15" },
  { id:5, seller:"DewiLestari", type:"chicken", item:{ id:103, name:"Bekisar×Bangkok", emoji:"🦜", element:"Petir", rarity:"Rare", stats:{ hp:145, attack:98, speed:102, critRate:18 }, breedCount:2, skills:["Pecuk Kilat ⚡","Mata Elang 👁️"] }, price:18000, listedAt:"2025-01-15" },
  { id:6, seller:"RizkyPratama", type:"equipment", item:{ id:202, type:"Armor", rarity:"Epic", statBonus:{ hp:45 } }, price:35000, listedAt:"2025-01-15" },
];

const MOCK_CLAN_RANKING = [
  { name:"Garuda Merah",    trophies:4820, members:25, emoji:"🦅" },
  { name:"Naga Biru",       trophies:4210, members:23, emoji:"🐉" },
  { name:"Harimau Jawa",    trophies:3980, members:20, emoji:"🐯" },
  { name:"Badak Sumatera",  trophies:3540, members:18, emoji:"🦏" },
  { name:"Komodo Elite",    trophies:3120, members:22, emoji:"🦎" },
];

const MOCK_PVP_OPPONENTS = [
  { name:"AyamKilat99",   rank:"Gold" as SeasonRank,   pts:520, emoji:"🥇", defense:[{ id:-1, name:"Bangkok",  emoji:"🐉", element:"Api"   as Element, rarity:"Epic"      as NFTRarity, stats:{ hp:170, attack:115, speed:80,  critRate:20 }, breedCount:1, skills:["Taji Api 🔥"] }] },
  { name:"PetemburSakti", rank:"Master" as SeasonRank, pts:1100,emoji:"🏅", defense:[{ id:-2, name:"Cemani",   emoji:"🌑", element:"Tanah" as Element, rarity:"Legendary" as NFTRarity, stats:{ hp:260, attack:185, speed:105, critRate:32 }, breedCount:0, skills:["Aura Legenda 👑"] }] },
  { name:"JawaraNusantara",rank:"Silver" as SeasonRank,pts:250, emoji:"🥈", defense:[{ id:-3, name:"Bekisar",  emoji:"🦜", element:"Petir" as Element, rarity:"Rare"      as NFTRarity, stats:{ hp:130, attack:88,  speed:95,  critRate:15 }, breedCount:2, skills:["Pecuk Kilat ⚡"] }] },
  { name:"MandorAyam",    rank:"Diamond" as SeasonRank,pts:720, emoji:"💎", defense:[{ id:-4, name:"Wangkas",  emoji:"🔥", element:"Api"   as Element, rarity:"Epic"      as NFTRarity, stats:{ hp:200, attack:140, speed:90,  critRate:25 }, breedCount:1, skills:["Taji Api 🔥","Cakar Baja 🦾"] }] },
];

const SAVE_KEY  = "ayam-petarung-v5";

// ─── DAILY LOGIN (30-day cycle) ────────────────────────────────────────────────
function buildDailyRewards():DailyReward[] {
  const rewards:DailyReward[]=[];
  for(let d=1;d<=30;d++){
    if(d===1)        rewards.push({day:d,eggs:100, goldenEgg:0,                 label:"100 🥚"});
    else if(d===7)   rewards.push({day:d,eggs:300, goldenEgg:2, guaranteed:"Epic",     label:"Epic Egg 🥚✨"});
    else if(d===30)  rewards.push({day:d,eggs:5000,goldenEgg:5, guaranteed:"Legendary",label:"Legendary Egg 🥚✨"});
    else if(d%5===0) rewards.push({day:d,eggs:100+d*25,goldenEgg:1,             label:`${fmtNum(100+d*25)} 🥚 + 1 🥚✨`});
    else             rewards.push({day:d,eggs:100+d*20,goldenEgg:0,             label:`${fmtNum(100+d*20)} 🥚`});
  }
  return rewards;
}
const DAILY_REWARDS:DailyReward[]=buildDailyRewards();

// ─── REFERRAL VIRAL LOOP ────────────────────────────────────────────────────────
const REFERRAL_MILESTONES:{ count:number; goldenEgg:number; heroRarity:NFTRarity; label:string }[] = [
  { count:1,  goldenEgg:1,  heroRarity:"Common",    label:"Undang 1 teman → 1 Pet 🐣"        },
  { count:5,  goldenEgg:3,  heroRarity:"Rare",       label:"Undang 5 teman → Rare Egg 🥚✨"    },
  { count:25, goldenEgg:10, heroRarity:"Legendary",  label:"Undang 25 teman → Legendary Pet 👑"},
];
function genReferralCode(name:string):string {
  const base=name.trim().slice(0,5).toUpperCase().replace(/[^A-Z0-9]/g,"")||"AYAM";
  return `${base}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
}

// ─── EGG GACHA (4-tier, classic Telegram-style loot odds) ─────────────────────
const GACHA_PROB = [
  { rarity:"Common"    as NFTRarity, prob:70 },
  { rarity:"Rare"      as NFTRarity, prob:20 },
  { rarity:"Epic"      as NFTRarity, prob:8  },
  { rarity:"Legendary" as NFTRarity, prob:2  },
];
const GACHA_COST_GOLDEN_EGG=1;
const GOLDEN_EGG_BUY_RATE=600; // eggs per 1 golden egg

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function weightedPick<T extends { prob:number }>(pool:T[]):T {
  const total = pool.reduce((s,r)=>s+r.prob,0);
  let rand = Math.random()*total;
  for(const r of pool){ rand-=r.prob; if(rand<=0)return r; }
  return pool[pool.length-1];
}
function todayStr():string { return new Date().toISOString().slice(0,10); }
function getTier(tier:TierId):ChickenTier { return CHICKEN_TIERS[(tier-1)%CHICKEN_TIERS.length]; }
function fmtNum(n:number):string {
  if(n>=1_000_000) return (n/1_000_000).toFixed(1)+"M";
  if(n>=1_000) return (n/1_000).toFixed(1)+"K";
  return Math.floor(n).toString();
}
function loadSave():Record<string,unknown>|null {
  try { const s=localStorage.getItem(SAVE_KEY); return s?JSON.parse(s):null; } catch { return null; }
}

// ─── YARD ─────────────────────────────────────────────────────────────────────
function Yard({ tiers }:{ tiers:ChickenTier[] }) {
  return (
    <div style={{ width:"100%", height:200, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, height:80, background:"linear-gradient(to bottom,#0d1a2e,#1a2d4a)" }} />
      {[{l:30,t:15,r:3},{l:120,t:22,r:2},{l:230,t:10,r:4},{l:310,t:18,r:2.5}].map((s,i)=>(
        <div key={i} style={{ position:"absolute", top:s.t, left:s.l, width:s.r*14, height:s.r*6, background:"rgba(255,255,255,0.12)", borderRadius:20 }} />
      ))}
      <div style={{ position:"absolute", top:80, left:0, right:0, bottom:45, background:"linear-gradient(to bottom,#1a4a1a,#2d6b1a)" }} />
      <div style={{ position:"absolute", bottom:45, right:12, width:52 }}>
        <div style={{ width:0,height:0,borderLeft:"27px solid transparent",borderRight:"27px solid transparent",borderBottom:"22px solid #8b2010",margin:"0 auto" }} />
        <div style={{ width:52,height:40,background:"#c4944a",border:"2px solid #8b6030",borderRadius:"3px 3px 0 0",position:"relative",marginTop:-1 }}>
          <div style={{ width:14,height:18,background:"#3a1a08",borderRadius:"8px 8px 0 0",position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)" }} />
        </div>
      </div>
      {tiers.slice(0,8).map((t,i)=><ChickenWalker key={t.tier} tier={t} index={i}/>)}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:45, background:"#b8903a", borderTop:"2px solid #8b6828" }} />
    </div>
  );
}

const WALK_P=[
  {goRight:true, dur:7, delay:0,  size:22,bot:48},
  {goRight:false,dur:9, delay:1.5,size:20,bot:52},
  {goRight:true, dur:6, delay:3.0,size:18,bot:50},
  {goRight:false,dur:11,delay:0.5,size:22,bot:54},
  {goRight:true, dur:8, delay:2.0,size:20,bot:49},
  {goRight:false,dur:13,delay:4.0,size:18,bot:55},
  {goRight:true, dur:10,delay:1.0,size:22,bot:51},
  {goRight:false,dur:7, delay:2.5,size:20,bot:53},
];
function ChickenWalker({tier,index}:{tier:ChickenTier;index:number}) {
  const p=WALK_P[index%WALK_P.length];
  const an=`wk${tier.tier}`;
  const from=p.goRight?"-28px":"380px";
  const to  =p.goRight?"380px" :"-28px";
  return (
    <>
      <style>{`@keyframes ${an}{0%{left:${from}}100%{left:${to}}}`}</style>
      <div style={{ position:"absolute",bottom:p.bot,fontSize:p.size,lineHeight:1,pointerEvents:"none",
        animation:`${an} ${p.dur}s linear ${p.delay}s infinite`,
        transform:p.goRight?"scaleX(1)":"scaleX(-1)",userSelect:"none" }}>
        {tier.emoji}
      </div>
    </>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Home() {
  const [screen,   setScreen]   = useState<Screen>("home");
  const [eggs,     setEggs]     = useState(500);
  const [worms,    setWorms]    = useState(10);
  const [tokens,   setTokens]   = useState(0);
  const [grid,     setGrid]     = useState<(GridCell|null)[]>(Array(GRID_SIZE).fill(null));
  const [selectedCell,setSelectedCell]=useState<number|null>(null);
  const [boostActive,setBoostActive]=useState(false);
  const [boostEndTime,setBoostEndTime]=useState(0);
  const [totalEarned,setTotalEarned]=useState(0);
  const [playerName,setPlayerName]=useState("Pejuang Nusantara");
  const [now,      setNow]      = useState(Date.now());
  const [musicOn,  setMusicOn]  = useState(false);
  const [toast,    setToast]    = useState<Toast|null>(null);
  const [floats,   setFloats]   = useState<FloatItem[]>([]);

  // NFT
  const [nftChickens, setNftChickens]= useState<NFTChicken[]>([]);
  const [nftEquipment,setNftEquipment]=useState<NFTEquipment[]>([]);

  // Arena / PvP
  const [arenaPoints,setArenaPoints]=useState(0);
  const [pvpDefense, setPvpDefense] =useState<PvPDefense>({ nftIds:[], wins:0, losses:0 });
  const [battleResult,setBattleResult]=useState<{win:boolean;logs:BattleLog[];opponent:string}|null>(null);
  const [isBattling, setIsBattling] =useState(false);
  const [pvpTab,     setPvpTab]     =useState<"attack"|"defense"|"replay">("attack");

  // Season
  const [seasonPts,setSeasonPts]  =useState(0);
  const [seasonStart,setSeasonStart]=useState(todayStr());

  // Clan
  const [myClan,setMyClan]=useState<ClanInfo|null>(null);
  const [clanTab,setClanTab]=useState<"info"|"boss"|"ranking"|"donate">("info");
  const [bossHP,setBossHP]=useState(BOSS_DATA.maxHP);
  const [bossDefeated,setBossDefeated]=useState(false);
  const [bossDmgToday,setBossDmgToday]=useState(0);
  const [bossDate,setBossDate]=useState("");
  const [clanNameInput,setClanNameInput]=useState("");

  // Market
  const [marketTab,setMarketTab]=useState<"browse"|"sell">("browse");
  const [listings,setListings]=useState<MarketListing[]>(MOCK_MARKET_LISTINGS);
  const [sellType,setSellType]=useState<"chicken"|"equipment"|"egg">("chicken");
  const [sellPrice,setSellPrice]=useState("");
  const [sellNftId,setSellNftId]=useState<number|null>(null);
  const [sellEggAmt,setSellEggAmt]=useState("");

  // Breed
  const [breedA,setBreedA]=useState<number|null>(null);
  const [breedB,setBreedB]=useState<number|null>(null);
  const [breedResult,setBreedResult]=useState<NFTChicken|null>(null);

  // Growth: Daily Login / Referral / Gacha
  const [goldenEgg,setGoldenEgg]=useState(0);
  const [dailyLogin,setDailyLogin]=useState<DailyLoginState>({ streak:0, lastClaim:"", claimedDays:[] });
  const [referral,setReferral]=useState<ReferralState>(()=>({ code:genReferralCode("Pejuang Nusantara"), invited:0, claimedMilestones:[] }));
  const [growthTab,setGrowthTab]=useState<"daily"|"referral"|"gacha">("daily");
  const [gachaResults,setGachaResults]=useState<NFTChicken[]|null>(null);
  const [isGacha,setIsGacha]=useState(false);

  const audioCtxRef=useRef<AudioContext|null>(null);
  const bgStopRef  =useRef<(()=>void)|null>(null);
  const floatId    =useRef(0);
  const idleRef    =useRef({grid,boostActive,boostEndTime,eggs});

  // ── Clock ──
  useEffect(()=>{ const id=setInterval(()=>setNow(Date.now()),1000); return()=>clearInterval(id); },[]);
  useEffect(()=>{ idleRef.current={grid,boostActive,boostEndTime,eggs}; },[grid,boostActive,boostEndTime,eggs]);

  // ── Load Save ──
  useEffect(()=>{
    const s=loadSave();
    if(!s)return;
    if(typeof s.eggs==="number")       setEggs(s.eggs);
    if(typeof s.worms==="number")      setWorms(s.worms);
    if(typeof s.tokens==="number")     setTokens(s.tokens);
    if(Array.isArray(s.grid))          setGrid(s.grid as (GridCell|null)[]);
    if(typeof s.boostEndTime==="number"){
      setBoostEndTime(s.boostEndTime as number);
      setBoostActive(Date.now()<(s.boostEndTime as number));
    }
    if(typeof s.totalEarned==="number")setTotalEarned(s.totalEarned);
    if(typeof s.playerName==="string") setPlayerName(s.playerName);
    if(Array.isArray(s.nftChickens))   setNftChickens(s.nftChickens as NFTChicken[]);
    if(Array.isArray(s.nftEquipment))  setNftEquipment(s.nftEquipment as NFTEquipment[]);
    if(typeof s.arenaPoints==="number")setArenaPoints(s.arenaPoints);
    if(typeof s.seasonPts==="number")  setSeasonPts(s.seasonPts);
    if(typeof s.seasonStart==="string")setSeasonStart(s.seasonStart);
    if(s.pvpDefense) setPvpDefense(s.pvpDefense as PvPDefense);
    if(s.myClan) setMyClan(s.myClan as ClanInfo);
    if(typeof s.bossHP==="number")     setBossHP(s.bossHP);
    if(typeof s.bossDefeated==="boolean")setBossDefeated(s.bossDefeated);
    if(typeof s.bossDmgToday==="number")setBossDmgToday(s.bossDmgToday);
    if(typeof s.bossDate==="string")   setBossDate(s.bossDate);
    if(typeof s.goldenEgg==="number")  setGoldenEgg(s.goldenEgg);
    if(s.dailyLogin)                   setDailyLogin(s.dailyLogin as DailyLoginState);
    if(s.referral)                     setReferral(s.referral as ReferralState);
  },[]);

  // ── Save ──
  useEffect(()=>{
    try {
      localStorage.setItem(SAVE_KEY,JSON.stringify({
        eggs,worms,tokens,grid,boostEndTime,totalEarned,playerName,
        nftChickens,nftEquipment,arenaPoints,seasonPts,seasonStart,
        pvpDefense,myClan,bossHP,bossDefeated,bossDmgToday,bossDate,
        goldenEgg,dailyLogin,referral,
      }));
    } catch{}
  },[eggs,worms,tokens,grid,boostEndTime,totalEarned,playerName,nftChickens,nftEquipment,arenaPoints,seasonPts,seasonStart,pvpDefense,myClan,bossHP,bossDefeated,bossDmgToday,bossDate,goldenEgg,dailyLogin,referral]);

  // ── Reset boss daily ──
  useEffect(()=>{
    if(bossDate!==todayStr()){
      setBossHP(BOSS_DATA.maxHP);
      setBossDefeated(false);
      setBossDmgToday(0);
      setBossDate(todayStr());
    }
  },[bossDate]);

  // ── Season reset (30 days) ──
  useEffect(()=>{
    const start=new Date(seasonStart);
    const diff=(Date.now()-start.getTime())/(1000*60*60*24);
    if(diff>30){
      setSeasonStart(todayStr());
      setSeasonPts(0);
      showToast("Season baru dimulai! Rank direset 🔄","info");
    }
  },[seasonStart]);

  // ── Idle income ──
  useEffect(()=>{
    const id=setInterval(()=>{
      const{grid:g,boostActive:ba,boostEndTime:bet}=idleRef.current;
      const mult=ba&&Date.now()<bet?2:1;
      const earned=g.reduce((s,c)=>s+(c?getTier(c.tier).idlePerSec*mult:0),0);
      if(earned<=0)return;
      setEggs(e=>e+earned);
      setTotalEarned(t=>t+earned);
    },1000);
    return()=>clearInterval(id);
  },[]);

  // ── Boost expiry ──
  useEffect(()=>{
    if(!boostActive)return;
    const ms=boostEndTime-Date.now();
    if(ms<=0){setBoostActive(false);return;}
    const t=setTimeout(()=>{setBoostActive(false);showToast("Boost habis!");},ms);
    return()=>clearTimeout(t);
  },[boostActive,boostEndTime]);

  // ── Music ──
  useEffect(()=>{ if(musicOn)startMusic(); else stopMusic(); return()=>stopMusic(); },[musicOn]);

  function initAudio(){
    if(!audioCtxRef.current)
      audioCtxRef.current=new (window.AudioContext||(window as unknown as{webkitAudioContext:typeof AudioContext}).webkitAudioContext)();
    if(audioCtxRef.current.state==="suspended")audioCtxRef.current.resume();
    return audioCtxRef.current;
  }
  function playMergeSound(){
    if(!musicOn)return;
    try{
      const ctx=initAudio();
      const osc=ctx.createOscillator(),gain=ctx.createGain();
      osc.connect(gain);gain.connect(ctx.destination);
      osc.type="sine";osc.frequency.setValueAtTime(320,ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60,ctx.currentTime+0.18);
      gain.gain.setValueAtTime(0.18,ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+0.18);
      osc.start(ctx.currentTime);osc.stop(ctx.currentTime+0.18);
    }catch{}
  }
  function startMusic(){
    try{
      const ctx=initAudio(); stopMusic();
      const notes=[329.63,392.00,440.00,523.25,659.25,587.33];
      const seq=[0,1,2,3,4,3,2,1,0,2,4,5];
      let i=0,stopped=false;
      function playNext(){
        if(stopped||!audioCtxRef.current)return;
        const osc=ctx.createOscillator(),gain=ctx.createGain();
        osc.connect(gain);gain.connect(ctx.destination);
        osc.type="triangle";osc.frequency.value=notes[seq[i%seq.length]];
        gain.gain.setValueAtTime(0.04,ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.4);
        osc.start(ctx.currentTime);osc.stop(ctx.currentTime+0.45);
        i++;
        const tid=setTimeout(playNext,450);
        bgStopRef.current=()=>{stopped=true;clearTimeout(tid);};
      }
      playNext();
    }catch{}
  }
  function stopMusic(){bgStopRef.current?.();bgStopRef.current=null;}

  // ── Toast & Floats ──
  function showToast(msg:string,type:Toast["type"]="info"){
    setToast({msg,type});
    setTimeout(()=>setToast(null),2500);
  }
  function addFloat(text:string,x:number,y:number){
    const id=floatId.current++;
    setFloats(f=>[...f,{id,text,x,y}]);
    setTimeout(()=>setFloats(f=>f.filter(fi=>fi.id!==id)),900);
  }

  // ── Farm Actions ──
  function hatchChicken(){
    if(eggs<HATCH_COST){showToast("Telur tidak cukup!","err");return;}
    const empty=grid.findIndex(c=>c===null);
    if(empty===-1){showToast("Kandang penuh!","err");return;}
    setEggs(e=>e-HATCH_COST);
    setGrid(g=>{const n=[...g];n[empty]={tier:1,id:Date.now()};return n;});
    showToast("Ayam baru menetas! 🐣");
  }
  function cellClick(idx:number){
    if(selectedCell===null){
      if(!grid[idx])return;
      setSelectedCell(idx);
    } else {
      if(selectedCell===idx){setSelectedCell(null);return;}
      const a=grid[selectedCell],b=grid[idx];
      if(a&&b&&a.tier===b.tier&&a.tier<6){
        setGrid(g=>{const n=[...g];n[selectedCell]=null;n[idx]={tier:(a.tier+1) as TierId,id:Date.now()};return n;});
        const nt=getTier((a.tier+1) as TierId);
        playMergeSound();
        showToast(`Merge! ${nt.emoji} ${nt.name} (${nt.rarity})`);
        // auto-mint if tier >= 3 (Epic+)
        if((a.tier+1)>=3){
          showToast(`🃏 ${nt.name} siap di-mint jadi NFT!`,"success");
        }
      } else if(!b){
        setGrid(g=>{const n=[...g];n[idx]=a;n[selectedCell]=null;return n;});
      } else {
        setSelectedCell(idx);return;
      }
      setSelectedCell(null);
    }
  }
  function mintFromGrid(cell:GridCell){
    if(cell.tier<3){showToast("Tier 3+ (Epic) untuk mint NFT!","err");return;}
    if(eggs<NFT_MINT_COST){showToast(`Butuh ${fmtNum(NFT_MINT_COST)} 🥚!`,"err");return;}
    const rp=weightedPick(NFT_RARITY_PROB);
    const hero=pickRandomHero(rp.rarity);
    const newNFT:NFTChicken={
      id:Date.now(),name:hero.name,emoji:hero.emoji,element:hero.element,
      rarity:rp.rarity,stats:randomStat(rp.rarity),breedCount:0,skills:randomSkills(rp.rarity),
    };
    setEggs(e=>e-NFT_MINT_COST);
    setNftChickens(prev=>[...prev,newNFT]);
    // remove from grid
    setGrid(g=>{const n=[...g];const i=n.findIndex(c=>c&&c.id===cell.id);if(i>=0)n[i]=null;return n;});
    showToast(`Hero ${rp.rarity} ${ELEMENT_EMOJI[hero.element]} ${hero.name} di-mint! 🎉`,"success");
  }

  // ── NFT Helpers ──
  function randomStat(rarity:NFTRarity):NFTStat{
    const base={Common:1,Rare:1.3,Epic:1.7,Legendary:2.5,Mythic:3.6,Divine:5.2}[rarity];
    return{
      hp:Math.floor((50+Math.random()*50)*base),
      attack:Math.floor((30+Math.random()*40)*base),
      speed:Math.floor((20+Math.random()*30)*base),
      critRate:Math.floor((5+Math.random()*20)*base),
    };
  }
  function randomSkills(rarity:NFTRarity):string[]{
    const pool=["Pecuk Kilat ⚡","Sayap Badai 🌪️","Taji Api 🔥","Pukulan Bumi 🌍","Arus Deras 💧",
                "Terbang Tinggi 🦅","Cakar Baja 🦾","Aura Legenda 👑","Mata Elang 👁️","Lari Angin 💨"];
    const count={Common:1,Rare:2,Epic:3,Legendary:4,Mythic:5,Divine:6}[rarity];
    return [...pool].sort(()=>Math.random()-0.5).slice(0,Math.min(count,pool.length));
  }
  function burnNFT(id:number){
    setNftChickens(prev=>prev.filter(n=>n.id!==id));
    setTokens(t=>t+2);
    showToast("NFT dibakar! +2 Token 🔥","info");
  }

  // ── PvP Arena ──
  function getSeasonRank(pts:number):typeof SEASONAL_RANKS[0]{
    return [...SEASONAL_RANKS].reverse().find(r=>pts>=r.minPts)??SEASONAL_RANKS[0];
  }
  function toggleDefense(id:number){
    setPvpDefense(prev=>{
      const ids=[...prev.nftIds];
      const idx=ids.indexOf(id);
      if(idx>=0){ ids.splice(idx,1); }
      else if(ids.length<3){ ids.push(id); }
      else{ showToast("Maks. 3 ayam di tim bertahan!","err"); return prev; }
      return{...prev,nftIds:ids};
    });
  }
  function doBattle(opponentIdx:number){
    if(nftChickens.length===0){showToast("Butuh min. 1 NFT untuk menyerang!","err");return;}
    if(isBattling)return;
    const opp=MOCK_PVP_OPPONENTS[opponentIdx];
    const myNFT=nftChickens[0];
    const enemy=opp.defense[0]??{ stats:{hp:120,attack:80,speed:60,critRate:10},element:"Api" as Element };
    setIsBattling(true);setBattleResult(null);
    const logs:BattleLog[]=[];
    let aHP=myNFT.stats.hp,eHP=enemy.stats.hp;let round=1;
    const aMult=ELEMENT_COUNTER[myNFT.element]===enemy.element?1.5:1;
    const eMult=ELEMENT_COUNTER[enemy.element]===myNFT.element?1.5:1;
    logs.push({round:0,msg:`⚔️ ${myNFT.emoji} ${ELEMENT_EMOJI[myNFT.element]} vs ${enemy.emoji} ${ELEMENT_EMOJI[enemy.element]}`});
    if(aMult>1)logs.push({round:0,msg:`✅ Counter ${ELEMENT_EMOJI[myNFT.element]}→${ELEMENT_EMOJI[enemy.element]}! ×1.5`});
    if(eMult>1)logs.push({round:0,msg:`⚠️ Counter ${ELEMENT_EMOJI[enemy.element]}→${ELEMENT_EMOJI[myNFT.element]}! ×1.5`});
    while(aHP>0&&eHP>0&&round<=10){
      const crit=Math.random()*100<myNFT.stats.critRate;
      const dmg=Math.floor(myNFT.stats.attack*aMult*(crit?2:1)*(0.85+Math.random()*0.3));
      eHP-=dmg;
      logs.push({round,msg:`R${round}: Kamu serang ${dmg}💥${crit?" CRIT!":""}`});
      if(eHP<=0)break;
      const eDmg=Math.floor(enemy.stats.attack*eMult*(0.85+Math.random()*0.3));
      aHP-=eDmg;
      logs.push({round,msg:`R${round}: ${opp.name} serang ${eDmg}💥`});
      round++;
    }
    const win=aHP>0;
    const ptsDelta=win?30:-10;
    setArenaPoints(p=>Math.max(0,p+ptsDelta));
    setSeasonPts(p=>Math.max(0,p+ptsDelta));
    if(win){
      const reward=Math.floor(300+Math.random()*500);
      setEggs(e=>e+reward);setTotalEarned(t=>t+reward);
      logs.push({round:99,msg:`🏆 Menang! +${reward}🥚 +${ptsDelta} Season Pts`});
      setPvpDefense(prev=>({...prev,wins:prev.wins+1}));
    } else {
      logs.push({round:99,msg:`💀 Kalah! ${ptsDelta} Season Pts`});
      setPvpDefense(prev=>({...prev,losses:prev.losses+1}));
    }
    setTimeout(()=>{setBattleResult({win,logs,opponent:opp.name});setIsBattling(false);},1200);
  }

  // ── Clan ──
  function createClan(){
    if(clanNameInput.trim().length<3){showToast("Nama clan min. 3 karakter!","err");return;}
    const tag=clanNameInput.trim().slice(0,4).toUpperCase();
    setMyClan({
      name:clanNameInput.trim(),tag,level:1,members:1,trophies:arenaPoints,
      donations:0,bossHP:BOSS_DATA.maxHP,maxBossHP:BOSS_DATA.maxHP,
      bossDefeated:false,lastBossDate:todayStr(),
    });
    setClanNameInput("");
    showToast(`Clan "${clanNameInput.trim()}" [${tag}] dibuat! 🏰`,"success");
  }
  function donateToClan(){
    if(!myClan){showToast("Belum punya clan!","err");return;}
    if(eggs<500){showToast("Butuh 500 🥚 untuk donasi!","err");return;}
    setEggs(e=>e-500);
    setMyClan(c=>c?{...c,donations:c.donations+500,level:Math.min(10,Math.floor((c.donations+500)/5000)+1)}:c);
    showToast("+500 🥚 didonasi ke clan! ❤️","success");
  }
  function attackClanBoss(){
    if(!myClan){showToast("Bergabung dulu dengan clan!","err");return;}
    if(nftChickens.length===0){showToast("Butuh min. 1 NFT untuk menyerang Boss!","err");return;}
    if(bossDefeated){showToast("Boss sudah dikalahkan hari ini!","err");return;}
    const best=nftChickens.reduce((b,n)=>n.stats.attack>b.stats.attack?n:b,nftChickens[0]);
    const dmg=Math.floor(best.stats.attack*(8+Math.random()*4)*(1+best.breedCount*0.1));
    const newHP=Math.max(0,bossHP-dmg);
    setBossHP(newHP);
    setBossDmgToday(d=>d+dmg);
    if(newHP===0){
      setBossDefeated(true);
      const reward=Math.floor(5000+bossDmgToday*0.5);
      setEggs(e=>e+reward);setTotalEarned(t=>t+reward);
      setTokens(t=>t+5);
      showToast(`Boss dikalahkan! +${fmtNum(reward)}🥚 +5🪙`,"success");
    } else {
      showToast(`${best.emoji} serang Boss: -${fmtNum(dmg)} HP! 💥`,"success");
    }
  }

  // ── Market ──
  function listForSale(){
    if(sellType==="chicken"){
      if(!sellNftId){showToast("Pilih NFT dulu!","err");return;}
      const nft=nftChickens.find(n=>n.id===sellNftId);
      if(!nft){showToast("NFT tidak ditemukan!","err");return;}
      const price=parseInt(sellPrice);
      if(!price||price<100){showToast("Harga min. 100 🥚!","err");return;}
      const listing:MarketListing={id:Date.now(),seller:playerName,type:"chicken",item:{...nft,forSale:true,salePrice:price},price,listedAt:todayStr()};
      setListings(l=>[listing,...l]);
      setNftChickens(prev=>prev.filter(n=>n.id!==sellNftId));
      setSellNftId(null);setSellPrice("");
      showToast("NFT berhasil di-listing! 🛒","success");
    } else if(sellType==="egg"){
      const amt=parseInt(sellEggAmt);
      const price=parseInt(sellPrice);
      if(!amt||amt<100){showToast("Min. 100 🥚!","err");return;}
      if(!price||price<10){showToast("Harga min. 10!","err");return;}
      if(eggs<amt){showToast("Telur tidak cukup!","err");return;}
      setEggs(e=>e-amt);
      const listing:MarketListing={id:Date.now(),seller:playerName,type:"egg",item:null,eggAmount:amt,price,listedAt:todayStr()};
      setListings(l=>[listing,...l]);
      setSellEggAmt("");setSellPrice("");
      showToast(`${fmtNum(amt)}🥚 di-listing di pasar! 🛒`,"success");
    }
  }
  function buyListing(listing:MarketListing){
    if(eggs<listing.price){showToast("Telur tidak cukup!","err");return;}
    setEggs(e=>e-listing.price);
    if(listing.type==="chicken"&&listing.item){
      const ch=listing.item as NFTChicken;
      setNftChickens(prev=>[...prev,{...ch,id:Date.now(),forSale:false}]);
    } else if(listing.type==="equipment"&&listing.item){
      const eq=listing.item as NFTEquipment;
      setNftEquipment(prev=>[...prev,{...eq,id:Date.now(),forSale:false}]);
    } else if(listing.type==="egg"&&listing.eggAmount){
      setEggs(e=>e+listing.eggAmount!);
    }
    setListings(l=>l.filter(li=>li.id!==listing.id));
    showToast(`Berhasil membeli dari ${listing.seller}! ✅`,"success");
  }

  // ── Breeding ──
  function doBreed(){
    if(breedA===null||breedB===null){showToast("Pilih 2 NFT!","err");return;}
    const nA=nftChickens.find(n=>n.id===breedA);
    const nB=nftChickens.find(n=>n.id===breedB);
    if(!nA||!nB)return;
    if(nA.breedCount>=5){showToast(`${nA.name} max breed!`,"err");return;}
    if(nB.breedCount>=5){showToast(`${nB.name} max breed!`,"err");return;}
    if(eggs<BREED_EGG_COST){showToast(`Butuh ${fmtNum(BREED_EGG_COST)}🥚!`,"err");return;}
    if(tokens<BREED_TOKEN_COST){showToast(`Butuh ${BREED_TOKEN_COST}🪙!`,"err");return;}
    setEggs(e=>e-BREED_EGG_COST);
    setTokens(t=>t-BREED_TOKEN_COST);
    setNftChickens(prev=>prev.map(n=>(n.id===breedA||n.id===breedB)?{...n,breedCount:n.breedCount+1}:n));
    const comboKey=`${nA.element}+${nB.element}`;
    const combo=BREED_COMBOS[comboKey];
    const rp=weightedPick(NFT_RARITY_PROB);
    const el=combo?nA.element:ELEMENTS[Math.floor(Math.random()*ELEMENTS.length)];
    const hero=combo?null:pickRandomHero(rp.rarity);
    const child:NFTChicken={
      id:Date.now()+1,
      name:combo?combo.name:hero!.name,
      emoji:combo?combo.emoji:hero!.emoji,
      element:el,rarity:rp.rarity,
      stats:randomStat(rp.rarity),breedCount:0,skills:randomSkills(rp.rarity),
    };
    setNftChickens(prev=>[...prev,child]);
    setBreedResult(child);
    setBreedA(null);setBreedB(null);
    if(combo)showToast(`🔥 Hybrid langka: ${combo.name}! ${combo.bonus}`,"success");
    else showToast(`Breeding berhasil! ${rp.rarity} ${ELEMENT_EMOJI[el]} lahir! 🥚`,"success");
  }

  // ── Daily Login ──
  function currentDailyDay():number {
    // streak 0 = belum pernah klaim → hari 1
    return (dailyLogin.streak%30)+1;
  }
  function canClaimDaily():boolean { return dailyLogin.lastClaim!==todayStr(); }
  function claimDaily(){
    if(!canClaimDaily()){showToast("Sudah klaim hari ini! Balik lagi besok 👋","err");return;}
    const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
    const brokeStreak=dailyLogin.lastClaim!==""&&dailyLogin.lastClaim!==yesterday;
    const newStreak=brokeStreak?1:dailyLogin.streak+1;
    const day=(newStreak%30===0)?30:(newStreak%30);
    const reward=DAILY_REWARDS[day-1];
    setEggs(e=>e+reward.eggs);
    setTotalEarned(t=>t+reward.eggs);
    setGoldenEgg(g=>g+reward.goldenEgg);
    if(reward.guaranteed){
      const hero=pickRandomHero(reward.guaranteed);
      const nft:NFTChicken={ id:Date.now(),name:hero.name,emoji:hero.emoji,element:hero.element,
        rarity:reward.guaranteed,stats:randomStat(reward.guaranteed),breedCount:0,skills:randomSkills(reward.guaranteed) };
      setNftChickens(prev=>[...prev,nft]);
      showToast(`Hari ke-${day}! ${reward.label} → ${hero.name} didapat! 🎉`,"success");
    } else {
      showToast(`Hari ke-${day} diklaim! ${reward.label}${brokeStreak?" (streak reset)":""}`,"success");
    }
    setDailyLogin({ streak:newStreak, lastClaim:todayStr(), claimedDays:[...dailyLogin.claimedDays,day] });
  }

  // ── Referral Viral Loop ──
  function inviteFriend(){
    // Simulasi undangan (di Telegram asli ini datang dari deep-link bot)
    setReferral(r=>({ ...r, invited:r.invited+1 }));
    showToast("👥 1 teman baru bergabung lewat link referral-mu!","success");
  }
  function claimReferralMilestone(m:typeof REFERRAL_MILESTONES[0]){
    if(referral.invited<m.count){showToast(`Butuh ${m.count} undangan!`,"err");return;}
    if(referral.claimedMilestones.includes(m.count)){showToast("Sudah diklaim!","err");return;}
    const hero=pickRandomHero(m.heroRarity);
    const nft:NFTChicken={ id:Date.now(),name:hero.name,emoji:hero.emoji,element:hero.element,
      rarity:m.heroRarity,stats:randomStat(m.heroRarity),breedCount:0,skills:randomSkills(m.heroRarity) };
    setNftChickens(prev=>[...prev,nft]);
    setGoldenEgg(g=>g+m.goldenEgg);
    setReferral(r=>({ ...r, claimedMilestones:[...r.claimedMilestones,m.count] }));
    showToast(`🎁 Milestone ${m.count} teman! ${hero.name} + ${m.goldenEgg}🥚✨ didapat!`,"success");
  }
  function copyReferralCode(){
    try{ navigator.clipboard?.writeText(referral.code); }catch{}
    showToast(`Kode "${referral.code}" disalin! Bagikan ke teman 📋`,"success");
  }

  // ── Egg Gacha ──
  function buyGoldenEgg(){
    if(eggs<GOLDEN_EGG_BUY_RATE){showToast(`Butuh ${fmtNum(GOLDEN_EGG_BUY_RATE)}🥚!`,"err");return;}
    setEggs(e=>e-GOLDEN_EGG_BUY_RATE);
    setGoldenEgg(g=>g+1);
    showToast("+1 🥚✨ Golden Egg dibeli!","success");
  }
  function doGachaPull(times:1|10){
    const cost=GACHA_COST_GOLDEN_EGG*times;
    if(goldenEgg<cost){showToast(`Butuh ${cost} 🥚✨ Golden Egg!`,"err");return;}
    if(isGacha)return;
    setIsGacha(true);
    setGoldenEgg(g=>g-cost);
    const pulls:NFTChicken[]=[];
    for(let i=0;i<times;i++){
      const rp=weightedPick(GACHA_PROB);
      const hero=pickRandomHero(rp.rarity);
      pulls.push({ id:Date.now()+i,name:hero.name,emoji:hero.emoji,element:hero.element,
        rarity:rp.rarity,stats:randomStat(rp.rarity),breedCount:0,skills:randomSkills(rp.rarity) });
    }
    setTimeout(()=>{
      setNftChickens(prev=>[...prev,...pulls]);
      setGachaResults(pulls);
      setIsGacha(false);
      const best=pulls.reduce((b,p)=>NFT_RARITY_PROB.findIndex(r=>r.rarity===p.rarity)>NFT_RARITY_PROB.findIndex(r=>r.rarity===b.rarity)?p:b,pulls[0]);
      showToast(`Gacha selesai! Terbaik: ${best.rarity} ${best.name} 🎉`,"success");
    },900);
  }

  // ── Derived ──
  const totalIdle=grid.reduce((s,c)=>{
    if(!c)return s;
    const base=getTier(c.tier).idlePerSec;
    return s+base*(boostActive&&Date.now()<boostEndTime?2:1);
  },0);
  const maxTierInGrid=grid.reduce((m,c)=>c&&c.tier>m?c.tier:m,0);
  const walkingTiers=maxTierInGrid>0?CHICKEN_TIERS.slice(0,maxTierInGrid):[];
  const chickenCount=grid.filter(Boolean).length;
  const curSeasonRank=getSeasonRank(seasonPts);
  const nextSeasonRank=SEASONAL_RANKS[SEASONAL_RANKS.indexOf(curSeasonRank)+1];
  const seasonDaysLeft=30-Math.floor((Date.now()-new Date(seasonStart).getTime())/(1000*60*60*24));

  const NAV:[Screen,string,string][]=[
    ["home","🏠","Home"],
    ["farm","🐔","Farm"],
    ["heroes","🃏","Hero"],
    ["growth","🎁","Growth"],
    ["arena","⚔️","Arena"],
    ["clan","🏰","Clan"],
    ["market","🛒","Pasar"],
  ];

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <main style={{ minHeight:"100vh", background:"#080814", color:"#f0e6c8", fontFamily:"system-ui,sans-serif", userSelect:"none" }}>
      <style>{`
        @keyframes floatUp{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-60px)}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
        @keyframes bossShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
        @keyframes rankGlow{0%,100%{box-shadow:0 0 8px currentColor}50%{box-shadow:0 0 20px currentColor}}
        .mcell{transition:border-color .12s,transform .1s;cursor:pointer;}
        .mcell:active{transform:scale(.88);}
        .navbtn{transition:all .15s;cursor:pointer;border:none;background:none;}
        .glow{animation:rankGlow 2s ease-in-out infinite;}
      `}</style>

      {/* Toast */}
      {toast&&(
        <div style={{ position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",
          background:toast.type==="err"?"#7f1d1d":toast.type==="success"?"#14532d":"#1e3a5f",
          color:"#fff",padding:"8px 20px",borderRadius:20,fontSize:13,
          zIndex:999,whiteSpace:"nowrap",pointerEvents:"none",boxShadow:"0 4px 16px rgba(0,0,0,.5)" }}>
          {toast.msg}
        </div>
      )}

      {/* Floats */}
      {floats.map(f=>(
        <div key={f.id} style={{ position:"fixed",left:f.x,top:f.y,color:"#fbbf24",
          fontWeight:700,fontSize:18,pointerEvents:"none",animation:"floatUp .9s ease-out forwards",zIndex:900 }}>
          {f.text}
        </div>
      ))}

      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",
        background:"#0d0d1f",borderBottom:"1px solid #1e1e40" }}>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <span style={{ fontSize:20 }}>🐓</span>
          <span style={{ fontWeight:900,fontSize:15,color:"#fbbf24",letterSpacing:1 }}>AYAM PETARUNG</span>
        </div>
        <div style={{ display:"flex",gap:10,alignItems:"center" }}>
          <span style={{ fontSize:12 }}>🥚 <b style={{ color:"#fbbf24" }}>{fmtNum(eggs)}</b></span>
          <span style={{ fontSize:12 }}>🥚✨ <b style={{ color:"#fde047" }}>{goldenEgg}</b></span>
          <span style={{ fontSize:12 }}>🪙 <b style={{ color:"#c084fc" }}>{tokens}</b></span>
          <span style={{ fontSize:11,background:curSeasonRank.color+"22",color:curSeasonRank.color,
            border:`1px solid ${curSeasonRank.color}44`,borderRadius:8,padding:"2px 7px",fontWeight:700 }}>
            {curSeasonRank.emoji} {curSeasonRank.rank}
          </span>
          <button onClick={()=>{initAudio();setMusicOn(m=>!m);}}
            style={{ background:"none",border:"1px solid #2d2d5e",borderRadius:8,color:musicOn?"#fbbf24":"#555",
              fontSize:14,padding:"3px 7px",cursor:"pointer" }}>
            {musicOn?"🔊":"🔇"}
          </button>
        </div>
      </div>

      {/* Yard */}
      <Yard tiers={walkingTiers}/>

      {/* Stat strip */}
      <div style={{ background:"#0d1a2e",padding:"6px 12px",display:"flex",gap:8,alignItems:"center",
        borderTop:"1px solid #1e3a5f",borderBottom:"1px solid #1e3a5f",overflowX:"auto" }}>
        <div style={{ display:"flex",alignItems:"center",gap:5,background:"#1a2a4a",padding:"3px 10px",
          borderRadius:20,border:"1px solid #2d4a7a",flexShrink:0 }}>
          <span style={{ fontSize:12,fontWeight:700,color:"#86efac" }}>{fmtNum(totalIdle)}/s</span>
          <span style={{ fontSize:12 }}>🚀</span>
        </div>
        {boostActive&&(
          <div style={{ background:"#b45309",padding:"2px 8px",borderRadius:10,fontSize:11,fontWeight:700,color:"#fef3c7",flexShrink:0 }}>
            ⚡ x2 {Math.ceil((boostEndTime-now)/1000)}s
          </div>
        )}
        <div style={{ marginLeft:"auto",display:"flex",gap:6,flexShrink:0 }}>
          {myClan&&(
            <div style={{ background:"#1a2a3a",padding:"2px 8px",borderRadius:10,fontSize:11,color:"#93c5fd",border:"1px solid #2d4a6a" }}>
              🏰 {myClan.name} [{myClan.tag}]
            </div>
          )}
          <div style={{ background:"#2d1a4a",padding:"2px 8px",borderRadius:10,fontSize:11,
            color:curSeasonRank.color,border:`1px solid ${curSeasonRank.color}44`,fontWeight:700 }}>
            {curSeasonRank.emoji} {seasonPts}pts
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display:"flex",background:"#0a0a18",borderBottom:"2px solid #1e1e40" }}>
        {NAV.map(([key,emoji,label])=>(
          <button key={key} className="navbtn" onClick={()=>setScreen(key)} style={{
            flex:1,padding:"10px 4px 8px",
            color:screen===key?"#fbbf24":"#6b7280",
            fontWeight:screen===key?800:400,fontSize:11,
            borderBottom:screen===key?"3px solid #fbbf24":"3px solid transparent",
          }}>
            <div style={{ fontSize:18 }}>{emoji}</div>
            <div>{label}</div>
          </button>
        ))}
      </div>

      {/* Screens */}
      <div style={{ padding:"14px 12px",maxWidth:480,margin:"0 auto",paddingBottom:30 }}>

        {/* ══════════════════════════════════════════ HOME ══ */}
        {screen==="home"&&(
          <div style={{ display:"flex",flexDirection:"column",gap:14 }}>

            {/* Season Rank Card */}
            <div style={{ background:`linear-gradient(135deg,${curSeasonRank.color}18,#111130)`,
              border:`1px solid ${curSeasonRank.color}44`,borderRadius:16,padding:14 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:11,color:"#9ca3af" }}>SEASON RANK — {seasonDaysLeft} hari tersisa</div>
                  <div style={{ fontSize:22,fontWeight:900,color:curSeasonRank.color }}>
                    {curSeasonRank.emoji} {curSeasonRank.rank}
                  </div>
                  <div style={{ fontSize:11,color:"#9ca3af" }}>{seasonPts} pts</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:10,color:"#9ca3af" }}>Reward musim ini</div>
                  <div style={{ fontSize:12,fontWeight:700,color:"#fbbf24" }}>{curSeasonRank.reward}</div>
                  {nextSeasonRank&&(
                    <div style={{ fontSize:10,color:"#6b7280",marginTop:4 }}>
                      Berikutnya: {nextSeasonRank.emoji} {nextSeasonRank.rank}<br/>
                      ({nextSeasonRank.minPts-seasonPts} pts lagi)
                    </div>
                  )}
                </div>
              </div>
              {/* Progress bar */}
              {nextSeasonRank&&(
                <div style={{ background:"#1e1e40",borderRadius:6,height:6,overflow:"hidden" }}>
                  <div style={{ background:curSeasonRank.color,height:"100%",borderRadius:6,
                    width:`${Math.min(100,(seasonPts-curSeasonRank.minPts)/(nextSeasonRank.minPts-curSeasonRank.minPts)*100)}%`,
                    transition:"width .4s" }} />
                </div>
              )}
            </div>

            {/* Quick stats */}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
              <div style={{ background:"#111130",border:"1px solid #1e1e40",borderRadius:12,padding:12,textAlign:"center" }}>
                <div style={{ fontSize:10,color:"#9ca3af" }}>Per Detik</div>
                <div style={{ fontWeight:800,fontSize:16,color:"#fbbf24" }}>{fmtNum(totalIdle)} 🥚</div>
              </div>
              <div style={{ background:"#111130",border:"1px solid #1e1e40",borderRadius:12,padding:12,textAlign:"center" }}>
                <div style={{ fontSize:10,color:"#9ca3af" }}>NFT Dimiliki</div>
                <div style={{ fontWeight:800,fontSize:16,color:"#a78bfa" }}>{nftChickens.length} 🃏</div>
              </div>
              <div style={{ background:"#111130",border:"1px solid #1e1e40",borderRadius:12,padding:12,textAlign:"center" }}>
                <div style={{ fontSize:10,color:"#9ca3af" }}>W/L Arena</div>
                <div style={{ fontWeight:800,fontSize:14 }}>
                  <span style={{ color:"#86efac" }}>{pvpDefense.wins}W</span>
                  {" "}<span style={{ color:"#f87171" }}>{pvpDefense.losses}L</span>
                </div>
              </div>
              <div style={{ background:"#111130",border:"1px solid #1e1e40",borderRadius:12,padding:12,textAlign:"center" }}>
                <div style={{ fontSize:10,color:"#9ca3af" }}>Clan</div>
                <div style={{ fontWeight:800,fontSize:13,color:"#93c5fd" }}>{myClan?myClan.name:"—"}</div>
              </div>
            </div>

            {/* Quick nav buttons */}
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8 }}>
              {([
                { s:"farm" as Screen,   emoji:"🐔", label:"Kandang",  sub:"Merge & hatch",  color:"#16a34a", bg:"#0a2a10" },
                { s:"arena" as Screen,  emoji:"⚔️", label:"Arena PvP",sub:"Serang musuh",   color:"#ef4444", bg:"#2a0a0a" },
                { s:"clan" as Screen,   emoji:"🏰", label:"Clan War", sub:"Boss & donasi",  color:"#3b82f6", bg:"#0a1a2a" },
                { s:"market" as Screen, emoji:"🛒", label:"Pasar",    sub:"Jual beli ayam", color:"#f59e0b", bg:"#2a1a00" },
              ] as {s:Screen;emoji:string;label:string;sub:string;color:string;bg:string}[]).map(item=>(
                <button key={item.s} onClick={()=>setScreen(item.s)} style={{
                  background:item.bg,border:`1px solid ${item.color}44`,borderRadius:14,
                  padding:"14px 10px",cursor:"pointer",textAlign:"left",
                  transition:"all .15s",
                }}>
                  <div style={{ fontSize:24 }}>{item.emoji}</div>
                  <div style={{ fontWeight:700,fontSize:13,color:item.color,marginTop:4 }}>{item.label}</div>
                  <div style={{ fontSize:10,color:"#6b7280" }}>{item.sub}</div>
                </button>
              ))}
            </div>

            {/* Boss teaser */}
            <div onClick={()=>{setScreen("clan");setClanTab("boss");}}
              style={{ background:"linear-gradient(135deg,#2a0a00,#1a0000)",
                border:"1px solid #ff450055",borderRadius:14,padding:14,cursor:"pointer" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:10,color:"#ff4500",fontWeight:700,letterSpacing:1 }}>BOSS HARIAN</div>
                  <div style={{ fontSize:16,fontWeight:800,color:"#fff",marginTop:2 }}>
                    🦅 Garuda Nusantara
                  </div>
                  <div style={{ fontSize:11,color:"#9ca3af",marginTop:2 }}>
                    {bossDefeated?"✅ Dikalahkan hari ini!":"Serang bersama clan-mu!"}
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:11,color:"#ff4500",fontWeight:700 }}>
                    {Math.round((bossHP/BOSS_DATA.maxHP)*100)}% HP
                  </div>
                  <div style={{ background:"#1a0000",border:"1px solid #ff450033",borderRadius:8,
                    width:80,height:8,overflow:"hidden",marginTop:4 }}>
                    <div style={{ background:"#ff4500",height:"100%",width:`${(bossHP/BOSS_DATA.maxHP)*100}%`,
                      borderRadius:8,transition:"width .4s" }} />
                  </div>
                  <div style={{ fontSize:10,color:"#ff4500",marginTop:4 }}>→ Buka Clan</div>
                </div>
              </div>
            </div>

            {/* Breed shortcut */}
            <button onClick={()=>setScreen("breed")} style={{
              background:"#0a2a1a",border:"1px solid #05966944",borderRadius:14,padding:14,
              cursor:"pointer",textAlign:"left",width:"100%" }}>
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                <span style={{ fontSize:28 }}>🥚</span>
                <div>
                  <div style={{ fontWeight:700,fontSize:14,color:"#34d399" }}>Breeding Hybrid</div>
                  <div style={{ fontSize:11,color:"#6b7280" }}>
                    Api+Petir = Ayam Guntur Api 🌩️ — Cari kombinasi langka!
                  </div>
                </div>
              </div>
            </button>

            {/* Daily login + referral teaser */}
            <button onClick={()=>{setScreen("growth");setGrowthTab("daily");}} style={{
              background:canClaimDaily()?"linear-gradient(135deg,#2a2300,#1a1500)":"#0d0d22",
              border:`1px solid ${canClaimDaily()?"#fbbf2477":"#1e1e40"}`,borderRadius:14,padding:14,
              cursor:"pointer",textAlign:"left",width:"100%" }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <span style={{ fontSize:28 }}>🎁</span>
                  <div>
                    <div style={{ fontWeight:700,fontSize:14,color:"#fbbf24" }}>
                      Daily Login • Hari {currentDailyDay()}
                    </div>
                    <div style={{ fontSize:11,color:"#6b7280" }}>
                      {canClaimDaily()?"Reward hari ini siap diambil! 🔥":"Sudah diklaim — balik besok"}
                    </div>
                  </div>
                </div>
                {canClaimDaily()&&<span className="glow" style={{ fontSize:11,background:"#fbbf24",color:"#000",
                  borderRadius:8,padding:"3px 8px",fontWeight:800 }}>KLAIM</span>}
              </div>
            </button>

            <button onClick={()=>{setScreen("growth");setGrowthTab("referral");}} style={{
              background:"#0a1a2a",border:"1px solid #3b82f644",borderRadius:14,padding:14,
              cursor:"pointer",textAlign:"left",width:"100%" }}>
              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                <span style={{ fontSize:28 }}>👥</span>
                <div>
                  <div style={{ fontWeight:700,fontSize:14,color:"#60a5fa" }}>Undang Teman, Dapat Hero!</div>
                  <div style={{ fontSize:11,color:"#6b7280" }}>
                    {referral.invited} teman diundang — semakin viral, semakin cuan 🚀
                  </div>
                </div>
              </div>
            </button>

          </div>
        )}

        {/* ══════════════════════════════════════════ FARM ══ */}
        {screen==="farm"&&(
          <div>
            <div style={{ marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div style={{ fontSize:12,color:"#9ca3af" }}>Tap dua sel sama untuk merge</div>
              <button onClick={hatchChicken} style={{ ...btn("#7c2d12","#b45309"),width:"auto",padding:"6px 14px",fontSize:12 }}>
                +Ayam ({HATCH_COST}🥚)
              </button>
            </div>

            {/* Grid */}
            <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6 }}>
              {grid.map((cell,idx)=>{
                const td=cell?getTier(cell.tier):null;
                const sel=selectedCell===idx;
                const canMint=cell&&cell.tier>=3;
                return(
                  <div key={idx} className="mcell" onClick={()=>cellClick(idx)} style={{
                    aspectRatio:"1",background:sel?"#1e1e50":cell?"#111130":"#0d0d22",
                    border:`2px solid ${sel?"#fbbf24":cell?td!.rarityColor+"55":"#1e1e30"}`,
                    borderRadius:12,display:"flex",flexDirection:"column",alignItems:"center",
                    justifyContent:"center",gap:2,position:"relative",
                  }}>
                    {cell?(
                      <>
                        <span style={{ fontSize:22 }}>{td!.emoji}</span>
                        <span style={{ fontSize:9,color:td!.rarityColor,fontWeight:700 }}>T{cell.tier}</span>
                        {canMint&&(
                          <button onClick={e=>{e.stopPropagation();mintFromGrid(cell);}} style={{
                            position:"absolute",top:2,right:2,fontSize:8,background:"#7c3aed",
                            border:"none",color:"#fff",borderRadius:4,padding:"1px 3px",cursor:"pointer",fontWeight:700,
                          }}>NFT</button>
                        )}
                      </>
                    ):(
                      <span style={{ fontSize:18,opacity:.2 }}>+</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Farm info */}
            <div style={{ marginTop:12,background:"#111130",border:"1px solid #1e1e40",borderRadius:12,padding:10 }}>
              <div style={{ fontSize:11,color:"#9ca3af",marginBottom:6 }}>🐔 {chickenCount}/{GRID_SIZE} Ayam • {fmtNum(totalIdle)}/s</div>
              <div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>
                {CHICKEN_TIERS.map(t=>{
                  const count=grid.filter(c=>c&&c.tier===t.tier).length;
                  if(count===0)return null;
                  return(
                    <div key={t.tier} style={{ background:"#1e1e40",border:`1px solid ${t.rarityColor}44`,
                      borderRadius:8,padding:"2px 8px",fontSize:11,display:"flex",alignItems:"center",gap:3 }}>
                      <span>{t.emoji}</span>
                      <span style={{ color:t.rarityColor,fontWeight:700 }}>T{t.tier}</span>
                      <span style={{ fontWeight:800 }}>×{count}</span>
                    </div>
                  );
                })}
              </div>
              {maxTierInGrid>=3&&(
                <div style={{ marginTop:8,fontSize:11,color:"#c084fc",background:"#1a0a2a",
                  borderRadius:8,padding:"6px 10px",border:"1px solid #7c3aed33" }}>
                  🃏 Tier Epic+ bisa di-mint jadi Hero NFT! Klik tombol "NFT" di sel ayam.
                </div>
              )}
            </div>

            {/* My NFTs */}
            {nftChickens.length>0&&(
              <div style={{ marginTop:12,background:"#0a0a1a",border:"1px solid #1e1e40",borderRadius:14,padding:12 }}>
                <div style={{ fontWeight:700,fontSize:13,color:"#a78bfa",marginBottom:8 }}>🃏 NFT Saya</div>
                <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                  {nftChickens.map(n=>(
                    <div key={n.id} style={{ background:"#111130",border:`1px solid ${NFT_RARITY_COLOR[n.rarity]}33`,
                      borderRadius:10,padding:"8px 12px",display:"flex",alignItems:"center",gap:8 }}>
                      <span style={{ fontSize:22 }}>{n.emoji}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700,fontSize:12,color:NFT_RARITY_COLOR[n.rarity] }}>{n.name}</div>
                        <div style={{ fontSize:10,color:"#9ca3af" }}>
                          {ELEMENT_EMOJI[n.element]} {n.element} • ❤️{n.stats.hp} ⚔️{n.stats.attack} • Breed {n.breedCount}/5
                        </div>
                      </div>
                      <button onClick={()=>burnNFT(n.id)} style={{ fontSize:10,background:"#2a0a0a",
                        border:"1px solid #7f1d1d33",color:"#f87171",borderRadius:6,padding:"3px 7px",cursor:"pointer" }}>
                        🔥 Burn
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════ GROWTH (Daily/Referral/Gacha) ══ */}
        {screen==="growth"&&(
          <div style={{ display:"flex",flexDirection:"column",gap:14 }}>

            {/* Sub tabs */}
            <div style={{ display:"flex",gap:6,background:"#0a0a18",borderRadius:12,padding:4 }}>
              {([["daily","🎁","Daily"],["referral","👥","Referral"],["gacha","🥚✨","Gacha"]] as [typeof growthTab,string,string][]).map(([key,emoji,label])=>(
                <button key={key} onClick={()=>setGrowthTab(key)} style={{
                  flex:1,padding:"8px 4px",borderRadius:9,border:"none",cursor:"pointer",
                  background:growthTab===key?"#1e1e40":"transparent",
                  color:growthTab===key?"#fbbf24":"#6b7280",fontWeight:700,fontSize:12,
                }}>
                  {emoji} {label}
                </button>
              ))}
            </div>

            {/* ── DAILY LOGIN ── */}
            {growthTab==="daily"&&(
              <>
                <div style={{ background:"#111130",border:"1px solid #1e1e40",borderRadius:14,padding:14,textAlign:"center" }}>
                  <div style={{ fontSize:11,color:"#9ca3af" }}>STREAK SAAT INI</div>
                  <div style={{ fontSize:26,fontWeight:900,color:"#fbbf24" }}>🔥 {dailyLogin.streak} hari</div>
                  <button onClick={claimDaily} disabled={!canClaimDaily()} style={{
                    ...btn(canClaimDaily()?"#7c2d12":"#1e1e40",canClaimDaily()?"#fbbf24":"#2d2d5e"),
                    marginTop:10,opacity:canClaimDaily()?1:.5,
                  }}>
                    {canClaimDaily()?`🎁 Klaim Hari ke-${currentDailyDay()}`:"✅ Sudah diklaim hari ini"}
                  </button>
                </div>

                <div style={{ display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:6 }}>
                  {DAILY_REWARDS.map(r=>{
                    const claimed=dailyLogin.claimedDays.includes(r.day);
                    const isNext=r.day===currentDailyDay()&&canClaimDaily();
                    const special=!!r.guaranteed;
                    return(
                      <div key={r.day} title={r.label} style={{
                        aspectRatio:"1",borderRadius:10,display:"flex",flexDirection:"column",
                        alignItems:"center",justifyContent:"center",fontSize:9,gap:2,
                        background:claimed?"#0a2a10":isNext?"#2a2300":"#111130",
                        border:`1px solid ${special?"#fbbf24":isNext?"#fbbf2477":claimed?"#16a34a55":"#1e1e40"}`,
                      }}>
                        <span style={{ fontSize:special?16:13 }}>{special?(r.guaranteed==="Legendary"?"👑":"🃏"):claimed?"✅":"🥚"}</span>
                        <span style={{ color:"#9ca3af" }}>D{r.day}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize:10,color:"#6b7280",textAlign:"center" }}>
                  Hari 1: 100🥚 • Hari 7: Epic Egg 🃏 • Hari 30: Legendary Egg 👑 — jangan putus streak!
                </div>
              </>
            )}

            {/* ── REFERRAL ── */}
            {growthTab==="referral"&&(
              <>
                <div style={{ background:"linear-gradient(135deg,#0a1a2a,#111130)",border:"1px solid #3b82f655",
                  borderRadius:14,padding:14,textAlign:"center" }}>
                  <div style={{ fontSize:11,color:"#9ca3af" }}>KODE REFERRAL-MU</div>
                  <div style={{ fontSize:22,fontWeight:900,color:"#60a5fa",letterSpacing:1,marginTop:2 }}>{referral.code}</div>
                  <div style={{ fontSize:11,color:"#6b7280",marginTop:4 }}>{referral.invited} teman sudah diundang 🚀</div>
                  <div style={{ display:"flex",gap:8,marginTop:10 }}>
                    <button onClick={copyReferralCode} style={{ ...btn("#1e3a5f","#3b82f6"),fontSize:12 }}>📋 Salin Kode</button>
                    <button onClick={inviteFriend} style={{ ...btn("#1e3a8a","#60a5fa"),fontSize:12 }}>👥 Simulasi Undang</button>
                  </div>
                  <div style={{ fontSize:9,color:"#6b7280",marginTop:6 }}>
                    (Demo lokal — di Telegram asli, link ini otomatis lewat bot share)
                  </div>
                </div>

                <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  {REFERRAL_MILESTONES.map(m=>{
                    const reached=referral.invited>=m.count;
                    const claimed=referral.claimedMilestones.includes(m.count);
                    return(
                      <div key={m.count} style={{ background:"#111130",border:`1px solid ${reached&&!claimed?"#fbbf2477":"#1e1e40"}`,
                        borderRadius:12,padding:12,display:"flex",alignItems:"center",gap:10 }}>
                        <span style={{ fontSize:24 }}>{claimed?"✅":reached?"🎁":"🔒"}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700,fontSize:13,color:NFT_RARITY_COLOR[m.heroRarity] }}>{m.label}</div>
                          <div style={{ fontSize:10,color:"#9ca3af" }}>{referral.invited}/{m.count} teman • +{m.goldenEgg} 🥚✨</div>
                        </div>
                        <button onClick={()=>claimReferralMilestone(m)} disabled={!reached||claimed} style={{
                          ...btn(reached&&!claimed?"#7c2d12":"#1e1e40",reached&&!claimed?"#fbbf24":"#2d2d5e"),
                          width:"auto",padding:"6px 12px",fontSize:11,opacity:reached&&!claimed?1:.4,
                        }}>
                          {claimed?"Diklaim":"Klaim"}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div style={{ background:"#0a1a10",border:"1px solid #065f4644",borderRadius:10,padding:10 }}>
                  <div style={{ fontSize:11,fontWeight:700,color:"#34d399",marginBottom:4 }}>Kenapa invite penting?</div>
                  <div style={{ fontSize:10,color:"#6b7280",lineHeight:1.8 }}>
                    Setiap teman yang main lewat kodemu = progress lebih cepat buat kalian berdua 🤝<br/>
                    Reward referral cuma bisa didapat dari mengundang — bukan dibeli 💎
                  </div>
                </div>
              </>
            )}

            {/* ── GACHA ── */}
            {growthTab==="gacha"&&(
              <>
                <div style={{ background:"linear-gradient(135deg,#2a2300,#111130)",border:"1px solid #fbbf2455",
                  borderRadius:16,padding:16,textAlign:"center" }}>
                  <div style={{ fontSize:34 }}>🥚✨</div>
                  <div style={{ fontWeight:800,fontSize:16,color:"#fbbf24",marginTop:4 }}>Egg Gacha</div>
                  <div style={{ fontSize:11,color:"#9ca3af",marginTop:2 }}>
                    Common 70% • Rare 20% • Epic 8% • Legendary 2%
                  </div>
                  <div style={{ fontSize:13,marginTop:8 }}>Punya <b style={{ color:"#fde047" }}>{goldenEgg} 🥚✨</b></div>
                  <div style={{ display:"flex",gap:8,marginTop:12 }}>
                    <button onClick={()=>doGachaPull(1)} disabled={isGacha||goldenEgg<1} style={{
                      ...btn("#7c2d12","#fbbf24"),opacity:isGacha||goldenEgg<1?.4:1 }}>
                      🥚 Buka 1 ({GACHA_COST_GOLDEN_EGG} 🥚✨)
                    </button>
                    <button onClick={()=>doGachaPull(10)} disabled={isGacha||goldenEgg<10} style={{
                      ...btn("#7c2d12","#fbbf24"),opacity:isGacha||goldenEgg<10?.4:1 }}>
                      🥚×10 Buka 10 ({GACHA_COST_GOLDEN_EGG*10} 🥚✨)
                    </button>
                  </div>
                  <button onClick={buyGoldenEgg} style={{ ...btn("#1e1e40","#3d3d6e"),marginTop:8,fontSize:11 }}>
                    💰 Beli 1 🥚✨ — {fmtNum(GOLDEN_EGG_BUY_RATE)} 🥚
                  </button>
                </div>

                {isGacha&&(
                  <div style={{ textAlign:"center",fontSize:13,color:"#fbbf24",animation:"pulse 0.6s infinite" }}>
                    🥚 Membuka telur...
                  </div>
                )}

                {gachaResults&&!isGacha&&(
                  <div style={{ background:"#0a0a1a",border:"1px solid #1e1e40",borderRadius:14,padding:12 }}>
                    <div style={{ fontWeight:700,fontSize:13,color:"#fbbf24",marginBottom:8,textAlign:"center" }}>
                      🎉 Hasil Gacha
                    </div>
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6 }}>
                      {gachaResults.map(r=>(
                        <div key={r.id} style={{ aspectRatio:"1",background:"#111130",
                          border:`1px solid ${NFT_RARITY_COLOR[r.rarity]}`,borderRadius:10,
                          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1 }}>
                          <span style={{ fontSize:18 }}>{r.emoji}</span>
                          <span style={{ fontSize:7,color:NFT_RARITY_COLOR[r.rarity],fontWeight:700 }}>{r.rarity}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={()=>setGachaResults(null)} style={{ ...btn("#1e1e40","#3d3d6e"),marginTop:10,fontSize:11 }}>
                      ✕ Tutup
                    </button>
                  </div>
                )}
              </>
            )}

          </div>
        )}

        {/* ══════════════════════════════════════════ HERO COLLECTION ══ */}
        {screen==="heroes"&&(()=>{
          const ownedKeys=new Set(nftChickens.map(n=>n.name));
          const rarityOrder:NFTRarity[]=["Common","Rare","Epic","Legendary","Mythic","Divine"];
          const ownedCount=HEROES.filter(h=>ownedKeys.has(h.name)).length;
          return(
            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              <div style={{ background:"#111130",border:"1px solid #1e1e40",borderRadius:14,padding:12,textAlign:"center" }}>
                <div style={{ fontWeight:800,fontSize:16,color:"#fbbf24" }}>🃏 Hero Collection</div>
                <div style={{ fontSize:12,color:"#9ca3af",marginTop:2 }}>{ownedCount}/{HEROES.length} Hero terkumpul</div>
                <div style={{ background:"#1e1e40",borderRadius:6,height:6,overflow:"hidden",marginTop:8 }}>
                  <div style={{ background:"#fbbf24",height:"100%",borderRadius:6,
                    width:`${(ownedCount/HEROES.length)*100}%`,transition:"width .4s" }} />
                </div>
              </div>

              {rarityOrder.map(rarity=>{
                const heroes=heroesByRarity(rarity);
                const owned=heroes.filter(h=>ownedKeys.has(h.name)).length;
                return(
                  <div key={rarity}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
                      <div style={{ fontWeight:700,fontSize:13,color:NFT_RARITY_COLOR[rarity] }}>
                        {rarity} ({owned}/{heroes.length})
                      </div>
                    </div>
                    <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6 }}>
                      {heroes.map(h=>{
                        const isOwned=ownedKeys.has(h.name);
                        return(
                          <div key={h.key} title={h.name} style={{
                            aspectRatio:"1",background:isOwned?"#111130":"#0d0d1a",
                            border:`1px solid ${isOwned?NFT_RARITY_COLOR[rarity]+"66":"#1e1e30"}`,
                            borderRadius:10,display:"flex",flexDirection:"column",alignItems:"center",
                            justifyContent:"center",gap:1,opacity:isOwned?1:.35,
                          }}>
                            <span style={{ fontSize:18,filter:isOwned?"none":"grayscale(1)" }}>{h.emoji}</span>
                            <span style={{ fontSize:8 }}>{ELEMENT_EMOJI[h.element]}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div style={{ background:"#0a1a10",border:"1px solid #065f4644",borderRadius:10,padding:10 }}>
                <div style={{ fontSize:11,fontWeight:700,color:"#34d399",marginBottom:4 }}>Cara dapat Hero baru</div>
                <div style={{ fontSize:10,color:"#6b7280",lineHeight:1.8 }}>
                  Merge ayam ke Tier Epic+ lalu mint jadi Hero NFT 🃏<br/>
                  Breeding 2 NFT bisa menghasilkan Hero acak baru 🥚<br/>
                  Beli Hero langsung dari pemain lain di Pasar 🛒
                </div>
              </div>
            </div>
          );
        })()}

        {/* ══════════════════════════════════════════ ARENA ══ */}
        {screen==="arena"&&(
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>

            {/* Season Rank full */}
            <div style={{ background:"#0a0a1a",border:`2px solid ${curSeasonRank.color}55`,borderRadius:16,padding:14 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
                <div>
                  <div style={{ fontSize:10,color:"#9ca3af",letterSpacing:1 }}>SEASONAL RANK</div>
                  <div style={{ fontSize:26,fontWeight:900,color:curSeasonRank.color }}>{curSeasonRank.emoji} {curSeasonRank.rank}</div>
                </div>
                <div style={{ textAlign:"right",fontSize:11,color:"#9ca3af" }}>
                  <div>{seasonPts} pts</div>
                  <div style={{ marginTop:2 }}>🗓 {seasonDaysLeft}h tersisa</div>
                  <div style={{ marginTop:4,fontWeight:700,color:"#fbbf24" }}>{curSeasonRank.reward}</div>
                </div>
              </div>
              {/* All ranks */}
              <div style={{ display:"flex",gap:4,overflowX:"auto",paddingBottom:4 }}>
                {SEASONAL_RANKS.map(r=>(
                  <div key={r.rank} style={{ flexShrink:0,textAlign:"center",
                    background:r.rank===curSeasonRank.rank?r.color+"22":"#0d0d22",
                    border:`1px solid ${r.color}${r.rank===curSeasonRank.rank?"99":"33"}`,
                    borderRadius:10,padding:"4px 8px",minWidth:64 }}>
                    <div style={{ fontSize:14 }}>{r.emoji}</div>
                    <div style={{ fontSize:9,color:r.color,fontWeight:700 }}>{r.rank}</div>
                    <div style={{ fontSize:9,color:"#6b7280" }}>{r.minPts}+</div>
                  </div>
                ))}
              </div>
            </div>

            {/* PvP tabs */}
            <div style={{ display:"flex",background:"#0a0a18",borderRadius:10,border:"1px solid #1e1e40",padding:3,gap:2 }}>
              {(["attack","defense","replay"] as const).map(t=>(
                <button key={t} onClick={()=>setPvpTab(t)} style={{
                  flex:1,padding:"7px 0",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,
                  background:pvpTab===t?"#1e1e50":"none",
                  color:pvpTab===t?"#fbbf24":"#6b7280",
                }}>
                  {t==="attack"?"⚔️ Serang":t==="defense"?"🛡️ Bertahan":"📼 Replay"}
                </button>
              ))}
            </div>

            {/* ATTACK tab */}
            {pvpTab==="attack"&&(
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                <div style={{ fontSize:12,color:"#9ca3af" }}>Pilih lawan dan serang! Menang = +30 pts, Kalah = −10 pts</div>
                {MOCK_PVP_OPPONENTS.map((opp,i)=>{
                  const oppRank=getSeasonRank(opp.pts);
                  return(
                    <div key={i} style={{ background:"#111130",border:"1px solid #1e1e40",borderRadius:12,padding:12 }}>
                      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
                        <div>
                          <div style={{ fontWeight:700,fontSize:13 }}>{opp.name}</div>
                          <div style={{ fontSize:11,color:oppRank.color }}>{oppRank.emoji} {opp.rank} • {opp.pts} pts</div>
                        </div>
                        <button onClick={()=>doBattle(i)} disabled={isBattling} style={{
                          ...btn("#7f1d1d","#ef4444"),width:"auto",padding:"7px 14px",fontSize:12,
                          opacity:isBattling?.5:1,
                        }}>
                          {isBattling?"⚔️...":"⚔️ Serang"}
                        </button>
                      </div>
                      <div style={{ display:"flex",gap:6 }}>
                        {opp.defense.map(d=>(
                          <div key={d.id} style={{ background:"#1e1e40",border:`1px solid ${NFT_RARITY_COLOR[d.rarity]}44`,
                            borderRadius:8,padding:"4px 8px",display:"flex",alignItems:"center",gap:4,fontSize:11 }}>
                            <span>{d.emoji}</span>
                            <span style={{ color:NFT_RARITY_COLOR[d.rarity],fontWeight:700 }}>{d.name}</span>
                            <span style={{ color:"#6b7280" }}>{ELEMENT_EMOJI[d.element]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* DEFENSE tab */}
            {pvpTab==="defense"&&(
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                <div style={{ fontSize:12,color:"#9ca3af" }}>Pilih maks. 3 NFT untuk tim bertahan (maks. 3)</div>
                {nftChickens.length===0?(
                  <div style={{ background:"#111130",border:"1px solid #1e1e40",borderRadius:12,padding:20,
                    textAlign:"center",color:"#6b7280",fontSize:12 }}>
                    Belum punya NFT! Mint dulu dari Farm 🃏
                  </div>
                ):(
                  nftChickens.map(n=>{
                    const inDef=pvpDefense.nftIds.includes(n.id);
                    return(
                      <div key={n.id} onClick={()=>toggleDefense(n.id)} style={{
                        background:inDef?"#0a1a2a":"#111130",
                        border:`1px solid ${inDef?"#3b82f6":NFT_RARITY_COLOR[n.rarity]+"33"}`,
                        borderRadius:12,padding:"10px 12px",cursor:"pointer",
                        display:"flex",alignItems:"center",gap:10,
                      }}>
                        <span style={{ fontSize:22 }}>{n.emoji}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700,fontSize:12,color:NFT_RARITY_COLOR[n.rarity] }}>{n.name}</div>
                          <div style={{ fontSize:10,color:"#9ca3af" }}>
                            {ELEMENT_EMOJI[n.element]} ❤️{n.stats.hp} ⚔️{n.stats.attack} 💨{n.stats.speed}
                          </div>
                        </div>
                        {inDef&&<span style={{ color:"#3b82f6",fontWeight:800,fontSize:13 }}>🛡️</span>}
                      </div>
                    );
                  })
                )}
                {pvpDefense.nftIds.length>0&&(
                  <div style={{ background:"#0a1a2a",border:"1px solid #3b82f644",borderRadius:12,padding:10,fontSize:12,color:"#93c5fd" }}>
                    Tim Bertahan: {pvpDefense.nftIds.length}/3 ayam terpilih
                    <div style={{ fontSize:10,color:"#6b7280",marginTop:2 }}>
                      W/L: {pvpDefense.wins}/{pvpDefense.losses}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* REPLAY tab */}
            {pvpTab==="replay"&&(
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                {battleResult?(
                  <div style={{ background:"#111130",border:`1px solid ${battleResult.win?"#16a34a":"#b91c1c"}`,
                    borderRadius:14,padding:14 }}>
                    <div style={{ fontWeight:800,fontSize:16,color:battleResult.win?"#86efac":"#f87171",textAlign:"center",marginBottom:6 }}>
                      {battleResult.win?"🏆 MENANG!":"💀 KALAH!"}
                    </div>
                    <div style={{ fontSize:11,color:"#9ca3af",textAlign:"center",marginBottom:10 }}>
                      vs {battleResult.opponent}
                    </div>
                    <div style={{ display:"flex",flexDirection:"column",gap:3 }}>
                      {battleResult.logs.map((log,i)=>(
                        <div key={i} style={{ fontSize:11,color:log.round===99?"#fbbf24":log.round===0?"#c084fc":"#d1d5db",
                          background:"#1e1e40",borderRadius:6,padding:"4px 8px" }}>
                          {log.msg}
                        </div>
                      ))}
                    </div>
                  </div>
                ):(
                  <div style={{ background:"#111130",border:"1px solid #1e1e40",borderRadius:12,padding:20,
                    textAlign:"center",color:"#6b7280",fontSize:12 }}>
                    Belum ada pertarungan. Serang lawan dulu! ⚔️
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════ CLAN ══ */}
        {screen==="clan"&&(
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>

            {!myClan?(
              /* Create/Join Clan */
              <div>
                <div style={{ fontWeight:700,fontSize:15,color:"#93c5fd",marginBottom:12 }}>🏰 Bergabung atau Buat Clan</div>
                <div style={{ background:"#0a1a2a",border:"1px solid #1e3a5f",borderRadius:14,padding:14,marginBottom:10 }}>
                  <div style={{ fontSize:12,color:"#9ca3af",marginBottom:8 }}>Buat Clan Baru</div>
                  <input value={clanNameInput} onChange={e=>setClanNameInput(e.target.value)}
                    placeholder="Nama Clan (min. 3 karakter)"
                    style={{ width:"100%",background:"#0d1a2e",border:"1px solid #2d4a7a",borderRadius:8,
                      padding:"8px 12px",color:"#fff",fontSize:13,boxSizing:"border-box",marginBottom:8 }}/>
                  <button onClick={createClan} style={{ ...btn("#1e3a5f","#3b82f6"),width:"100%" }}>
                    🏰 Buat Clan
                  </button>
                </div>
                {/* Clan ranking (join demo) */}
                <div style={{ fontWeight:700,fontSize:13,color:"#9ca3af",marginBottom:8 }}>🏆 Top Clan Global</div>
                {MOCK_CLAN_RANKING.map((c,i)=>(
                  <div key={i} style={{ background:"#0d0d22",border:"1px solid #1e1e40",borderRadius:12,
                    padding:"10px 12px",display:"flex",alignItems:"center",gap:10,marginBottom:6 }}>
                    <span style={{ fontSize:18,width:28,textAlign:"center",fontWeight:800,color:"#fbbf24" }}>#{i+1}</span>
                    <span style={{ fontSize:20 }}>{c.emoji}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700,fontSize:13 }}>{c.name}</div>
                      <div style={{ fontSize:11,color:"#9ca3af" }}>{c.members} anggota • 🏆 {c.trophies.toLocaleString()}</div>
                    </div>
                    <button onClick={()=>{setMyClan({name:c.name,tag:c.name.slice(0,4).toUpperCase(),level:5,members:c.members+1,trophies:c.trophies,donations:0,bossHP:BOSS_DATA.maxHP,maxBossHP:BOSS_DATA.maxHP,bossDefeated:false,lastBossDate:todayStr()});showToast(`Bergabung dengan ${c.name}! 🎉`,"success");}}
                      style={{ ...btn("#0a1a2a","#3b82f6"),width:"auto",padding:"5px 12px",fontSize:11 }}>
                      Gabung
                    </button>
                  </div>
                ))}
              </div>
            ):(
              /* Clan Detail */
              <div>
                {/* Clan header */}
                <div style={{ background:"linear-gradient(135deg,#0a1a3a,#0d1a2e)",
                  border:"1px solid #2d4a7a",borderRadius:16,padding:14,marginBottom:10 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                    <div>
                      <div style={{ fontSize:10,color:"#9ca3af",letterSpacing:1 }}>KLAN KAMU</div>
                      <div style={{ fontSize:20,fontWeight:900,color:"#93c5fd" }}>{myClan.name}</div>
                      <div style={{ fontSize:11,color:"#6b7280" }}>[{myClan.tag}] • Level {myClan.level} • {myClan.members} anggota</div>
                    </div>
                    <div style={{ textAlign:"right",fontSize:11,color:"#9ca3af" }}>
                      <div style={{ fontSize:20 }}>🏆</div>
                      <div style={{ fontWeight:700,color:"#fbbf24" }}>{myClan.trophies.toLocaleString()}</div>
                      <div>trophies</div>
                    </div>
                  </div>
                </div>

                {/* Clan tabs */}
                <div style={{ display:"flex",background:"#0a0a18",borderRadius:10,border:"1px solid #1e1e40",padding:3,gap:2,marginBottom:10 }}>
                  {(["info","boss","donate","ranking"] as const).map(t=>(
                    <button key={t} onClick={()=>setClanTab(t)} style={{
                      flex:1,padding:"7px 0",borderRadius:8,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,
                      background:clanTab===t?"#1e1e50":"none",
                      color:clanTab===t?"#fbbf24":"#6b7280",
                    }}>
                      {t==="info"?"ℹ️ Info":t==="boss"?"👹 Boss":t==="donate"?"❤️ Donasi":"🏆 Ranking"}
                    </button>
                  ))}
                </div>

                {/* INFO tab */}
                {clanTab==="info"&&(
                  <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                    <div style={{ background:"#111130",border:"1px solid #1e1e40",borderRadius:12,padding:12 }}>
                      <div style={{ fontWeight:700,fontSize:12,color:"#93c5fd",marginBottom:8 }}>📊 Statistik Clan</div>
                      {[
                        ["Level Clan",`${myClan.level}/10`],
                        ["Donasi Total",`${myClan.donations.toLocaleString()} 🥚`],
                        ["Boss Dikalahkan",bossDefeated?"✅ Hari ini":"❌ Belum"],
                        ["Damage Boss Hari Ini",`${fmtNum(BOSS_DATA.maxHP-bossHP)} dmg`],
                      ].map(([l,v])=>(
                        <div key={l as string} style={{ display:"flex",justifyContent:"space-between",
                          padding:"5px 0",borderBottom:"1px solid #1e1e40",fontSize:12 }}>
                          <span style={{ color:"#9ca3af" }}>{l}</span>
                          <span style={{ fontWeight:700 }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={()=>{setMyClan(null);showToast("Keluar dari clan","info");}}
                      style={{ ...btn("#2a0a0a","#7f1d1d"),fontSize:11 }}>
                      🚪 Keluar Clan
                    </button>
                  </div>
                )}

                {/* BOSS tab */}
                {clanTab==="boss"&&(
                  <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                    <div style={{ background:"linear-gradient(135deg,#2a0a00,#1a0000)",
                      border:`2px solid ${bossDefeated?"#16a34a":"#ff4500"}55`,borderRadius:16,padding:14,textAlign:"center" }}>
                      <div style={{ fontSize:10,color:"#ff4500",letterSpacing:2,fontWeight:700 }}>BOSS HARIAN</div>
                      <div style={{ fontSize:40,margin:"10px 0",animation:!bossDefeated?"bossShake 2s infinite":"none" }}>
                        {BOSS_DATA.emoji}
                      </div>
                      <div style={{ fontSize:18,fontWeight:900,color:"#fff",marginBottom:4 }}>{BOSS_DATA.name}</div>
                      <div style={{ fontSize:11,color:"#9ca3af",marginBottom:12 }}>{BOSS_DATA.description}</div>

                      {/* Boss HP bar */}
                      <div style={{ background:"#1a0000",borderRadius:8,height:14,overflow:"hidden",marginBottom:6 }}>
                        <div style={{ background:bossDefeated?"#16a34a":"linear-gradient(to right,#ff4500,#ff8c00)",
                          height:"100%",width:`${(bossHP/BOSS_DATA.maxHP)*100}%`,
                          borderRadius:8,transition:"width .5s" }} />
                      </div>
                      <div style={{ fontSize:12,color:"#ff4500",fontWeight:700,marginBottom:12 }}>
                        {bossDefeated?"💀 Boss dikalahkan!":
                          `${fmtNum(bossHP)} / ${fmtNum(BOSS_DATA.maxHP)} HP`}
                      </div>

                      {!bossDefeated&&(
                        <button onClick={attackClanBoss} style={{ ...btn("#4a0a00","#ff4500"),fontSize:14,fontWeight:800,letterSpacing:0.5 }}>
                          ⚔️ Serang Boss! ({nftChickens.length} NFT)
                        </button>
                      )}
                      {bossDefeated&&(
                        <div style={{ fontSize:12,color:"#86efac",fontWeight:700 }}>
                          ✅ Selesai! Boss kembali besok.
                        </div>
                      )}
                    </div>

                    {/* Damage leaderboard */}
                    <div style={{ background:"#111130",border:"1px solid #1e1e40",borderRadius:12,padding:12 }}>
                      <div style={{ fontWeight:700,fontSize:12,color:"#fbbf24",marginBottom:8 }}>
                        💥 Damage Hari Ini
                      </div>
                      <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,
                        padding:"5px 0",borderBottom:"1px solid #1e1e40" }}>
                        <span style={{ color:"#9ca3af" }}>Kamu</span>
                        <span style={{ fontWeight:700,color:"#ff4500" }}>{fmtNum(bossDmgToday)} dmg</span>
                      </div>
                      {[{name:"ClanMate_A",dmg:385000},{name:"ClanMate_B",dmg:210000},{name:"ClanMate_C",dmg:98000}].map(m=>(
                        <div key={m.name} style={{ display:"flex",justifyContent:"space-between",
                          fontSize:11,padding:"4px 0",borderBottom:"1px solid #1e1e3a" }}>
                          <span style={{ color:"#9ca3af" }}>{m.name}</span>
                          <span style={{ color:"#fb923c" }}>{fmtNum(m.dmg)} dmg</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* DONATE tab */}
                {clanTab==="donate"&&(
                  <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                    <div style={{ background:"#111130",border:"1px solid #1e1e40",borderRadius:12,padding:12 }}>
                      <div style={{ fontWeight:700,fontSize:13,color:"#f87171",marginBottom:8 }}>❤️ Donasi ke Clan</div>
                      <div style={{ fontSize:12,color:"#9ca3af",lineHeight:1.8,marginBottom:12 }}>
                        Donasi meningkatkan Level Clan dan membuka bonus:<br/>
                        • Level 3: +10% idle income<br/>
                        • Level 5: Boss slot +1<br/>
                        • Level 10: Exclusive skin Cemani
                      </div>
                      <div style={{ fontSize:12,marginBottom:8 }}>
                        Total Donasi: <b style={{ color:"#f87171" }}>{myClan.donations.toLocaleString()} 🥚</b>
                      </div>
                      <button onClick={donateToClan} style={{ ...btn("#4a0a00","#f87171") }}>
                        ❤️ Donasi 500 🥚
                      </button>
                    </div>
                    <div style={{ background:"#0a1a0a",border:"1px solid #16a34a44",borderRadius:12,padding:12 }}>
                      <div style={{ fontSize:12,fontWeight:700,color:"#86efac",marginBottom:6 }}>Level Clan {myClan.level}/10</div>
                      <div style={{ background:"#1a3a1a",borderRadius:6,height:8,overflow:"hidden" }}>
                        <div style={{ background:"#16a34a",height:"100%",width:`${myClan.level*10}%`,borderRadius:6 }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* RANKING tab */}
                {clanTab==="ranking"&&(
                  <div>
                    {MOCK_CLAN_RANKING.map((c,i)=>(
                      <div key={i} style={{ background:c.name===myClan.name?"#0a1a2a":"#0d0d22",
                        border:`1px solid ${c.name===myClan.name?"#3b82f6":"#1e1e40"}`,
                        borderRadius:12,padding:"10px 12px",display:"flex",alignItems:"center",
                        gap:10,marginBottom:6 }}>
                        <span style={{ fontSize:16,width:28,textAlign:"center",fontWeight:800,
                          color:i===0?"#fbbf24":i===1?"#c0c0c0":i===2?"#cd7f32":"#6b7280" }}>
                          #{i+1}
                        </span>
                        <span style={{ fontSize:18 }}>{c.emoji}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700,fontSize:13 }}>{c.name}</div>
                          <div style={{ fontSize:10,color:"#9ca3af" }}>{c.members} anggota</div>
                        </div>
                        <div style={{ textAlign:"right",fontWeight:700,color:"#fbbf24",fontSize:13 }}>
                          🏆 {c.trophies.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════ MARKET ══ */}
        {screen==="market"&&(
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>

            <div style={{ display:"flex",gap:4,background:"#0a0a18",borderRadius:10,
              border:"1px solid #1e1e40",padding:3 }}>
              {(["browse","sell"] as const).map(t=>(
                <button key={t} onClick={()=>setMarketTab(t)} style={{
                  flex:1,padding:"8px 0",borderRadius:8,border:"none",cursor:"pointer",fontSize:13,fontWeight:700,
                  background:marketTab===t?"#1e1e50":"none",
                  color:marketTab===t?"#fbbf24":"#6b7280",
                }}>
                  {t==="browse"?"🛒 Jelajahi":"📦 Jual"}
                </button>
              ))}
            </div>

            {/* BROWSE */}
            {marketTab==="browse"&&(
              <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                <div style={{ fontSize:11,color:"#9ca3af" }}>
                  {listings.length} listing aktif • kamu punya 🥚 {fmtNum(eggs)}
                </div>
                {listings.map(l=>(
                  <div key={l.id} style={{ background:"#111130",border:"1px solid #1e1e40",borderRadius:12,padding:12 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6 }}>
                      <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                        {l.type==="chicken"&&l.item&&(
                          <>
                            <span style={{ fontSize:24 }}>{(l.item as NFTChicken).emoji}</span>
                            <div>
                              <div style={{ fontWeight:700,fontSize:12,
                                color:NFT_RARITY_COLOR[(l.item as NFTChicken).rarity] }}>
                                {(l.item as NFTChicken).name}
                              </div>
                              <div style={{ fontSize:10,color:"#9ca3af" }}>
                                {(l.item as NFTChicken).rarity} {ELEMENT_EMOJI[(l.item as NFTChicken).element]}
                                {" "}❤️{(l.item as NFTChicken).stats.hp} ⚔️{(l.item as NFTChicken).stats.attack}
                              </div>
                            </div>
                          </>
                        )}
                        {l.type==="equipment"&&l.item&&(
                          <>
                            <span style={{ fontSize:24 }}>{EQUIPMENT_EMOJI[(l.item as NFTEquipment).type]}</span>
                            <div>
                              <div style={{ fontWeight:700,fontSize:12,
                                color:NFT_RARITY_COLOR[(l.item as NFTEquipment).rarity] }}>
                                {(l.item as NFTEquipment).type} ({(l.item as NFTEquipment).rarity})
                              </div>
                              <div style={{ fontSize:10,color:"#9ca3af" }}>
                                {Object.entries((l.item as NFTEquipment).statBonus).map(([k,v])=>`+${v} ${k}`).join(", ")}
                              </div>
                            </div>
                          </>
                        )}
                        {l.type==="egg"&&(
                          <>
                            <span style={{ fontSize:24 }}>🥚</span>
                            <div>
                              <div style={{ fontWeight:700,fontSize:13,color:"#fbbf24" }}>
                                {fmtNum(l.eggAmount??0)} Telur
                              </div>
                              <div style={{ fontSize:10,color:"#9ca3af" }}>Dari {l.seller}</div>
                            </div>
                          </>
                        )}
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontWeight:800,fontSize:14,color:"#fbbf24" }}>{fmtNum(l.price)} 🥚</div>
                        <div style={{ fontSize:10,color:"#9ca3af" }}>by {l.seller}</div>
                      </div>
                    </div>
                    <button onClick={()=>buyListing(l)} style={{
                      ...btn("#1a2a00","#16a34a"),fontSize:12,
                      opacity:eggs<l.price?.5:1,
                    }}>
                      {eggs<l.price?"Telur kurang":"✅ Beli Sekarang"}
                    </button>
                  </div>
                ))}
                {listings.length===0&&(
                  <div style={{ background:"#111130",border:"1px solid #1e1e40",borderRadius:12,
                    padding:24,textAlign:"center",color:"#6b7280",fontSize:12 }}>
                    Pasar kosong. Jadilah yang pertama listing! 📦
                  </div>
                )}
              </div>
            )}

            {/* SELL */}
            {marketTab==="sell"&&(
              <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                <div style={{ display:"flex",gap:4,background:"#111130",borderRadius:10,padding:4 }}>
                  {(["chicken","equipment","egg"] as const).map(t=>(
                    <button key={t} onClick={()=>setSellType(t)} style={{
                      flex:1,padding:"6px 0",borderRadius:8,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,
                      background:sellType===t?"#1e1e50":"none",
                      color:sellType===t?"#fbbf24":"#6b7280",
                    }}>
                      {t==="chicken"?"🃏 NFT":t==="equipment"?"🛡️ Equipment":"🥚 Telur"}
                    </button>
                  ))}
                </div>

                {sellType==="chicken"&&(
                  <>
                    <div style={{ fontSize:12,color:"#9ca3af" }}>Pilih NFT untuk dijual:</div>
                    {nftChickens.length===0?(
                      <div style={{ background:"#111130",border:"1px solid #1e1e40",borderRadius:12,
                        padding:20,textAlign:"center",color:"#6b7280",fontSize:12 }}>
                        Belum punya NFT. Mint dulu di Farm! 🃏
                      </div>
                    ):(
                      nftChickens.map(n=>(
                        <div key={n.id} onClick={()=>setSellNftId(sellNftId===n.id?null:n.id)} style={{
                          background:sellNftId===n.id?"#0a2a10":"#111130",
                          border:`1px solid ${sellNftId===n.id?"#16a34a":NFT_RARITY_COLOR[n.rarity]+"33"}`,
                          borderRadius:10,padding:"8px 12px",cursor:"pointer",
                          display:"flex",alignItems:"center",gap:8,
                        }}>
                          <span style={{ fontSize:20 }}>{n.emoji}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontWeight:700,fontSize:12,color:NFT_RARITY_COLOR[n.rarity] }}>{n.name}</div>
                            <div style={{ fontSize:10,color:"#9ca3af" }}>
                              {n.rarity} {ELEMENT_EMOJI[n.element]} • ❤️{n.stats.hp} ⚔️{n.stats.attack}
                            </div>
                          </div>
                          {sellNftId===n.id&&<span style={{ color:"#16a34a",fontWeight:800 }}>✓</span>}
                        </div>
                      ))
                    )}
                  </>
                )}

                {sellType==="egg"&&(
                  <>
                    <div style={{ fontSize:12,color:"#9ca3af" }}>Kamu punya {fmtNum(eggs)} 🥚</div>
                    <input value={sellEggAmt} onChange={e=>setSellEggAmt(e.target.value)}
                      placeholder="Jumlah telur (min. 100)"
                      style={{ ...inputStyle }} type="number"/>
                  </>
                )}

                <input value={sellPrice} onChange={e=>setSellPrice(e.target.value)}
                  placeholder="Harga jual (🥚)"
                  style={{ ...inputStyle }} type="number"/>

                <button onClick={listForSale} style={{ ...btn("#1a2a00","#16a34a") }}>
                  📦 Listing di Pasar
                </button>

                <div style={{ background:"#0a1a0a",border:"1px solid #16a34a33",borderRadius:10,padding:10,fontSize:11,color:"#9ca3af" }}>
                  💡 Harga pasar wajar: NFT Common ~5.000🥚, Rare ~20.000🥚, Epic ~80.000🥚, Legendary ~300.000🥚
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════ BREED ══ */}
        {screen==="breed"&&(
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            <div style={{ fontWeight:700,fontSize:15,color:"#34d399" }}>🥚 Breeding Hybrid</div>

            {/* Combo chart */}
            <div style={{ background:"#0a2a1a",border:"1px solid #065f46",borderRadius:14,padding:12 }}>
              <div style={{ fontSize:12,fontWeight:700,color:"#34d399",marginBottom:8 }}>🔮 Kombinasi Langka</div>
              <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
                {Object.entries(BREED_COMBOS).filter(([k])=>!k.split("+").reverse().join("+")!==k).map(([combo,result])=>{
                  const [a,b]=combo.split("+") as [Element,Element];
                  return(
                    <div key={combo} style={{ display:"flex",alignItems:"center",gap:6,fontSize:11,
                      background:"#0d2a1a",borderRadius:8,padding:"5px 8px" }}>
                      <span>{ELEMENT_EMOJI[a]}</span><span style={{ color:"#6b7280" }}>+</span>
                      <span>{ELEMENT_EMOJI[b]}</span>
                      <span style={{ color:"#6b7280" }}>→</span>
                      <span>{result.emoji}</span>
                      <span style={{ fontWeight:700,color:"#34d399" }}>{result.name}</span>
                      <span style={{ marginLeft:"auto",color:"#fbbf24" }}>{result.bonus}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cost */}
            <div style={{ background:"#111130",border:"1px solid #065f46",borderRadius:12,padding:10 }}>
              <div style={{ display:"flex",gap:16,fontSize:12 }}>
                <div>🥚 <b style={{ color:eggs>=BREED_EGG_COST?"#86efac":"#f87171" }}>{fmtNum(eggs)}</b> / {fmtNum(BREED_EGG_COST)}</div>
                <div>🪙 <b style={{ color:tokens>=BREED_TOKEN_COST?"#86efac":"#f87171" }}>{tokens}</b> / {BREED_TOKEN_COST}</div>
              </div>
            </div>

            {nftChickens.length<2?(
              <div style={{ background:"#111130",border:"1px solid #1e1e40",borderRadius:12,padding:20,
                textAlign:"center",color:"#6b7280",fontSize:12 }}>
                Butuh min. 2 NFT untuk breeding! Mint ayam di Farm tier 8+ 🃏
              </div>
            ):(
              <>
                <div style={{ fontWeight:700,fontSize:12,color:"#86efac" }}>
                  👨 Induk A {breedA!==null?`— ${nftChickens.find(n=>n.id===breedA)?.name}`:""} 
                </div>
                {nftChickens.map(n=>(
                  <div key={n.id} onClick={()=>setBreedA(breedA===n.id?null:n.id)} style={{
                    background:breedA===n.id?"#0a2a1a":"#111130",
                    border:`1px solid ${breedA===n.id?"#34d399":NFT_RARITY_COLOR[n.rarity]+"33"}`,
                    borderRadius:10,padding:"8px 12px",cursor:"pointer",
                    display:"flex",alignItems:"center",gap:8,
                    opacity:n.breedCount>=5?.4:1,
                  }}>
                    <span style={{ fontSize:20 }}>{n.emoji}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700,fontSize:12,color:NFT_RARITY_COLOR[n.rarity] }}>{n.name}</div>
                      <div style={{ fontSize:10,color:"#9ca3af" }}>
                        {ELEMENT_EMOJI[n.element]} {n.element} • Breed {n.breedCount}/5{n.breedCount>=5?" ⛔":""}
                      </div>
                    </div>
                    {breedA===n.id&&<span style={{ color:"#34d399",fontWeight:800 }}>A</span>}
                  </div>
                ))}

                <div style={{ fontWeight:700,fontSize:12,color:"#60a5fa",marginTop:4 }}>
                  👩 Induk B {breedB!==null?`— ${nftChickens.find(n=>n.id===breedB)?.name}`:""}
                </div>
                {nftChickens.filter(n=>n.id!==breedA).map(n=>(
                  <div key={n.id} onClick={()=>setBreedB(breedB===n.id?null:n.id)} style={{
                    background:breedB===n.id?"#0a1a2a":"#111130",
                    border:`1px solid ${breedB===n.id?"#60a5fa":NFT_RARITY_COLOR[n.rarity]+"33"}`,
                    borderRadius:10,padding:"8px 12px",cursor:"pointer",
                    display:"flex",alignItems:"center",gap:8,
                    opacity:n.breedCount>=5?.4:1,
                  }}>
                    <span style={{ fontSize:20 }}>{n.emoji}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700,fontSize:12,color:NFT_RARITY_COLOR[n.rarity] }}>{n.name}</div>
                      <div style={{ fontSize:10,color:"#9ca3af" }}>
                        {ELEMENT_EMOJI[n.element]} {n.element} • Breed {n.breedCount}/5{n.breedCount>=5?" ⛔":""}
                      </div>
                    </div>
                    {breedB===n.id&&<span style={{ color:"#60a5fa",fontWeight:800 }}>B</span>}
                  </div>
                ))}

                {/* Preview combo */}
                {breedA!==null&&breedB!==null&&(()=>{
                  const nA=nftChickens.find(n=>n.id===breedA);
                  const nB=nftChickens.find(n=>n.id===breedB);
                  if(!nA||!nB)return null;
                  const comboKey=`${nA.element}+${nB.element}`;
                  const combo=BREED_COMBOS[comboKey];
                  return combo?(
                    <div style={{ background:"#0a1a00",border:"2px solid #16a34a",borderRadius:12,padding:10,textAlign:"center" }}>
                      <div style={{ fontSize:10,color:"#34d399",fontWeight:700,letterSpacing:1 }}>KOMBINASI LANGKA!</div>
                      <div style={{ fontSize:28,margin:"6px 0" }}>{combo.emoji}</div>
                      <div style={{ fontWeight:800,fontSize:14,color:"#34d399" }}>{combo.name}</div>
                      <div style={{ fontSize:12,color:"#fbbf24",marginTop:2 }}>Bonus: {combo.bonus}</div>
                    </div>
                  ):null;
                })()}

                <button onClick={doBreed} disabled={breedA===null||breedB===null} style={{
                  ...btn("#065f46","#059669"),
                  opacity:breedA===null||breedB===null?.4:1,
                }}>
                  🥚 Breed — {fmtNum(BREED_EGG_COST)} 🥚 + {BREED_TOKEN_COST} 🪙
                </button>
              </>
            )}

            {/* Result */}
            {breedResult&&(
              <div style={{ background:"#111130",border:`2px solid ${NFT_RARITY_COLOR[breedResult.rarity]}`,
                borderRadius:14,padding:14,textAlign:"center" }}>
                <div style={{ fontSize:13,color:"#34d399",fontWeight:700,marginBottom:6 }}>🎉 Hasil Breeding!</div>
                <div style={{ fontSize:40 }}>{breedResult.emoji}</div>
                <div style={{ fontWeight:800,fontSize:15,color:NFT_RARITY_COLOR[breedResult.rarity],marginTop:4 }}>
                  {breedResult.rarity} {ELEMENT_EMOJI[breedResult.element]} {breedResult.name}
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:4,marginTop:10 }}>
                  {([["❤️",breedResult.stats.hp],["⚔️",breedResult.stats.attack],["💨",breedResult.stats.speed],[`✨`,`${breedResult.stats.critRate}%`]] as [string,string|number][]).map(([l,v])=>(
                    <div key={l} style={{ background:"#1e1e40",borderRadius:6,padding:4,textAlign:"center" }}>
                      <div style={{ fontSize:9,color:"#6b7280" }}>{l}</div>
                      <div style={{ fontSize:12,fontWeight:700 }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex",flexWrap:"wrap",gap:4,marginTop:8,justifyContent:"center" }}>
                  {breedResult.skills.map(s=>(
                    <div key={s} style={{ fontSize:10,background:"#2a1a4a",border:"1px solid #7c3aed44",
                      borderRadius:6,padding:"2px 7px",color:"#c084fc" }}>{s}</div>
                  ))}
                </div>
                <button onClick={()=>setBreedResult(null)} style={{ ...btn("#1e1e40","#3d3d6e"),marginTop:10,fontSize:11 }}>
                  ✕ Tutup
                </button>
              </div>
            )}

            {/* Burn info */}
            <div style={{ background:"#0a1a10",border:"1px solid #065f4644",borderRadius:10,padding:10 }}>
              <div style={{ fontSize:11,fontWeight:700,color:"#34d399",marginBottom:4 }}>🔥 Burn Mechanic</div>
              <div style={{ fontSize:10,color:"#6b7280",lineHeight:1.8 }}>
                Setiap breeding burn {fmtNum(BREED_EGG_COST)}🥚 + {BREED_TOKEN_COST}🪙 → ekonomi sehat<br/>
                Max breed/ayam: 5x → NFT tidak inflasi<br/>
                Hybrid langka → lebih laku di Pasar
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

// ─── STYLE HELPERS ────────────────────────────────────────────────────────────
function btn(bg:string,border:string):React.CSSProperties {
  return {
    background:bg,border:`1px solid ${border}`,color:"#fff",
    borderRadius:10,padding:"10px 18px",fontSize:13,fontWeight:700,
    cursor:"pointer",width:"100%",
  };
}
const inputStyle:React.CSSProperties={
  width:"100%",background:"#0d0d22",border:"1px solid #2d2d5e",
  borderRadius:8,padding:"9px 12px",color:"#fff",fontSize:13,
  boxSizing:"border-box",
};
