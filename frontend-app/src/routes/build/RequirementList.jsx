import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/Shell.jsx';
import { StatusChip, RequirementGroupBlock, EmptyState } from '../../components/Domain.jsx';
import Icon from '../../lib/icons.jsx';
import { api } from '../../lib/api.js';
import { useStore } from '../../lib/store.js';

export default function RequirementList() {
  const navigate = useNavigate();
  const tmp = useStore((s) => s.tmp);
  const showToast = useStore((s) => s.showToast);
  const scenario = tmp.lastScenario;

  if (!scenario) {
    return (
      <main className="screen">
        <TopBar title="Suggested Requirements" back />
        <EmptyState icon="sparkle" title="Nothing generated yet" body="Describe what you're building in the Build Assistant first."
          ctaLabel="Open Build Assistant" onCta={() => navigate('/build/assistant')} />
      </main>
    );
  }

  const flat = scenario.groups.flatMap((g) => g.items);
  const avail = flat.filter((i) => i.status === 'available').length;
  const similar = flat.filter((i) => i.status === 'similar').length;
  const custom = flat.filter((i) => i.status === 'custom').length;
  const info = flat.filter((i) => i.status === 'info').length;

  const createProject = async () => {
    const proj = await api.createProject({ prompt: tmp.lastPrompt, scenario });
    showToast('Project created');
    navigate(`/project/${proj.id}`, { replace: true });
  };

  return (
    <main className="screen">
      <TopBar title="Suggested Requirements" back />
      <div className="pad" style={{ paddingBottom: 6 }}>
        <div className="card card-pad" style={{ background: 'var(--accent-bg)', borderColor: 'var(--accent)' }}>
          <div style={{ fontWeight: 700, fontSize: 14.5 }}>{scenario.label}</div>
          <div style={{ fontSize: 12.5, color: 'var(--copper-600)', marginTop: 2 }}>{scenario.summary}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <StatusChip status="available" text={avail + ' Available'} />
          <StatusChip status="similar" text={similar + ' Similar'} />
          <StatusChip status="custom" text={custom + ' Custom'} />
          {info > 0 && <StatusChip status="info" text={info + ' Need info'} />}
        </div>
      </div>
      <div className="pad" style={{ paddingTop: 0 }}><RequirementGroupBlock groups={scenario.groups} /></div>
      <div className="pad stack" style={{ paddingTop: 10, paddingBottom: 22 }}>
        <button className="btn btn-primary" onClick={createProject}><Icon name="layers" size={16} /> Create project</button>
        <div className="btn-block-row">
          <button className="btn btn-secondary btn-sm" style={{ flex: 1, width: 'auto' }} onClick={() => showToast('AI is re-checking your requirements for savings…', 'sparkle')}>
            <Icon name="sparkle" size={14} /> Ask AI to optimize
          </button>
          <button className="btn btn-secondary btn-sm" style={{ flex: 1, width: 'auto' }} onClick={() => navigate('/build/assistant')}>
            <Icon name="edit" size={14} /> Refine in chat
          </button>
        </div>
      </div>
    </main>
  );
}
