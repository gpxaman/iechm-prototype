import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/Shell.jsx';
import { EmptyState } from '../../components/Domain.jsx';
import Icon from '../../lib/icons.jsx';
import { api, money, timeAgo } from '../../lib/api.js';
import { REQUEST_STAGE_LABEL, DEAL_STAGE_LABEL } from '../../lib/constants.js';

const FILTERS = [['all', 'All'], ['orders', 'Orders'], ['requests', 'Requests'], ['deals', 'Deals']];
const ROW_ICON = { order: 'truck', request: 'wrench', deal: 'handshake' };

export default function Activity() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [orders, setOrders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [deals, setDeals] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api.orders().then(setOrders);
    api.customRequests().then(setRequests);
    api.deals().then(setDeals);
    api.notifications().then(setNotifications);
  }, []);

  const rows = [];
  if (filter === 'all' || filter === 'orders') orders.forEach((o) => rows.push({ kind: 'order', title: o.name, sub: `${o.status} · ${timeAgo(o.date)}`, right: money(o.total), onClick: () => navigate('/you') }));
  if (filter === 'all' || filter === 'requests') requests.forEach((c) => rows.push({ kind: 'request', title: c.title, sub: REQUEST_STAGE_LABEL[c.status], right: '', onClick: () => navigate(`/request/${c.id}`) }));
  if (filter === 'all' || filter === 'deals') deals.forEach((d) => rows.push({ kind: 'deal', title: d.customer, sub: DEAL_STAGE_LABEL[d.status], right: money(d.value), onClick: () => navigate(`/deal/${d.id}`) }));

  return (
    <main className="screen">
      <TopBar title="Activity" />
      <div className="hscroll" style={{ padding: '10px 16px 4px' }}>
        {FILTERS.map(([k, l]) => (
          <button key={k} className={'selectchip' + (filter === k ? ' sel' : '')} type="button" onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>
      <div className="section">
        <div className="section-title">Notifications</div>
        <button className="section-link" onClick={() => navigate('/notifications')}>See all</button>
      </div>
      <div className="pad stack" style={{ paddingTop: 0 }}>
        {notifications.slice(0, 3).map((n) => (
          <div className="card card-pad" key={n.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Icon name={ROW_ICON[n.type] || 'layers'} size={16} />
            <span style={{ flex: 1, fontSize: 13 }}>{n.title}</span>
            <span className="tag">{timeAgo(n.time)}</span>
          </div>
        ))}
      </div>
      <div className="section"><div className="section-title">History</div></div>
      <div className="pad stack" style={{ paddingTop: 0, paddingBottom: 20 }}>
        {rows.length ? rows.map((r, i) => (
          <button key={i} className="card card-pad tap" onClick={r.onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
            <span className="iconbtn" style={{ width: 34, height: 34 }}><Icon name={ROW_ICON[r.kind]} size={16} /></span>
            <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{r.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>{r.sub}</div>
            </span>
            {r.right && <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}>{r.right}</span>}
          </button>
        )) : <EmptyState icon="activity" title="Nothing here yet" body="Orders, requests, and deals will show up here as they happen." />}
      </div>
    </main>
  );
}
