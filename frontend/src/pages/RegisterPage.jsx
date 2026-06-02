import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

export default function RegisterPage() {
  const { register, loading } = useAuthStore();
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirm: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Las contraseñas no coinciden');
    if (form.password.length < 6) return toast.error('Mínimo 6 caracteres en la contraseña');
    const result = await register(form.name, form.email, form.password, form.username);
    if (!result.ok) toast.error(result.error);
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '52px', marginBottom: '12px' }}>🌍</div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>Crear cuenta</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Únete a la Quiniela del Mundial 2026</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nombre completo *</label>
              <input className="form-input" placeholder="Tu nombre" value={form.name} onChange={set('name')} required />
            </div>
            <div className="form-group">
              <label className="form-label">
                Nombre de usuario <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opcional)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '14px' }}>@</span>
                <input className="form-input" placeholder="usuario" value={form.username} onChange={set('username')}
                  style={{ paddingLeft: '28px' }}
                  pattern="[a-zA-Z0-9_]+" title="Solo letras, números y guion bajo" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" placeholder="tu@email.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña *</label>
              <input className="form-input" type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={set('password')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmar contraseña *</label>
              <input className="form-input" type="password" placeholder="Repite tu contraseña" value={form.confirm} onChange={set('confirm')} required />
            </div>
            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
            </button>
          </form>
          <div className="divider" />
          <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
            ¿Ya tienes cuenta? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
