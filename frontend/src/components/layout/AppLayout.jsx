import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const PLAYER_NAV = [
  { to:'/',             label:'Dashboard',        icon:'📊', exact:true },
  { to:'/grupos',       label:'Fase de Grupos',   icon:'🏟️' },
  // { to:'/partidos',     label:'Partidos',          icon:'⚽' },
  // { to:'/tablas',       label:'Tablas',            icon:'📊' },
  { to:'/eliminatoria', label:'Eliminatoria',      icon:'🏆' },
  { to:'/especiales',   label:'Especiales',        icon:'⭐' },
  { to:'/tabla',        label:'Ranking Global',    icon:'📋' },
];
const PLAYER_NAV2 = [
  { to:'/mis-grupos',   label:'Mis grupos',        icon:'👥' },
];

const ADMIN_NAV = [
  { to:'/admin',        label:'Dashboard',         icon:'📊', exact:true },
];

export default function AppLayout() {
  const { user, logout, isAdmin } = useAuthStore();
  const navigate = useNavigate();
  const admin = isAdmin();

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()||'?';

  const navStyle = ({ isActive }) => ({
    display:'flex', alignItems:'center', gap:'10px',
    padding:'9px 12px', borderRadius:'8px', fontSize:'14px',
    fontWeight: isActive?600:400,
    color: isActive ? (admin ? 'var(--purple)' : 'var(--accent)') : 'var(--text-secondary)',
    background: isActive ? (admin ? 'rgba(139,92,246,.15)' : 'var(--accent-dim)') : 'transparent',
    marginBottom:'2px', transition:'all .15s',
  });

  return (
    <div className="app-layout">
      <aside className="sidebar">
        {/* Logo */}
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
                <NavLink key={to} to={to} end={exact} style={navStyle}>
                  <span>{icon}</span>{label}
                </NavLink>
              ))}
            </>
          ) : (
            <>
              <div style={{ fontSize:'10px', fontWeight:700, color:'var(--text-muted)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:'6px', padding:'0 12px' }}>Pronósticos</div>
              {PLAYER_NAV.map(({ to, label, icon, exact }) => (
                <NavLink key={to} to={to} end={exact} style={navStyle}>
                  <span>{icon}</span>{label}
                </NavLink>
              ))}
              <div style={{ fontSize:'10px', fontWeight:700, color:'var(--text-muted)', letterSpacing:'.08em', textTransform:'uppercase', margin:'12px 0 6px', padding:'0 12px' }}>Social</div>
              {PLAYER_NAV2.map(({ to, label, icon }) => (
                <NavLink key={to} to={to} style={navStyle}>
                  <span>{icon}</span>{label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Perfil */}
        <div style={{ padding:'1rem', borderTop:'1px solid var(--border)' }}>
          {!admin && (
            <NavLink to="/perfil" style={{ textDecoration:'none', display:'block', marginBottom:'8px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px', borderRadius:'8px', transition:'background .15s', cursor:'pointer' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg-card)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{ width:36, height:36, borderRadius:'50%', background: user?.avatar ? `url(${user.avatar}) center/cover` : 'var(--accent-dim)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:700, color:'var(--accent)', flexShrink:0 }}>
                  {!user?.avatar && initials}
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

      <main className="main-content"><Outlet /></main>
    </div>
  );
}
