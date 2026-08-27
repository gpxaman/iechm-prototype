import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/Shell.jsx';
import { ProductCardGrid } from '../../components/Domain.jsx';
import Icon from '../../lib/icons.jsx';
import { api } from '../../lib/api.js';
import { CATEGORIES_META } from '../../lib/constants.js';
import { useStore } from '../../lib/store.js';
import { useEffect } from 'react';

export default function Discover() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [popular, setPopular] = useState([]);
  const showToast = useStore((s) => s.showToast);

  useEffect(() => { api.products().then((p) => setPopular(p.slice(0, 10))); }, []);

  const runSearch = async (plain) => {
    if (!q.trim()) { showToast('Type or describe what you need', 'search'); return; }
    const res = plain ? await plainSearch(q) : await api.aiSearch(q);
    navigate('/search-results', { state: { ...res, query: q } });
  };
  const plainSearch = async (text) => {
    const products = await api.products({ q: text });
    return { kind: products.length ? 'exact' : 'none', products };
  };

  const searchCategory = async (id) => {
    const products = await api.products({ category: id });
    navigate('/search-results', { state: { kind: products.length ? 'exact' : 'none', products, query: CATEGORIES_META[id].name } });
  };

  return (
    <main className="screen">
      <TopBar title="Discover" showMode />
      <div className="pad" style={{ paddingBottom: 6 }}>
        <div className="ai-input-card">
          <textarea
            className="input"
            placeholder="Search or describe what you need…"
            style={{ minHeight: 0, padding: 2 }}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="ai-input-row">
            <button className="btn btn-accent btn-sm" onClick={() => runSearch(false)}><Icon name="sparkle" size={14} /> Ask AI</button>
            <button className="btn btn-ghost btn-sm" onClick={() => runSearch(true)}><Icon name="search" size={14} /> Search</button>
            <span style={{ marginLeft: 'auto' }} className="chiprow">
              <button className="iconbtn" title="Image search" onClick={() => showToast('Image search (demo)', 'image')}><Icon name="image" size={15} /></button>
              <button className="iconbtn" title="Voice" onClick={() => showToast('Voice captured (demo)', 'mic')}><Icon name="mic" size={15} /></button>
            </span>
          </div>
        </div>
      </div>
      <div className="section"><div className="section-title">Categories</div></div>
      <div className="pad" style={{ paddingTop: 0, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {Object.entries(CATEGORIES_META).map(([id, c]) => (
          <button key={id} className="card card-pad tap" onClick={() => searchCategory(id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center' }}>
            <Icon name={c.icon} size={20} />
            <span style={{ fontSize: 11.5, fontWeight: 600 }}>{c.name}</span>
          </button>
        ))}
      </div>
      <div className="section"><div className="section-title">Popular right now</div></div>
      <div className="hscroll" style={{ paddingBottom: 18 }}>{popular.map((p) => <ProductCardGrid key={p.id} product={p} />)}</div>
    </main>
  );
}
