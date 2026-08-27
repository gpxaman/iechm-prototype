import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar, NotifBell } from '../../components/Shell.jsx';
import { ProductCardGrid } from '../../components/Domain.jsx';
import Icon from '../../lib/icons.jsx';
import { api, money, timeAgo } from '../../lib/api.js';

const QUICK_QUERIES = ['I need waterproof connectors.', 'Show me lithium battery packs.', 'I need 100 custom metal brackets.'];

export default function BuyHome() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.products().then(setProducts);
    api.orders().then((o) => setOrders(o.slice(0, 2)));
  }, []);

  const quickQuery = async (text) => {
    const res = await api.aiSearch(text);
    navigate('/search-results', { state: { ...res, query: text } });
  };

  return (
    <main className="screen">
      <TopBar title="Buy" showMode right={<NotifBell />} />
      <div className="hero"><h1>What do you need today?</h1></div>
      <div className="pad">
        <button className="ai-input-card tap" style={{ width: '100%', border: 'none' }} onClick={() => navigate('/discover')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-faint)', fontSize: 14.5 }}>
            <Icon name="search" size={18} /> Search products or describe what you need…
          </div>
        </button>
        <div className="chiprow" style={{ marginTop: 10 }}>
          {QUICK_QUERIES.map((q) => (
            <button key={q} className="selectchip" type="button" onClick={() => quickQuery(q)}>{q}</button>
          ))}
        </div>
      </div>
      <div className="pad" style={{ paddingTop: 4 }}>
        <div className="btn-block-row">
          <button className="btn btn-secondary btn-sm" style={{ flex: 1, width: 'auto' }} onClick={() => navigate('/discover')}>
            <Icon name="compass" size={15} /> Browse
          </button>
          <button className="btn btn-secondary btn-sm" style={{ flex: 1, width: 'auto' }} onClick={() => navigate('/discover')}>
            <Icon name="image" size={15} /> Image search
          </button>
          <button className="btn btn-secondary btn-sm" style={{ flex: 1, width: 'auto' }} onClick={() => navigate('/custom-request/new')}>
            <Icon name="plus" size={15} /> Custom
          </button>
        </div>
      </div>
      <div className="section">
        <div className="section-head">
          <span className="section-title">Recent orders</span>
          <button className="section-link" onClick={() => navigate('/activity')}>See all</button>
        </div>
      </div>
      <div className="pad stack" style={{ paddingTop: 0 }}>
        {orders.map((o) => (
          <div className="card card-pad" key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{o.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>{o.status} &middot; {timeAgo(o.date)}</div>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{money(o.total)}</div>
          </div>
        ))}
      </div>
      <div className="section"><div className="section-head"><span className="section-title">Frequently purchased</span></div></div>
      <div className="hscroll">{products.slice(0, 8).map((p) => <ProductCardGrid key={p.id} product={p} />)}</div>
      <div className="section"><div className="section-head"><span className="section-title">Recommended for you</span></div></div>
      <div className="hscroll" style={{ paddingBottom: 18 }}>{products.slice(6, 12).map((p) => <ProductCardGrid key={p.id} product={p} />)}</div>
    </main>
  );
}
