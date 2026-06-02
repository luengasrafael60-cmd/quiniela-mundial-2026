import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import useAuthStore from '../store/authStore';

function StatBox({ label, value, color = 'var(--text-primary)', icon }) {
  return (
    <div className="card card-sm" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '22px', marginBottom: '4px' }}>{icon}</div>
      <div style={{ fontSize: '26px', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{label}</div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [groups, setGroups] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', bio: '', avatar: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/users/profile').then(r => {
      setProfile(r.data.user);
      setGroups(r.data.groups || []);
      setForm({
        name: r.data.user.name || '',
        username: r.data.user.username || '',
        bio: r.data.user.bio || '',
        avatar: r.data.user.avatar || '',
      });
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/users/profile', form);
      setProfile(data.user);
      updateUser(data.user);
      setEditing(false);
      toast.success('Perfil actualizado');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const initials = profile?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  if (!profile) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: 700 }}>
      <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '1.5rem' }}>👤 Mi Perfil</h1>

      {/* Tarjeta de perfil */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        {!editing ? (
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{
              width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
              background: profile.avatar ? `url(${profile.avatar}) center/cover` : 'var(--accent-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', fontWeight: 700, color: 'var(--accent)',
              border: '3px solid var(--accent)',
            }}>
              {!profile.avatar && initials}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '2px' }}>{profile.name}</h2>
              {profile.username && (
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '6px' }}>@{profile.username}</div>
              )}
              {profile.bio && <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{profile.bio}</p>}
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Miembro desde {new Date(profile.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long' })}
              </div>
            </div>

            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>✏️ Editar</button>
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '1.2rem' }}>Editar perfil</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Usuario</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>@</span>
                  <input className="form-input" style={{ paddingLeft: '26px' }} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value.toLowerCase() }))} />
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea className="form-input" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} maxLength={200} style={{ resize: 'vertical', minHeight: '60px' }} />
            </div>
            <div className="form-group">
              <label className="form-label">URL de foto de perfil</label>
              <input className="form-input" placeholder="https://..." value={form.avatar} onChange={e => setForm(f => ({ ...f, avatar: e.target.value }))} type="url" />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
            </div>
          </form>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginBottom: '1.5rem' }}>
        <StatBox label="Puntos totales" value={profile.totalPoints || 0} color="var(--accent)" icon="⭐" />
        <StatBox label="Posición global" value={`#${profile.rank || '–'}`} color="var(--accent-2)" icon="📊" />
        <StatBox label="Aciertos" value={profile.totalCorrect || 0} color="var(--green)" icon="✅" />
        <StatBox label="Pts exactos" value={profile.exactScorePoints || 0} color="var(--purple)" icon="🎯" />
        <StatBox label="Pts grupos" value={profile.groupPoints || 0} icon="🏟️" />
        <StatBox label="Grupos" value={groups.length} icon="👥" />
      </div>

      {/* Mis grupos */}
      {groups.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600 }}>👥 Mis grupos</h2>
            <Link to="/mis-grupos" style={{ fontSize: '13px', color: 'var(--accent)' }}>Ver todos →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {groups.map(g => (
              <Link key={g._id} to={`/mis-grupos/${g._id}`} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px', borderRadius: '8px', background: 'var(--bg-input)',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-input)'}
              >
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>👥</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{g.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{g.memberCount} jugadores</div>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>{g.code}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
