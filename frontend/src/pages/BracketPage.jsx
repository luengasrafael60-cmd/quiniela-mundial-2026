import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { getFlagUrl, getTeam } from '../utils/teams';

/**
 * Nombres de fases — FIFA 2026 tiene 48 equipos
 * round16       = Dieciseisavos (32→16, 16 partidos)
 * quarterfinals = Octavos       (16→8,   8 partidos)
 * semifinals    = Cuartos       ( 8→4,   4 partidos)
 * final         = Semifinal + Final
 */
const PHASE_CONFIG = [
  { key:'round16',       label:'Dieciseisavos',   short:'16avos', pts:4,  bonus:3,  color:'var(--accent-2)' },
  { key:'quarterfinals', label:'Octavos de Final', short:'Octavos',pts:6,  bonus:5,  color:'var(--accent)'   },
  { key:'semifinals',    label:'Cuartos de Final', short:'Cuartos',pts:10, bonus:7,  color:'var(--purple)'   },
  { key:'semifinal',     label:'Semifinales',      short:'Semis', pts:15, bonus:8,  color:'#a855f7'         },
  { key:'third_place',   label:'3er Lugar',        short:'3°',     pts:10, bonus:7,  color:'var(--green)'    },
  { key:'final',         label:'Final', short:'Final', pts:15, bonus:10, color:'#f59e0b'      },
];

function FlagImg({ teamName, size=26 }) {
  const url = getFlagUrl(teamName, 'w40');
  const team = getTeam(teamName);
  if (!url) return <span style={{ fontSize:size+'px', lineHeight:1 }}>{team.flag}</span>;
  return <img src={url} alt={teamName} width={Math.round(size*1.4)} height={size}
    style={{ objectFit:'cover', borderRadius:'4px', display:'block', flexShrink:0 }}
    onError={e=>{e.currentTarget.style.display='none'}} />;
}

function MatchCard({ match, prediction, onSave, saving, phaseLocked }) {
  const [homeScore, setHomeScore] = useState(prediction?.predictedHomeScore ?? '');
  const [awayScore, setAwayScore] = useState(prediction?.predictedAwayScore ?? '');
  const [winner,    setWinner]    = useState(prediction?.predictedWinner ?? null);

  useEffect(() => {
    setHomeScore(prediction?.predictedHomeScore ?? '');
    setAwayScore(prediction?.predictedAwayScore ?? '');
    setWinner(prediction?.predictedWinner ?? null);
  }, [prediction]);

  const isLocked   = match.status !== 'scheduled' || !!phaseLocked;
  const isFinished = match.status === 'finished';
  const isLive     = match.status === 'live';
  const realWinner = match.winner;
  const myCorrect  = isFinished && winner === realWinner;
  const exactScore = myCorrect && parseInt(homeScore) === match.homeScore && parseInt(awayScore) === match.awayScore;

  const homeTeam = getTeam(match.homeTeam.name);
  const awayTeam = getTeam(match.awayTeam.name);

  const teamStyle = (side) => {
    const isPick = winner === side;
    const isReal = isFinished && realWinner === side;
    const correct = isPick && isReal;
    const wrong   = isPick && isFinished && !isReal;
    return {
      flex:1, display:'flex', flexDirection:'column', alignItems:'center',
      gap:'8px', padding:'14px 8px', borderRadius:'12px',
      cursor: isLocked ? 'default' : 'pointer',
      border:`1.5px solid ${isPick ? correct ? 'rgba(16,185,129,.5)' : wrong ? 'rgba(239,68,68,.4)' : 'rgba(245,158,11,.5)' : 'var(--border)'}`,
      background: isPick ? correct ? 'var(--green-dim)' : wrong ? 'var(--red-dim)' : 'var(--accent-dim)'
        : isReal ? 'rgba(255,255,255,.03)' : 'transparent',
      transition:'all .15s',
    };
  };

  return (
    <div className="card card-sm" style={{
      borderColor: isLive ? 'rgba(239,68,68,.4)' : isFinished && myCorrect ? 'rgba(16,185,129,.3)' : 'var(--border)',
    }}>
      {/* Status bar */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          {isLive && <span className="dot-live" />}
          <span style={{ fontSize:'11px', fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em',
            color: isLive ? 'var(--red)' : isFinished ? 'var(--green)' : 'var(--text-muted)' }}>
            {isLive ? (match.minute ? `🔴 ${match.minute}'` : '🔴 EN VIVO')
              : isFinished ? '✅ Finalizado' : '⏰ Próximo'}
          </span>
          {match.venue && <span style={{ fontSize:'10px', color:'var(--text-muted)' }}>· {match.venue}</span>}
        </div>
        {isFinished && prediction?.predictedWinner && (
          <span className={`badge ${exactScore ? 'badge-gold' : myCorrect ? 'badge-green' : 'badge-red'}`} style={{ fontSize:'11px' }}>
            {exactScore ? `🎯 +${prediction.pointsEarned||0}` : myCorrect ? `✓ +${prediction.pointsEarned||0}` : '✗ 0'} pts
          </span>
        )}
      </div>

      {/* Equipos */}
      <div style={{ display:'flex', gap:'8px', alignItems:'stretch', marginBottom:'10px' }}>
        {/* Local */}
        <div style={teamStyle('home')} onClick={() => { if (!isLocked) setWinner(p => p==='home' ? null : 'home'); }}>
          <div style={{ width:4, height:30, borderRadius:99, background:homeTeam.primary, flexShrink:0 }} />
          <FlagImg teamName={match.homeTeam.name} size={28} />
          <span style={{ fontSize:'12px', fontWeight:600, textAlign:'center', lineHeight:1.2 }}>{match.homeTeam.name}</span>
          {isFinished && realWinner === 'home' && <span style={{ fontSize:'11px', color:'var(--green)' }}>🏆 Ganó</span>}
          {winner === 'home' && !isFinished && <span style={{ fontSize:'11px', color:'var(--accent)' }}>Tu pick ✓</span>}
        </div>

        {/* Centro — marcador */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'6px', padding:'0 4px', minWidth:80 }}>
          {isFinished ? (
            <div style={{ background:'var(--bg-input)', borderRadius:'10px', padding:'8px 14px', textAlign:'center' }}>
              <div style={{ fontSize:'22px', fontWeight:800 }}>{match.homeScore} – {match.awayScore}</div>
              {match.winner === 'draw' && <div style={{ fontSize:'10px', color:'var(--text-muted)' }}>Empate</div>}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'4px', alignItems:'center' }}>
              <span style={{ fontSize:'11px', color:'var(--text-muted)' }}>Marcador (opc.)</span>
              <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
                <input type="number" min="0" max="20" value={homeScore} onChange={e=>setHomeScore(e.target.value)}
                  disabled={isLocked} placeholder="0"
                  style={{ width:38, padding:'5px 2px', textAlign:'center', background:'var(--bg-input)', border:'1px solid var(--border-strong)', borderRadius:'6px', color:'var(--text-primary)', fontSize:'15px', fontWeight:700 }} />
                <span style={{ color:'var(--text-muted)', fontSize:'12px' }}>–</span>
                <input type="number" min="0" max="20" value={awayScore} onChange={e=>setAwayScore(e.target.value)}
                  disabled={isLocked} placeholder="0"
                  style={{ width:38, padding:'5px 2px', textAlign:'center', background:'var(--bg-input)', border:'1px solid var(--border-strong)', borderRadius:'6px', color:'var(--text-primary)', fontSize:'15px', fontWeight:700 }} />
              </div>
            </div>
          )}
          {isLive && <span className="dot-live" />}
          {isLocked && !isFinished && <span style={{ fontSize:'11px', color:'var(--text-muted)' }}>🔒</span>}
        </div>

        {/* Visitante */}
        <div style={teamStyle('away')} onClick={() => { if (!isLocked) setWinner(p => p==='away' ? null : 'away'); }}>
          <div style={{ width:4, height:30, borderRadius:99, background:awayTeam.primary, flexShrink:0 }} />
          <FlagImg teamName={match.awayTeam.name} size={28} />
          <span style={{ fontSize:'12px', fontWeight:600, textAlign:'center', lineHeight:1.2 }}>{match.awayTeam.name}</span>
          {isFinished && realWinner === 'away' && <span style={{ fontSize:'11px', color:'var(--green)' }}>🏆 Ganó</span>}
          {winner === 'away' && !isFinished && <span style={{ fontSize:'11px', color:'var(--accent)' }}>Tu pick ✓</span>}
        </div>
      </div>

      {/* Pronóstico del jugador si ya terminó */}
      {isFinished && prediction?.predictedWinner && (
        <div style={{ fontSize:'12px', color:'var(--text-muted)', textAlign:'center', marginBottom:'6px' }}>
          Tu pronóstico: <strong>{prediction.predictedWinner === 'home' ? match.homeTeam.name : match.awayTeam.name}</strong>
          {prediction.predictedHomeScore != null && ` (${prediction.predictedHomeScore}–${prediction.predictedAwayScore})`}
        </div>
      )}

      {/* Botón guardar */}
      {!isLocked && (
        <button className="btn btn-primary btn-sm btn-full"
          onClick={() => onSave(match._id, { predictedHomeScore: homeScore!==''?parseInt(homeScore):null, predictedAwayScore: awayScore!==''?parseInt(awayScore):null, predictedWinner: winner })}
          disabled={saving || !winner}>
          {saving ? 'Guardando...' : winner ? '💾 Guardar pronóstico' : 'Toca un equipo para elegir ganador'}
        </button>
      )}
    </div>
  );
}

export default function BracketPage() {
  const [matchesByPhase, setMatchesByPhase] = useState({});
  const [predictions,    setPredictions]    = useState({});
  const [saving,         setSaving]         = useState({});
  const [activePhase,    setActivePhase]    = useState('round16');
  const [tournState,     setTournState]     = useState(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(refreshState, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [pRes, sRes, ...phaseResults] = await Promise.all([
        api.get('/predictions/my'),
        api.get('/predictions/state'),
        ...PHASE_CONFIG.map(p => api.get('/matches?phase=' + p.key).catch(() => ({ data: { matches: [] } }))),
      ]);
      const byPhase = {};
      PHASE_CONFIG.forEach((p, i) => {
        byPhase[p.key] = phaseResults[i]?.data?.matches || [];
      });
      setMatchesByPhase(byPhase);
      setTournState(sRes.data.state);
      const preds = {};
      pRes.data.matchPredictions?.forEach(p => { preds[p.match?._id || p.match] = p; });
      setPredictions(preds);
      const firstWithMatches = PHASE_CONFIG.find(p => byPhase[p.key]?.length > 0);
      if (firstWithMatches) setActivePhase(firstWithMatches.key);
    } catch (err) { console.error('BracketPage load error:', err); }
  };

  // Refresh ONLY the tournament state every 5 seconds to pick up admin lock changes
  const refreshState = async () => {
    try {
      const { data } = await api.get('/predictions/state');
      setTournState(data.state);
    } catch {}
  };

  const handleSave = async (matchId, data) => {
    setSaving(s => ({ ...s, [matchId]: true }));
    try {
      await api.post('/predictions/match', { matchId, ...data });
      setPredictions(prev => ({ ...prev, [matchId]: { ...prev[matchId], ...data } }));
      toast.success('Pronóstico guardado ✓');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(s => ({ ...s, [matchId]: false }));
    }
  };

  const totalMatches = Object.values(matchesByPhase).flat().length;
  const activeMatches = matchesByPhase[activePhase] || [];

  // Is this phase locked?
  const phaseLocks = {
    round16:       tournState?.round16Locked,
    quarterfinals: tournState?.quarterfinalsLocked,
    semifinals:    tournState?.semiFinalsLocked, // Cuartos
    semifinal:     tournState?.semifinalLocked,  // Semifinales
    third_place:   tournState?.thirdPlaceLocked, // Tercer lugar — independiente
    final:         tournState?.finalLocked,
  };
  const isActiveLocked = !!phaseLocks[activePhase];

  return (
    <div>
      <div style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'22px', fontWeight:700, marginBottom:'4px' }}>🏆 Fase Eliminatoria</h1>
        <p style={{ color:'var(--text-secondary)', fontSize:'14px' }}>
          48 equipos · 6 rondas · elige quién avanza en cada cruce
        </p>
      </div>

      {totalMatches === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'3.5rem 2rem' }}>
          <div style={{ fontSize:'56px', marginBottom:'16px' }}>⏳</div>
          <h2 style={{ fontSize:'18px', fontWeight:600, marginBottom:'8px' }}>Esperando fase de grupos</h2>
          <p style={{ color:'var(--text-secondary)', fontSize:'14px', maxWidth:400, margin:'0 auto' }}>
            Los dieciseisavos se generan automáticamente cuando terminen los 72 partidos de grupos.
          </p>
        </div>
      ) : (
        <>
          {/* Selector de fase */}
          <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'1rem' }}>
            {PHASE_CONFIG.map(phase => {
              const count = matchesByPhase[phase.key]?.length || 0;
              if (count === 0) return null;
              const locked = phaseLocks[phase.key];
              return (
                <button key={phase.key} onClick={() => setActivePhase(phase.key)}
                  className={`btn btn-sm ${activePhase === phase.key ? 'btn-primary' : 'btn-secondary'}`}>
                  {phase.label}
                  <span style={{ marginLeft:'4px', fontSize:'11px', opacity:.7 }}>({count})</span>
                  {locked && <span style={{ marginLeft:'4px' }}>🔒</span>}
                </button>
              );
            })}
          </div>

          {/* Info de puntos */}
          {(() => {
            const cfg = PHASE_CONFIG.find(p => p.key === activePhase);
            return cfg && (
              <div style={{ display:'flex', gap:'8px', marginBottom:'1rem', flexWrap:'wrap', alignItems:'center' }}>
                {/* <span className="badge badge-blue">Ganador correcto: +{cfg.pts} pts</span> */}
{/* <span className="badge badge-gold">Marcador exacto: +{cfg.pts + cfg.bonus} pts</span> */}
                {isActiveLocked && <span className="badge badge-red">🔒 Pronósticos cerrados</span>}
              </div>
            );
          })()}

          {activeMatches.length === 0 ? (
            <div className="card" style={{ textAlign:'center', padding:'2rem', color:'var(--text-secondary)' }}>
              Esta fase aún no tiene partidos
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px,1fr))', gap:'10px' }}>
              {activeMatches.map(match => (
                <MatchCard key={match._id} match={match}
                  prediction={predictions[match._id]}
                  onSave={handleSave} saving={saving[match._id]}
                  phaseLocked={isActiveLocked} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
