import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TopBar } from '../../components/Shell.jsx';
import { RequirementRow, ProductCardRow, CustomRequestCard, EmptyState, FileList } from '../../components/Domain.jsx';
import Icon from '../../lib/icons.jsx';
import { api } from '../../lib/api.js';
import { useStore } from '../../lib/store.js';
import { REQUEST_STAGE_LABEL, REQUEST_STAGES } from '../../lib/constants.js';

const TABS = [['overview', 'Overview'], ['requirements', 'Requirements'], ['products', 'Products'], ['custom', 'Custom'], ['files', 'Files'], ['ai', 'AI Assistant']];

export default function ProjectOverview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tab, setTab] = useState('overview');
  const [products, setProducts] = useState({});
  const [customRequests, setCustomRequests] = useState([]);
  const [aiReply, setAiReply] = useState(null);
  const showToast = useStore((s) => s.showToast);
  const setCartCount = useStore((s) => s.setCartCount);

  const reload = () => api.project(id).then(setProject);
  useEffect(() => { reload(); setTab('overview'); setAiReply(null); }, [id]);

  useEffect(() => {
    if (!project) return;
    api.products().then((all) => {
      const map = {};
      all.forEach((p) => { map[p.id] = p; });
      setProducts(map);
    });
    api.customRequests().then((all) => setCustomRequests(all.filter((c) => c.projectId === project.id)));
  }, [project?.id]);

  if (!project) return <main className="screen"><TopBar back /></main>;

  const total = project.requirements.length;
  const avail = project.requirements.filter((r) => r.status === 'available');
  const review = project.requirements.filter((r) => r.status === 'similar' || r.status === 'info').length;
  const custom = project.requirements.filter((r) => r.status === 'custom').length;
  const pct = total ? Math.round((avail.length / total) * 100) : 0;

  const addAllAvailable = async () => {
    let n = 0;
    for (const r of avail) {
      if (r.matchedProductId) { await api.addToCart(r.matchedProductId, products[r.matchedProductId]?.moq || 1); n++; }
    }
    const c = await api.cart();
    setCartCount(c.reduce((s, l) => s + l.qty, 0));
    showToast(n + ' items added to cart');
  };

  const projectProducts = project.requirements.filter((r) => r.matchedProductId).map((r) => products[r.matchedProductId]).filter(Boolean);

  const askProject = (text) => {
    const map = {
      'Find cheaper alternatives.': 'I compared unit prices across your matched components — switching the Bluetooth module to a similar lower-cost option could save roughly 18% at your target volume, with a 3-day longer lead time.',
      'Reduce my lead time.': 'Your longest lead-time item is currently at 20 days. Ordering the battery and MCU together from the same production run could shave about 5 days off your critical path.',
      "Explain the missing components.": "Items marked \"Need info\" don't have enough detail yet to match confidently — usually target quantity or a dimension. Add that in the requirement detail and I'll re-match it.",
    };
    setAiReply(map[text] || 'Let me look into that for you.');
  };

  return (
    <main className="screen">
      <TopBar title={project.name} back />
      <div className="hscroll" style={{ padding: '10px 16px 4px' }}>
        {TABS.map(([k, l]) => (
          <button key={k} className={'selectchip' + (tab === k ? ' sel' : '')} type="button" onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="pad stack">
          <p style={{ fontSize: 13, color: 'var(--text-faint)', lineHeight: 1.5 }}>{project.prompt}</p>
          <div className="card card-pad">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span className="tag">Total requirements</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 18 }}>{total}</span>
            </div>
            <div className="progress" style={{ marginTop: 10 }}><i style={{ width: pct + '%' }} /></div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              <span style={{ fontSize: 12.5, color: 'var(--success-600)', fontWeight: 600 }}><Icon name="check" size={12} /> {avail.length} Available</span>
              <span style={{ fontSize: 12.5, color: 'var(--teal-600)', fontWeight: 600 }}>{review} Review needed</span>
              <span style={{ fontSize: 12.5, color: 'var(--copper-600)', fontWeight: 600 }}>{custom} Custom</span>
            </div>
          </div>
          <button className="btn btn-primary" onClick={addAllAvailable}><Icon name="cart" size={16} /> Add all available products to cart</button>
          <div className="btn-block-row">
            <button className="btn btn-outline-accent btn-sm" style={{ flex: 1, width: 'auto' }} onClick={() => setTab('custom')}>
              <Icon name="plus" size={14} /> Request missing custom
            </button>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1, width: 'auto' }} onClick={() => showToast('AI is re-checking your requirements for savings…', 'sparkle')}>
              <Icon name="sparkle" size={14} /> Ask AI to optimize
            </button>
          </div>
          {custom + review > 0 && (
            <button className="btn btn-ghost" onClick={() => navigate(`/project/${project.id}/pilot`)}><Icon name="truck" size={16} /> Need a pilot run?</button>
          )}
        </div>
      )}

      {tab === 'requirements' && (
        <div className="pad stack">
          {project.requirements.map((r) => (
            <RequirementRow key={r.id} req={r} onOpen={() => navigate(`/project/${project.id}/requirement/${r.id}`)} />
          ))}
        </div>
      )}

      {tab === 'products' && (
        <div className="pad stack">
          {projectProducts.length
            ? projectProducts.map((p) => <ProductCardRow key={p.id} product={p} onAdd={() => api.addToCart(p.id, p.moq).then(() => showToast('Added to cart'))} />)
            : <EmptyState icon="box" title="No products yet" body="Available requirements will show up here once matched." />}
        </div>
      )}

      {tab === 'custom' && (
        <div className="pad stack">
          {customRequests.map((c) => <CustomRequestCard key={c.id} cr={c} stageLabel={REQUEST_STAGE_LABEL} stages={REQUEST_STAGES} />)}
          <button className="btn btn-outline-accent" onClick={() => navigate('/custom-request/new', { state: { projectId: project.id } })}>
            <Icon name="plus" size={16} /> Request a custom component
          </button>
        </div>
      )}

      {tab === 'files' && (
        <div className="pad">
          <EmptyState icon="doc" title="No files uploaded" body="Sketches, CAD files, and documents you share with AI appear here." />
          <button className="upload-slot tap" onClick={() => showToast('File attached (demo)')}>
            <Icon name="upload" size={18} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>Upload a file</div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>PDF, image, or CAD/design file</div>
            </div>
          </button>
        </div>
      )}

      {tab === 'ai' && (
        <div className="pad">
          <p style={{ fontSize: 13, color: 'var(--text-faint)', marginBottom: 10 }}>Ask about this project specifically.</p>
          <div className="chiprow">
            <button className="selectchip" type="button" onClick={() => askProject('Find cheaper alternatives.')}>Find cheaper alternatives</button>
            <button className="selectchip" type="button" onClick={() => askProject('Reduce my lead time.')}>Reduce my lead time</button>
            <button className="selectchip" type="button" onClick={() => askProject('Explain the missing components.')}>Explain missing components</button>
          </div>
          {aiReply && (
            <div style={{ marginTop: 14 }}>
              <div className="bubble-ai">
                <div className="avatar"><Icon name="sparkle" size={14} /></div>
                <div className="content">{aiReply}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
