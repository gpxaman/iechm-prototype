import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/Shell.jsx';
import { EmptyState, ProductCardRow } from '../../components/Domain.jsx';
import Icon from '../../lib/icons.jsx';
import { api, money } from '../../lib/api.js';
import { productIcon } from '../../lib/constants.js';
import { useStore } from '../../lib/store.js';

export default function Cart() {
  const navigate = useNavigate();
  const [lines, setLines] = useState(null);
  const setCartCount = useStore((s) => s.setCartCount);
  const openSheet = useStore((s) => s.openSheet);
  const closeSheet = useStore((s) => s.closeSheet);

  const reload = () => api.cart().then((c) => { setLines(c); setCartCount(c.reduce((n, l) => n + l.qty, 0)); });
  useEffect(() => { reload(); }, []);

  if (!lines) return <main className="screen"><TopBar title="Cart" back /></main>;
  if (!lines.length) {
    return (
      <main className="screen">
        <TopBar title="Cart" back />
        <EmptyState icon="cart" title="Your cart is empty" body="Products you add will show up here, ready for checkout."
          ctaLabel="Browse products" onCta={() => navigate('/discover')} />
      </main>
    );
  }

  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const maxLead = Math.max(...lines.map((l) => l.leadTimeDays));

  const remove = async (productId) => { await api.removeFromCart(productId); reload(); };

  const suggest = async () => {
    const cats = [...new Set(lines.map((l) => l.category))];
    const all = await api.products();
    const suggestions = all.filter((p) => cats.includes(p.category) && !lines.some((l) => l.productId === p.id)).slice(0, 3);
    openSheet(
      <>
        <div className="sheet-head">
          <h3 style={{ fontSize: 16 }}><Icon name="sparkle" size={16} /> What else do I need?</h3>
          <button className="topbar-icon" onClick={closeSheet}><Icon name="close" size={16} /></button>
        </div>
        <div className="sheet-body stack">
          <p style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>Based on what's in your cart, teams often also add:</p>
          {suggestions.length ? suggestions.map((p) => <ProductCardRow key={p.id} product={p} />) : <p style={{ fontSize: 13 }}>Your cart already looks complete.</p>}
        </div>
      </>,
    );
  };

  return (
    <main className="screen">
      <TopBar title="Cart" back />
      <div className="pad stack">
        {lines.map((l) => (
          <div className="card card-pad" key={l.productId} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-s)', background: 'var(--surface-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
              <Icon name={productIcon(l.category)} size={22} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{l.name}</div>
              <div className="pmeta" style={{ marginTop: 4 }}>{l.qty.toLocaleString()} units &middot; {money(l.price)}/unit</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{money(l.qty * l.price)}</div>
              <span style={{ fontSize: 11, color: 'var(--danger-600)', cursor: 'pointer' }} onClick={() => remove(l.productId)}>Remove</span>
            </div>
          </div>
        ))}
        <div className="card card-pad">
          <div className="kv"><span className="k">Subtotal</span><span className="v">{money(total)}</span></div>
          <div className="kv"><span className="k">Est. lead time</span><span className="v">{maxLead} days</span></div>
        </div>
        <button
          className="card card-pad tap"
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--accent-bg)', borderColor: 'var(--accent)', width: '100%' }}
          onClick={suggest}
        >
          <Icon name="sparkle" size={18} />
          <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>Ask AI &middot; "What else do I need?"</span>
        </button>
        <button className="btn btn-primary" onClick={() => navigate('/checkout')}>Checkout &middot; {money(total)}</button>
      </div>
    </main>
  );
}
