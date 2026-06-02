import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';

/* ─── Componente tarjeta de grupo ─── */
function GroupCard({ group, isOwner }) {
  const medals = ['🥇','🥈','🥉'];
  return (
    <Link to={`/mis-grupos/${group._id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ cursor: 'pointer', transition: 'border-color 0.15s', height: '100%' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '12px', flexShrink: 0,
            background: group.image ? `url(${group.image}) center/cover` : 'var(--accent-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px',
          }}>
            {!group.image && '👥'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {group.memberCount || group.members?.length || 0} jugador{(group.memberCount || group.members?.length || 0) !== 1 ? 'es' : ''}
              {isOwner && <span style={{ marginLeft: '6px', color: 'var(--accent)', fontWeight: 600 }}>· Admin</span>}
            </div>
          </div>
          <span style={{
            fontSize: '11px', padding: '3px 8px', borderRadius: '20px',
            background: group.isPrivate ? 'var(--bg-input)' : 'var(--green-dim)',
            color: group.isPrivate ? 'var(--text-muted)' : 'var(--green)',
            border: `1px solid ${group.isPrivate ? 'var(--border)' : 'rgba(16,185,129,0.3)'}`,
          }}>
            {group.isPrivate ? '🔒 Privado' : '🌐 Público'}
          </span>
        </div>

        {group.description && (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {group.description}
          </p>
        )}

        {/* Stats */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {group.myRank > 0 && (
            <span style={{ fontSize: '12px', background: 'var(--accent-dim)', color: 'var(--accent)', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
              {medals[group.myRank - 1] || `#${group.myRank}`} Tu posición
            </span>
          )}
          {group.myPoints > 0 && (
            <span style={{ fontSize: '12px', background: 'var(--bg-input)', color: 'var(--text-secondary)', padding: '3px 8px', borderRadius: '6px' }}>
              {group.myPoints} pts
            </span>
          )}
        </div>

        {/* Código */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 10px', background: 'var(--bg-input)', borderRadius: '8px',
        }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Código:</span>
          <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-primary)', flex: 1 }}>{group.code}</span>
          <button
            onClick={e => { e.preventDefault(); navigator.clipboard.writeText(group.code); toast.success('Código copiado'); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '14px', padding: '0 2px' }}
          >📋</button>
        </div>
      </div>
    </Link>
  );
}

/* ─── Modal Crear grupo ─── */
function CreateGroupModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', isPrivate: true, maxMembers: 50 });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/quiniela-groups', form);
      toast.success(`¡Grupo "${data.group.name}" creado!`);
      onCreated(data.group);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al crear el grupo');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Crear grupo</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Nombre del grupo *</label>
            <input className="form-input" placeholder='Ej: "Amigos Puebla"' value={form.name} onChange={set('name')} required maxLength={60} />
          </div>
          <div className="form-group">
            <label className="form-label">Descripción <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span></label>
            <textarea className="form-input" placeholder="¿De qué trata tu grupo?" value={form.description} onChange={set('description')} maxLength={300}
              style={{ resize: 'vertical', minHeight: '70px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Máx. jugadores</label>
              <input className="form-input" type="number" min={2} max={200} value={form.maxMembers} onChange={set('maxMembers')} />
            </div>
            <div className="form-group">
              <label className="form-label">Privacidad</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px' }}>
                <input type="checkbox" checked={form.isPrivate} onChange={set('isPrivate')} style={{ width: '16px', height: '16px' }} />
                <span style={{ fontSize: '14px' }}>{form.isPrivate ? '🔒 Privado' : '🌐 Público'}</span>
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Creando...' : '✅ Crear grupo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Modal Unirse por código ─── */
function JoinModal({ onClose, onJoined }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/quiniela-groups/join', { code });
      toast.success(data.message || '¡Te uniste al grupo!');
      onJoined(data.group);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Código inválido');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Unirse a un grupo</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '1.2rem' }}>
          Ingresa el código de 6 letras que te compartió el administrador del grupo.
        </p>
        <form onSubmit={handleJoin}>
          <div className="form-group">
            <label className="form-label">Código del grupo</label>
            <input className="form-input" placeholder="Ej: A3F9D2" value={code}
              onChange={e => setCode(e.target.value.toUpperCase())} maxLength={6} required
              style={{ textAlign: 'center', fontSize: '22px', fontWeight: 700, letterSpacing: '0.2em' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading || code.length < 6}>
              {loading ? 'Uniéndome...' : '🚀 Unirme'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Página principal ─── */
export default function MyGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { loadGroups(); }, []);

  const loadGroups = async () => {
    try {
      const { data } = await api.get('/quiniela-groups');
      setGroups(data.groups || []);
    } catch (err) {
      toast.error('Error al cargar grupos');
    } finally { setLoading(false); }
  };

  const handleCreated = (group) => {
    setShowCreate(false);
    navigate(`/mis-grupos/${group._id}`);
  };

  const handleJoined = (group) => {
    setShowJoin(false);
    navigate(`/mis-grupos/${group._id}`);
  };

  return (
    <div>
      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
      {showJoin   && <JoinModal onClose={() => setShowJoin(false)} onJoined={handleJoined} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>👥 Mis Grupos</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Compite con amigos, familia o compañeros de trabajo.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => setShowJoin(true)}>🔑 Unirse con código</button>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Crear grupo</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Cargando grupos...</div>
      ) : groups.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🏆</div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Aún no tienes grupos</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '1.5rem' }}>
            Crea un grupo para invitar a tus amigos, o únete a uno con un código.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Crear mi primer grupo</button>
            <button className="btn btn-secondary" onClick={() => setShowJoin(true)}>🔑 Tengo un código</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {groups.map(g => (
            <GroupCard key={g._id} group={g} isOwner={g.createdBy?._id === g.createdBy || g.createdBy === g.createdBy} />
          ))}
        </div>
      )}
    </div>
  );
}
