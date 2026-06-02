import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { getFlagUrl, getTeam } from '../utils/teams';

const P_LABEL = { groups:'Grupos', round16:'Octavos', quarterfinals:'Cuartos', semifinals:'Semis', third_place:'3er Lugar', final:'Final' };

function Avatar({ user, size = 48 }) {
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || '?';
  if (user?.avatar) return <img src={user.avatar} alt={user.name} width={size} height={size}
    style={{ borderRadius:'50%', objectFit:'cover', flexShrink:0, border:'2px solid var(--border)' }} />;
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', flexShrink:0,
      background:'var(--accent-dim)', display:'flex', alignItems:'center',
      justifyContent:'center', fontSize:Math.round(size*.33)+'px',
      fontWeight:700, color:'var(--accent)', border:'2px solid var(--accent)',
    }}>{initials}</div>
  );
}

function FlagImg({ teamName, size=16 }) {
  const url = getFlagUrl(teamName, 'w40');
  const team = getTeam(teamName);
  if (!url) return <span style={{ fontSize:size+'px' }}>{team.flag}</span>;
  return <img src={url} alt={teamName} width={Math.round(size*1.4)} height={size}
    style={{ objectFit:'cover', borderRadius:'3px', display:'block', flexShrink:0 }}
    onError={e=>{e.currentTarget.style.display='none'}} />;
}

export default function ComparisonPage() {
  const { userId } = useParams();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/leaderboard/compare/${userId}`)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  if (loading) return <div style={{ textAlign:'center', padding:'4rem', color:'var(--text-secondary)' }}>Cargando comparación...</div>;
  if (!data)   return <div style={{ textAlign:'center', padding:'4rem', color:'var(--text-secondary)' }}>No se pudo cargar la comparación.</div>;

  const { me, other, comparison } = data;
  const myWins    = comparison.filter(c => (c.me.pointsEarned || 0) > (c.other.pointsEarned || 0)).length;
  const otherWins = comparison.filter(c => (c.other.pointsEarned || 0) > (c.me.pointsEarned || 0)).length;
  const ties      = comparison.filter(c => (c.me.pointsEarned || 0) === (c.other.pointsEarned || 0) && c.me.correct != null).length;

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ fontSize:'13px', color:'var(--text-secondary)', marginBottom:'1rem' }}>
        <Link to="/tabla" style={{ color:'var(--accent)' }}>🏆 Tabla</Link>
        <span style={{ margin:'0 6px' }}>›</span>
        Comparación
      </div>

      <h1 style={{ fontSize:'22px', fontWeight:700, marginBottom:'1.5rem' }}>⚔️ Comparación cara a cara</h1>

      {/* Cabecera: tú vs él */}
      <div className="card" style={{ marginBottom:'1.5rem' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center', gap:'16px' }}>
          {/* Yo */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}>
            <Avatar user={me} size={52} />
            <div style={{ fontWeight:700, fontSize:'15px', textAlign:'center' }}>{me.name}</div>
            <div style={{ fontSize:'28px', fontWeight:800, color:'var(--accent)', lineHeight:1 }}>{me.totalPoints}</div>
            <div style={{ fontSize:'12px', color:'var(--text-muted)' }}>puntos</div>
          </div>

          {/* VS + marcador */}
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'13px', color:'var(--text-muted)', marginBottom:'8px' }}>en partidos compartidos</div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', justifyContent:'center' }}>
              <span style={{ fontSize:'22px', fontWeight:800, color: myWins >= otherWins ? 'var(--green)' : 'var(--text-secondary)' }}>{myWins}</span>
              <span style={{ fontSize:'14px', color:'var(--text-muted)' }}>VS</span>
              <span style={{ fontSize:'22px', fontWeight:800, color: otherWins > myWins ? 'var(--green)' : 'var(--text-secondary)' }}>{otherWins}</span>
            </div>
            <div style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:'4px' }}>{ties} empates</div>
          </div>

          {/* Otro */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}>
            <Avatar user={other} size={52} />
            <div style={{ fontWeight:700, fontSize:'15px', textAlign:'center' }}>{other.name}</div>
            <div style={{ fontSize:'28px', fontWeight:800, color:'var(--accent-2)', lineHeight:1 }}>{other.totalPoints}</div>
            <div style={{ fontSize:'12px', color:'var(--text-muted)' }}>puntos</div>
          </div>
        </div>
      </div>

      {/* Partidos comparados */}
      {comparison.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'2.5rem', color:'var(--text-secondary)' }}>
          Aún no hay partidos finalizados en común para comparar.
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {comparison.map((c, i) => {
            const myBetter    = (c.me.pointsEarned || 0) > (c.other.pointsEarned || 0);
            const otherBetter = (c.other.pointsEarned || 0) > (c.me.pointsEarned || 0);
            return (
              <div key={i} className="card card-sm" style={{
                borderColor: myBetter ? 'rgba(16,185,129,0.3)' : otherBetter ? 'rgba(59,130,246,0.3)' : 'var(--border)',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
                  <FlagImg teamName={c.match.homeTeam.name} size={14} />
                  <span style={{ fontSize:'12px', color:'var(--text-secondary)' }}>{c.match.homeTeam.name}</span>
                  <span style={{ fontWeight:700, fontSize:'13px', padding:'2px 8px', background:'var(--bg-input)', borderRadius:'6px' }}>
                    {c.match.homeScore} – {c.match.awayScore}
                  </span>
                  <span style={{ fontSize:'12px', color:'var(--text-secondary)' }}>{c.match.awayTeam.name}</span>
                  <FlagImg teamName={c.match.awayTeam.name} size={14} />
                  <span className="badge badge-silver" style={{ marginLeft:'auto', fontSize:'10px' }}>{P_LABEL[c.match.phase] || c.match.phase}</span>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:'8px', alignItems:'center' }}>
                  {/* Mi pronóstico */}
                  <div style={{ textAlign:'center', padding:'6px', borderRadius:'8px',
                    background: c.me.correct ? 'var(--green-dim)' : 'var(--red-dim)',
                    border: `1px solid ${c.me.correct ? 'rgba(16,185,129,.3)' : 'rgba(239,68,68,.3)'}`,
                  }}>
                    <div style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'2px' }}>Tú</div>
                    <div style={{ fontSize:'13px', fontWeight:600 }}>
                      {c.me.predictedHomeScore ?? '?'} – {c.me.predictedAwayScore ?? '?'}
                    </div>
                    <div style={{ fontSize:'12px', color: c.me.correct ? 'var(--green)' : 'var(--red)', fontWeight:600 }}>
                      {c.me.correct ? `✓ +${c.me.pointsEarned}pts` : '✗ 0pts'}
                    </div>
                  </div>

                  <span style={{ fontSize:'11px', color:'var(--text-muted)', textAlign:'center' }}>vs</span>

                  {/* Su pronóstico */}
                  <div style={{ textAlign:'center', padding:'6px', borderRadius:'8px',
                    background: c.other.correct ? 'var(--green-dim)' : 'var(--red-dim)',
                    border: `1px solid ${c.other.correct ? 'rgba(16,185,129,.3)' : 'rgba(239,68,68,.3)'}`,
                  }}>
                    <div style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'2px' }}>{other.name?.split(' ')[0]}</div>
                    <div style={{ fontSize:'13px', fontWeight:600 }}>
                      {c.other.predictedHomeScore ?? '?'} – {c.other.predictedAwayScore ?? '?'}
                    </div>
                    <div style={{ fontSize:'12px', color: c.other.correct ? 'var(--green)' : 'var(--red)', fontWeight:600 }}>
                      {c.other.correct ? `✓ +${c.other.pointsEarned}pts` : '✗ 0pts'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
