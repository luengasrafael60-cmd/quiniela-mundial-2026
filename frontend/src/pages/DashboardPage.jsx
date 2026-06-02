import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import { getFlagUrl, getTeam } from '../utils/teams';

function FlagImg({ teamName, size = 18 }) {
  const url = getFlagUrl(teamName, 'w40');
  const team = getTeam(teamName);
  if (!url) return <span style={{ fontSize: size + 'px' }}>{team.flag}</span>;
  return <img src={url} alt={teamName} width={Math.round(size * 1.4)} height={size}
    style={{ objectFit: 'cover', borderRadius: '3px', display: 'block', flexShrink: 0 }}
    onError={e => { e.currentTarget.style.display = 'none'; }} />;
}

function MatchRow({ match }) {
  const isLive     = match.status === 'live';
  const isFinished = match.status === 'finished';

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center', gap: '10px',
      padding: '10px 0', borderBottom: '1px solid var(--border)',
    }}>
      {/* Local */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <FlagImg teamName={match.homeTeam.name} size={16} />
        <span style={{ fontSize: '13px', fontWeight: isFinished && match.winner === 'home' ? 700 : 400 }}>
          {match.homeTeam.name}
        </span>
      </div>

      {/* Marcador / estado */}
      <div style={{ textAlign: 'center', minWidth: 90 }}>
        {isFinished ? (
          <div style={{
            background: 'var(--bg-input)', borderRadius: '8px',
            padding: '4px 10px', fontWeight: 700, fontSize: '16px',
            display: 'inline-flex', alignItems: 'center', gap: '6px',
          }}>
            <span style={{ color: match.winner === 'home' ? 'var(--green)' : 'var(--text-primary)' }}>{match.homeScore}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>–</span>
            <span style={{ color: match.winner === 'away' ? 'var(--green)' : 'var(--text-primary)' }}>{match.awayScore}</span>
          </div>
        ) : isLive ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
            <span className="dot-live" />
            <span style={{
              background: 'var(--bg-input)', borderRadius: '8px', padding: '4px 10px',
              fontWeight: 700, fontSize: '15px', color: 'var(--red)',
            }}>
              {match.homeScore ?? 0} – {match.awayScore ?? 0}
              {match.minute ? <span style={{ fontSize: '11px', marginLeft: '4px' }}>{match.minute}'</span> : null}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-input)', padding: '4px 10px', borderRadius: '8px' }}>vs</span>
        )}
        {match.group && (
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>Grupo {match.group}</div>
        )}
      </div>

      {/* Visitante */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: '13px', fontWeight: isFinished && match.winner === 'away' ? 700 : 400 }}>
          {match.awayTeam.name}
        </span>
        <FlagImg teamName={match.awayTeam.name} size={16} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, updateUser } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [tournamentState, setTournamentState] = useState(null);

  useEffect(() => {
    loadAll();
    // Refresh cada 30s si hay partidos en vivo
    const interval = setInterval(() => { loadAll(); }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const loadAll = async () => {
    try {
      const [lbRes, recentRes, stateRes, meRes] = await Promise.all([
        api.get('/leaderboard'),
        api.get('/matches/recent'),
        api.get('/predictions/state'),
        api.get('/auth/me'),
      ]);
      setLeaderboard(lbRes.data.leaderboard?.slice(0, 5) || []);
      setLiveMatches(recentRes.data.live || []);
      setRecentMatches(recentRes.data.finished || []);
      setTournamentState(stateRes.data.state);
      if (meRes.data.user) updateUser(meRes.data.user);
    } catch {}
  };

  const myRank  = leaderboard.findIndex(u => u._id === user?._id) + 1;
  const medals  = ['🥇', '🥈', '🥉'];
  const phase   = tournamentState?.currentPhase;
  const phaseLabel = { pre:'Pre-torneo', groups:'Fase de Grupos', round16:'Dieciseisavos (32→16)', quarterfinals:'Octavos (16→8)', semifinals:'Cuartos (8→4)', semifinal:'Semifinales (4→2)', final:'Final', finished:'Torneo Terminado' };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>
          ¡Hola, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          {phase ? `Torneo: ${phaseLabel[phase] || phase}` : 'Quiniela del Mundial 2026'}
        </p>
      </div>

      {/* Mis stats */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Mis puntos',  value: user?.totalPoints   || 0,   color: 'var(--accent)',   icon: '⭐' },
          { label: 'Mi posición', value: myRank ? `#${myRank}` : '–', color: 'var(--accent-2)', icon: '🏆' },
          { label: 'Aciertos',    value: user?.totalCorrect  || 0,   color: 'var(--green)',    icon: '✅' },
          { label: 'Efectividad', value: `${user?.accuracy   || 0}%`, color: 'var(--purple)',   icon: '🎯' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div style={{ fontSize: '20px' }}>{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Desglose de puntos */}
      {(user?.totalPoints || 0) > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>Desglose de mis puntos</div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {[
              { label: 'Grupos',      value: user?.groupPoints      || 0, color: 'var(--accent-2)' },
              { label: 'Eliminat.',   value: user?.knockoutPoints   || 0, color: 'var(--purple)'   },
              { label: 'Especiales',  value: user?.specialPoints    || 0, color: 'var(--accent)'   },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid-2">
        {/* Partidos */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600 }}>
              {liveMatches.length > 0 ? '🔴 En vivo' : '⚽ Últimos partidos'}
            </h2>
            <Link to="/partidos" style={{ fontSize: '13px', color: 'var(--accent)' }}>Ver todos →</Link>
          </div>

          {liveMatches.length > 0 && (
            <>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px' }}>
                🔴 En vivo ahora
              </div>
              {liveMatches.map(m => <MatchRow key={m._id} match={m} />)}
              {recentMatches.length > 0 && (
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', margin: '12px 0 4px' }}>
                  Recientes
                </div>
              )}
            </>
          )}

          {recentMatches.slice(0, liveMatches.length > 0 ? 3 : 5).map(m => <MatchRow key={m._id} match={m} />)}

          {liveMatches.length === 0 && recentMatches.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', padding: '1.5rem 0' }}>
              Los partidos aparecerán aquí cuando inicien
            </p>
          )}
        </div>

        {/* Top 5 */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600 }}>🏆 Top jugadores</h2>
            <Link to="/tabla" style={{ fontSize: '13px', color: 'var(--accent)' }}>Ver ranking →</Link>
          </div>
          {leaderboard.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', padding: '1.5rem 0' }}>
              Aún no hay puntos. ¡Haz tus pronósticos!
            </p>
          )}
          {leaderboard.map((p, i) => {
            const isMe = p._id === user?._id;
            return (
              <div key={p._id} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 0', borderBottom: i < leaderboard.length - 1 ? '1px solid var(--border)' : 'none',
                background: isMe ? 'transparent' : 'transparent',
              }}>
                <span style={{ fontSize: i < 3 ? '18px' : '13px', fontWeight: 600, minWidth: '24px', textAlign: 'center' }}>
                  {medals[i] || i + 1}
                </span>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  background: isMe ? 'var(--accent-dim)' : 'var(--bg-input)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, color: isMe ? 'var(--accent)' : 'var(--text-secondary)',
                }}>
                  {p.name?.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: isMe ? 700 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name} {isMe && <span style={{ color: 'var(--accent)', fontSize: '11px' }}>(tú)</span>}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {p.totalCorrect || 0} aciertos · {p.accuracy || 0}%
                  </div>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: i === 0 ? 'var(--accent)' : 'var(--text-primary)' }}>
                  {p.totalPoints}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div style={{ marginTop: '1.5rem', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {(!tournamentState?.groupPredictionsLocked) && (
          <Link to="/grupos" className="btn btn-primary">🏟️ Llenar grupos</Link>
        )}
        {(!tournamentState?.specialsLocked) && (
          <Link to="/especiales" className="btn btn-secondary">⭐ Pronósticos especiales</Link>
        )}
        {tournamentState?.bracketGenerated && (
          <Link to="/eliminatoria" className="btn btn-secondary">🏆 Ver bracket</Link>
        )}
        <Link to="/tablas" className="btn btn-secondary">📊 Tablas de grupos</Link>
        <Link to="/mis-grupos" className="btn btn-secondary">👥 Mis grupos</Link>
      </div>
    </div>
  );
}
