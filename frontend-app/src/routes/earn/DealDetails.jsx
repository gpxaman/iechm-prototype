import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { TopBar } from '../../components/Shell.jsx';
import { Timeline } from '../../components/Domain.jsx';
import Icon from '../../lib/icons.jsx';
import { api, money } from '../../lib/api.js';
import { DEAL_STAGES, DEAL_STAGE_LABEL, DEAL_STAGE_DESC } from '../../lib/constants.js';

export default function DealDetails() {
  const { id } = useParams();
  const [deal, setDeal] = useState(null);
  const reload = () => api.deal(id).then(setDeal);
  useEffect(() => { reload(); }, [id]);

  if (!deal) return <main className="screen"><TopBar title="Deal Details" back /></main>;
  const isLost = deal.status === 'lost';

  const advance = async () => {
    const idx = DEAL_STAGES.indexOf(deal.status);
    if (idx < DEAL_STAGES.length - 1) await api.updateDeal(id, { status: DEAL_STAGES[idx + 1] });
    reload();
  };

  return (
    <main className="screen">
      <TopBar title="Deal Details" back />
      <div className="pad stack">
        <div>
          <h1 style={{ fontSize: 18 }}>{deal.customer}</h1>
          <p style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 4 }}>{deal.contact}</p>
        </div>
        <div className="card card-pad"><div className="section-title" style={{ marginBottom: 6 }}>What they need</div><p style={{ fontSize: 13.5, lineHeight: 1.5 }}>{deal.need}</p></div>
        {deal.notes && <div className="card card-pad"><div className="section-title" style={{ marginBottom: 6 }}>Notes</div><p style={{ fontSize: 13, color: 'var(--text-faint)', lineHeight: 1.5 }}>{deal.notes}</p></div>}
        <div className="card card-pad">
          <div className="kv"><span className="k">Deal value</span><span className="v">{money(deal.value)}</span></div><hr className="divider" />
          <div className="kv"><span className="k">Your commission</span><span className="v" style={{ color: 'var(--copper-600)' }}>{money(deal.commission)}</span></div><hr className="divider" />
          <div className="kv"><span className="k">Payment status</span><span className="v">{deal.status === 'won' ? (deal.paid ? 'Paid' : 'Pending payout') : '—'}</span></div>
        </div>
        {isLost ? (
          <div className="card card-pad" style={{ borderColor: 'var(--danger-600)' }}>
            <div style={{ fontWeight: 700, color: 'var(--danger-600)', fontSize: 13.5 }}>Deal lost</div>
            <p style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 4 }}>This opportunity didn't convert. Keep bringing more — most partners have several in flight.</p>
          </div>
        ) : (
          <div className="card card-pad">
            <div className="section-title" style={{ marginBottom: 6 }}>Progress</div>
            <Timeline stages={DEAL_STAGES} labels={DEAL_STAGE_LABEL} descs={DEAL_STAGE_DESC} currentKey={deal.status} />
          </div>
        )}
        <button className="btn btn-ghost btn-sm" onClick={advance}><Icon name="refresh" size={14} /> (Demo) advance status</button>
      </div>
    </main>
  );
}
