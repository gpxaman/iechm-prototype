import { useLocation, useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/Shell.jsx';
import Icon from '../../lib/icons.jsx';
import { useStore } from '../../lib/store.js';
import { api } from '../../lib/api.js';

export default function ExceptionReview() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const showToast = useStore((s) => s.showToast);
  const r = state || { needMoq: 0, needPrice: 0, needSpec: 0 };

  const items = [];
  for (let i = 0; i < r.needMoq; i++) items.push({ name: `Product ${i + 1}`, issue: 'Missing MOQ', field: 'MOQ', ic: 'clip' });
  for (let i = 0; i < r.needPrice; i++) items.push({ name: `Product ${r.needMoq + i + 1}`, issue: 'Price needs confirmation', field: 'Price', ic: 'coins' });
  for (let i = 0; i < r.needSpec; i++) items.push({ name: `Product ${r.needMoq + r.needPrice + i + 1}`, issue: 'Incomplete specifications', field: 'Specs', ic: 'file' });

  const submitAll = async () => {
    await api.updateUser({ isSupplier: true });
    showToast('All ' + items.length + ' items saved');
    navigate('/you');
  };

  return (
    <main className="screen">
      <TopBar title="Exceptions" back />
      <div className="pad">
        <p style={{ fontSize: 13, color: 'var(--text-faint)', lineHeight: 1.5 }}>
          AI handled bulk extraction — you only need to review these {items.length} exceptions.
        </p>
      </div>
      <div className="pad stack" style={{ paddingTop: 0, paddingBottom: 20 }}>
        {items.map((it, i) => (
          <div className="card card-pad" key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="iconbtn" style={{ width: 34, height: 34 }}><Icon name={it.ic} size={16} /></span>
            <span style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{it.name}</div>
              <div style={{ fontSize: 12, color: 'var(--warning-600)', marginTop: 2 }}>{it.issue}</div>
            </span>
            <input className="input" style={{ width: 84, padding: 8, fontSize: 12.5 }} placeholder={it.field} />
          </div>
        ))}
        <button className="btn btn-primary" onClick={submitAll}>Save &amp; Submit All</button>
      </div>
    </main>
  );
}
