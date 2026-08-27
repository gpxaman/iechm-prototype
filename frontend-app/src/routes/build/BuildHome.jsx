import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar, NotifBell } from '../../components/Shell.jsx';
import { ProjectCard } from '../../components/Domain.jsx';
import Icon from '../../lib/icons.jsx';
import { api } from '../../lib/api.js';

export default function BuildHome() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  useEffect(() => { api.projects().then(setProjects); }, []);

  return (
    <main className="screen">
      <TopBar title="Build" showMode right={<NotifBell />} />
      <div className="hero"><h1>What are you building?</h1></div>
      <div className="pad">
        <button className="ai-input-card tap" style={{ width: '100%', border: 'none' }} onClick={() => navigate('/build/assistant')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-faint)', fontSize: 14.5 }}>
            <Icon name="sparkle" size={18} /> Tell us about your idea…
          </div>
          <div className="ai-input-row">
            <span className="chip chip-neutral"><Icon name="mic" size={12} /> Speak</span>
            <span className="chip chip-neutral"><Icon name="image" size={12} /> Image</span>
            <span className="chip chip-neutral"><Icon name="doc" size={12} /> Document</span>
          </div>
        </button>
      </div>
      <div className="section">
        <div className="section-head">
          <span className="section-title">Continue your projects</span>
          <button className="section-link" onClick={() => navigate('/projects')}>See all</button>
        </div>
      </div>
      <div className="pad stack" style={{ paddingTop: 0 }}>
        {projects.slice(0, 3).map((p) => <ProjectCard key={p.id} project={p} />)}
      </div>
      <div className="pad" style={{ paddingTop: 4, paddingBottom: 20 }}>
        <button className="btn btn-secondary" onClick={() => navigate('/build/assistant')}><Icon name="plus" size={16} /> Start a new project</button>
      </div>
    </main>
  );
}
