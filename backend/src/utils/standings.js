import Match from '../models/Match.js';
import GroupStanding from '../models/GroupStanding.js';
import { WORLD_CUP_2026_GROUPS } from '../routes/groups.js';

export async function recalcGroupStanding(group) {
  const groupTeams = WORLD_CUP_2026_GROUPS[group];
  if (!groupTeams) return;

  const stats = {};
  for (const t of groupTeams) {
    stats[t.name] = {
      name: t.name, flag: t.flag, code: t.code, primary: t.primary,
      PJ:0, PG:0, PE:0, PP:0, GF:0, GC:0, DG:0, PTS:0,
    };
  }

  const matches = await Match.find({ phase: 'groups', group, status: 'finished' });

  for (const m of matches) {
    const h = m.homeTeam?.name;
    const a = m.awayTeam?.name;
    const hg = m.homeScore ?? 0;
    const ag = m.awayScore ?? 0;
    if (!h || !a || !stats[h] || !stats[a]) continue;

    stats[h].PJ++; stats[a].PJ++;
    stats[h].GF += hg; stats[h].GC += ag;
    stats[a].GF += ag; stats[a].GC += hg;
    stats[h].DG = stats[h].GF - stats[h].GC;
    stats[a].DG = stats[a].GF - stats[a].GC;

    if (hg > ag)      { stats[h].PG++; stats[h].PTS += 3; stats[a].PP++; }
    else if (hg < ag) { stats[a].PG++; stats[a].PTS += 3; stats[h].PP++; }
    else              { stats[h].PE++; stats[h].PTS++;     stats[a].PE++; stats[a].PTS++; }
  }

  const sorted = Object.values(stats).sort((a, b) => {
    if (b.PTS !== a.PTS) return b.PTS - a.PTS;
    if (b.DG  !== a.DG)  return b.DG  - a.DG;
    if (b.GF  !== a.GF)  return b.GF  - a.GF;
    const direct = getDirectResult(a.name, b.name, matches);
    if (direct !== 0) return direct;
    return (a.name || '').localeCompare(b.name || '');
  });

  await GroupStanding.findOneAndUpdate(
    { group },
    { group, teams: sorted, updatedAt: new Date() },
    { upsert: true, new: true }
  );
  return sorted;
}

export async function recalcAllStandings() {
  const groups = Object.keys(WORLD_CUP_2026_GROUPS);
  for (const g of groups) await recalcGroupStanding(g);
}

function getDirectResult(nameA, nameB, matches) {
  const direct = matches.filter(m =>
    (m.homeTeam?.name === nameA && m.awayTeam?.name === nameB) ||
    (m.homeTeam?.name === nameB && m.awayTeam?.name === nameA)
  );
  let ptsA=0, ptsB=0, dgA=0, dgB=0, gfA=0, gfB=0;
  for (const m of direct) {
    const isAHome = m.homeTeam?.name === nameA;
    const goalsA = isAHome ? (m.homeScore||0) : (m.awayScore||0);
    const goalsB = isAHome ? (m.awayScore||0) : (m.homeScore||0);
    dgA += goalsA - goalsB; dgB += goalsB - goalsA;
    gfA += goalsA; gfB += goalsB;
    if (goalsA > goalsB) ptsA += 3;
    else if (goalsA < goalsB) ptsB += 3;
    else { ptsA++; ptsB++; }
  }
  if (ptsB !== ptsA) return ptsB - ptsA;
  if (dgB  !== dgA)  return dgB  - dgA;
  if (gfB  !== gfA)  return gfB  - gfA;
  return 0;
}
