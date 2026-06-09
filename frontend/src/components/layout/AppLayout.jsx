import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const PLAYER_NAV = [
  { to:'/',             label:'Inicio',      icon:'📊', exact:true },
  { to:'/grupos',       label:'Grupos',      icon:'🏟️' },
  { to:'/partidos',     label:'Partidos',    icon:'⚽' },
  { to:'/eliminatoria', label:'Llaves',      icon:'🏆' },
  { to:'/tabla',        label:'Ranking',     icon:'📋' },
];

const PLAYER_NAV_MORE = [
  { to:'/tablas',       label:'Tablas',      icon:'📊' },
  { to:'/especiales',   label:'Especiales',  icon:'⭐' },
  { to:'/mis-grupos',   label:'Mis grupos',  icon:'👥' },
  { to:'/perfil',       label:'Perfil',      icon:'👤' },
];

const ADMIN_NAV = [
  { to:'/admin', label:'Dashboard', icon:'📊', exact:true },
];

export default function AppLayout() {
  const { user, logout, isAdmin } = useAuthStore();
  const navigate = useNavigate();
  const admin = isAdmin();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()||'?';

  const navStyle = ({ isActive }) => ({
    display:'flex', alignItems:'center', gap:'10px',
    padding:'9px 12px', borderRadius:'8px', fontSize:'14px',
    fontWeight: isActive?600:400,
    color: isActive ? (admin ? 'var(--purple)' : 'var(--accent)') : 'var(--text-secondary)',
    background: isActive ? (admin ? 'rgba(139,92,246,.15)' : 'var(--accent-dim)') : 'transparent',
    marginBottom:'2px', transition:'all .15s', textDecoration:'none',
  });

  const mobileNavStyle = ({ isActive }) => ({
    display:'flex', flexDirection:'column', alignItems:'center', gap:'3px',
    padding:'6px 8px', borderRadius:'8px', fontSize:'10px', fontWeight: isActive?700:400,
    color: isActive ? 'var(--accent)' : 'var(--text-muted)',
    textDecoration:'none', flex:1, minWidth:0,
  });

  return (
    <div className="app-layout">
      {/* ── Sidebar desktop ── */}
      <aside className="sidebar">
        <div style={{ padding:'1.5rem 1.25rem', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <span style={{ fontSize:'24px' }}>🌍</span>
            <div>
              <div style={{ fontWeight:700, fontSize:'15px', lineHeight:1.2 }}>Quiniela</div>
              <div style={{ fontSize:'12px', color: admin ? 'var(--purple)' : 'var(--accent)', fontWeight:600 }}>
                {admin ? 'Administrador' : 'Mundial 2026'}
              </div>
            </div>
          </div>
        </div>

        <nav style={{ padding:'1rem .75rem', flex:1, overflowY:'auto' }}>
          {admin ? (
            <>
              <div style={{ fontSize:'10px', fontWeight:700, color:'var(--text-muted)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:'6px', padding:'0 12px' }}>Administración</div>
              {ADMIN_NAV.map(({ to, label, icon, exact }) => (
                <NavLink key={to} to={to} end={exact} style={navStyle}><span>{icon}</span>{label}</NavLink>
              ))}
            </>
          ) : (
            <>
              <div style={{ fontSize:'10px', fontWeight:700, color:'var(--text-muted)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:'6px', padding:'0 12px' }}>Pronósticos</div>
              {PLAYER_NAV.map(({ to, label, icon, exact }) => (
                <NavLink key={to} to={to} end={exact} style={navStyle}><span>{icon}</span>{label}</NavLink>
              ))}
              <div style={{ fontSize:'10px', fontWeight:700, color:'var(--text-muted)', letterSpacing:'.08em', textTransform:'uppercase', margin:'12px 0 6px', padding:'0 12px' }}>Más</div>
              {PLAYER_NAV_MORE.map(({ to, label, icon }) => (
                <NavLink key={to} to={to} style={navStyle}><span>{icon}</span>{label}</NavLink>
              ))}
            </>
          )}
        </nav>

        <div style={{ padding:'1rem', borderTop:'1px solid var(--border)' }}>
          {!admin && (
            <NavLink to="/perfil" style={{ textDecoration:'none', display:'block', marginBottom:'8px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px', borderRadius:'8px', transition:'background .15s', cursor:'pointer' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg-card)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'var(--accent-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:700, color:'var(--accent)', flexShrink:0 }}>
                  {initials}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'13px', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name}</div>
                  <div style={{ fontSize:'11px', color:'var(--accent)', fontWeight:600 }}>
                    {user?.totalPoints||0} pts
                    {user?.rank && <span style={{ color:'var(--text-muted)', fontWeight:400 }}> · #{user.rank}</span>}
                  </div>
                </div>
              </div>
            </NavLink>
          )}
          {admin && (
            <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px', marginBottom:'8px' }}>
              <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(139,92,246,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 }}>⚙️</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'13px', fontWeight:600 }}>{user?.name}</div>
                <div style={{ fontSize:'11px', color:'var(--purple)', fontWeight:600 }}>Administrador</div>
              </div>
            </div>
          )}
          <button className="btn btn-ghost btn-sm btn-full" onClick={handleLogout} style={{ justifyContent:'center' }}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Mobile header ── */}
      <header className="mobile-header">
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ fontSize:'20px' }}>🌍</span>
          <span style={{ fontWeight:700, fontSize:'15px' }}>Quiniela 2026</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          {!admin && <NotificationBell />}
          <button onClick={handleLogout} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:'13px', cursor:'pointer', padding:'6px 10px', borderRadius:'6px', border:'1px solid var(--border)' }}>
            Salir
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="main-content"><Outlet /></main>

      {/* ── Mobile bottom navigation ── */}
      {!admin && (
        <>
          <nav className="mobile-bottom-nav">
            {PLAYER_NAV.map(({ to, label, icon, exact }) => (
              <NavLink key={to} to={to} end={exact} style={mobileNavStyle} onClick={() => setMenuOpen(false)}>
                <span style={{ fontSize:'20px' }}>{icon}</span>
                <span>{label}</span>
              </NavLink>
            ))}
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', padding:'6px 8px', borderRadius:'8px', fontSize:'10px', fontWeight:400, color: menuOpen ? 'var(--accent)' : 'var(--text-muted)', background:'none', border:'none', cursor:'pointer', flex:1 }}>
              <span style={{ fontSize:'20px' }}>☰</span>
              <span>Más</span>
            </button>
          </nav>

          {/* More menu drawer */}
          {menuOpen && (
            <div style={{ position:'fixed', bottom:'65px', left:0, right:0, background:'var(--bg-card)', borderTop:'1px solid var(--border)', borderRadius:'16px 16px 0 0', padding:'1rem', zIndex:200, boxShadow:'0 -4px 20px rgba(0,0,0,.3)' }}
              onClick={() => setMenuOpen(false)}>
              <div style={{ width:40, height:4, background:'var(--border)', borderRadius:2, margin:'0 auto 1rem' }} />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
                {PLAYER_NAV_MORE.map(({ to, label, icon }) => (
                  <NavLink key={to} to={to} style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:'10px', padding:'12px', borderRadius:'10px', background:'var(--bg-input)', color:'var(--text-primary)', fontSize:'14px', fontWeight:500 }}>
                    <span style={{ fontSize:'20px' }}>{icon}</span>{label}
                  </NavLink>
                ))}
                <button onClick={handleLogout} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px', borderRadius:'10px', background:'rgba(239,68,68,.1)', color:'var(--red)', fontSize:'14px', fontWeight:500, border:'none', cursor:'pointer', gridColumn:'span 2' }}>
                  <span style={{ fontSize:'20px' }}>🚪</span>Cerrar sesión
                </button>
              </div>
            </div>
          )}
          {menuOpen && <div style={{ position:'fixed', inset:0, zIndex:199 }} onClick={() => setMenuOpen(false)} />}
        </>
      )}

      {/* Admin mobile bottom nav */}
      {admin && (
        <nav className="mobile-bottom-nav">
          <NavLink to="/admin" end style={mobileNavStyle}>
            <span style={{ fontSize:'20px' }}>📊</span>
            <span>Admin</span>
          </NavLink>
          <button onClick={handleLogout} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', padding:'6px 8px', fontSize:'10px', color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', flex:1 }}>
            <span style={{ fontSize:'20px' }}>🚪</span>
            <span>Salir</span>
          </button>
        </nav>
      )}
    </div>
  );
}
