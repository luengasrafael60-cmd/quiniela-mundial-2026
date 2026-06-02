import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

export default function LoginPage() {
  const { login, loading } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(form.email, form.password);
    if (!result.ok) toast.error(result.error);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: '1rem',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>🏆</div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>Quiniela Mundial 2026</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Inicia sesión para hacer tus pronósticos</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="divider" />
          <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
            ¿No tienes cuenta?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Regístrate gratis</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
