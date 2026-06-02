import mongoose from 'mongoose';

/**
 * Estado global del torneo — documento único (singleton)
 * Controla qué pronósticos están abiertos/cerrados
 */
const tournamentStateSchema = new mongoose.Schema({
  _id:  { type: String, default: 'singleton' },

  // Fase actual
  currentPhase: {
    type: String,
    enum: ['pre', 'groups', 'round16', 'quarterfinals', 'semifinals', 'semifinal', 'third_place', 'final', 'finished'],
    default: 'pre',
  },

  // Locks por sección
  groupPredictionsLocked:  { type: Boolean, default: false }, // se bloquea al iniciar partido 1
  thirdPlaceLocked:        { type: Boolean, default: false }, // se bloquea al terminar grupos
  specialsLocked:          { type: Boolean, default: false }, // se bloquea al iniciar la final
  round16Locked:           { type: Boolean, default: false },
  quarterfinalsLocked:     { type: Boolean, default: false },
  semiFinalsLocked:        { type: Boolean, default: false },
  semifinalLocked:         { type: Boolean, default: false },
  finalLocked:             { type: Boolean, default: false },

  // Timestamps de cada lock
  groupsLockedAt:     { type: Date, default: null },
  round16LockedAt:    { type: Date, default: null },
  qfLockedAt:         { type: Date, default: null },
  sfLockedAt:         { type: Date, default: null },
  thirdPlaceLockedAt: { type: Date, default: null },
  finalLockedAt:      { type: Date, default: null },

  // Bandera: ¿se generó ya el bracket de octavos?
  bracketGenerated:   { type: Boolean, default: false },
  bracketGeneratedAt: { type: Date,    default: null  },

  // Estadísticas rápidas
  totalGroupMatchesFinished:   { type: Number, default: 0 },
  bestThirds: [{ type: String }], // los 8 mejores terceros seleccionados manualmente
  totalGroupMatches:           { type: Number, default: 72 },
}, { timestamps: true });

export default mongoose.model('TournamentState', tournamentStateSchema);
