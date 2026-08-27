import { useNavigate } from 'react-router-dom';
import { useStore } from '../../lib/store.js';
import { Logo, Hazard } from '../../components/Shell.jsx';
import Icon from '../../lib/icons.jsx';

const CARDS = [
  { key: 'buy', icon: 'cart', title: 'Buy Products', desc: 'Find and purchase what you need.' },
  { key: 'build', icon: 'wrench', title: 'Build Something', desc: "Tell us what you're building and get everything you need." },
  { key: 'earn', icon: 'handshake', title: 'Earn With Us', desc: 'Bring business opportunities and earn commission.' },
];

export default function Welcome() {
  const navigate = useNavigate();
  const intent = useStore((s) => s.intent);
  const setIntent = useStore((s) => s.setIntent);

  return (
    <main className="screen">
      <div className="hero" style={{ paddingTop: 30 }}>
        <div style={{ marginBottom: 14 }}><Logo size="26px" /></div>
        <div className="kicker" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Hazard />Engineering the next frontier
        </div>
        <h1>What brings you here?</h1>
      </div>
      <div className="pad stack">
        {CARDS.map((c) => (
          <button
            key={c.key}
            className="card card-pad tap"
            onClick={() => setIntent(c.key)}
            style={{ textAlign: 'left', display: 'flex', gap: 14, alignItems: 'center' }}
          >
            <span className="iconbtn" style={{ width: 44, height: 44, background: 'var(--accent-bg)', color: 'var(--copper-600)' }}>
              <Icon name={c.icon} size={22} />
            </span>
            <span style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15.5 }}>{c.title}</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 2 }}>{c.desc}</div>
            </span>
            {intent === c.key && <Icon name="check" size={18} />}
          </button>
        ))}
        <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--text-faint)', marginTop: 6 }}>
          You can switch between these anytime.
        </p>
        <button className="btn btn-primary" style={{ marginTop: 8 }} disabled={!intent} onClick={() => navigate('/account')}>
          Continue
        </button>
      </div>
    </main>
  );
}
