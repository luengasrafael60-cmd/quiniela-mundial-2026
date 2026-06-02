import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../utils/api';

const MEDALS  = ['🥇','🥈','🥉'];
const PHASES  = ['groups','round16','quarterfinals','semifinals','third_place','final'];
const P_LABEL = { groups:'Grupos', round16:'16avos', quarterfinals:'Octavos', semifinals:'Cuartos', third_place:'3er Lugar', final:'Final' };

function Avatar({ user, size = 34 }) {
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || '?';
  if (user?.avatar) return <img src={user.avatar} alt={user.name} width={size} height={size}
    style={{ borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'var(--accent-dim)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: Math.round(size * .33) + 'px',
      fontWeight: 700, color: 'var(--accent)',
    }}>{initials}</div>
  );
}

function StatPill({ label, value, color = 'var(--text-secondary)' }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 12px', background: 'var(--bg-input)', borderRadius: '10px' }}>
      <div style={{ fontSize: '18px', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>{label}</div>
    </div>
  );
}

/* ── Vista: ranking global ── */
function GlobalTab({ board, user, loading }) {
  const [expanded, setExpanded] = useState(null);
  const maxPts = board[0]?.totalPoints || 1;

  if (loading) return <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-secondary)' }}>Cargando...</div>;

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {board.map((p, i) => {
        const isMe  = p._id === user?._id;
        const pct   = Math.round((p.totalPoints / maxPts) * 100);
        const isOpen = expanded === p._id;

        return (
          <div key={p._id}>
            <div onClick={() => setExpanded(isOpen ? null : p._id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', cursor: 'pointer',
                borderBottom: '1px solid var(--border)',
                background: isMe ? 'rgba(245,158,11,0.05)' : 'transparent',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => { if (!isMe) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
              onMouseLeave={e => { if (!isMe) e.currentTarget.style.background = 'transparent'; }}
            >
              {/* Posición */}
              <div style={{ minWidth: 32, textAlign: 'center' }}>
                <span style={{ fontSize: i < 3 ? '20px' : '14px', fontWeight: 600 }}>
                  {MEDALS[i] || i + 1}
                </span>
              </div>

              {/* Avatar + nombre */}
              <Avatar user={p} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: isMe ? 700 : 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {p.name}
                  {isMe && <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>(tú)</span>}
                  {p.username && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>@{p.username}</span>}
                </div>
                {/* Barra de progreso */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <div style={{ flex: 1, height: 4, background: 'var(--bg-input)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: i === 0 ? 'var(--accent)' : 'var(--accent-2)', transition: 'width .4s' }} />
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: 28 }}>{pct}%</span>
                </div>
              </div>

              {/* Puntos */}
              <div style={{ textAlign: 'right', minWidth: 52 }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: i === 0 ? 'var(--accent)' : 'var(--text-primary)', lineHeight: 1 }}>{p.totalPoints}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>pts</div>
              </div>

              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{isOpen ? '▲' : '▼'}</span>
            </div>

            {/* Panel expandido con stats */}
            {isOpen && (
              <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                  <StatPill label="Grupos" value={p.groupPoints || 0} color="var(--accent-2)" />
                  <StatPill label="Eliminat." value={p.knockoutPoints || 0} color="var(--purple)" />
                  <StatPill label="Especiales" value={p.specialPoints || 0} color="var(--accent)" />
                  <StatPill label="Aciertos" value={p.totalCorrect || 0} color="var(--green)" />
                  <StatPill label="Exactos" value={p.exactScorePoints || 0} color="var(--accent)" />
                  <StatPill label="Efectividad" value={`${p.accuracy || 0}%`} />
                </div>
                {!isMe && (
                  <Link to={`/comparar/${p._id}`} className="btn btn-secondary btn-sm">
                    ⚔️ Comparar conmigo
                  </Link>
                )}
              </div>
            )}
          </div>
        );
      })}
      {board.length === 0 && !loading && (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Nadie tiene puntos todavía. ¡Sé el primero en acertar!
        </div>
      )}
    </div>
  );
}

/* ── Vista: historial por fase ── */
function HistoryTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/leaderboard/history').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-secondary)' }}>Cargando historial...</div>;
  if (!data || data.history?.length === 0) return (
    <div className="card" style={{ textAlign:'center', padding:'3rem', color:'var(--text-secondary)' }}>
      Aún no hay historial de puntos.
    </div>
  );

  const phases   = data.phases?.filter(p => data.history.some(h => h.byPhase[p] > 0)) || [];
  const maxTotal = Math.max(...data.history.map(h => Object.values(h.byPhase).reduce((a,b) => a+b, 0)), 1);

  return (
    <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
      <table className="table" style={{ minWidth: 500 }}>
        <thead>
          <tr>
            <th>Jugador</th>
            {phases.map(p => <th key={p} style={{ textAlign: 'center', minWidth: 70 }}>{P_LABEL[p]}</th>)}
            <th style={{ textAlign: 'right' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {data.history
            .sort((a,b) => Object.values(b.byPhase).reduce((x,y)=>x+y,0) - Object.values(a.byPhase).reduce((x,y)=>x+y,0))
            .map((h, i) => {
              const total = Object.values(h.byPhase).reduce((a,b) => a+b, 0);
              const pct   = Math.round((total / maxTotal) * 100);
              return (
                <tr key={h.user._id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <Avatar user={h.user} size={28} />
                      <div>
                        <div style={{ fontSize:'13px', fontWeight:500 }}>{h.user.name}</div>
                        {h.user.username && <div style={{ fontSize:'11px', color:'var(--text-muted)' }}>@{h.user.username}</div>}
                      </div>
                    </div>
                  </td>
                  {phases.map(p => (
                    <td key={p} style={{ textAlign:'center', fontSize:'13px', fontWeight: h.byPhase[p] > 0 ? 600 : 400, color: h.byPhase[p] > 0 ? 'var(--green)' : 'var(--text-muted)' }}>
                      {h.byPhase[p] > 0 ? `+${h.byPhase[p]}` : '–'}
                    </td>
                  ))}
                  <td style={{ textAlign:'right', fontWeight:700, fontSize:'15px', color:'var(--accent)' }}>{total}</td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Página principal ── */
export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [board,   setBoard]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('global');

  useEffect(() => {
    api.get('/leaderboard').then(r => {
      setBoard(r.data.leaderboard || []);
      setLoading(false);
    });
  }, []);

  const myIdx  = board.findIndex(u => u._id === user?._id);
  const me     = myIdx >= 0 ? board[myIdx] : null;
  const maxPts = board[0]?.totalPoints || 1;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>🏆 Tabla General</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Ranking en tiempo real · {board.length} participantes</p>
      </div>

      {/* Mi posición */}
      {me && (
        <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'rgba(245,158,11,0.3)', background: 'var(--accent-dim)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'16px', flexWrap:'wrap' }}>
            <div style={{ fontSize:'36px', minWidth:48, textAlign:'center' }}>
              {MEDALS[myIdx] || `#${myIdx+1}`}
            </div>
            <Avatar user={me} size={44} />
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:'16px', marginBottom:'4px' }}>Tu posición</div>
              <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', fontSize:'13px', color:'var(--text-secondary)' }}>
                <span>🎯 {me.accuracy || 0}% efectividad</span>
                <span>✅ {me.totalCorrect || 0} aciertos</span>
                <span>📝 {me.totalPredictions || 0} predicciones</span>
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:'32px', fontWeight:800, color:'var(--accent)', lineHeight:1 }}>{me.totalPoints}</div>
              <div style={{ fontSize:'12px', color:'var(--text-muted)' }}>puntos totales</div>
            </div>
          </div>

          {/* Desglose de mis puntos */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(90px,1fr))', gap:'8px', marginTop:'12px' }}>
            <StatPill label="Grupos"    value={me.groupPoints    || 0} color="var(--accent-2)"  />
            <StatPill label="Eliminat." value={me.knockoutPoints || 0} color="var(--purple)"     />
            <StatPill label="Especiales"value={me.specialPoints  || 0} color="var(--accent)"     />
            <StatPill label="Aciertos"  value={me.totalCorrect   || 0} color="var(--green)"      />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:'4px', borderBottom:'1px solid var(--border)', marginBottom:'1.5rem' }}>
        {[['global','🌍 Ranking'],['historia','📈 Por fase']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding:'8px 16px', background:'none', border:'none', cursor:'pointer',
            borderBottom:`2px solid ${tab===k ? 'var(--accent)' : 'transparent'}`,
            color: tab===k ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: tab===k ? 600 : 400, fontSize:'14px', marginBottom:'-1px',
          }}>{l}</button>
        ))}
      </div>

      {tab === 'global'   && <GlobalTab  board={board} user={user} loading={loading} />}
      {tab === 'historia' && <HistoryTab />}
    </div>
  );
}
