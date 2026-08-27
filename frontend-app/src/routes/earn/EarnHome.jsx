import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar, NotifBell } from '../../components/Shell.jsx';
import { DealCard, EmptyState } from '../../components/Domain.jsx';
import Icon from '../../lib/icons.jsx';
import { api, money } from '../../lib/api.js';
import { DEAL_STAGE_LABEL } from '../../lib/constants.js';

export default function EarnHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [deals, setDeals] = useState([]);

  useEffect(() => {
    api.user().then(setUser);
    api.deals().then(setDeals);
  }, []);

  if (!user) return <main className="screen"><TopBar title="Earn" showMode /></main>;

  if (!user.isPartner) {
    return (
      <main className="screen">
        <TopBar title="Earn" showMode right={<NotifBell />} />
        <div className="hero"><h1>Bring opportunities. Earn commission.</h1></div>
        <div className="pad">
          <EmptyState icon="handshake" title="Not registered as a Deal Partner yet"
            body="Register in a couple of minutes — then submit your first opportunity."
            ctaLabel="Become a Deal Partner" onCta={() => navigate('/earn/onboarding')} />
        </div>
      </main>
    );
  }

  const active = deals.filter((d) => !['won', 'lost'].includes(d.status)).length;
  const won = deals.filter((d) => d.status === 'won').length;
  const totalEarn = deals.filter((d) => d.status === 'won').reduce((s, d) => s + d.commission, 0);
  const pending = deals.filter((d) => !['won', 'lost'].includes(d.status)).reduce((s, d) => s + d.commission, 0);

  return (
    <main className="screen">
      <TopBar title="Earn" showMode right={<NotifBell />} />
      <div className="hero"><h1>Bring opportunities. Earn commission.</h1></div>
      <div className="pad" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="card card-pad"><div className="tag">Active deals</div><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 22, marginTop: 4 }}>{active}</div></div>
        <div className="card card-pad"><div className="tag">Converted</div><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 22, marginTop: 4, color: 'var(--success-600)' }}>{won}</div></div>
        <div className="card card-pad"><div className="tag">Available commission</div><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 22, marginTop: 4, color: 'var(--copper-600)' }}>{money(pending)}</div></div>
        <div className="card card-pad"><div className="tag">Total earnings</div><div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 22, marginTop: 4 }}>{money(totalEarn)}</div></div>
      </div>
      <div className="pad stack" style={{ paddingTop: 6 }}>
        <button className="btn btn-accent" onClick={() => navigate('/earn/submit')}><Icon name="plus" size={16} /> Submit an Opportunity</button>
        <button className="btn btn-secondary" onClick={() => navigate('/earn/earnings')}><Icon name="coins" size={16} /> My Deals &amp; Earnings</button>
      </div>
      <div className="section"><div className="section-head"><span className="section-title">Recent opportunities</span></div></div>
      <div className="pad stack" style={{ paddingTop: 0, paddingBottom: 20 }}>
        {deals.slice(0, 4).map((d) => <DealCard key={d.id} deal={d} stageLabel={DEAL_STAGE_LABEL} />)}
      </div>
    </main>
  );
}
