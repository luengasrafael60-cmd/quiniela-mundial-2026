export function selectBestThirds(allStandings) {
  const thirds = [];
  for (const standing of allStandings) {
    if (standing.teams?.length >= 3) {
      const third = standing.teams[2];
      if (third?.name) thirds.push({ ...third, group: standing.group });
    }
  }
  thirds.sort((a, b) => {
    if (b.PTS !== a.PTS) return b.PTS - a.PTS;
    if (b.DG  !== a.DG)  return b.DG  - a.DG;
    if (b.GF  !== a.GF)  return b.GF  - a.GF;
    return (a.name || '').localeCompare(b.name || '');
  });
  return thirds.slice(0, 8);
}

export function buildR16Fixtures(classified) {
  const g = classified;
  return [
    { matchNumber:73,  homeSlot:'2A',      awaySlot:'2B',      home: g.A?.second, away: g.B?.second },
    { matchNumber:74,  homeSlot:'1E',      awaySlot:'3ABCDF',  home: g.E?.first,  away: null },
    { matchNumber:75,  homeSlot:'1F',      awaySlot:'2C',      home: g.F?.first,  away: g.C?.second },
    { matchNumber:76,  homeSlot:'1C',      awaySlot:'2F',      home: g.C?.first,  away: g.F?.second },
    { matchNumber:77,  homeSlot:'1I',      awaySlot:'3CDFGH',  home: g.I?.first,  away: null },
    { matchNumber:78,  homeSlot:'2E',      awaySlot:'2I',      home: g.E?.second, away: g.I?.second },
    { matchNumber:79,  homeSlot:'1A',      awaySlot:'3CEFHI',  home: g.A?.first,  away: null },
    { matchNumber:80,  homeSlot:'1L',      awaySlot:'3EHIJK',  home: g.L?.first,  away: null },
    { matchNumber:81,  homeSlot:'1D',      awaySlot:'3BEFIJ',  home: g.D?.first,  away: null },
    { matchNumber:82,  homeSlot:'1G',      awaySlot:'3AEHIJ',  home: g.G?.first,  away: null },
    { matchNumber:83,  homeSlot:'2K',      awaySlot:'2L',      home: g.K?.second, away: g.L?.second },
    { matchNumber:84,  homeSlot:'1H',      awaySlot:'2J',      home: g.H?.first,  away: g.J?.second },
    { matchNumber:85,  homeSlot:'1B',      awaySlot:'3EFGIJ',  home: g.B?.first,  away: null },
    { matchNumber:86,  homeSlot:'1J',      awaySlot:'2H',      home: g.J?.first,  away: g.H?.second },
    { matchNumber:87,  homeSlot:'1K',      awaySlot:'3DEIJL',  home: g.K?.first,  away: null },
    { matchNumber:88,  homeSlot:'2D',      awaySlot:'2G',      home: g.D?.second, away: g.G?.second },
  ];
}

export function assignThirdsToFixtures(fixtures, bestThirds) {
  const queue = [...bestThirds];
  return fixtures.map(f => {
    if (f.away === null && queue.length > 0) {
      return { ...f, away: queue.shift().name };
    }
    return f;
  });
}
