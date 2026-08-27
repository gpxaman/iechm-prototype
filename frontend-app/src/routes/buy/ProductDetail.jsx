import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TopBar } from '../../components/Shell.jsx';
import { AiMsg } from '../../components/Domain.jsx';
import Icon from '../../lib/icons.jsx';
import { api, money } from '../../lib/api.js';
import { productIcon, CATEGORIES_META } from '../../lib/constants.js';
import { useStore } from '../../lib/store.js';

function productAiReply(q, p) {
  const t = q.toLowerCase();
  if (t.includes('compat') || t.includes('use this'))
    return <>Yes — the <b>{p.name}</b> is compatible with most builds in its category. If your project has specific tolerances, share them and I'll double-check fit.</>;
  if (t.includes('differ') || t.includes('alternative'))
    return <>Compared to similar parts in <b>{CATEGORIES_META[p.category]?.name}</b>, this one has a shorter lead time ({p.leadTimeDays}d) at a slightly higher unit price. I can pull up a side-by-side if that helps.</>;
  return <>Here's what stands out about the <b>{p.name}</b>: {p.leadTimeDays}-day lead time, MOQ of {p.moq.toLocaleString()}, and {p.stock.toLowerCase()}. Ask me anything else about it.</>;
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(0);
  const showToast = useStore((s) => s.showToast);
  const setCartCount = useStore((s) => s.setCartCount);
  const openSheet = useStore((s) => s.openSheet);
  const closeSheet = useStore((s) => s.closeSheet);

  useEffect(() => {
    api.product(id).then((p) => { setProduct(p); setQty(p.moq); });
  }, [id]);

  if (!product) return <main className="screen"><TopBar back /></main>;

  const addToCart = async () => {
    await api.addToCart(product.id, Math.max(product.moq, qty));
    const c = await api.cart();
    setCartCount(c.reduce((n, l) => n + l.qty, 0));
    showToast('Added to cart');
  };

  const askAi = (question) => {
    openSheet(
      <AskAiSheet product={product} initialQuestion={question} onClose={closeSheet} />,
    );
  };

  return (
    <main className="screen">
      <TopBar
        title=""
        back
        right={<button className="iconbtn" onClick={() => navigate('/cart')}><Icon name="cart" size={16} /></button>}
      />
      <div className="pad">
        <div style={{ width: '100%', aspectRatio: '4/3', borderRadius: 'var(--radius-l)', background: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)' }}>
          <Icon name={productIcon(product.category)} size={56} stroke={1.4} />
        </div>
        <div style={{ marginTop: 16 }}>
          <div className="tag">{CATEGORIES_META[product.category]?.name || product.category}</div>
          <h1 style={{ fontSize: 19, marginTop: 6 }}>{product.name}</h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-faint)', marginTop: 6, lineHeight: 1.5 }}>{product.description}</p>
        </div>
        <div className="card card-pad" style={{ marginTop: 14 }}>
          <div className="kv"><span className="k">Price</span><span className="v">{money(product.price)} / unit</span></div><hr className="divider" />
          <div className="kv"><span className="k">MOQ</span><span className="v">{product.moq.toLocaleString()} units</span></div><hr className="divider" />
          <div className="kv"><span className="k">Lead time</span><span className="v">{product.leadTimeDays} days</span></div><hr className="divider" />
          <div className="kv"><span className="k">Availability</span><span className="v">{product.stock}</span></div>
        </div>
        <div className="section-title" style={{ marginTop: 16 }}>Specifications</div>
        <div className="card card-pad" style={{ marginTop: 8 }}>
          {Object.entries(product.specs).map(([k, v], i, arr) => (
            <div key={k}>
              <div className="kv"><span className="k">{k}</span><span className="v">{v}</span></div>
              {i < arr.length - 1 && <hr className="divider" />}
            </div>
          ))}
        </div>
        <div className="field" style={{ marginTop: 16 }}>
          <label>Quantity (min {product.moq.toLocaleString()})</label>
          <input className="input" type="number" value={qty} min={product.moq} step={product.moq} onChange={(e) => setQty(Number(e.target.value))} />
        </div>
        <div className="btn-block-row" style={{ marginTop: 12 }}>
          <button className="btn btn-primary" onClick={addToCart}><Icon name="cart" size={16} /> Add to Cart</button>
          <button className="btn btn-secondary" style={{ width: 'auto', flex: '0 0 auto' }} onClick={() => showToast("Quote requested — we'll follow up shortly")}>Quote</button>
        </div>
        <button
          className="card card-pad tap"
          style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--accent-bg)', borderColor: 'var(--accent)', width: '100%' }}
          onClick={() => askAi('Can I use this for my project?')}
        >
          <Icon name="sparkle" size={18} />
          <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>Ask AI &middot; "Can I use this for my project?"</span>
          <Icon name="chevron" size={16} />
        </button>
        <div className="card card-pad" style={{ marginTop: 14, textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 13.5 }}>Not exactly what you need?</div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => navigate('/custom-request/new', { state: { prefill: product.name } })}>
            Request a Custom Version
          </button>
        </div>
      </div>
    </main>
  );
}

function AskAiSheet({ product, initialQuestion, onClose }) {
  const [reply, setReply] = useState(null);
  useEffect(() => { if (initialQuestion) setReply(productAiReply(initialQuestion, product)); }, []);
  const questions = ['Can I use this for my project?', 'What is the difference between these options?', 'Show alternatives.'];
  return (
    <>
      <div className="sheet-head">
        <h3 style={{ fontSize: 16 }}><Icon name="sparkle" size={16} /> Ask AI</h3>
        <button className="topbar-icon" onClick={onClose}><Icon name="close" size={16} /></button>
      </div>
      <div className="sheet-body stack">
        <div className="chiprow">
          {questions.map((q) => (
            <button key={q} className="selectchip" type="button" onClick={() => setReply(productAiReply(q, product))}>{q}</button>
          ))}
        </div>
        {reply && <AiMsg>{reply}</AiMsg>}
      </div>
    </>
  );
}
