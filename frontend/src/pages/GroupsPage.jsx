import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { GROUPS_DATA, getTeam, getFlagUrl } from '../utils/teams';

const GROUPS_NAMES = Object.fromEntries(
  Object.entries(GROUPS_DATA).map(([g, teams]) => [g, teams.map(t => t.name)])
);

function FlagImg({ teamName, size = 24 }) {
  const url = getFlagUrl(teamName, 'w40');
  const team = getTeam(teamName);
  if (!url) return <span style={{ fontSize: size + 'px' }}>{team.flag}</span>;
  return (
    <img
      src={url}
      alt={teamName}
      width={size * 1.4}
      height={size}
      style={{ objectFit: 'cover', borderRadius: '3px', display: 'block', flexShrink: 0 }}
      onError={e => { e.currentTarget.style.display = 'none'; }}
    />
  );
}

function TeamChip({ teamName, isFirst, isSecond, onClick1st, onClick2nd, locked }) {
  const team = getTeam(teamName);
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 44px 44px', gap: '4px',
      padding: '6px 4px', borderRadius: '8px', marginBottom: '3px',
      background: isFirst
        ? `linear-gradient(90deg, ${team.primary}22 0%, transparent 60%)`
        : isSecond
          ? `linear-gradient(90deg, ${team.secondary}22 0%, transparent 60%)`
          : 'transparent',
      transition: 'background 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
        <div style={{ width: 3, height: 28, borderRadius: 99, background: team.primary, flexShrink: 0 }} />
        <FlagImg teamName={teamName} size={18} />
        <span style={{
          fontSize: '13px', fontWeight: isFirst || isSecond ? 600 : 400,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{teamName}</span>
      </div>
      <button onClick={locked ? undefined : onClick1st} disabled={locked} style={{
        width: 36, height: 36, margin: 'auto', borderRadius: '8px', border: 'none',
        cursor: locked ? 'default' : 'pointer',
        background: isFirst ? team.primary : 'var(--bg-input)',
        color: isFirst ? '#fff' : 'var(--text-muted)',
        fontWeight: 700, fontSize: '13px',
        boxShadow: isFirst ? `0 0 10px ${team.primary}66` : 'none',
        opacity: locked ? 0.6 : 1,
        transition: 'all 0.15s',
      }}>1°</button>
      <button onClick={locked ? undefined : onClick2nd} disabled={locked} style={{
        width: 36, height: 36, margin: 'auto', borderRadius: '8px', border: 'none',
        cursor: locked ? 'default' : 'pointer',
        background: isSecond ? team.secondary : 'var(--bg-input)',
        color: isSecond ? (team.secondary === '#FFFFFF' ? '#111' : '#fff') : 'var(--text-muted)',
        fontWeight: 700, fontSize: '13px',
        boxShadow: isSecond ? `0 0 10px ${team.secondary}55` : 'none',
        opacity: locked ? 0.6 : 1,
        transition: 'all 0.15s',
      }}>2°</button>
    </div>
  );
}

export default function GroupsPage() {
  const [picks, setPicks] = useState({});
  const [thirdPicks, setThirdPicks] = useState([]);
  const [locked, setLocked] = useState(false);
  const [saving, setSaving] = useState({});
  const [savingThird, setSavingThird] = useState(false);
  const [activeTab, setActiveTab] = useState('groups');

  useEffect(() => {
    // Load picks
    api.get('/predictions/my').then(r => {
      const p = {};
      r.data.groupPredictions?.forEach(gp => {
        p[gp.group] = { first: gp.first, second: gp.second };
      });
      setPicks(p);
      setThirdPicks(r.data.thirdPicks?.picks || []);
    });

    // Load lock state
    api.get('/predictions/state').then(r => { setLocked(r.data.state?.groupPredictionsLocked || false); });

    // Refresh lock state every 5s
    const interval = setInterval(() => {
      api.get('/predictions/state').then(r => { setLocked(r.data.state?.groupPredictionsLocked || false); }).catch(()=>{});
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const setPosition = (group, position, team) => {
    setPicks(prev => {
      const current = prev[group] || { first: null, second: null };
      const newPick = { ...current };
      if (newPick.first === team && position !== 'first') newPick.first = null;
      if (newPick.second === team && position !== 'second') newPick.second = null;
      if (newPick[position] === team) { newPick[position] = null; }
      else { newPick[position] = team; }
      return { ...prev, [group]: newPick };
    });
  };

  const saveGroup = async (group) => {
    const p = picks[group] || {};
    if (!p.first || !p.second) return toast.error('Selecciona 1ro y 2do lugar');
    setSaving(s => ({ ...s, [group]: true }));
    try {
      await api.post('/predictions/group', { group, first: p.first, second: p.second });
      toast.success(`Grupo ${group} guardado ✓`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    } finally {
      setSaving(s => ({ ...s, [group]: false }));
    }
  };

  const toggleThird = (team) => {
    setThirdPicks(prev => {
      if (prev.includes(team)) return prev.filter(t => t !== team);
      if (prev.length >= 8) { toast('Ya elegiste 8 terceros lugares', { icon: '⚠️' }); return prev; }
      return [...prev, team];
    });
  };

  const saveThirds = async () => {
    if (thirdPicks.length !== 8) return toast.error('Debes elegir exactamente 8 terceros lugares');
    setSavingThird(true);
    try {
      await api.post('/predictions/third-places', { picks: thirdPicks });
      toast.success('Terceros lugares guardados ✓');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    } finally {
      setSavingThird(false);
    }
  };

  const completedGroups = Object.keys(GROUPS_NAMES).filter(g => picks[g]?.first && picks[g]?.second).length;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>🏟️ Fase de Grupos</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Elige quién queda 1ro y 2do en cada grupo, y los 8 mejores terceros que clasifican.
        </p>
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
          <span className="badge badge-green">{completedGroups}/12 grupos completados</span>
          <span className="badge badge-gold">{thirdPicks.length}/8 terceros elegidos</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {[
          { key: 'groups', label: '📋 Posiciones de grupos' },
          { key: 'thirds', label: '🏅 8 mejores terceros' },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: '8px 16px', background: 'none', border: 'none',
            borderBottom: `2px solid ${activeTab === t.key ? 'var(--accent)' : 'transparent'}`,
            color: activeTab === t.key ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: activeTab === t.key ? 600 : 400, fontSize: '14px', cursor: 'pointer',
            marginBottom: '-1px',
          }}>{t.label}</button>
        ))}
      </div>

      {activeTab === 'groups' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {Object.entries(GROUPS_DATA).map(([letter, teams]) => {
            const p = picks[letter] || {};
            const isComplete = p.first && p.second;
            return (
              <div key={letter} className="card" style={{ borderColor: isComplete ? 'rgba(16,185,129,0.3)' : 'var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '8px',
                      background: isComplete ? 'var(--green-dim)' : 'var(--accent-dim)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, color: isComplete ? 'var(--green)' : 'var(--accent)', fontSize: '14px',
                    }}>{letter}</div>
                    <span style={{ fontWeight: 600 }}>Grupo {letter}</span>
                  </div>
                  {isComplete
                    ? <span className="badge badge-green">✓ Listo</span>
                    : <span className="badge badge-silver">{(p.first ? 1 : 0) + (p.second ? 1 : 0)}/2</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 44px 44px', gap: '4px', marginBottom: '4px', padding: '0 4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Equipo</span>
                  <span style={{ fontSize: '11px', color: 'var(--accent)', textAlign: 'center', fontWeight: 600 }}>1°</span>
                  <span style={{ fontSize: '11px', color: 'var(--accent-2)', textAlign: 'center', fontWeight: 600 }}>2°</span>
                </div>

                {teams.map(team => (
                  <TeamChip
                    key={team.name}
                    teamName={team.name}
                    isFirst={p.first === team.name}
                    isSecond={p.second === team.name}
                    onClick1st={() => setPosition(letter, 'first', team.name)}
                    onClick2nd={() => setPosition(letter, 'second', team.name)}
                    locked={locked}
                  />
                ))}

                <button className="btn btn-primary btn-sm btn-full" style={{ marginTop: '10px' }}
                  onClick={() => saveGroup(letter)}
                  disabled={!isComplete || saving[letter] || locked}>
                  {locked ? '🔒 Cerrado' : saving[letter] ? 'Guardando...' : isComplete ? '💾 Guardar grupo' : 'Selecciona 1° y 2°'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'thirds' && (
        <div>
          <div className="card" style={{ marginBottom: '1.5rem', borderColor: thirdPicks.length === 8 ? 'rgba(16,185,129,0.3)' : 'var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>🏅 8 mejores terceros lugares</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  De los 12 equipos en 3er lugar, solo 8 clasifican. Elige cuáles serán.
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: thirdPicks.length === 8 ? 'var(--green)' : 'var(--accent)' }}>{thirdPicks.length}/8</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>elegidos</div>
              </div>
            </div>

            {thirdPicks.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px', padding: '10px', background: 'var(--bg-input)', borderRadius: '8px' }}>
                {thirdPicks.map((t, i) => {
                  const team = getTeam(t);
                  return (
                    <div key={t} onClick={() => toggleThird(t)} style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '5px 10px', borderRadius: '20px',
                      background: `${team.primary}22`,
                      border: `1px solid ${team.primary}55`,
                      cursor: 'pointer', fontSize: '13px', fontWeight: 500,
                    }}>
                      <span style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 700 }}>{i + 1}</span>
                      <FlagImg teamName={t} size={14} />
                      <span>{t}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>✕</span>
                    </div>
                  );
                })}
              </div>
            )}

            <button className="btn btn-success btn-full" onClick={saveThirds}
              disabled={thirdPicks.length !== 8 || savingThird || locked}>
              {savingThird ? 'Guardando...' : thirdPicks.length === 8 ? '💾 Guardar 8 terceros lugares' : `Faltan ${8 - thirdPicks.length} más`}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {Object.entries(GROUPS_DATA).map(([letter, teams]) => {
              const p = picks[letter] || {};
              const possibleThirds = teams.filter(t => t.name !== p.first && t.name !== p.second);
              return (
                <div key={letter} className="card card-sm">
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    Grupo {letter} — posibles 3ros
                  </div>
                  {possibleThirds.length === 0 && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Completa primero el grupo {letter}</p>}
                  {possibleThirds.map(team => {
                    const isSelected = thirdPicks.includes(team.name);
                    const rank = thirdPicks.indexOf(team.name) + 1;
                    return (
                      <div key={team.name} onClick={() => toggleThird(team.name)} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px', borderRadius: '8px', marginBottom: '4px', cursor: 'pointer',
                        background: isSelected ? `${team.primary}22` : 'transparent',
                        border: `1px solid ${isSelected ? team.primary + '55' : 'transparent'}`,
                        transition: 'all 0.15s',
                      }}>
                        {isSelected
                          ? <span style={{ fontSize: '12px', fontWeight: 700, color: team.primary, minWidth: '18px' }}>{rank}</span>
                          : <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '18px' }}>—</span>}
                        <FlagImg teamName={team.name} size={16} />
                        <span style={{ fontSize: '13px', fontWeight: isSelected ? 600 : 400, flex: 1 }}>{team.name}</span>
                        {isSelected && <span style={{ fontSize: '13px', color: team.primary }}>✓</span>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
