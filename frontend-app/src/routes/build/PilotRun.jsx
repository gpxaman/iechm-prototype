import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TopBar } from '../../components/Shell.jsx';
import Icon from '../../lib/icons.jsx';
import { api } from '../../lib/api.js';
import { useStore } from '../../lib/store.js';

export default function PilotRun() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [qty, setQty] = useState('50 units');
  const [notes, setNotes] = useState('');
  const showToast = useStore((s) => s.showToast);

  useEffect(() => { api.project(id).then(setProject); }, [id]);

  const submit = () => {
    showToast('Pilot run requested — our manufacturing team will follow up');
    navigate(-1);
  };

  return (
    <main className="screen">
      <TopBar title="Pilot Run Request" back />
      <div className="pad stack">
        <h1 style={{ fontSize: 18 }}>Request a Pilot Run</h1>
        <p style={{ fontSize: 13, color: 'var(--text-faint)', lineHeight: 1.5 }}>
          We've pre-filled this from your project — just confirm the details and tell us what's missing.
        </p>
        <div className="card card-pad">
          <div className="section-title" style={{ marginBottom: 8 }}>From project</div>
          <div className="kv"><span className="k">Project</span><span className="v">{project?.name || '—'}</span></div><hr className="divider" />
          <div className="kv"><span className="k">Components</span><span className="v">{project ? project.requirements.length : 0} included</span></div><hr className="divider" />
          <div className="kv"><span className="k">Custom requirements</span><span className="v">{project ? project.customRequestIds.length : 0} included</span></div><hr className="divider" />
          <div className="kv"><span className="k">Files</span><span className="v">0 attached</span></div>
        </div>
        <div className="field">
          <label>Target pilot quantity</label>
          <input className="input" value={qty} onChange={(e) => setQty(e.target.value)} />
        </div>
        <div className="field">
          <label>Anything else we should know?</label>
          <textarea className="input" placeholder="Optional notes for our manufacturing team…" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={submit}><Icon name="truck" size={16} /> Request Pilot Run</button>
      </div>
    </main>
  );
}
