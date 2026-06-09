import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import { getFlagUrl, getTeam } from '../utils/teams';

const MEDALS   = ['🥇','🥈','🥉'];
const P_LABEL  = { groups:'Grupos', round16:'Octavos', quarterfinals:'Cuartos', semifinals:'Semis', third_place:'3er Lugar', final:'Final' };

function Avatar({ user, size = 36 }) {
  const initials = user?.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()||'?';
  if (user?.avatar) return <img src={user.avatar} alt={user.name} width={size} height={size}
    style={{ borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />;
  return <div style={{ width:size, height:size, borderRadius:'50%', flexShrink:0, background:'var(--accent-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:Math.round(size*.33)+'px', fontWeight:700, color:'var(--accent)' }}>{initials}</div>;
}

function FlagImg({ teamName, size=15 }) {
  const url = getFlagUrl(teamName, 'w40');
  const team = getTeam(teamName);
  if (!url) return <span style={{ fontSize:size+'px' }}>{team.flag}</span>;
  return <img src={url} alt={teamName} width={Math.round(size*1.4)} height={size}
    style={{ objectFit:'cover', borderRadius:'2px', display:'block', flexShrink:0 }}
    onError={e=>{e.currentTarget.style.display='none'}} />;
}

function MemberPredictions({ groupId, member, onClose }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/predictions/breakdown/' + member.user._id)
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [member]);

  const PHASE_LABEL = { round16:'Dieciseisavos', quarterfinals:'Octavos', semifinals:'Cuartos', semifinal:'Semifinales', third_place:'3er Lugar', final:'Final' };
  const PHASE_ORDER = ['round16','quarterfinals','semifinals','semifinal','third_place','final'];

  const statusIcon = (s) => s==='exact' ? '🎯' : s==='correct'||s==='classified' ? '✅' : s==='wrong' ? '❌' : '🟡';
  const statusColor = (s) => s==='exact'||s==='correct'||s==='classified' ? 'var(--green)' : s==='wrong' ? 'var(--red)' : 'var(--text-muted)';
  const statusLabel = (s) => s==='exact' ? 'Posición exacta' : s==='classified' ? 'Clasificó' : s==='correct' ? 'Correcto' : s==='wrong' ? 'Falló' : 'Pendiente';

  // Points by section
  const groupPts    = data?.groupBreakdown?.reduce((s,g)=>s+(g.pointsEarned||0),0)||0;
  const thirdPts    = data?.thirdsBreakdown?.filter(t=>t.status==='correct').length||0;
  const koPts       = Object.values(data?.byPhase||{}).flat().reduce((s,p)=>s+(p.pointsEarned||0),0);
  const specialPts  = (data?.special?.pointsEarned)||0;
  const totalPts    = member.points || 0;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:1000, overflowY:'auto', padding:'1.5rem 1rem' }}>
      <div style={{ maxWidth:660, margin:'0 auto' }}>
        {/* Header */}
        <div className="card" style={{ marginBottom:'1rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <Avatar user={member.user} size={44} />
              <div>
                <div style={{ fontWeight:700, fontSize:'16px' }}>{member.user.name}</div>
                <div style={{ fontSize:'13px', color:'var(--accent)' }}>#{member.rank} · {member.points} pts totales</div>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>✕ Cerrar</button>
          </div>
          {/* Points summary */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(90px,1fr))', gap:'8px' }}>
            {[
              { l:'Grupos',      v:groupPts,   c:'var(--accent-2)' },
              { l:'Terceros',    v:thirdPts,   c:'var(--accent)'   },
              { l:'Eliminat.',   v:koPts,      c:'var(--purple)'   },
              { l:'Especiales',  v:specialPts, c:'var(--green)'    },
              { l:'TOTAL',       v:totalPts,   c:'var(--accent)',  big:true },
            ].map(s => (
              <div key={s.l} style={{ textAlign:'center', padding:'8px', background:'var(--bg-input)', borderRadius:'8px', border:s.big?'1px solid var(--accent)':'none' }}>
                <div style={{ fontSize: s.big?'22px':'18px', fontWeight:800, color:s.c, lineHeight:1 }}>{s.v}</div>
                <div style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:'3px' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="card" style={{ textAlign:'center', padding:'2rem', color:'var(--text-secondary)' }}>Cargando picks...</div>
        ) : !data ? (
          <div className="card" style={{ textAlign:'center', padding:'2rem', color:'var(--text-secondary)' }}>Sin datos</div>
        ) : (
          <>
            {/* ── FASE DE GRUPOS ── */}
            {data.groupBreakdown?.length > 0 && (
              <div className="card" style={{ marginBottom:'1rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                  <div style={{ fontWeight:700, fontSize:'14px' }}>🏟️ Fase de Grupos</div>
                  <span className="badge badge-gold">{groupPts} pts</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px,1fr))', gap:'6px' }}>
                  {data.groupBreakdown.map(g => (
                    <div key={g.group} style={{ background:'var(--bg-input)', borderRadius:'8px', padding:'8px' }}>
                      <div style={{ fontSize:'11px', color:'var(--accent)', fontWeight:700, marginBottom:'6px' }}>Grupo {g.group} · {g.pointsEarned||0}pts</div>
                      {[['first','1°',g.firstStatus],['second','2°',g.secondStatus]].map(([key,lbl,st]) => (
                        g[key] ? (
                          <div key={key} style={{ display:'flex', alignItems:'center', gap:'4px', marginBottom:'3px', fontSize:'12px' }}>
                            <span style={{ fontSize:'12px' }}>{statusIcon(st)}</span>
                            <FlagImg teamName={g[key]} size={11} />
                            <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, color:statusColor(st) }}>{g[key]}</span>
                            <span style={{ fontSize:'10px', color:'var(--text-muted)' }}>{lbl}</span>
                          </div>
                        ) : null
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── MEJORES TERCEROS ── */}
            {data.thirdsBreakdown?.length > 0 && (
              <div className="card" style={{ marginBottom:'1rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                  <div style={{ fontWeight:700, fontSize:'14px' }}>🥉 Mejores Terceros</div>
                  <span className="badge badge-gold">{thirdPts} pts</span>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                  {data.thirdsBreakdown.map(t => {
                    const team = getTeam(t.name);
                    return (
                      <div key={t.name} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'5px 10px', borderRadius:'20px', background:team.primary+'22', border:'1px solid '+team.primary+'33', fontSize:'12px' }}>
                        <span>{statusIcon(t.status)}</span>
                        <FlagImg teamName={t.name} size={12} />
                        <span style={{ color:statusColor(t.status), fontWeight:500 }}>{t.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── FASES ELIMINATORIAS ── */}
            {PHASE_ORDER.filter(p => data.byPhase?.[p]?.length > 0).map(phase => {
              const preds = data.byPhase[phase];
              const phasePts = preds.reduce((s,p)=>s+(p.pointsEarned||0),0);
              return (
                <div key={phase} className="card" style={{ marginBottom:'1rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                    <div style={{ fontWeight:700, fontSize:'14px' }}>🏆 {PHASE_LABEL[phase]||phase}</div>
                    <span className="badge badge-gold">{phasePts} pts</span>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                    {preds.map((p,i) => {
                      const pending = p.status !== 'finished';
                      const winnerName = p.realWinner === 'home' ? p.homeTeam : p.awayTeam;
                      const myPickName = p.predictedWinner === 'home' ? p.homeTeam : p.awayTeam;
                      const st = pending ? 'pending' : p.correct ? (p.exact ? 'exact' : 'correct') : 'wrong';
                      return (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 10px', borderRadius:'8px', background:'var(--bg-input)', border:'1px solid '+(st==='exact'?'rgba(245,158,11,.3)':st==='correct'?'rgba(16,185,129,.2)':st==='wrong'?'rgba(239,68,68,.2)':'transparent') }}>
                          <span style={{ fontSize:'14px' }}>{statusIcon(st)}</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'2px' }}>
                              {p.homeTeam} vs {p.awayTeam}
                            </div>
                            <div style={{ fontSize:'13px', fontWeight:500, color:statusColor(st) }}>
                              {pending ? ('Mi pick: ' + (myPickName||'–'))
                                : p.correct ? (p.exact ? ('Exacto ' + p.realHome + '-' + p.realAway) : ('Ganó ' + winnerName))
                                : ('Ganó ' + winnerName + ' · Mi pick: ' + (myPickName||'–'))}
                            </div>
                          </div>
                          {!pending && (
                            <span className={'badge ' + (p.exact?'badge-gold':p.correct?'badge-green':'badge-red')} style={{ fontSize:'11px' }}>
                              {p.exact?'🎯 ':p.correct?'✓ ':'✗ '}{p.pointsEarned>0?'+'+p.pointsEarned:'0'} pts
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* ── ESPECIALES ── */}
            {data.special?.champion && (
              <div className="card" style={{ marginBottom:'1rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                  <div style={{ fontWeight:700, fontSize:'14px' }}>⭐ Pronósticos Especiales</div>
                  <span className="badge badge-gold">{specialPts} pts</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
                  {[
                    { l:'🥇 Campeón', v:data.special.champion },
                    { l:'🥈 Subcampeón', v:data.special.runnerUp },
                    { l:'🥉 Tercer lugar', v:data.special.thirdPlace },
                    { l:'4° Cuarto', v:data.special.fourthPlace },
                  ].filter(s=>s.v).map(s => (
                    <div key={s.l} style={{ background:'var(--bg-input)', borderRadius:'8px', padding:'8px' }}>
                      <div style={{ fontSize:'11px', color:'var(--text-muted)', marginBottom:'4px' }}>{s.l}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', fontWeight:500 }}>
                        <FlagImg teamName={s.v} size={13} />
                        <span>{s.v}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!data.groupBreakdown?.length && !Object.keys(data.byPhase||{}).length && (
              <div className="card" style={{ textAlign:'center', padding:'2rem', color:'var(--text-secondary)' }}>Aún no tiene predicciones.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


export default function GroupDetailPage() {
  const { id }       = useParams();
  const { user }     = useAuthStore();
  const navigate     = useNavigate();
  const [group,      setGroup]    = useState(null);
  const [standings,  setStandings]= useState([]);
  const [loading,    setLoading]  = useState(true);
  const [tab,        setTab]      = useState('tabla');
  const [selected,   setSelected] = useState(null);
  const [leaving,    setLeaving]  = useState(false);

  const load = useCallback(async () => {
    try {
      const [gRes, sRes] = await Promise.all([
        api.get(`/quiniela-groups/${id}`),
        api.get(`/quiniela-groups/${id}/standings`),
      ]);
      setGroup(gRes.data.group);
      setStandings(sRes.data.standings || []);
    } catch {
      toast.error('Error al cargar el grupo');
      navigate('/mis-grupos');
    } finally { setLoading(false); }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  const handleLeave = async () => {
    if (!confirm(`¿Salir del grupo "${group.name}"?`)) return;
    setLeaving(true);
    try { await api.delete(`/quiniela-groups/${id}/leave`); toast.success('Saliste del grupo'); navigate('/mis-grupos'); }
    catch (err) { toast.error(err.response?.data?.error||'Error'); setLeaving(false); }
  };

  const handleKick = async (memberId, name) => {
    if (!confirm(`¿Eliminar a ${name}?`)) return;
    try { await api.delete(`/quiniela-groups/${id}/kick/${memberId}`); toast.success('Eliminado'); load(); }
    catch (err) { toast.error(err.response?.data?.error||'Error'); }
  };

  const copyCode = () => { navigator.clipboard.writeText(group.code); toast.success('Código copiado'); };

  if (loading) return <div style={{ textAlign:'center', padding:'4rem', color:'var(--text-secondary)' }}>Cargando...</div>;
  if (!group) return null;

  const me      = standings.find(s => s.isMe);
  const isAdmin = group.createdBy?._id === user?._id || group.createdBy === user?._id
    || group.members?.some(m => m.user?._id === user?._id && m.role === 'admin');
  const maxPts  = standings[0]?.points || 1;

  return (
    <div>
      {selected && <MemberPredictions groupId={id} member={selected} onClose={() => setSelected(null)} />}

      <div style={{ fontSize:'13px', color:'var(--text-secondary)', marginBottom:'1rem' }}>
        <Link to="/mis-grupos" style={{ color:'var(--accent)' }}>👥 Mis grupos</Link> › {group.name}
      </div>

      {/* Header */}
      <div className="card" style={{ marginBottom:'1.5rem' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:'16px', flexWrap:'wrap' }}>
          <div style={{ width:56, height:56, borderRadius:'14px', background:'var(--accent-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', flexShrink:0 }}>👥</div>
          <div style={{ flex:1, minWidth:0 }}>
            <h1 style={{ fontSize:'20px', fontWeight:700, marginBottom:'4px' }}>{group.name}</h1>
            {group.description && <p style={{ fontSize:'14px', color:'var(--text-secondary)', marginBottom:'8px' }}>{group.description}</p>}
            <div style={{ display:'flex', gap:'16px', flexWrap:'wrap', fontSize:'13px', color:'var(--text-secondary)' }}>
              <span>👥 {group.members?.length}/{group.maxMembers}</span>
              {me && <span style={{ color:'var(--accent)', fontWeight:600 }}>#{me.rank} · {me.points} pts</span>}
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px', alignItems:'flex-end' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 12px', background:'var(--bg-input)', borderRadius:'10px', cursor:'pointer' }} onClick={copyCode}>
              <span style={{ fontSize:'12px', color:'var(--text-muted)' }}>Código</span>
              <span style={{ fontSize:'16px', fontWeight:800, letterSpacing:'.15em' }}>{group.code}</span>
              <span>📋</span>
            </div>
            <div style={{ display:'flex', gap:'6px' }}>
              <button className="btn btn-danger btn-sm" onClick={handleLeave} disabled={leaving}>🚪 Salir</button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'4px', borderBottom:'1px solid var(--border)', marginBottom:'1.5rem' }}>
        {[['tabla','🏆 Tabla'],['miembros','👥 Miembros']].map(([k,l]) => (
          <button key={k} onClick={()=>setTab(k)} style={{
            padding:'8px 16px', background:'none', border:'none', cursor:'pointer',
            borderBottom:`2px solid ${tab===k?'var(--accent)':'transparent'}`,
            color:tab===k?'var(--accent)':'var(--text-secondary)',
            fontWeight:tab===k?600:400, fontSize:'14px', marginBottom:'-1px',
          }}>{l}</button>
        ))}
      </div>

      {/* Tabla de posiciones */}
      {tab === 'tabla' && (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          {standings.length === 0 ? (
            <div style={{ padding:'3rem', textAlign:'center', color:'var(--text-secondary)' }}>Sin jugadores con puntos aún.</div>
          ) : (
            <table className="table">
              <thead><tr>
                <th style={{ width:44 }}>#</th>
                <th>Jugador</th>
                <th style={{ textAlign:'right' }}>Puntos</th>
                <th style={{ textAlign:'right' }}>Grupos</th>
                <th style={{ textAlign:'right' }}>Eliminat.</th>
                <th style={{ textAlign:'right' }}>Aciertos</th>
                <th style={{ textAlign:'right' }}>%</th>
                <th style={{ minWidth:100 }}>Progreso</th>
                <th style={{ width:80 }}></th>
              </tr></thead>
              <tbody>
                {standings.map((s, i) => {
                  const pct = Math.round((s.points / maxPts) * 100);
                  return (
                    <tr key={s.user._id} style={{ background:s.isMe?'rgba(245,158,11,.05)':'transparent' }}>
                      <td><span style={{ fontSize:i<3?'18px':'14px', fontWeight:600 }}>{MEDALS[i]||i+1}</span></td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                          <Avatar user={s.user} size={30} />
                          <div>
                            <div style={{ fontSize:'13px', fontWeight:s.isMe?700:400 }}>
                              {s.user.name}
                              {s.isMe && <span style={{ color:'var(--accent)', fontSize:'11px', marginLeft:'4px' }}>(tú)</span>}
                            </div>
                            {s.user.username && <div style={{ fontSize:'11px', color:'var(--text-muted)' }}>@{s.user.username}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign:'right', fontWeight:700, fontSize:'15px', color:i===0?'var(--accent)':'var(--text-primary)' }}>{s.points}</td>
                      <td style={{ textAlign:'right', fontSize:'13px', color:'var(--text-secondary)' }}>{s.user.groupPoints||0}</td>
                      <td style={{ textAlign:'right', fontSize:'13px', color:'var(--text-secondary)' }}>{s.user.knockoutPoints||0}</td>
                      <td style={{ textAlign:'right', fontSize:'13px', color:'var(--text-secondary)' }}>{s.user.totalCorrect||0}</td>
                      <td style={{ textAlign:'right', fontSize:'13px', color:s.user.accuracy>50?'var(--green)':'var(--text-secondary)' }}>{s.user.accuracy||0}%</td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                          <div style={{ flex:1, height:4, background:'var(--bg-input)', borderRadius:99, overflow:'hidden' }}>
                            <div style={{ width:`${pct}%`, height:'100%', borderRadius:99, background:i===0?'var(--accent)':'var(--accent-2)', transition:'width .4s' }} />
                          </div>
                          <span style={{ fontSize:'10px', color:'var(--text-muted)', minWidth:24 }}>{pct}%</span>
                        </div>
                      </td>
                      <td>
                        {s.isMe && (
                          <button className="btn btn-ghost btn-sm" style={{ fontSize:'12px' }} onClick={() => setSelected(s)}>Mis picks</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Miembros */}
      {tab === 'miembros' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:'10px' }}>
          {standings.map((s, i) => (
            <div key={s.user._id} className="card card-sm" style={{ borderColor:s.isMe?'var(--accent)':'var(--border)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
                <Avatar user={s.user} size={40} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:'14px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {s.user.name} {s.isMe && <span style={{ color:'var(--accent)', fontSize:'11px' }}>(tú)</span>}
                  </div>
                  <div style={{ fontSize:'11px', color:'var(--text-muted)' }}>
                    {s.role==='admin'?'⚙️ Admin':'Miembro'} · {new Date(s.joinedAt).toLocaleDateString('es-MX',{day:'numeric',month:'short'})}
                  </div>
                </div>
                <span style={{ fontSize:i<3?'20px':'13px', fontWeight:600 }}>{MEDALS[i]||`#${i+1}`}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                <div>
                  <span style={{ fontSize:'22px', fontWeight:800, color:i===0?'var(--accent)':'var(--text-primary)' }}>{s.points}</span>
                  <span style={{ fontSize:'12px', color:'var(--text-secondary)', marginLeft:'4px' }}>pts</span>
                </div>
                <div style={{ fontSize:'12px', color:'var(--text-secondary)', textAlign:'right' }}>
                  <div>{s.user.totalCorrect||0} aciertos</div>
                  <div>{s.user.accuracy||0}% efectividad</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:'6px' }}>
                {/* <button className="btn btn-ghost btn-sm" style={{ fontSize:'12px', flex:1 }} onClick={()=>setSelected(s)}>Ver picks</button> */}
                {isAdmin && !s.isMe && (
                  <button className="btn btn-danger btn-sm" style={{ fontSize:'12px' }} onClick={()=>handleKick(s.user._id, s.user.name)}>✕</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
