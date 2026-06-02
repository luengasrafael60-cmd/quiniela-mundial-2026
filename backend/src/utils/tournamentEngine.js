/**
 * Motor central del torneo — FIFA Mundial 2026
 *
 * Mapa de fases en DB vs nombre real:
 *   'groups'        → Fase de grupos (72 partidos)
 *   'round16'       → Dieciseisavos de final (16 partidos, 32→16)
 *   'quarterfinals' → Octavos de final (8 partidos, 16→8)
 *   'semifinals'    → Cuartos de final (4 partidos, 8→4)
 *   'final'         → Semifinales + Gran Final (3 partidos)
 *   'third_place'   → Partido por 3er lugar (1 partido)
 */
import Match from '../models/Match.js';
import TournamentState from '../models/TournamentState.js';
import GroupStanding from '../models/GroupStanding.js';
import Prediction from '../models/Prediction.js';
import { GroupPrediction, ThirdPlacePicks, SpecialPrediction } from '../models/GroupPrediction.js';
import { recalcAllStandings } from './standings.js';
import { selectBestThirds, buildR16Fixtures, assignThirdsToFixtures } from './bracket.js';
import { WORLD_CUP_2026_GROUPS } from '../routes/groups.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function buildTeamMap() {
  return Object.values(WORLD_CUP_2026_GROUPS).flat()
    .reduce((acc, t) => { acc[t.name] = t; return acc; }, {});
}
function stub(name) {
  return { name: name || 'TBD', flag: '🏳️', code: 'TBD', primary: '#475569', secondary: '#94a3b8' };
}
function toTeamDoc(t, fallbackName) {
  return {
    name:      t?.name      || fallbackName || 'TBD',
    flag:      t?.flag      || '🏳️',
    code:      t?.code      || 'TBD',
    primary:   t?.primary   || '#475569',
    secondary: t?.secondary || '#94a3b8',
  };
}

// ─── State singleton ─────────────────────────────────────────────────────────
export async function getState() {
  let s = await TournamentState.findById('singleton');
  if (!s) s = await TournamentState.create({ _id: 'singleton' });
  return s;
}

// ─── Main hook — called after every admin result update ──────────────────────
export async function onMatchUpdated(match) {
  const state = await getState();

  // Lock group predictions on first match going live
  if (match.status === 'live' && !state.groupPredictionsLocked) {
    state.groupPredictionsLocked = true;
    state.groupsLockedAt = new Date();
    state.currentPhase = 'groups';
    await GroupPrediction.updateMany({}, { isLocked: true });
    await ThirdPlacePicks.updateMany({}, { isLocked: true });
    await state.save();
    console.log('[Engine] Groups locked');
  }

  // Lock each knockout phase on first match going live
  const phaseLockMap = {
    round16:       { field: 'round16Locked',       tsField: 'round16LockedAt' },
    quarterfinals: { field: 'quarterfinalsLocked',  tsField: 'qfLockedAt' },
    semifinals:    { field: 'semiFinalsLocked',     tsField: 'sfLockedAt' },
    third_place:   { field: 'semiFinalsLocked',     tsField: 'sfLockedAt' },
    final:         { field: 'finalLocked',          tsField: 'finalLockedAt' },
  };
  const lockCfg = phaseLockMap[match.phase];
  if (lockCfg && match.status === 'live' && !state[lockCfg.field]) {
    state[lockCfg.field] = true;
    state[lockCfg.tsField] = new Date();
    if (match.phase === 'final') state.specialsLocked = true;
    await Prediction.updateMany({ phase: match.phase }, { isLocked: true });
    if (match.phase === 'final') await SpecialPrediction.updateMany({}, { isLocked: true });
    await state.save();
    console.log('[Engine] Locked phase:', match.phase);
  }

  // When a groups match finishes: recalc standings and check if phase is done
  if (match.phase === 'groups' && match.status === 'finished') {
    const { recalcGroupStanding } = await import('./standings.js');
    await recalcGroupStanding(match.group);
    const finished = await Match.countDocuments({ phase: 'groups', status: 'finished' });
    state.totalGroupMatchesFinished = finished;
    await state.save();

    if (finished >= 72 && !state.bracketGenerated) {
      console.log('[Engine] All groups done — generating R16...');
      await generateR16();
    }
  }

  // When any knockout match finishes: try to generate next round
  if (['round16','quarterfinals','semifinals'].includes(match.phase) && match.status === 'finished') {
    await tryAdvanceRound(match.phase);
  }
}

// ─── Generate dieciseisavos (R16) ────────────────────────────────────────────
async function generateR16() {
  try {
    await recalcAllStandings();
    const standings = await GroupStanding.find();
    if (standings.length < 12) {
      console.error('[Engine] Not enough standings to generate R16');
      return;
    }

    const classified = {};
    for (const s of standings) {
      classified[s.group] = {
        first:  s.teams[0]?.name || null,
        second: s.teams[1]?.name || null,
        third:  s.teams[2]?.name || null,
      };
    }

    const bestThirds = selectBestThirds(standings);
    let fixtures = buildR16Fixtures(classified);
    fixtures = assignThirdsToFixtures(fixtures, bestThirds);

    const teamMap = buildTeamMap();
    let created = 0, updated = 0;

    for (const f of fixtures) {
      if (!f.home || !f.away) {
        console.warn('[Engine] Incomplete fixture:', f.matchNumber, f.homeSlot, 'vs', f.awaySlot);
        continue;
      }
      const ht = toTeamDoc(teamMap[f.home], f.home);
      const at = toTeamDoc(teamMap[f.away], f.away);
      const ex = await Match.findOne({ matchNumber: f.matchNumber });
      if (ex) {
        ex.homeTeam = ht; ex.awayTeam = at;
        ex.slotHome = f.homeSlot; ex.slotAway = f.awaySlot;
        ex.phase = 'round16';
        await ex.save(); updated++;
      } else {
        await Match.create({
          matchNumber: f.matchNumber, phase: 'round16',
          homeTeam: ht, awayTeam: at,
          slotHome: f.homeSlot, slotAway: f.awaySlot,
          status: 'scheduled',
        });
        created++;
      }
    }

    const state = await getState();
    state.bracketGenerated = true;
    state.bracketGeneratedAt = new Date();
    state.currentPhase = 'round16';
    await state.save();

    console.log('[Engine] R16 done:', created, 'created,', updated, 'updated');
    console.log('[Engine] Best thirds:', bestThirds.map(t => t.name + '(' + t.group + ')').join(', '));
    return { created, updated, bestThirds };
  } catch (err) {
    console.error('[Engine] Error generating R16:', err.message);
    throw err;
  }
}

// ─── Advance to next knockout round ──────────────────────────────────────────
async function tryAdvanceRound(finishedPhase) {
  const NEXT = {
    round16:       { phase: 'quarterfinals', startNum: 200 },
    quarterfinals: { phase: 'semifinals',    startNum: 300 },
    semifinals:    { phase: 'final',         startNum: 400 },
  };
  const next = NEXT[finishedPhase];
  if (!next) return;

  // Count finished vs total for this phase
  const [total, finished] = await Promise.all([
    Match.countDocuments({ phase: finishedPhase }),
    Match.countDocuments({ phase: finishedPhase, status: 'finished' }),
  ]);

  if (total === 0 || finished < total) {
    console.log('[Engine] Phase', finishedPhase, 'not complete:', finished, '/', total);
    return;
  }

  console.log('[Engine] Phase', finishedPhase, 'complete! Generating', next.phase);

  // Get all finished matches in ORDER
  const doneMatches = await Match.find({ phase: finishedPhase, status: 'finished' })
    .sort({ matchNumber: 1 });

  const winners = doneMatches.map(m => ({
    name: m.winner === 'home' ? m.homeTeam.name : m.awayTeam.name,
    team: m.winner === 'home' ? m.homeTeam      : m.awayTeam,
  }));

  const teamMap = buildTeamMap();
  let created = 0;

  // Pair winners: match 1 winner vs match 2 winner, etc.
  for (let i = 0; i < winners.length; i += 2) {
    const hw = winners[i];
    const aw = winners[i + 1];
    if (!hw || !aw) continue;

    const num = next.startNum + Math.floor(i / 2) + 1;
    const ht  = toTeamDoc(teamMap[hw.name] || hw.team, hw.name);
    const at  = toTeamDoc(teamMap[aw.name] || aw.team, aw.name);

    const ex = await Match.findOne({ matchNumber: num });
    if (ex) {
      // Update teams if they changed (re-run)
      ex.homeTeam = ht; ex.awayTeam = at;
      await ex.save();
    } else {
      await Match.create({
        matchNumber: num, phase: next.phase,
        homeTeam: ht, awayTeam: at,
        status: 'scheduled',
      });
      created++;
    }
  }

  // Third place match when semis finish
  if (finishedPhase === 'semifinals') {
    const losers = doneMatches.map(m => ({
      name: m.winner === 'home' ? m.awayTeam.name : m.homeTeam.name,
      team: m.winner === 'home' ? m.awayTeam      : m.homeTeam,
    }));
    if (losers[0] && losers[1]) {
      const ht = toTeamDoc(teamMap[losers[0].name] || losers[0].team, losers[0].name);
      const at = toTeamDoc(teamMap[losers[1].name] || losers[1].team, losers[1].name);
      const ex3 = await Match.findOne({ phase: 'third_place' });
      if (ex3) {
        ex3.homeTeam = ht; ex3.awayTeam = at; await ex3.save();
      } else {
        await Match.create({ matchNumber: 500, phase: 'third_place', homeTeam: ht, awayTeam: at, status: 'scheduled' });
        created++;
      }
    }
  }

  const state = await getState();
  state.currentPhase = next.phase;
  await state.save();

  console.log('[Engine]', created, 'matches created for', next.phase);
}

// ─── Public exports ───────────────────────────────────────────────────────────
export { generateR16 as forceGenerateR16 };

export async function advanceToNextRound(finishedPhase) {
  return tryAdvanceRound(finishedPhase);
}
