import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TopBar } from '../../components/Shell.jsx';
import { StatusChip, ProductCardRow } from '../../components/Domain.jsx';
import Icon from '../../lib/icons.jsx';
import { api } from '../../lib/api.js';
import { useStore } from '../../lib/store.js';

export default function RequirementDetail() {
  const { projectId, reqId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [product, setProduct] = useState(null);
  const [aiReply, setAiReply] = useState(null);
  const showToast = useStore((s) => s.showToast);

  useEffect(() => { api.project(projectId).then(setProject); }, [projectId]);
  const req = project?.requirements.find((r) => r.id === reqId);

  useEffect(() => { if (req?.matchedProductId) api.product(req.matchedProductId).then(setProduct); }, [req?.matchedProductId]);

  if (!req) return <main className="screen"><TopBar title="Requirement" back /></main>;

  const askAlternatives = () => {
    setAiReply(
      <>Looking at similar parts to <b>{req.name}</b>… the closest alternatives trade a slightly longer lead time for a lower unit price. I can start a custom request if none of our stock options fit.</>,
    );
  };

  const remove = async () => {
    await api.deleteRequirement(projectId, reqId);
    showToast('Removed from project');
    navigate(-1);
  };

  return (
    <main className="screen">
      <TopBar title="Requirement" back />
      <div className="pad stack">
        <div>
          <div className="tag">{req.group}</div>
          <h1 style={{ fontSize: 19, marginTop: 6 }}>{req.name}</h1>
        </div>
        <StatusChip status={req.status} />
        {req.note && <p style={{ fontSize: 13, color: 'var(--text-faint)', lineHeight: 1.5 }}>{req.note}</p>}
        {product && <ProductCardRow product={product} onAdd={() => api.addToCart(product.id, product.moq).then(() => showToast('Added to cart'))} />}
        <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5 }}>What would you like to do?</div>
          <button className="btn btn-secondary btn-sm" onClick={askAlternatives}><Icon name="refresh" size={14} /> Ask AI for alternatives</button>
          <button className="btn btn-secondary btn-sm" onClick={remove}><Icon name="trash" size={14} /> Remove from project</button>
          <button className="btn btn-outline-accent btn-sm" onClick={() => navigate('/custom-request/new', { state: { projectId, prefill: req.name } })}>
            <Icon name="plus" size={14} /> Request custom instead
          </button>
        </div>
        {aiReply && (
          <div className="bubble-ai">
            <div className="avatar"><Icon name="sparkle" size={14} /></div>
            <div className="content">{aiReply}</div>
          </div>
        )}
      </div>
    </main>
  );
}
