import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/Shell.jsx';
import { ProjectCard, CustomRequestCard, EmptyState } from '../../components/Domain.jsx';
import Icon from '../../lib/icons.jsx';
import { api } from '../../lib/api.js';
import { REQUEST_STAGE_LABEL, REQUEST_STAGES } from '../../lib/constants.js';

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [customRequests, setCustomRequests] = useState([]);
  useEffect(() => {
    api.projects().then(setProjects);
    api.customRequests().then(setCustomRequests);
  }, []);

  return (
    <main className="screen">
      <TopBar title="Projects" right={<button className="topbar-icon" onClick={() => navigate('/build/assistant')}><Icon name="plus" size={17} /></button>} />
      {!projects.length ? (
        <EmptyState icon="layers" title="What do you want to build?" body="Start a project and AI will break it into sourced requirements."
          ctaLabel="Start a Project" onCta={() => navigate('/build/assistant')} />
      ) : (
        <div className="pad stack">
          {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
          <button className="btn btn-secondary" onClick={() => navigate('/build/assistant')}><Icon name="plus" size={16} /> Start a new project</button>
        </div>
      )}
      <div className="section"><div className="section-title">Custom requests</div></div>
      <div className="pad stack" style={{ paddingTop: 0, paddingBottom: 20 }}>
        {customRequests.length
          ? customRequests.slice(0, 3).map((c) => <CustomRequestCard key={c.id} cr={c} stageLabel={REQUEST_STAGE_LABEL} stages={REQUEST_STAGES} />)
          : <EmptyState icon="wrench" title="Need something we don't currently offer?" body="Request something custom — no spec sheet required."
              ctaLabel="Request Something Custom" onCta={() => navigate('/custom-request/new')} />}
      </div>
    </main>
  );
}
