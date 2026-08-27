import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/Shell.jsx';
import { DealCard, EmptyState } from '../../components/Domain.jsx';
import { api, money } from '../../lib/api.js';
import { DEAL_STAGE_LABEL } from '../../lib/constants.js';

const FILTERS = [['all', 'All'], ['active', 'Active'], ['won', 'Won'], ['lost', 'Lost']];

export default function Earnings() {
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [filter, setFilter] = useState('all');
  useEffect(() => { api.deals().then(setDeals); }, []);

  const filtered = deals.filter((d) =>
    filter === 'all' ? true :
    filter === 'active' ? !['won', 'lost'].includes(d.status) :
    filter === 'won' ? d.status === 'won' : d.status === 'lost');

  const totalEarn = deals.filter((d) => d.status === 'won').reduce((s, d) => s + d.commission, 0);
  const pendingEarn = deals.filter((d) => d.status === 'won' && !d.paid).reduce((s, d) => s + d.commission, 0);
  const paidEarn = deals.filter((d) => d.status === 'won' && d.paid).reduce((s, d) => s + d.commission, 0);

  return (
    <main className="screen">
      <TopBar title="My Deals & Earnings" back />
      <div className="pad" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, paddingBottom: 6 }}>
        <div className="card card-pad" style={{ textAlign: 'center' }}><div className="tag">Pending</div><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, marginTop: 4 }}>{money(pendingEarn)}</div></div>
        <div className="card card-pad" style={{ textAlign: 'center' }}><div className="tag">Available</div><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, marginTop: 4, color: 'var(--copper-600)' }}>{money(totalEarn - paidEarn)}</div></div>
        <div className="card card-pad" style={{ textAlign: 'center' }}><div className="tag">Paid</div><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, marginTop: 4, color: 'var(--success-600)' }}>{money(paidEarn)}</div></div>
      </div>
      <div className="hscroll" style={{ padding: '6px 16px' }}>
        {FILTERS.map(([k, l]) => (
          <button key={k} className={'selectchip' + (filter === k ? ' sel' : '')} type="button" onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>
      <div className="pad stack" style={{ paddingTop: 0, paddingBottom: 20 }}>
        {filtered.length
          ? filtered.map((d) => <DealCard key={d.id} deal={d} stageLabel={DEAL_STAGE_LABEL} />)
          : <EmptyState icon="handshake" title="Know someone who needs products or manufacturing?" body="Submit an opportunity to start earning."
              ctaLabel="Submit an Opportunity" onCta={() => navigate('/earn/submit')} />}
      </div>
    </main>
  );
}
