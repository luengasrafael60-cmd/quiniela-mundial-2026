import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { ALL_TEAMS, getTeam, getFlagUrl } from '../utils/teams';

// ALL_TEAMS viene de teams.js — siempre disponible, no depende de la API
const TEAM_LIST = ALL_TEAMS; // array de {name, flag, code, iso, primary, secondary}

const SPECIALS = [
  { key: 'champion',    label: 'Campeón',      emoji: '🥇', pts: 20 },
  { key: 'runnerUp',    label: 'Subcampeón',   emoji: '🥈', pts: 10 },
  { key: 'thirdPlace',  label: 'Tercer lugar', emoji: '🥉', pts: 7  },
  { key: 'fourthPlace', label: 'Cuarto lugar', emoji: '4️⃣', pts: 5  },
];

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

export default function SpecialPage() {
  // picks: { champion: 'Brasil', runnerUp: null, ... }
  const [picks, setPicks] = useState({ champion: null, runnerUp: null, thirdPlace: null, fourthPlace: null });
  const [saved, setSaved] = useState({ champion: null, runnerUp: null, thirdPlace: null, fourthPlace: null });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [activeSlot, setActiveSlot] = useState(null); // key de qué slot está abierto

  // Cargar predicciones guardadas
  useEffect(() => {
    api.get('/predictions/my').then(r => {
      const s = r.data.special;
      if (s) {
        const p = {
          champion:    s.champion    || null,
          runnerUp:    s.runnerUp    || null,
          thirdPlace:  s.thirdPlace  || null,
          fourthPlace: s.fourthPlace || null,
        };
        setPicks(p);
        setSaved(p);
      }
    }).catch(() => {}); // silenciar error — picks quedan en null
  }, []);

  // Abrir/cerrar el selector de un slot
  const toggleSlot = (key) => {
    setActiveSlot(prev => prev === key ? null : key);
    setSearch('');
  };

  // Seleccionar un equipo para el slot activo
  const selectTeam = (teamName) => {
    if (!activeSlot) return;
    setPicks(prev => ({ ...prev, [activeSlot]: teamName }));
    setActiveSlot(null);
    setSearch('');
  };

  // Limpiar un slot
  const clearSlot = (key, e) => {
    e.stopPropagation();
    setPicks(prev => ({ ...prev, [key]: null }));
    if (activeSlot === key) setActiveSlot(null);
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      await api.post('/predictions/special', {
        champion:    picks.champion    || null,
        runnerUp:    picks.runnerUp    || null,
        thirdPlace:  picks.thirdPlace  || null,
        fourthPlace: picks.fourthPlace || null,
      });
      setSaved({ ...picks });
      toast.success('¡Pronósticos especiales guardados!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const filtered = search.trim()
    ? TEAM_LIST.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    : TEAM_LIST;

  const hasChanges = JSON.stringify(picks) !== JSON.stringify(saved);
  const completedCount = Object.values(picks).filter(Boolean).length;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>⭐ Pronósticos Especiales</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Predice los 4 mejores del torneo. Se bloquean cuando empiece la final.
        </p>
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <span className={`badge ${completedCount === 4 ? 'badge-green' : 'badge-silver'}`}>
            {completedCount}/4 completados
          </span>
        </div>
      </div>

      {/* Tarjetas de pronósticos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {SPECIALS.map(({ key, label, emoji, pts }) => {
          const teamName = picks[key];
          const team = teamName ? getTeam(teamName) : null;
          const isOpen = activeSlot === key;

          return (
            <div key={key}
              className="card"
              onClick={() => toggleSlot(key)}
              style={{
                cursor: 'pointer',
                borderColor: isOpen
                  ? 'var(--accent)'
                  : teamName
                    ? (team?.primary + '66') || 'rgba(16,185,129,0.3)'
                    : 'var(--border)',
                background: isOpen
                  ? 'var(--accent-dim)'
                  : teamName
                    ? `${team?.primary}11`
                    : 'var(--bg-card)',
                transition: 'all 0.15s',
                userSelect: 'none',
              }}
            >
              {/* Encabezado */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '22px', lineHeight: 1 }}>{emoji}</span>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{label}</span>
                </div>
                <span className="badge badge-gold">+{pts} pts</span>
              </div>

              {/* Equipo seleccionado o placeholder */}
              {teamName && team ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 10px', borderRadius: '8px',
                  background: `${team.primary}22`,
                  border: `1px solid ${team.primary}44`,
                }}>
                  <div style={{ width: 3, height: 22, borderRadius: 99, background: team.primary, flexShrink: 0 }} />
                  <FlagImg teamName={teamName} size={17} />
                  <span style={{ fontWeight: 600, fontSize: '13px', flex: 1 }}>{teamName}</span>
                  <button
                    onClick={(e) => clearSlot(key, e)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', fontSize: '14px', padding: '0 2px',
                      lineHeight: 1,
                    }}
                    title="Quitar selección"
                  >✕</button>
                </div>
              ) : (
                <div style={{
                  padding: '10px', borderRadius: '8px', textAlign: 'center',
                  background: 'rgba(0,0,0,0.15)',
                  color: isOpen ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: '13px',
                  border: `1px dashed ${isOpen ? 'var(--accent)' : 'var(--border-strong)'}`,
                }}>
                  {isOpen ? '▼ Elige un equipo abajo' : '+ Toca para elegir'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Panel selector de equipo — solo visible cuando hay un slot activo */}
      {activeSlot && (
        <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600 }}>
              {SPECIALS.find(s => s.key === activeSlot)?.emoji}{' '}
              Eligiendo: {SPECIALS.find(s => s.key === activeSlot)?.label}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={() => setActiveSlot(null)}>✕ Cerrar</button>
          </div>

          <input
            className="form-input"
            placeholder="Buscar equipo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
            style={{ marginBottom: '10px' }}
          />

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
            gap: '5px',
            maxHeight: '300px',
            overflowY: 'auto',
            paddingRight: '4px',
          }}>
            {filtered.map(t => {
              const team = getTeam(t.name);
              const isSelected = picks[activeSlot] === t.name;
              return (
                <div
                  key={t.code}
                  onClick={() => selectTeam(t.name)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    padding: '7px 9px', borderRadius: '8px', cursor: 'pointer',
                    background: isSelected ? `${team.primary}33` : 'var(--bg-input)',
                    border: `1px solid ${isSelected ? team.primary + '77' : 'transparent'}`,
                    transition: 'background 0.1s, border 0.1s',
                  }}
                >
                  <div style={{ width: 3, height: 20, borderRadius: 99, background: team.primary, flexShrink: 0 }} />
                  <FlagImg teamName={t.name} size={15} />
                  <span style={{ fontSize: '12px', fontWeight: isSelected ? 600 : 400, lineHeight: 1.3 }}>
                    {t.name}
                  </span>
                  {isSelected && <span style={{ marginLeft: 'auto', fontSize: '11px', color: team.primary }}>✓</span>}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', gridColumn: '1/-1', padding: '8px 4px' }}>
                Sin resultados para "{search}"
              </p>
            )}
          </div>
        </div>
      )}

      {/* Botón guardar */}
      <button
        className="btn btn-primary btn-lg"
        onClick={saveAll}
        disabled={saving || !hasChanges}
        style={{ opacity: saving || !hasChanges ? 0.6 : 1 }}
      >
        {saving
          ? 'Guardando...'
          : hasChanges
            ? `💾 Guardar pronósticos especiales (${completedCount}/4)`
            : '✓ Todo guardado'}
      </button>
    </div>
  );
}
