import { useEffect, useState } from 'react';
import api from '../utils/api';
import { getFlagUrl, getTeam, GROUPS_DATA } from '../utils/teams';

const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'];

function FlagImg({ teamName, size = 17 }) {
  const url = getFlagUrl(teamName, 'w40');
  const team = getTeam(teamName);
  if (!url) return <span style={{ fontSize: size + 'px', lineHeight: 1 }}>{team.flag}</span>;
  return (
    <img src={url} alt={teamName} width={Math.round(size * 1.4)} height={size}
      style={{ objectFit: 'cover', borderRadius: '3px', display: 'block', flexShrink: 0 }}
      onError={e => { e.currentTarget.style.display = 'none'; }} />
  );
}

function GroupTable({ group, standing }) {
  // Si no hay datos de DB, mostrar equipos del grupo sin estadísticas
  const dbTeams = standing?.teams || [];
  const groupTeams = GROUPS_DATA[group] || [];

  // Combinar: si hay datos de DB usar esos, si no mostrar los equipos del grupo con todo en 0
  const teams = groupTeams.map(gt => {
    const db = dbTeams.find(t => t.name === gt.name);
    return db || { name: gt.name, flag: gt.flag, code: gt.code, primary: gt.primary,
      PJ: 0, PG: 0, PE: 0, PP: 0, GF: 0, GC: 0, DG: 0, PTS: 0 };
  }).sort((a, b) => {
    if (b.PTS !== a.PTS) return b.PTS - a.PTS;
    if (b.DG  !== a.DG)  return b.DG  - a.DG;
    if (b.GF  !== a.GF)  return b.GF  - a.GF;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header del grupo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '12px 16px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '8px', background: 'var(--accent-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, color: 'var(--accent)', fontSize: '13px',
        }}>{group}</div>
        <span style={{ fontWeight: 700, fontSize: '14px' }}>Grupo {group}</span>
        {standing?.updatedAt && (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            Actualizado {new Date(standing.updatedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Tabla */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 460 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', width: 24 }}>#</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>Equipo</th>
              {['PJ','PG','PE','PP','GF','GC','DG','PTS'].map(h => (
                <th key={h} style={{ padding: '8px 8px', textAlign: 'center', fontSize: '11px', fontWeight: 600, color: h === 'PTS' ? 'var(--accent)' : 'var(--text-muted)', minWidth: 28 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.map((t, i) => {
              const team = getTeam(t.name);
              const isClassified = i < 2;
              const isThird = i === 2;
              return (
                <tr key={t.name} style={{ borderBottom: i < teams.length - 1 ? '1px solid var(--border)' : 'none', background: 'transparent' }}>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 700,
                      background: isClassified ? 'var(--green-dim)' : isThird ? 'var(--accent-dim)' : 'transparent',
                      color: isClassified ? 'var(--green)' : isThird ? 'var(--accent)' : 'var(--text-muted)',
                    }}>{i + 1}</div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: 3, height: 20, borderRadius: 99, background: team.primary, flexShrink: 0 }} />
                      <FlagImg teamName={t.name} size={16} />
                      <span style={{ fontSize: '13px', fontWeight: isClassified ? 600 : 400, whiteSpace: 'nowrap' }}>{t.name}</span>
                    </div>
                  </td>
                  {['PJ','PG','PE','PP','GF','GC','DG','PTS'].map(col => (
                    <td key={col} style={{
                      padding: '10px 8px', textAlign: 'center',
                      fontSize: col === 'PTS' ? '14px' : '13px',
                      fontWeight: col === 'PTS' ? 700 : 400,
                      color: col === 'PTS' ? 'var(--accent)' : col === 'DG' ? (t[col] > 0 ? 'var(--green)' : t[col] < 0 ? 'var(--red)' : 'var(--text-secondary)') : 'var(--text-secondary)',
                    }}>
                      {col === 'DG' && t[col] > 0 ? `+${t[col]}` : t[col]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Leyenda */}
      <div style={{ display: 'flex', gap: '16px', padding: '8px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--green)' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Clasificado</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)' }} />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Posible 3ro</span>
        </div>
      </div>
    </div>
  );
}

export default function StandingsPage() {
  const [standings, setStandings] = useState({});
  const [loading, setLoading]     = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const load = async () => {
    try {
      const { data } = await api.get('/standings');
      const map = {};
      (data.standings || []).forEach(s => { map[s.group] = s; });
      setStandings(map);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error cargando tablas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Auto-refresh cada 60 segundos
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>📊 Tablas de Posiciones</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Se actualizan automáticamente al terminar cada partido.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {lastUpdate && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Última actualización: {lastUpdate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button className="btn btn-secondary btn-sm" onClick={load}>↻ Actualizar</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Cargando tablas...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: '1.2rem' }}>
          {GROUPS.map(g => (
            <GroupTable key={g} group={g} standing={standings[g]} />
          ))}
        </div>
      )}

      {/* Sistema de puntos */}
      <div className="card" style={{ marginTop: '2rem', padding: '1rem' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Sistema de puntos FIFA</div>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          {[['Victoria','3 pts','var(--green)'],['Empate','1 pt','var(--accent)'],['Derrota','0 pts','var(--text-muted)']].map(([l,v,c]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: c }}>{v}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
