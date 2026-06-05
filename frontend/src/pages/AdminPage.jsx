import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { getFlagUrl, getTeam, GROUPS_DATA, ALL_TEAMS } from '../utils/teams';

const PHASE_LABEL = { round16:'Dieciseisavos', quarterfinals:'Octavos', semifinals:'Cuartos', semifinal:'Semifinales', third_place:'3er Lugar', final:'Final' };
const PHASE_ORDER = ['round16','quarterfinals','semifinals','semifinal','third_place','final'];
const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

function FlagImg({ teamName, size=15 }) {
  const url = getFlagUrl(teamName, 'w40');
  const team = getTeam(teamName);
  if (!url) return <span style={{ fontSize:size+'px' }}>{team.flag}</span>;
  return <img src={url} alt={teamName} width={Math.round(size*1.4)} height={size}
    style={{ objectFit:'cover', borderRadius:'2px', display:'block', flexShrink:0 }}
    onError={e=>{e.currentTarget.style.display='none'}} />;
}

function StatCard({ icon, label, value, color='var(--accent)', sub }) {
  return (
    <div className="stat-card">
      <div style={{ fontSize:'22px' }}>{icon}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:'2px' }}>{sub}</div>}
    </div>
  );
}

/* ── Tab Partidos ── */
function MatchesTab() {
  const [matches,  setMatches]  = useState([]);
  const [scores,   setScores]   = useState({});
  const [updating, setUpdating] = useState({});
  const [filter,   setFilter]   = useState('round16');

  const load = useCallback(async () => {
    const { data } = await api.get('/matches?phase=' + filter);
    const ms = data.matches || [];
    setMatches(ms);
    const s = {};
    ms.forEach(m => { s[m._id] = { homeScore:m.homeScore??'', awayScore:m.awayScore??'' }; });
    setScores(s);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const set = (id, key) => e => setScores(s => ({ ...s, [id]: { ...s[id], [key]: e.target.value } }));

  const save = async (matchId) => {
    const sc = scores[matchId];
    if (sc.homeScore==='' || sc.awayScore==='') return toast.error('Ingresa ambos marcadores');
    setUpdating(u => ({ ...u, [matchId]: true }));
    try {
      await api.put('/admin/match/' + matchId + '/result', {
        homeScore: parseInt(sc.homeScore), awayScore: parseInt(sc.awayScore),
        status: 'finished',
      });
      toast.success('Guardado ✓');
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setUpdating(u => ({ ...u, [matchId]: false })); }
  };

  const deleteMatch = async (matchId) => {
    if (!confirm('¿Eliminar este partido?')) return;
    try { await api.delete('/admin/match/' + matchId); toast.success('Eliminado'); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  return (
    <>
      <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'1rem' }}>
        {Object.entries(PHASE_LABEL).map(([k,l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={'btn btn-sm ' + (filter===k ? 'btn-primary' : 'btn-secondary')}>
            {l}
          </button>
        ))}
      </div>
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table className="table" style={{ minWidth:680 }}>
            <thead><tr>
              <th style={{ width:36 }}>#</th>
              <th>Partido</th>
              <th style={{ textAlign:'center', width:64 }}>Local</th>
              <th style={{ width:16 }}></th>
              <th style={{ textAlign:'center', width:64 }}>Visit.</th>

              <th style={{ width:110 }}></th>
            </tr></thead>
            <tbody>
              {matches.map(m => {
                const sc = scores[m._id] || {};
                return (
                  <tr key={m._id}>
                    <td style={{ color:'var(--text-muted)', fontSize:'12px' }}>{m.matchNumber}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:'5px', flexWrap:'wrap' }}>
                        <FlagImg teamName={m.homeTeam.name} /><span style={{ fontSize:'13px' }}>{m.homeTeam.name}</span>
                        <span style={{ color:'var(--text-muted)', fontSize:'11px' }}>vs</span>
                        <span style={{ fontSize:'13px' }}>{m.awayTeam.name}</span><FlagImg teamName={m.awayTeam.name} />
                        {m.group && <span className="badge badge-silver" style={{ fontSize:'10px', padding:'1px 5px' }}>G{m.group}</span>}
                        {m.status==='finished' && <span className="badge badge-green" style={{ fontSize:'10px', padding:'1px 5px' }}>✓ {m.homeScore}-{m.awayScore}</span>}
                      </div>
                      {m.matchDate && <div style={{ fontSize:'10px', color:'var(--text-muted)', marginTop:'2px' }}>
                        {new Date(m.matchDate).toLocaleDateString('es-MX',{day:'numeric',month:'short'})} · {new Date(m.matchDate).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}
                      </div>}
                    </td>
                    <td style={{ textAlign:'center' }}>
                      <input type="number" min="0" max="30" value={sc.homeScore??''} onChange={set(m._id,'homeScore')}
                        style={{ width:52, padding:'4px 2px', textAlign:'center', background:'var(--bg-input)', border:'1px solid var(--border-strong)', borderRadius:'6px', color:'var(--text-primary)', fontSize:'15px', fontWeight:700 }} />
                    </td>
                    <td style={{ textAlign:'center', color:'var(--text-muted)' }}>–</td>
                    <td style={{ textAlign:'center' }}>
                      <input type="number" min="0" max="30" value={sc.awayScore??''} onChange={set(m._id,'awayScore')}
                        style={{ width:52, padding:'4px 2px', textAlign:'center', background:'var(--bg-input)', border:'1px solid var(--border-strong)', borderRadius:'6px', color:'var(--text-primary)', fontSize:'15px', fontWeight:700 }} />
                    </td>


                    <td style={{ display:'flex', gap:'4px' }}>
                      <button className="btn btn-success btn-sm" onClick={() => save(m._id)} disabled={updating[m._id]}>
                        {updating[m._id] ? '...' : '💾'}
                      </button>
                      {m.phase !== 'groups' && (
                        <button className="btn btn-danger btn-sm" onClick={() => deleteMatch(m._id)}>✕</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {matches.length === 0 && <div style={{ padding:'2.5rem', textAlign:'center', color:'var(--text-secondary)' }}>No hay partidos para esta fase</div>}
      </div>
    </>
  );
}

/* ── Tab Clasificados ── */
function ClassifiedTab() {
  const [classified, setClassified] = useState(() => {
    const obj = {};
    GROUPS.forEach(g => { obj[g] = { first:'', second:'', third:'' }; });
    return obj;
  });
  const [bestThirds, setBestThirds] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/classified').then(r => {
      const obj = {};
      GROUPS.forEach(g => { obj[g] = { first:'', second:'', third:'' }; });
      (r.data.results||[]).forEach(r => { obj[r.group] = { first:r.first||'', second:r.second||'', third:r.third||'' }; });
      setClassified(obj);
    });
    api.get('/admin/tournament-state').then(r => {
      setBestThirds(r.data.state?.bestThirds || []);
    });
  }, []);

  // All selected teams across all groups — for exclusion
  const allSelected = Object.values(classified).flatMap(v => [v.first, v.second, v.third]).filter(Boolean);

  const set = (group, key) => e => {
    const val = e.target.value;
    setClassified(c => ({ ...c, [group]: { ...c[group], [key]: val } }));
  };

  // Options for a select: group teams minus already-selected (except current value)
  const getOptions = (group, key) => {
    const groupTeams = (GROUPS_DATA[group] || []).map(t => t.name);
    const currentVal = classified[group]?.[key] || '';
    // Exclude selections in OTHER keys of THIS group + all other groups
    const excluded = allSelected.filter(s => s !== currentVal);
    return groupTeams.filter(t => !excluded.includes(t));
  };

  const toggleThird = (name) => {
    setBestThirds(prev => {
      if (prev.includes(name)) return prev.filter(t => t !== name);
      if (prev.length >= 8) { toast('Máximo 8 terceros', { icon:'⚠️' }); return prev; }
      return [...prev, name];
    });
  };

  const handleSave = async () => {
    const incomplete = GROUPS.filter(g => !classified[g].first || !classified[g].second);
    if (incomplete.length > 0) return toast.error('Faltan clasificados en: ' + incomplete.join(', '));
    if (bestThirds.length !== 8) return toast.error('Elige exactamente 8 mejores terceros (' + bestThirds.length + '/8)');
    setSaving(true);
    try {
      await api.post('/admin/classified', { classified, bestThirds });
      toast.success('✅ Clasificados guardados. Ve a "Llaves" para crear los cruces.');
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  const completedGroups = GROUPS.filter(g => classified[g].first && classified[g].second).length;
  const possibleThirds = GROUPS.map(g => classified[g]?.third).filter(Boolean);

  return (
    <div>
      <div style={{ marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'15px', fontWeight:600, marginBottom:'4px' }}>Clasificados de fase de grupos</div>
        <p style={{ fontSize:'13px', color:'var(--text-secondary)' }}>
          Selecciona quién quedó 1°, 2° y 3° en cada grupo.
          Los equipos ya seleccionados desaparecen automáticamente de los demás selects.
        </p>
        <span className="badge badge-silver" style={{ marginTop:'6px' }}>{completedGroups}/12 grupos · {allSelected.length} equipos seleccionados</span>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(270px,1fr))', gap:'10px', marginBottom:'1.5rem' }}>
        {GROUPS.map(g => {
          const val = classified[g];
          const isComplete = val.first && val.second;
          return (
            <div key={g} className="card card-sm" style={{ borderColor: isComplete ? 'rgba(16,185,129,.3)' : 'var(--border)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
                <div style={{ width:28, height:28, borderRadius:'8px', background: isComplete ? 'var(--green-dim)' : 'var(--accent-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color: isComplete ? 'var(--green)' : 'var(--accent)', fontSize:'13px' }}>{g}</div>
                <span style={{ fontWeight:600 }}>Grupo {g}</span>
                {isComplete && <span style={{ fontSize:'11px', color:'var(--green)', marginLeft:'auto' }}>✓</span>}
              </div>
              {[['first','🥇 1er lugar'],['second','🥈 2do lugar'],['third','3er lugar']].map(([key, lbl]) => {
                const opts = getOptions(g, key);
                const curVal = val[key] || '';
                return (
                  <div key={key} style={{ marginBottom:'8px' }}>
                    <label style={{ fontSize:'11px', color:'var(--text-muted)', fontWeight:600, display:'block', marginBottom:'3px' }}>{lbl}</label>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                      {curVal && <FlagImg teamName={curVal} size={14} />}
                      <select value={curVal} onChange={set(g, key)}
                        style={{ flex:1, background:'var(--bg-input)', border:'1px solid '+(curVal?'var(--accent)':'var(--border-strong)'), borderRadius:'6px', color:'var(--text-primary)', padding:'6px 8px', fontSize:'13px' }}>
                        <option value="">-- Elegir --</option>
                        {curVal && !opts.includes(curVal) && <option value={curVal}>{curVal}</option>}
                        {opts.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      {curVal && <button onClick={() => set(g,key)({target:{value:''}}) } style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:'16px', padding:'0 2px', lineHeight:1 }}>✕</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* 8 mejores terceros */}
      <div className="card" style={{ marginBottom:'1.5rem', borderColor: bestThirds.length===8 ? 'rgba(16,185,129,.3)' : 'var(--border)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
          <div>
            <div style={{ fontWeight:600, fontSize:'15px' }}>8 mejores terceros que avanzan</div>
            <p style={{ fontSize:'13px', color:'var(--text-secondary)', marginTop:'2px' }}>Toca para seleccionar/quitar. Máximo 8.</p>
          </div>
          <span style={{ fontSize:'22px', fontWeight:800, color: bestThirds.length===8 ? 'var(--green)' : 'var(--accent)' }}>{bestThirds.length}/8</span>
        </div>

        {bestThirds.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'10px', padding:'8px', background:'var(--bg-input)', borderRadius:'8px' }}>
            {bestThirds.map((t,i) => {
              const team = getTeam(t);
              return (
                <div key={t} onClick={() => toggleThird(t)} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'4px 9px', borderRadius:'16px', background:team.primary+'22', border:'1px solid '+team.primary+'44', cursor:'pointer', fontSize:'12px', fontWeight:500 }}>
                  <span style={{ fontSize:'10px', color:'var(--green)', fontWeight:700 }}>{i+1}</span>
                  <FlagImg teamName={t} size={12} />
                  <span>{t}</span>
                  <span style={{ color:'var(--text-muted)' }}>✕</span>
                </div>
              );
            })}
          </div>
        )}

        {possibleThirds.length === 0 ? (
          <p style={{ fontSize:'13px', color:'var(--text-muted)', padding:'8px' }}>Primero selecciona los 3ros lugares arriba.</p>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(190px,1fr))', gap:'6px' }}>
            {possibleThirds.map(name => {
              const g = GROUPS.find(gr => classified[gr]?.third === name);
              const isSelected = bestThirds.includes(name);
              const team = getTeam(name);
              return (
                <div key={name} onClick={() => toggleThird(name)} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'7px 10px', borderRadius:'8px', cursor:'pointer', background: isSelected ? team.primary+'22' : 'var(--bg-input)', border:'1px solid '+(isSelected ? team.primary+'55' : 'transparent'), transition:'all .1s', opacity: !isSelected && bestThirds.length>=8 ? 0.4 : 1 }}>
                  <span style={{ fontSize:'11px', color:'var(--text-muted)', minWidth:18 }}>G{g}</span>
                  <FlagImg teamName={name} size={14} />
                  <span style={{ fontSize:'13px', fontWeight: isSelected ? 600 : 400, flex:1 }}>{name}</span>
                  {isSelected && <span style={{ fontSize:'12px', color:team.primary }}>✓</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>
        {saving ? 'Guardando...' : '💾 Guardar ' + completedGroups + '/12 grupos y ' + bestThirds.length + '/8 terceros'}
      </button>
    </div>
  );
}

/* ── Tab Llaves ── */
function BracketTab() {
  const [phase, setPhase]              = useState('round16');
  const [availableTeams, setAvailable] = useState([]);
  const [matches, setMatches]          = useState([]);
  const [homeTeam, setHomeTeam]        = useState('');
  const [awayTeam, setAwayTeam]        = useState('');
  const [creating, setCreating]        = useState(false);

  const loadData = useCallback(async () => {
    const [avRes, mRes] = await Promise.all([
      api.get('/admin/available-teams/' + phase),
      api.get('/matches?phase=' + phase),
    ]);
    setAvailable(avRes.data.teams || []);
    setMatches(mRes.data.matches || []);
    setHomeTeam(''); setAwayTeam('');
  }, [phase]);

  useEffect(() => { loadData(); }, [loadData]);

  // Teams already used in existing matches of this phase
  const usedTeams = matches.flatMap(m => [m.homeTeam.name, m.awayTeam.name]);

  // Available for local: not used, not selected as away
  const optsHome = availableTeams.filter(t => !usedTeams.includes(t.name) && t.name !== awayTeam);
  // Available for visitor: not used, not selected as home
  const optsAway = availableTeams.filter(t => !usedTeams.includes(t.name) && t.name !== homeTeam);

  const createMatch = async () => {
    if (!homeTeam || !awayTeam) return toast.error('Selecciona ambos equipos');
    if (homeTeam === awayTeam) return toast.error('No puedes enfrentar un equipo contra sí mismo');
    if (usedTeams.includes(homeTeam)) return toast.error(homeTeam + ' ya está en esta ronda');
    if (usedTeams.includes(awayTeam)) return toast.error(awayTeam + ' ya está en esta ronda');
    setCreating(true);
    try {
      await api.post('/admin/create-match', { phase, homeTeamName: homeTeam, awayTeamName: awayTeam });
      toast.success('Partido creado ✓');
      loadData();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setCreating(false); }
  };

  const deleteMatch = async (id) => {
    if (!confirm('¿Eliminar este partido?')) return;
    try { await api.delete('/admin/match/' + id); loadData(); }
    catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const maxMatches = { round16:16, quarterfinals:8, semifinals:4, semifinal:2, third_place:1, final:1 };
  const isFull = matches.length >= (maxMatches[phase] || 99);
  const remaining = availableTeams.filter(t => !usedTeams.includes(t.name)).length;

  return (
    <div>
      <div style={{ marginBottom:'1.5rem' }}>
        <div style={{ fontSize:'15px', fontWeight:600, marginBottom:'4px' }}>Crear llaves manualmente</div>
        <p style={{ fontSize:'13px', color:'var(--text-secondary)' }}>
          Equipos ya usados en esta ronda desaparecen automáticamente de los selects.
        </p>
      </div>

      {/* Selector de fase */}
      <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'1.5rem' }}>
        {PHASE_ORDER.map(p => (
          <button key={p} onClick={() => setPhase(p)}
            className={'btn btn-sm ' + (phase===p ? 'btn-primary' : 'btn-secondary')}>
            {PHASE_LABEL[p]} ({p===phase ? matches.length : '?'}/{maxMatches[p]||'?'})
          </button>
        ))}
      </div>

      {/* Crear partido */}
      {!isFull ? (
        <div className="card" style={{ marginBottom:'1.5rem', borderColor:'var(--accent)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
            <span style={{ fontSize:'14px', fontWeight:600 }}>➕ Nuevo partido — {PHASE_LABEL[phase]}</span>
            {availableTeams.length > 0 && (
              <span style={{ fontSize:'12px', color:'var(--text-muted)' }}>
                {remaining} equipos disponibles · {usedTeams.length/2} partidos creados de {maxMatches[phase]||'?'}
              </span>
            )}
          </div>
          {availableTeams.length === 0 ? (
            <div style={{ padding:'1rem', background:'var(--bg-input)', borderRadius:'8px', fontSize:'13px', color:'var(--text-secondary)' }}>
              {phase === 'round16'
                ? '⚠️ Primero guarda los clasificados en la pestaña "Clasificados".'
                : '⚠️ Primero registra los resultados de la ronda anterior como ✅ Finalizado.'}
            </div>
          ) : remaining === 0 && !isFull ? (
            <div style={{ padding:'1rem', background:'var(--bg-input)', borderRadius:'8px', fontSize:'13px', color:'var(--text-secondary)' }}>
              Todos los equipos disponibles ya tienen partido asignado.
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr auto', alignItems:'end', gap:'10px' }}>
              <div>
                <label style={{ fontSize:'11px', color:'var(--text-muted)', fontWeight:600, display:'block', marginBottom:'4px' }}>Equipo Local</label>
                <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  {homeTeam && <FlagImg teamName={homeTeam} size={16} />}
                  <select value={homeTeam} onChange={e=>setHomeTeam(e.target.value)}
                    style={{ flex:1, background:'var(--bg-input)', border:'1px solid '+(homeTeam?'var(--accent)':'var(--border-strong)'), borderRadius:'6px', color:'var(--text-primary)', padding:'8px', fontSize:'13px' }}>
                    <option value="">-- Local --</option>
                    {optsHome.map(t => <option key={t.name} value={t.name}>{t.name} ({t.source})</option>)}
                  </select>
                </div>
              </div>

              <span style={{ fontSize:'18px', fontWeight:700, color:'var(--text-muted)', paddingBottom:'4px' }}>vs</span>

              <div>
                <label style={{ fontSize:'11px', color:'var(--text-muted)', fontWeight:600, display:'block', marginBottom:'4px' }}>Equipo Visitante</label>
                <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  {awayTeam && <FlagImg teamName={awayTeam} size={16} />}
                  <select value={awayTeam} onChange={e=>setAwayTeam(e.target.value)}
                    style={{ flex:1, background:'var(--bg-input)', border:'1px solid '+(awayTeam?'var(--accent)':'var(--border-strong)'), borderRadius:'6px', color:'var(--text-primary)', padding:'8px', fontSize:'13px' }}>
                    <option value="">-- Visitante --</option>
                    {optsAway.map(t => <option key={t.name} value={t.name}>{t.name} ({t.source})</option>)}
                  </select>
                </div>
              </div>

              <button className="btn btn-primary" onClick={createMatch} disabled={creating||!homeTeam||!awayTeam} style={{ marginBottom:'1px' }}>
                {creating ? '...' : '+ Crear'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ marginBottom:'1.5rem', borderColor:'rgba(16,185,129,.3)', textAlign:'center', padding:'1rem' }}>
          <span style={{ color:'var(--green)', fontWeight:600 }}>✅ {PHASE_LABEL[phase]} completa — {matches.length} partidos creados</span>
        </div>
      )}

      {/* Lista de partidos */}
      {matches.length > 0 && (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)', fontSize:'13px', fontWeight:600, color:'var(--text-secondary)' }}>
            {PHASE_LABEL[phase]} — {matches.length}/{maxMatches[phase]||'?'} partidos
          </div>
          {matches.map((m,i) => (
            <div key={m._id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 16px', borderBottom: i<matches.length-1?'1px solid var(--border)':'none', flexWrap:'wrap' }}>
              <span style={{ fontSize:'12px', color:'var(--text-muted)', minWidth:24 }}>#{m.matchNumber}</span>
              <div style={{ display:'flex', alignItems:'center', gap:'6px', flex:1 }}>
                <FlagImg teamName={m.homeTeam.name} size={16} />
                <span style={{ fontSize:'13px', fontWeight:600 }}>{m.homeTeam.name}</span>
                <span style={{ fontSize:'12px', color:'var(--text-muted)', padding:'0 4px' }}>vs</span>
                <span style={{ fontSize:'13px', fontWeight:600 }}>{m.awayTeam.name}</span>
                <FlagImg teamName={m.awayTeam.name} size={16} />
              </div>
              <span>
                {m.status==='finished'
                  ? <span className="badge badge-green">{m.homeScore}–{m.awayScore} ✓</span>
                  : m.status==='live'
                    ? <span className="badge badge-red">🔴 Live</span>
                    : <span className="badge badge-silver">Programado</span>}
              </span>
              <button className="btn btn-danger btn-sm" style={{ fontSize:'11px' }} onClick={() => deleteMatch(m._id)}>✕ Quitar</button>
            </div>
          ))}
        </div>
      )}

      {matches.length === 0 && availableTeams.length > 0 && (
        <div className="card" style={{ textAlign:'center', padding:'2.5rem', color:'var(--text-secondary)' }}>
          No hay partidos de {PHASE_LABEL[phase]} todavía. Crea el primero arriba.
        </div>
      )}
    </div>
  );
}

/* ── Tab Jugadores ── */
function PlayersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/users').then(r => { setUsers(r.data.users || []); setLoading(false); });
  }, []);

  if (loading) return <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-secondary)' }}>Cargando...</div>;
  return (
    <div className="card" style={{ padding:0, overflow:'hidden' }}>
      <table className="table">
        <thead><tr>
          <th>#</th><th>Jugador</th><th style={{ textAlign:'right' }}>Puntos</th>
          <th style={{ textAlign:'right' }}>Grupos</th><th style={{ textAlign:'right' }}>Partidos</th>
          <th style={{ textAlign:'right' }}>%</th><th style={{ textAlign:'right' }}>G. Quiniela</th>
        </tr></thead>
        <tbody>
          {users.map((u,i) => (
            <tr key={u._id}>
              <td style={{ fontWeight:600, fontSize:i<3?'16px':'13px' }}>{['🥇','🥈','🥉'][i]||i+1}</td>
              <td>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <div style={{ width:30, height:30, borderRadius:'50%', background:'var(--accent-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, color:'var(--accent)', flexShrink:0 }}>{u.name?.slice(0,2).toUpperCase()}</div>
                  <div>
                    <div style={{ fontSize:'13px', fontWeight:500 }}>{u.name}</div>
                    {u.username && <div style={{ fontSize:'11px', color:'var(--text-muted)' }}>@{u.username}</div>}
                  </div>
                </div>
              </td>
              <td style={{ textAlign:'right', fontWeight:700, color:'var(--accent)' }}>{u.totalPoints}</td>
              <td style={{ textAlign:'right', fontSize:'13px', color:'var(--text-secondary)' }}>{u.groupPredsCompleted}/12</td>
              <td style={{ textAlign:'right', fontSize:'13px', color:'var(--text-secondary)' }}>{u.matchPredsCount}</td>
              <td style={{ textAlign:'right', fontSize:'13px', color:u.accuracy>50?'var(--green)':'var(--text-secondary)' }}>{u.accuracy||0}%</td>
              <td style={{ textAlign:'right', fontSize:'13px', color:'var(--text-secondary)' }}>{u.quinielaGroups}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length===0 && <div style={{ padding:'2.5rem', textAlign:'center', color:'var(--text-secondary)' }}>Sin jugadores</div>}
    </div>
  );
}

/* ── Tab Grupos de Quiniela ── */
function GroupsTab() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/quiniela-groups').then(r => { setGroups(r.data.groups||[]); setLoading(false); });
  }, []);

  if (loading) return <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-secondary)' }}>Cargando...</div>;
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:'1rem' }}>
      {groups.map(g => (
        <div key={g._id} className="card card-sm">
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
            <div style={{ width:40, height:40, borderRadius:'10px', background:'var(--accent-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>👥</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:600, fontSize:'14px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{g.name}</div>
              <div style={{ fontSize:'12px', color:'var(--text-muted)' }}>{g.memberCount} jugadores · {g.isPrivate?'🔒 Privado':'🌐 Público'}</div>
            </div>
            <span style={{ fontSize:'13px', fontWeight:700, letterSpacing:'.1em', color:'var(--text-secondary)' }}>{g.code}</span>
          </div>
          <div style={{ fontSize:'12px', color:'var(--text-muted)', display:'flex', justifyContent:'space-between' }}>
            <span>Admin: {g.createdBy?.name||'N/A'}</span>
            <span>Máx: {g.maxMembers}</span>
          </div>
        </div>
      ))}
      {groups.length===0 && <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'3rem', color:'var(--text-secondary)' }}>Sin grupos</div>}
    </div>
  );
}

/* ── Panel de control de fases ── */
function PhaseControlPanel({ state, onUpdate }) {
  const [toggling, setToggling] = useState({});

  const PHASES = [
    { key:'groups',        label:'Fase de Grupos',   lockField:'groupPredictionsLocked',  lockedAtField:'groupsLockedAt'   },
    { key:'round16',       label:'Dieciseisavos',    lockField:'round16Locked',            lockedAtField:'round16LockedAt'  },
    { key:'quarterfinals', label:'Octavos de Final', lockField:'quarterfinalsLocked',      lockedAtField:'qfLockedAt'       },
    { key:'semifinals',    label:'Cuartos de Final', lockField:'semiFinalsLocked',         lockedAtField:'sfLockedAt'        },
    { key:'semifinal',     label:'Semifinales',      lockField:'semifinalLocked',          lockedAtField:'sfLockedAt'        },
    { key:'third_place',   label:'Tercer Lugar',     lockField:'thirdPlaceLocked',         lockedAtField:'thirdPlaceLockedAt'},
    { key:'final',         label:'Final',            lockField:'finalLocked',              lockedAtField:'finalLockedAt'     },
  ];

  const toggle = async (phase, lockField, currentLocked) => {
    const action = currentLocked ? 'desbloquear' : 'bloquear';
    if (!confirm('¿Confirmas ' + action + ' los picks de ' + PHASES.find(p=>p.key===phase)?.label + '?')) return;
    setToggling(t => ({ ...t, [phase]: true }));
    try {
      await api.put('/admin/tournament-state', { [lockField]: !currentLocked });
      toast.success((currentLocked ? '🔓 Desbloqueado' : '🔒 Bloqueado') + ': ' + PHASES.find(p=>p.key===phase)?.label);
      onUpdate();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setToggling(t => ({ ...t, [phase]: false })); }
  };

  return (
    <div className="card" style={{ marginBottom:'1.5rem' }}>
      <div style={{ fontSize:'14px', fontWeight:700, marginBottom:'12px', display:'flex', alignItems:'center', gap:'8px' }}>
        🎛️ Control de fases
        <span style={{ fontSize:'12px', color:'var(--text-secondary)', fontWeight:400 }}>— el admin controla cuándo se abren y cierran los picks</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:'8px' }}>
        {PHASES.map(({ key, label, lockField, lockedAtField }) => {
          const isLocked = !!state[lockField];
          const lockedAt = state[lockedAtField];
          return (
            <div key={key} style={{
              display:'flex', alignItems:'center', gap:'10px',
              padding:'10px 12px', borderRadius:'10px',
              background: isLocked ? 'var(--red-dim)' : 'var(--green-dim)',
              border:'1px solid ' + (isLocked ? 'rgba(239,68,68,.25)' : 'rgba(16,185,129,.25)'),
            }}>
              <span style={{ fontSize:'18px' }}>{isLocked ? '🔒' : '🟢'}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'13px', fontWeight:600, color: isLocked ? 'var(--red)' : 'var(--green)' }}>{label}</div>
                <div style={{ fontSize:'11px', color:'var(--text-muted)' }}>
                  {isLocked ? (lockedAt ? 'Desde ' + new Date(lockedAt).toLocaleString('es-MX',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : 'Bloqueado') : 'Picks abiertos'}
                </div>
              </div>
              <button
                onClick={() => toggle(key, lockField, isLocked)}
                disabled={toggling[key]}
                className={'btn btn-sm ' + (isLocked ? 'btn-success' : 'btn-danger')}
                style={{ flexShrink:0, fontSize:'11px' }}>
                {toggling[key] ? '...' : isLocked ? '🔓' : '🔒'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Página principal ── */

/* ═══════════════════════════════════════════════
   NOTIFICATIONS TAB
   ═══════════════════════════════════════════════ */
function NotificationsTab() {
  const [notifs, setNotifs] = useState([]);
  const [title, setTitle]   = useState('');
  const [message, setMsg]   = useState('');
  const [phase, setPhase]   = useState('groups');
  const [saving, setSaving] = useState(false);

  const phases = [
    { key:'groups',        label:'Fase de Grupos' },
    { key:'round16',       label:'Dieciseisavos' },
    { key:'quarterfinals', label:'Octavos' },
    { key:'semifinals',    label:'Cuartos' },
    { key:'semifinal',     label:'Semifinales' },
    { key:'third_place',   label:'Tercer Lugar' },
    { key:'final',         label:'Final' },
  ];

  const load = async () => {
    try { const { data } = await api.get('/notifications/admin'); setNotifs(data.notifications || []); } catch {}
  };
  useEffect(() => { load(); }, []);

  const sendPhaseOpen = async (ph) => {
    setSaving(true);
    try { await api.post('/notifications/admin/phase-open', { phase: ph }); toast.success('Notificación enviada'); load(); }
    catch { toast.error('Error'); }
    setSaving(false);
  };

  const sendPhaseClosing = async (ph) => {
    setSaving(true);
    try { await api.post('/notifications/admin/phase-closing', { phase: ph }); toast.success('Aviso de cierre enviado'); load(); }
    catch { toast.error('Error'); }
    setSaving(false);
  };

  const sendCustom = async () => {
    if (!title || !message) return toast.error('Título y mensaje requeridos');
    setSaving(true);
    try { await api.post('/notifications/admin', { title, message, type:'custom' }); toast.success('Notificación enviada'); setTitle(''); setMsg(''); load(); }
    catch { toast.error('Error'); }
    setSaving(false);
  };

  const deleteNotif = async (id) => {
    try { await api.delete(`/notifications/admin/${id}`); load(); toast.success('Eliminada'); }
    catch { toast.error('Error'); }
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `Hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Hace ${hrs}h`;
    return `Hace ${Math.floor(hrs/24)}d`;
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', alignItems:'start' }}>
      {/* Left: Quick actions */}
      <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
        {/* Phase open */}
        <div className="card card-sm">
          <h3 style={{ fontSize:'14px', fontWeight:600, marginBottom:'12px' }}>📢 Avisar fase disponible</h3>
          <select value={phase} onChange={e=>setPhase(e.target.value)} className="form-input" style={{ marginBottom:'8px' }}>
            {phases.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          <div style={{ display:'flex', gap:'8px' }}>
            <button className="btn btn-success btn-sm" style={{ flex:1 }} onClick={() => sendPhaseOpen(phase)} disabled={saving}>
              ✅ Fase abierta
            </button>
            <button className="btn btn-secondary btn-sm" style={{ flex:1, color:'var(--accent)' }} onClick={() => sendPhaseClosing(phase)} disabled={saving}>
              ⏰ Cierre próximo
            </button>
          </div>
        </div>

        {/* Custom */}
        <div className="card card-sm">
          <h3 style={{ fontSize:'14px', fontWeight:600, marginBottom:'12px' }}>✏️ Notificación personalizada</h3>
          <input value={title} onChange={e=>setTitle(e.target.value)} className="form-input" placeholder="Título" style={{ marginBottom:'8px' }} />
          <textarea value={message} onChange={e=>setMsg(e.target.value)} className="form-input" placeholder="Mensaje" rows={3} style={{ marginBottom:'8px', resize:'vertical' }} />
          <button className="btn btn-primary btn-sm btn-full" onClick={sendCustom} disabled={saving}>Enviar a todos</button>
        </div>
      </div>

      {/* Right: History */}
      <div className="card card-sm">
        <h3 style={{ fontSize:'14px', fontWeight:600, marginBottom:'12px' }}>📋 Historial ({notifs.length})</h3>
        <div style={{ display:'flex', flexDirection:'column', gap:'8px', maxHeight:400, overflowY:'auto' }}>
          {notifs.length === 0 && <div style={{ color:'var(--text-muted)', fontSize:'13px', textAlign:'center', padding:'1rem' }}>Sin notificaciones</div>}
          {notifs.map(n => (
            <div key={n._id} style={{ background:'var(--bg-input)', borderRadius:'8px', padding:'10px 12px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'8px' }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'13px', fontWeight:600 }}>{n.title}</div>
                <div style={{ fontSize:'12px', color:'var(--text-secondary)', marginTop:2 }}>{n.message}</div>
                <div style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:4 }}>{timeAgo(n.createdAt)} · {n.readBy?.length||0} leídas</div>
              </div>
              <button onClick={() => deleteNotif(n._id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:'16px', padding:'2px', flexShrink:0 }}>🗑</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [stats,       setStats]       = useState({});
  const [state,       setState_]      = useState(null);
  const [tab,         setTab]         = useState('matches');
  const [recalcing,   setRecalcing]   = useState(false);
  const [resetting,   setResetting]   = useState(false);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
      setState_(data.tournamentState);
    } catch {}
  };

  const recalcAll = async () => {
    setRecalcing(true);
    try { await api.post('/admin/recalculate-all'); toast.success('Recalculado ✓'); loadStats(); }
    catch (err) { toast.error(err.response?.data?.error||'Error'); }
    finally { setRecalcing(false); }
  };

  const resetTournament = async () => {
    const adminPassword = window.prompt(
      '⚠️ ACCIÓN IRREVERSIBLE\n\nEsto borrará TODAS las predicciones, resultados, puntos y llaves.\n\nIngresa tu contraseña de admin para confirmar:'
    );
    if (!adminPassword) return;
    setResetting(true);
    try {
      const { data } = await api.post('/admin/reset-tournament', { adminPassword });
      toast.success(data.message, { duration:5000 });
      loadStats();
    } catch (err) { toast.error(err.response?.data?.error||'Contraseña incorrecta'); }
    finally { setResetting(false); }
  };

  const TABS = [
    ['matches',    '⚽ Partidos'],
    ['classified', '📋 Clasificados'],
    ['bracket',    '🏆 Llaves'],
    ['players',    '👥 Jugadores'],
    ['qgroups',    '🎯 Grupos'],
  ];

  return (
    <div>
      <div style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'22px', fontWeight:700, marginBottom:'4px' }}>⚙️ Panel Administrador</h1>
        <p style={{ color:'var(--text-secondary)', fontSize:'14px' }}>Gestión manual del torneo</p>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom:'1.5rem' }}>
        <StatCard icon="👥" label="Jugadores"  value={stats.users   ||0} color="var(--accent-2)"  />
        <StatCard icon="👥" label="Grupos"      value={stats.groups  ||0} color="var(--purple)"    />
        <StatCard icon="✅" label="Finalizados" value={stats.finished||0} color="var(--green)"     sub={'de '+(stats.matches||0)+' totales'} />
        <StatCard icon="🎯" label="% Aciertos"  value={(stats.accuracy||0)+'%'} sub={(stats.totalPreds||0)+' pronósticos'} />
      </div>

      {/* Control de fases */}
      {state && <PhaseControlPanel state={state} onUpdate={loadStats} />}

      {/* Acciones */}
      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'1.5rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={recalcAll} disabled={recalcing}>
          {recalcing ? 'Recalculando...' : '🔄 Recalcular puntos'}
        </button>
        <button className="btn btn-secondary btn-sm" onClick={loadStats}>↻ Actualizar</button>
        <button className="btn btn-danger btn-sm" onClick={resetTournament} disabled={resetting} style={{ marginLeft:'auto' }}>
          {resetting ? 'Reseteando...' : '⚠️ Resetear Mundial'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'4px', borderBottom:'1px solid var(--border)', marginBottom:'1.5rem' }}>
        {TABS.map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding:'8px 14px', background:'none', border:'none', cursor:'pointer',
            borderBottom:'2px solid '+(tab===k?'var(--accent)':'transparent'),
            color: tab===k?'var(--accent)':'var(--text-secondary)',
            fontWeight: tab===k?600:400, fontSize:'13px', marginBottom:'-1px',
          }}>{l}</button>
        ))}
      </div>

      {tab==='matches'    && <MatchesTab />}
      {tab==='classified' && <ClassifiedTab />}
      {tab==='bracket'    && <BracketTab />}
      {tab==='players'    && <PlayersTab />}
      {tab==='qgroups'    && <GroupsTab />}
    </div>
  );
}
