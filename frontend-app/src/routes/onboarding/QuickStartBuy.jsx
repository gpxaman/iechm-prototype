import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/Shell.jsx';
import Icon from '../../lib/icons.jsx';
import { useStore } from '../../lib/store.js';

export default function QuickStartBuy() {
  const navigate = useNavigate();
  const setOnboarded = useStore((s) => s.setOnboarded);
  const setMode = useStore((s) => s.setMode);

  const finish = () => {
    setOnboarded(true);
    setMode('buy');
    navigate('/buy');
  };

  const Row = ({ icon, label, onClick }) => (
    <button className="card card-pad tap" onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', width: '100%' }}>
      <Icon name={icon} size={20} />
      <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{label}</span>
      <Icon name="chevron" size={16} />
    </button>
  );

  return (
    <main className="screen">
      <TopBar title="Quick start" />
      <div className="hero"><h1 style={{ fontSize: 22 }}>What are you looking for?</h1></div>
      <div className="pad stack">
        <Row icon="search" label="Search products" onClick={() => navigate('/discover')} />
        <Row icon="compass" label="Browse categories" onClick={() => navigate('/discover')} />
        <Row icon="sparkle" label="Describe what I need" onClick={() => navigate('/discover')} />
        <Row icon="upload" label="Upload a requirement" onClick={() => navigate('/custom-request/new')} />
        <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={finish}>Explore products</button>
      </div>
    </main>
  );
}
