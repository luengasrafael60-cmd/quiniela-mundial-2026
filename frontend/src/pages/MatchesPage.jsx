import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { getTeam, getFlagUrl } from '../utils/teams';

const PHASE_LABELS = {
  round16: 'Dieciseisavos',
  quarterfinals: 'Octavos de Final',
  semifinals: 'Cuartos de Final',
  semifinal: 'Semifinales',
  third_place: 'Tercer Lugar',
  final: 'Final',
};

function FlagImg({ teamName, size = 18 }) {
  const url = getFlagUrl(teamName, 'w40');
  const team = getTeam(teamName);
  if (!url) return <span style={{ fontSize: size + 'px', lineHeight: 1 }}>{team.flag}</span>;
  return (
    <img src={url} alt={teamName}
      width={Math.round(size * 1.4)} height={size}
      style={{ objectFit: 'cover', borderRadius: '3px', display: 'block', flexShrink: 0 }}
      onError={e => { e.currentTarget.style.display = 'none'; }}
    />
  );
}

function MatchCard({ entry, dbMatch, pred, onScoreChange, onWinnerChange, onSave, saving, filter }) {
  const homeTeam = getTeam(entry.home);
  const awayTeam = getTeam(entry.away);
  const { day, time } = formatMatchDate(entry.date);
  const matchId = dbMatch?._id;
  const status = dbMatch?.status || 'scheduled';
  const isFinished = status === 'finished';
  const isLive = status === 'live';
  const isLocked = status !== 'scheduled';

  return (
    <div className="card card-sm" style={{
      borderColor: isLive ? 'rgba(239,68,68,0.4)' : 'var(--border)',
      marginBottom: '8px',
    }}>
      {/* Fila superior: hora, sede, grupo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <span style={{
          fontSize: '11px', fontWeight: 700, minWidth: '42px',
          color: isLive ? 'var(--red)' : isFinished ? 'var(--green)' : 'var(--accent)',
        }}>
          {isLive
            ? (dbMatch?.minute ? `🔴 ${dbMatch.minute}'` : '🔴 EN VIVO')
            : isFinished ? '✓ FIN' : time}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>📍 {entry.venue}</span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          Grupo {entry.group} · J{entry.jornada} · #{entry.matchNumber}
        </span>
      </div>

      {/* Fila principal: equipos + input/score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* Local */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: '100px' }}>
          <div style={{ width: 3, height: 26, borderRadius: 99, background: homeTeam.primary, flexShrink: 0 }} />
          <FlagImg teamName={entry.home} size={17} />
          <span style={{ fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {entry.home}
          </span>
        </div>

        {/* Centro: marcador real o inputs de predicción */}
        {isFinished ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--bg-input)', padding: '5px 12px', borderRadius: '8px',
            fontWeight: 700, fontSize: '18px', minWidth: '76px', justifyContent: 'center',
          }}>
            <span>{dbMatch?.homeScore ?? '?'}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>–</span>
            <span>{dbMatch?.awayScore ?? '?'}</span>
          </div>
        ) : filter === 'groups' && matchId ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input type="number" min="0" max="20"
              value={pred?.predictedHomeScore ?? ''}
              onChange={e => onScoreChange(matchId, 'home', e.target.value)}
              disabled={isLocked}
              placeholder="0"
              style={{
                width: '40px', padding: '5px 2px', textAlign: 'center',
                background: 'var(--bg-input)', border: '1px solid var(--border-strong)',
                borderRadius: '6px', color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600,
              }} />
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>–</span>
            <input type="number" min="0" max="20"
              value={pred?.predictedAwayScore ?? ''}
              onChange={e => onScoreChange(matchId, 'away', e.target.value)}
              disabled={isLocked}
              placeholder="0"
              style={{
                width: '40px', padding: '5px 2px', textAlign: 'center',
                background: 'var(--bg-input)', border: '1px solid var(--border-strong)',
                borderRadius: '6px', color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600,
              }} />
          </div>
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '4px 8px' }}>VS</span>
        )}

        {/* Visitante */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: '100px', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>
            {entry.away}
          </span>
          <FlagImg teamName={entry.away} size={17} />
          <div style={{ width: 3, height: 26, borderRadius: 99, background: awayTeam.primary, flexShrink: 0 }} />
        </div>

        {/* Feedback pronóstico */}
        {isFinished && pred?.predictedHomeScore != null && (() => {
          const exact   = pred.resultExactScore;
          const correct = pred.resultCorrectWinner;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', minWidth: '80px' }}>
              <span className={`badge ${exact ? 'badge-green' : correct ? 'badge-blue' : 'badge-red'}`}>
                {exact ? '🎯 Exacto' : correct ? '✅ Ganador' : '❌ Falló'}
              </span>
              {pred.pointsEarned > 0
                ? <span style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 700 }}>+{pred.pointsEarned} pts</span>
                : <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>0 pts</span>}
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Tu pronóstico: {pred.predictedHomeScore}–{pred.predictedAwayScore}
              </span>
            </div>
          );
        })()}
        {isFinished && pred?.predictedHomeScore == null && (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sin pronóstico</span>
        )}
        {!isLocked && matchId && (
          <button className="btn btn-primary btn-sm"
            onClick={() => onSave(matchId, pred)}
            disabled={saving[matchId]}>
            {saving[matchId] ? '...' : '💾 Guardar pronóstico'}
          </button>
        )}
        {!isLocked && !matchId && (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Corre el seed primero</span>
        )}
        {isLocked && !isFinished && (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>🔒 Bloqueado</span>
        )}
      </div>
    </div>
  );
}

export default function MatchesPage() {
  const [dbMatches, setDbMatches] = useState([]);   // matches de la DB (con _id, status, scores)
  const [predictions, setPredictions] = useState({});
  const [saving, setSaving] = useState({});
  const [filter, setFilter] = useState('round16');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      const [mRes, pRes] = await Promise.all([
        api.get(`/matches?phase=${filter}`),
        api.get('/predictions/my'),
      ]);
      setDbMatches(mRes.data.matches || []);
      const preds = {};
      pRes.data.matchPredictions?.forEach(p => {
        // indexar por matchNumber si está disponible, y por _id
        const id = p.match?._id || p.match;
        preds[id] = p;
        if (p.match?.matchNumber) preds[`num_${p.match.matchNumber}`] = p;
      });
      setPredictions(preds);
    } catch (err) {
      console.error('Error cargando partidos:', err);
    }
  };

  // Crear mapa matchNumber -> dbMatch para cruzar con el calendario
  const dbMatchByNum = dbMatches.reduce((acc, m) => {
    acc[m.matchNumber] = m;
    return acc;
  }, {});

  const handleScore = (matchId, side, val) => {
    setPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [`predicted${side === 'home' ? 'Home' : 'Away'}Score`]: parseInt(val) || 0,
      },
    }));
  };

  const handleWinner = (matchId, winner) => {
    setPredictions(prev => ({ ...prev, [matchId]: { ...prev[matchId], predictedWinner: winner } }));
  };

  const savePrediction = async (matchId, pred) => {
    setSaving(s => ({ ...s, [matchId]: true }));
    try {
      await api.post('/predictions/match', {
        matchId,
        predictedHomeScore: pred?.predictedHomeScore ?? null,
        predictedAwayScore: pred?.predictedAwayScore ?? null,
        predictedWinner: pred?.predictedWinner ?? null,
      });
      toast.success('Pronóstico guardado ✓');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(s => ({ ...s, [matchId]: false }));
    }
  };

  // Para fases eliminatorias, usar partidos de la DB directamente
  if (filter !== 'groups') {
    return (
      <div>
        <Header filter={filter} setFilter={setFilter} />
        {dbMatches.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⏳</div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Los partidos de {PHASE_LABELS[filter].toLowerCase()} se definirán cuando avance el torneo.
            </p>
          </div>
        ) : (
          dbMatches.map(match => {
            const pred = predictions[match._id];
            return (
              <div key={match._id} className="card card-sm" style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FlagImg teamName={match.homeTeam.name} size={17} />
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: 500 }}>{match.homeTeam.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>vs</span>
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, textAlign: 'right' }}>{match.awayTeam.name}</span>
                  <FlagImg teamName={match.awayTeam.name} size={17} />
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div>
      <Header filter={filter} setFilter={setFilter} />
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>⏳</div>
        <p style={{ color: 'var(--text-secondary)' }}>
          Los partidos eliminatorios aparecerán aquí cuando el admin genere las llaves.
        </p>
      </div>
    </div>
  );
}

function Header({ filter, setFilter }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>⚽ Partidos</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px' }}>
        Predice marcadores exactos (+5 pts) o solo el resultado (+2 pts)
      </p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {Object.entries(PHASE_LABELS).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`btn btn-sm ${filter === key ? 'btn-primary' : 'btn-secondary'}`}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
