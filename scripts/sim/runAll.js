// Lightweight seedable RNG - Mulberry32
function mulberry32(a) {
  return function() {
    var t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GameConfig = {
  combat: {
    critMultiplier: 1.75,
    minDamage: 1,
    defenseEffectiveness: 0.6,
  },
  breeding: {
    inheritance: { father: 0.4, mother: 0.4, mutation: 0.2 },
    mutationRarityBoostChance: 0.02,
  },
  rarity: { common: 0.5, rare: 0.28, epic: 0.14, legendary: 0.06, mythic: 0.019, divine: 0.001 },
  economy: { goldPerLevelBase: 50, rarityMultiplier: { common: 1, rare: 1.5, epic: 3, legendary: 8, mythic: 20, divine: 100 } },
};

function clamp01(v){ return Math.max(0, Math.min(1, v)); }

function hitChance(acc, dodge){
  const chance = acc / (acc + dodge + 10);
  return clamp01(chance);
}

function roll(rng, p){ return rng() < p; }

function rollCrit(rng, critPercent){ return roll(rng, clamp01(critPercent/100)); }

function calculateRawDamage(attack, defense){
  const dmg = attack * (100 / (100 + defense * GameConfig.combat.defenseEffectiveness));
  return Math.max(GameConfig.combat.minDamage, Math.floor(dmg));
}

function resolveAttack(attacker, target, rng){
  const hit = roll(rng, hitChance(attacker.accuracy, target.dodge));
  if(!hit) return { hit:false, critical:false, damage:0 };
  const crit = rollCrit(rng, attacker.crit);
  let raw = calculateRawDamage(attacker.attack, target.defense);
  if(crit) raw = Math.floor(raw * GameConfig.combat.critMultiplier);
  raw = Math.max(GameConfig.combat.minDamage, raw);
  return { hit:true, critical:crit, damage:raw };
}

function createRooster(level = 10, rarity = 'common'){ // simple factory
  const baseHp = 100 + level*25;
  return {
    hp: baseHp,
    maxHp: baseHp,
    attack: 10 + level*4,
    defense: 8 + level*3,
    speed: 10 + Math.floor(level*1.2),
    crit: Math.min(50, 5 + level*0.5),
    accuracy: Math.min(95, 70 + level*0.4),
    dodge: Math.min(60, 5 + level*0.3),
    rarity,
  };
}

function simulate1v1(options){
  const {runs=1000, seed=1, levelA=10, levelB=10} = options;
  const rng = mulberry32(seed);
  let totalTurns=0, winsA=0, totalHits=0, totalCrits=0, totalDamage=0;
  for(let i=0;i<runs;i++){
    const a = createRooster(levelA);
    const b = createRooster(levelB);
    let turn=0;
    // alternate attacker starting by speed
    let attacker = a.speed>=b.speed? a : b;
    let defender = attacker===a? b : a;
    while(a.hp>0 && b.hp>0 && turn<500){
      const res = resolveAttack(attacker, defender, rng);
      if(res.hit){
        totalHits++;
        if(res.critical) totalCrits++;
        defender.hp -= res.damage;
        totalDamage += res.damage;
      }
      // swap
      [attacker, defender] = [defender, attacker];
      turn++;
    }
    totalTurns += turn;
    if(a.hp>0 && b.hp<=0) winsA++;
    if(b.hp>0 && a.hp<=0) {} // b wins
  }
  return { runs, avgTurns: totalTurns/runs, winRateA: winsA/runs, hitRate: totalHits/(runs* (totalTurns/runs) || 1), critRate: totalCrits/(runs* (totalTurns/runs) || 1), avgDamagePerHit: totalDamage/Math.max(1,totalHits) };
}

function simulate3v3(options){
  const {runs=500, seed=2, level=12} = options;
  const rng = mulberry32(seed);
  function makeTeam(){
    return [createRooster(level), createRooster(level), createRooster(level)];
  }
  let avgTurns=0, winsA=0, matches=0;
  for(let i=0;i<runs;i++){
    const A = makeTeam();
    const B = makeTeam();
    let turn=0;
    while(A.some(x=>x.hp>0) && B.some(x=>x.hp>0) && turn<200){
      // collect alive actors and sort by speed
      const actors = [];
      A.forEach((r,idx)=> r.hp>0 && actors.push({team:'A', idx, speed:r.speed, r}));
      B.forEach((r,idx)=> r.hp>0 && actors.push({team:'B', idx, speed:r.speed, r}));
      actors.sort((a,b)=> b.speed - a.speed + (rng()*0.01));
      for(const actor of actors){
        if(actor.r.hp<=0) continue;
        const allies = actor.team==='A'? A : B;
        const enemies = actor.team==='A'? B : A;
        const target = enemies.filter(e=>e.hp>0)[Math.floor(rng()*enemies.filter(e=>e.hp>0).length)];
        if(!target) continue;
        const res = resolveAttack(actor.r, target, rng);
        if(res.hit){ target.hp -= res.damage; }
      }
      turn++;
    }
    avgTurns += turn;
    if(A.some(x=>x.hp>0) && !B.some(x=>x.hp>0)) winsA++;
    matches++;
  }
  return { runs: matches, avgTurns: avgTurns/matches, winRateA: winsA/matches };
}

// Breeding simulation
function pickParentGene(pFather, pMother, rng){
  const r = rng();
  if(r < GameConfig.breeding.inheritance.father) return pFather;
  if(r < GameConfig.breeding.inheritance.father + GameConfig.breeding.inheritance.mother) return pMother;
  return `mut_${Math.floor(rng()*100000)}`;
}

function breedSim(father, mother, rng){
  const geneA = pickParentGene(father.geneA, mother.geneA, rng);
  const geneB = pickParentGene(father.geneB, mother.geneB, rng);
  const geneC = pickParentGene(father.geneC, mother.geneC, rng);
  const mutation = [geneA,geneB,geneC].some(g=>g.startsWith('mut_'));
  const rarities = ['common','rare','epic','legendary','mythic','divine'];
  const idxF = rarities.indexOf(father.rarity);
  const idxM = rarities.indexOf(mother.rarity);
  let childIdx = Math.round((idxF+idxM)/2);
  if(mutation && rng() < GameConfig.breeding.mutationRarityBoostChance) childIdx = Math.min(rarities.length-1, childIdx+1);
  return { geneA, geneB, geneC, mutation, rarity: rarities[childIdx] };
}

function simulateBreeding(options){
  const {runs=10000, seed=3, fatherRarity='common', motherRarity='common'} = options;
  const rng = mulberry32(seed);
  const father = { geneA:'A1', geneB:'B1', geneC:'C1', rarity:fatherRarity };
  const mother = { geneA:'A2', geneB:'B2', geneC:'C2', rarity:motherRarity };
  const counts = {};
  let mutations=0;
  for(let i=0;i<runs;i++){
    const c = breedSim(father, mother, rng);
    counts[c.rarity] = (counts[c.rarity]||0)+1;
    if(c.mutation) mutations++;
  }
  const dist = {};
  for(const k of Object.keys(GameConfig.rarity)) dist[k] = (counts[k]||0)/runs;
  return { runs, distribution: dist, mutationRate: mutations/runs };
}

// Economy simulation
function goldReward(level, rarity){
  const base = GameConfig.economy.goldPerLevelBase * Math.max(1, level);
  const mult = GameConfig.economy.rarityMultiplier[rarity]||1;
  return Math.round(base * mult);
}

function simulateEconomy(options){
  const {days=30, players=1000, seed=4, avgDailyBattles=20, avgDailyBreeds=0.2} = options;
  const rng = mulberry32(seed);
  let goldProduced=0, goldSpent=0;
  for(let p=0;p<players;p++){
    for(let d=0; d<days; d++){
      // battles
      for(let b=0;b<avgDailyBattles;b++){
        // random rarity opponent
        const r = sampleRarity(rng);
        goldProduced += goldReward(10, r);
      }
      // breeding attempts
      const breeds = Math.random() < avgDailyBreeds ? 1 : 0; // approx
      for(let br=0;br<breeds;br++){
        const cost = breedingCost('common','common');
        goldSpent += cost.gold;
      }
    }
  }
  return { days, players, goldProduced, goldSpent, netPerPlayerPerDay: (goldProduced - goldSpent)/(players*days) };
}

function breedingCost(rA,rB){
  const rarityWeight = { common:1, rare:1.2, epic:1.6, legendary:2.5, mythic:6, divine:20 };
  const weight = (rarityWeight[rA]+rarityWeight[rB])/2;
  return { gold: Math.round(500 * weight), crystal: Math.round(2 * weight) };
}

function sampleRarity(rng){
  const map = GameConfig.rarity;
  const entries = Object.entries(map);
  const total = entries.reduce((s,e)=>s+e[1],0);
  const r = rng()*total;
  let acc=0;
  for(const [k,v] of entries){ acc+=v; if(r<=acc) return k; }
  return 'common';
}

// Runner
if(require.main === module){
  const seed = Number(process.argv[2]||12345);
  console.log('Running combined simulations with seed', seed);
  console.log('=== 1v1 Simulation ===');
  console.log(simulate1v1({runs:2000, seed}));
  console.log('=== 3v3 Simulation ===');
  console.log(simulate3v3({runs:800, seed:seed+1}));
  console.log('=== Breeding Simulation ===');
  console.log(simulateBreeding({runs:20000, seed:seed+2}));
  console.log('=== Economy Simulation ===');
  console.log(simulateEconomy({days:30, players:1000, seed:seed+3, avgDailyBattles:15, avgDailyBreeds:0.15}));
}
