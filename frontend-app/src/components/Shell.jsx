import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../lib/icons.jsx';
import { useStore, MODE_META, ROOT_SCREEN } from '../lib/store.js';

export function Logo({ size = '20px' }) {
  return (
    <span className="logo-mark" style={{ fontSize: size }}>
      I
      <span className="logo-e">
        <i /><i /><i />
      </span>
      CHM
    </span>
  );
}

export function Hazard() {
  return <span className="hazard" />;
}

export function TopBar({ title, sub, back = false, showMode = false, right = null }) {
  const navigate = useNavigate();
  const mode = useStore((s) => s.mode);
  const openSheet = useStore((s) => s.openSheet);
  const m = MODE_META[mode];
  return (
    <div className="topbar">
      {back && (
        <button className="topbar-icon" onClick={() => navigate(-1)} aria-label="Back">
          <Icon name="back" size={18} />
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="topbar-title">{title}</div>
        {sub && <div className="topbar-sub">{sub}</div>}
      </div>
      {showMode && (
        <button className="mode-pill" onClick={() => openSheet('mode')}>
          <span className="swatch"><Icon name={m.icon} size={12} /></span>
          <span className="lbl">{m.label}</span>
          <span className="car"><Icon name="chevrondown" size={10} /></span>
        </button>
      )}
      {right}
    </div>
  );
}

export function NotifBell() {
  const navigate = useNavigate();
  const unread = useStore((s) => s.unreadCount);
  return (
    <button className="topbar-icon" style={{ position: 'relative' }} onClick={() => navigate('/activity')}>
      <Icon name="bell" size={17} />
      {unread > 0 && <span className="badge-count" style={{ top: -3, right: -3 }}>{unread}</span>}
    </button>
  );
}

const TABS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'discover', label: 'Discover', icon: 'compass', path: '/discover' },
  { id: 'projects', label: 'Projects', icon: 'layers', path: '/projects' },
  { id: 'activity', label: 'Activity', icon: 'activity', path: '/activity' },
  { id: 'you', label: 'You', icon: 'user', path: '/you' },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = useStore((s) => s.mode);
  const unread = useStore((s) => s.unreadCount);
  const homePath = ROOT_SCREEN[mode];

  return (
    <nav className="bottomnav">
      {TABS.map((t) => {
        const path = t.id === 'home' ? homePath : t.path;
        const active = location.pathname === path;
        return (
          <button key={t.id} className={'navitem' + (active ? ' active' : '')} onClick={() => navigate(path)}>
            <Icon name={t.icon} size={21} />
            <span>{t.label}</span>
            {t.id === 'activity' && unread > 0 && <span className="badge-count" style={{ top: 2, right: '28%' }}>{unread}</span>}
          </button>
        );
      })}
    </nav>
  );
}

export function ModeSheetContent() {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const closeSheet = useStore((s) => s.closeSheet);
  const navigate = useNavigate();

  const pick = (key) => {
    setMode(key);
    closeSheet();
    navigate(ROOT_SCREEN[key]);
  };

  return (
    <>
      <div className="sheet-head">
        <h3 style={{ fontSize: 16 }}>Switch mode</h3>
        <button className="topbar-icon" onClick={closeSheet}><Icon name="close" size={16} /></button>
      </div>
      <div className="sheet-body stack">
        <p style={{ fontSize: 12.5, color: 'var(--text-faint)', marginBottom: 2 }}>
          One account. Move between modes anytime — nothing is locked.
        </p>
        {Object.entries(MODE_META).map(([key, m]) => (
          <button
            key={key}
            className="card card-pad tap"
            onClick={() => pick(key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              borderColor: mode === key ? 'var(--accent)' : 'var(--border)',
              background: mode === key ? 'var(--accent-bg)' : 'var(--surface)',
            }}
          >
            <span className="iconbtn" style={{ background: 'var(--surface)', color: 'var(--copper-600)' }}>
              <Icon name={m.icon} size={18} />
            </span>
            <span style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>{m.label}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>{m.desc}</div>
            </span>
            {mode === key && <Icon name="check" size={18} />}
          </button>
        ))}
      </div>
    </>
  );
}

export function SheetHost() {
  const sheet = useStore((s) => s.sheet);
  const closeSheet = useStore((s) => s.closeSheet);
  const show = !!sheet;
  return (
    <>
      <div className={'overlay' + (show ? ' show' : '')} onClick={closeSheet} />
      <div className={'sheet' + (show ? ' show' : '')}>
        <div className="sheet-handle" />
        {sheet === 'mode' ? <ModeSheetContent /> : sheet}
      </div>
    </>
  );
}

export function ToastHost() {
  const toast = useStore((s) => s.toast);
  return (
    <div className={'toast' + (toast ? ' show' : '')}>
      {toast && (
        <>
          <Icon name={toast.icon} size={16} />
          <span>{toast.message}</span>
        </>
      )}
    </div>
  );
}
