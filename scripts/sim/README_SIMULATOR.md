# LFR Simulators

This folder contains standalone Node.js simulation scripts to help tune and validate the game's balance math.

Files:
- scripts/sim/runAll.js — combined simulator for battles (1v1, 3v3), breeding distribution, and simple economy flow.

Usage:
- Run with Node.js (v14+ recommended):
  node scripts/sim/runAll.js [seed]

Examples:
  node scripts/sim/runAll.js 12345

Notes:
- The simulators use a deterministic seedable RNG (Mulberry32) so you can reproduce results by passing the same seed.
- These are intentionally lightweight and self-contained so they can run without installing project dependencies.
