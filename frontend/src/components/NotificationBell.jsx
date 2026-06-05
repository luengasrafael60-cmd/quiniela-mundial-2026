import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';

export default function NotificationBell() {
  const [notifs, setNotifs]   = useState([]);
  const [unread, setUnread]   = useState(0);
  const [open, setOpen]       = useState(false);
  const ref = useRef();

  const load = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifs(data.notifications || []);
      setUnread(data.unread || 0);
    } catch {}
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifs(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
      setUnread(0);
    } catch {}
  };

  const typeColor = (type) => ({
    phase_open:    'var(--green)',
    phase_closing: 'var(--accent)',
    reminder:      'var(--accent-2)',
    custom:        'var(--purple)',
  })[type] || 'var(--accent)';

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date);
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'Ahora';
    if (mins < 60) return `Hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `Hace ${hrs}h`;
    return `Hace ${Math.floor(hrs / 24)}d`;
  };

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background:'none', border:'none', cursor:'pointer', position:'relative', padding:'6px', borderRadius:'8px', color:'var(--text-secondary)', fontSize:'20px', lineHeight:1, transition:'color .15s' }}
        onMouseEnter={e => e.currentTarget.style.color='var(--text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color='var(--text-secondary)'}
      >
        🔔
        {unread > 0 && (
          <span style={{ position:'absolute', top:2, right:2, background:'var(--red)', color:'#fff', fontSize:'10px', fontWeight:700, borderRadius:'99px', minWidth:16, height:16, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', width:340, background:'var(--bg-card)', border:'1px solid var(--border-strong)', borderRadius:'var(--radius-lg)', boxShadow:'var(--shadow)', zIndex:300, overflow:'hidden' }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid var(--border)' }}>
            <span style={{ fontWeight:600, fontSize:'14px' }}>Notificaciones {unread > 0 && <span style={{ color:'var(--red)', fontSize:'12px' }}>({unread} nuevas)</span>}</span>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'12px', color:'var(--accent)', fontWeight:500 }}>
                Marcar todas leídas
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight:360, overflowY:'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ padding:'2rem', textAlign:'center', color:'var(--text-muted)', fontSize:'13px' }}>
                Sin notificaciones
              </div>
            ) : notifs.map(n => (
              <div key={n._id}
                onClick={() => !n.read && markRead(n._id)}
                style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', cursor: n.read ? 'default' : 'pointer', background: n.read ? 'transparent' : 'rgba(245,158,11,0.04)', transition:'background .15s' }}
                onMouseEnter={e => { if(!n.read) e.currentTarget.style.background='rgba(245,158,11,0.08)'; }}
                onMouseLeave={e => { if(!n.read) e.currentTarget.style.background='rgba(245,158,11,0.04)'; }}
              >
                <div style={{ display:'flex', alignItems:'flex-start', gap:'10px' }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background: n.read ? 'transparent' : typeColor(n.type), flexShrink:0, marginTop:5 }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'13px', fontWeight: n.read ? 400 : 600, lineHeight:1.3, marginBottom:3 }}>{n.title}</div>
                    <div style={{ fontSize:'12px', color:'var(--text-secondary)', lineHeight:1.4 }}>{n.message}</div>
                    <div style={{ fontSize:'11px', color:'var(--text-muted)', marginTop:4 }}>{timeAgo(n.createdAt)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
