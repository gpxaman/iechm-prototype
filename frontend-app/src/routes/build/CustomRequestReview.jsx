import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { TopBar } from '../../components/Shell.jsx';
import { Timeline, FileList } from '../../components/Domain.jsx';
import Icon from '../../lib/icons.jsx';
import { api } from '../../lib/api.js';
import { REQUEST_STAGES, REQUEST_STAGE_LABEL, REQUEST_STAGE_DESC } from '../../lib/constants.js';
import { useStore } from '../../lib/store.js';

export default function CustomRequestReview() {
  const { id } = useParams();
  const [cr, setCr] = useState(null);
  const showToast = useStore((s) => s.showToast);

  const reload = () => api.customRequest(id).then(setCr);
  useEffect(() => { reload(); }, [id]);

  if (!cr) return <main className="screen"><TopBar title="Request Status" back /></main>;

  const advance = async () => {
    const idx = REQUEST_STAGES.indexOf(cr.status);
    const next = REQUEST_STAGES[Math.min(idx + 1, REQUEST_STAGES.length - 1)];
    await api.updateCustomRequest(id, { status: next });
    reload();
  };
  const approve = async () => { await api.updateCustomRequest(id, { status: 'approved' }); showToast('Quote approved'); reload(); };
  const provideInfo = async () => { await api.updateCustomRequest(id, { status: 'feasibility' }); showToast('Info received — thanks!'); reload(); };

  return (
    <main className="screen">
      <TopBar title="Request Status" back />
      <div className="pad stack">
        <div>
          <h1 style={{ fontSize: 18 }}>{cr.title}</h1>
          <p style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 6, lineHeight: 1.5 }}>{cr.description}</p>
        </div>
        <div className="card card-pad">
          <div className="kv"><span className="k">Material</span><span className="v">{cr.material}</span></div><hr className="divider" />
          <div className="kv"><span className="k">Dimensions</span><span className="v">{cr.dims}</span></div><hr className="divider" />
          <div className="kv"><span className="k">Quantity</span><span className="v">{cr.quantity}</span></div><hr className="divider" />
          <div className="kv"><span className="k">Finish</span><span className="v">{cr.finish}</span></div><hr className="divider" />
          <div className="kv"><span className="k">Timeline</span><span className="v">{cr.timeline}</span></div>
        </div>
        {cr.files.length > 0 && (
          <div>
            <div className="tag" style={{ marginBottom: 6 }}>Files</div>
            <FileList files={cr.files} />
          </div>
        )}
        <div className="card card-pad">
          <div className="section-title" style={{ marginBottom: 6 }}>Status</div>
          <Timeline stages={REQUEST_STAGES} labels={REQUEST_STAGE_LABEL} descs={REQUEST_STAGE_DESC} currentKey={cr.status} />
        </div>
        {cr.status === 'quote' && <button className="btn btn-primary" onClick={approve}>Approve quote</button>}
        {cr.status === 'info' && <button className="btn btn-primary" onClick={provideInfo}>Provide missing info</button>}
        <button className="btn btn-ghost btn-sm" onClick={advance}><Icon name="refresh" size={14} /> (Demo) advance status</button>
      </div>
    </main>
  );
}
