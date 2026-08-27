import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar, Hazard } from '../../components/Shell.jsx';
import Icon from '../../lib/icons.jsx';
import { api } from '../../lib/api.js';
import { useStore, MODE_META } from '../../lib/store.js';

export default function You() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const mode = useStore((s) => s.mode);
  const openSheet = useStore((s) => s.openSheet);

  useEffect(() => { api.user().then(setUser); }, []);
  if (!user) return <main className="screen"><TopBar title="You" /></main>;

  const initials = (user.name || 'You').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  const Row = ({ icon, label, onClick, danger }) => (
    <button className="card card-pad tap" onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', width: '100%', color: danger ? 'var(--danger-600)' : undefined }}>
      <Icon name={icon} size={18} />
      <span style={{ flex: 1, fontWeight: 600, fontSize: 13.5 }}>{label}</span>
      {!danger && <Icon name="chevron" size={16} />}
    </button>
  );

  return (
    <main className="screen">
      <TopBar title="You" />
      <div className="pad" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div className="avatar-ph">{initials}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{user.name || 'Your name'}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 2 }}>{user.email || 'Add your email'}</div>
        </div>
      </div>
      <div className="pad" style={{ paddingTop: 4 }}>
        <div className="tag" style={{ marginBottom: 8 }}>Modes on this account</div>
        <div className="chiprow">
          {Object.entries(MODE_META).map(([k, m]) => (
            <span key={k} className={'chip ' + (mode === k ? 'chip-custom' : 'chip-neutral')}><Icon name={m.icon} size={12} /> {m.label}</span>
          ))}
        </div>
      </div>
      <div className="section"><div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 7 }}><Hazard />Why IECHM</div></div>
      <div className="pad" style={{ paddingTop: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="card card-pad" style={{ textAlign: 'center' }}><span style={{ color: 'var(--accent)' }}><Icon name="handshake" size={20} /></span><div style={{ fontSize: 11.5, fontWeight: 600, marginTop: 6 }}>Trusted Partner</div></div>
        <div className="card card-pad" style={{ textAlign: 'center' }}><span style={{ color: 'var(--accent)' }}><Icon name="bulb" size={20} /></span><div style={{ fontSize: 11.5, fontWeight: 600, marginTop: 6 }}>Innovative Thinking</div></div>
        <div className="card card-pad" style={{ textAlign: 'center' }}><span style={{ color: 'var(--accent)' }}><Icon name="medal" size={20} /></span><div style={{ fontSize: 11.5, fontWeight: 600, marginTop: 6 }}>Engineering Excellence</div></div>
        <div className="card card-pad" style={{ textAlign: 'center' }}><span style={{ color: 'var(--accent)' }}><Icon name="globe" size={20} /></span><div style={{ fontSize: 11.5, fontWeight: 600, marginTop: 6 }}>Global Impact</div></div>
      </div>
      <div className="section"><div className="section-title">Business</div></div>
      <div className="pad stack" style={{ paddingTop: 0 }}>
        <Row icon="building" label={user.isSupplier ? 'Manage supplier catalogue' : 'Register as a Supplier'} onClick={() => navigate('/supplier/register')} />
        <Row icon="handshake" label={user.isPartner ? 'Deal Partner settings' : 'Become a Deal Partner'} onClick={() => navigate('/earn/onboarding')} />
      </div>
      <div className="section"><div className="section-title">Account</div></div>
      <div className="pad stack" style={{ paddingTop: 0, paddingBottom: 24 }}>
        <Row icon="user" label="Profile details" onClick={() => {}} />
        <Row icon="shield" label="Security & verification" onClick={() => {}} />
        <Row icon="layers" label="Switch mode" onClick={() => openSheet('mode')} />
        <Row icon="logout" label="Sign out" danger onClick={() => navigate('/')} />
      </div>
    </main>
  );
}
