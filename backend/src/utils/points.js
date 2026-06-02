/**
 * Sistema de puntos — Quiniela Mundial 2026
 *
 * GRUPOS:
 *   Equipo clasificado correcto:  +1 pt
 *   Posición exacta (1° o 2°):   +2 pts extra  → total 3 pts
 *   Mejor tercero correcto:       +1 pt (solo clasificar) +2 extra si era su pick exacto
 *
 * ELIMINATORIAS (quién avanza):
 *   Acertar ganador:              +1 pt por ronda
 *   Marcador exacto bonus:        +3 pts extra
 */

export const POINTS = {
  // Grupos — clasificados
  CLASSIFIED_CORRECT: 1,   // el equipo que pusiste sí clasificó
  POSITION_EXACT:     2,   // bonus: además acertaste el lugar exacto (1° o 2°)
  THIRD_CORRECT:      1,   // pusiste este 3ro y sí avanzó

  // Eliminatorias — quién avanza
  KO_CORRECT:         1,   // acertaste el ganador de un partido eliminatorio
  EXACT_SCORE_BONUS:  3,   // bonus: además el marcador fue exacto
};

/**
 * Puntos por posiciones de grupo.
 * actualFirst / actualSecond: equipos reales clasificados
 * bestThirds: array de los 8 mejores terceros reales
 */
export function calcGroupPoints(prediction, actualFirst, actualSecond, bestThirds = []) {
  let pts = 0;
  let breakdown = [];

  const allClassified = [actualFirst, actualSecond, ...bestThirds].filter(Boolean);

  // 1er lugar
  if (prediction.first && actualFirst) {
    const classified = allClassified.includes(prediction.first);
    if (classified) {
      pts += POINTS.CLASSIFIED_CORRECT;
      if (prediction.first === actualFirst) {
        pts += POINTS.POSITION_EXACT;
        breakdown.push({ team: prediction.first, reason: '1° lugar exacto', pts: POINTS.CLASSIFIED_CORRECT + POINTS.POSITION_EXACT });
      } else {
        breakdown.push({ team: prediction.first, reason: 'Clasificó (no era 1°)', pts: POINTS.CLASSIFIED_CORRECT });
      }
    }
  }

  // 2do lugar
  if (prediction.second && actualSecond) {
    const classified = allClassified.includes(prediction.second);
    if (classified && prediction.second !== prediction.first) {
      pts += POINTS.CLASSIFIED_CORRECT;
      if (prediction.second === actualSecond) {
        pts += POINTS.POSITION_EXACT;
        breakdown.push({ team: prediction.second, reason: '2° lugar exacto', pts: POINTS.CLASSIFIED_CORRECT + POINTS.POSITION_EXACT });
      } else {
        breakdown.push({ team: prediction.second, reason: 'Clasificó (no era 2°)', pts: POINTS.CLASSIFIED_CORRECT });
      }
    }
  }

  return { pts, breakdown };
}

/** Puntos por mejor tercero */
export function calcThirdPlacePoints(userPicks, actualThirdAdvancers) {
  let pts = 0;
  let breakdown = [];
  for (const pick of (userPicks || [])) {
    if (actualThirdAdvancers.includes(pick)) {
      pts += POINTS.THIRD_CORRECT;
      breakdown.push({ team: pick, reason: 'Mejor tercero clasificó', pts: POINTS.THIRD_CORRECT });
    }
  }
  return { pts, breakdown };
}

/** Puntos por partido eliminatorio */
export function calcKnockoutPoints(prediction, match) {
  if (!prediction.predictedWinner || !match.winner) return { pts: 0, breakdown: [] };
  if (prediction.predictedWinner !== match.winner) return { pts: 0, breakdown: [] };

  const winnerName = match.winner === 'home' ? match.homeTeam.name : match.awayTeam.name;
  const exact = prediction.predictedHomeScore != null &&
    prediction.predictedHomeScore === match.homeScore &&
    prediction.predictedAwayScore === match.awayScore;

  const pts = POINTS.KO_CORRECT + (exact ? POINTS.EXACT_SCORE_BONUS : 0);
  const phaseLabel = { round16:'Dieciseisavos', quarterfinals:'Octavos', semifinals:'Cuartos', semifinal:'Semis', third_place:'3er lugar', final:'Final' };
  const reason = exact
    ? `Marcador exacto ${match.homeScore}-${match.awayScore} (${phaseLabel[match.phase]||match.phase})`
    : `${winnerName} avanzó (${phaseLabel[match.phase]||match.phase})`;

  return { pts, breakdown: [{ team: winnerName, reason, pts }] };
}

/** Puntos por pronósticos especiales */
export function calcSpecialPoints(prediction, results) {
  let pts = 0;
  let breakdown = [];
  if (results.champion   && prediction.champion   === results.champion)   { pts += 5; breakdown.push({ team: prediction.champion,    reason: 'Campeón correcto',       pts: 5 }); }
  if (results.runnerUp   && prediction.runnerUp   === results.runnerUp)   { pts += 3; breakdown.push({ team: prediction.runnerUp,    reason: 'Subcampeón correcto',    pts: 3 }); }
  if (results.thirdPlace && prediction.thirdPlace === results.thirdPlace) { pts += 2; breakdown.push({ team: prediction.thirdPlace,  reason: '3er lugar correcto',     pts: 2 }); }
  if (results.fourthPlace&& prediction.fourthPlace=== results.fourthPlace){ pts += 1; breakdown.push({ team: prediction.fourthPlace, reason: 'Cuarto lugar correcto',   pts: 1 }); }
  return { pts, breakdown };
}

// Backwards compat wrappers (return just pts number)
export function calcGroupPointsSimple(prediction, actualFirst, actualSecond, bestThirds) {
  return calcGroupPoints(prediction, actualFirst, actualSecond, bestThirds).pts;
}
export function calcThirdPlacePointsSimple(picks, advancers) {
  return calcThirdPlacePoints(picks, advancers).pts;
}
export function calcKnockoutPointsSimple(pred, match) {
  return calcKnockoutPoints(pred, match).pts;
}
export function calcSpecialPointsSimple(pred, results) {
  return calcSpecialPoints(pred, results).pts;
}
