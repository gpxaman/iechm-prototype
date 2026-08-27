import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/Shell.jsx';
import Icon from '../../lib/icons.jsx';
import { api, money } from '../../lib/api.js';
import { useStore } from '../../lib/store.js';

export default function Checkout() {
  const navigate = useNavigate();
  const [lines, setLines] = useState([]);
  const showToast = useStore((s) => s.showToast);
  const setCartCount = useStore((s) => s.setCartCount);

  useEffect(() => { api.cart().then(setLines); }, []);
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);

  const placeOrder = async () => {
    await api.createOrder({ name: count + ' items', total });
    setCartCount(0);
    showToast('Order placed');
    navigate('/buy');
  };

  return (
    <main className="screen">
      <TopBar title="Checkout" back />
      <div className="pad stack">
        <div className="card card-pad">
          <div className="section-title" style={{ marginBottom: 10 }}>Shipping to</div>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>Your business</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 2 }}>Add a delivery address to continue.</div>
          <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }}><Icon name="plus" size={14} /> Add address</button>
        </div>
        <div className="card card-pad">
          <div className="section-title" style={{ marginBottom: 10 }}>Order summary</div>
          <div className="kv"><span className="k">Items</span><span className="v">{count.toLocaleString()}</span></div>
          <div className="kv"><span className="k">Subtotal</span><span className="v">{money(total)}</span></div>
          <div className="kv"><span className="k">Shipping</span><span className="v">Calculated after review</span></div>
        </div>
        <div className="card card-pad">
          <div className="section-title" style={{ marginBottom: 10 }}>Payment</div>
          <div className="upload-slot" style={{ cursor: 'default' }}>
            <span className="iconbtn"><Icon name="doc" size={16} /></span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>Purchase order / invoice terms</div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>Available for verified business accounts.</div>
            </div>
          </div>
        </div>
        <button className="btn btn-primary" onClick={placeOrder}>Place order</button>
        <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--text-faint)' }}>This is a demo — no real order will be placed.</p>
      </div>
    </main>
  );
}
