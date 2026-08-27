import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/Shell.jsx';
import { CATEGORIES_META } from '../../lib/constants.js';

const TYPES = ['Manufacturer', 'Component supplier', 'Distributor', 'Fabricator'];

export default function SupplierRegister() {
  const navigate = useNavigate();
  const [type, setType] = useState(null);

  return (
    <main className="screen">
      <TopBar title="Supplier Registration" back />
      <div className="pad stack">
        <p style={{ fontSize: 13, color: 'var(--text-faint)', lineHeight: 1.5 }}>
          Join the IECHM manufacturing network. We'll extract your catalogue automatically — you won't create products one by one.
        </p>
        <div className="field"><label>Business name</label><input className="input" placeholder="Your company name" /></div>
        <div className="field">
          <label>Business type</label>
          <div className="chiprow">
            {TYPES.map((t) => (
              <button key={t} className={'selectchip' + (type === t ? ' sel' : '')} type="button" onClick={() => setType(t)}>{t}</button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Primary category</label>
          <select className="input" defaultValue="">
            <option value="" disabled>Select a category</option>
            {Object.entries(CATEGORIES_META).map(([id, c]) => <option key={id} value={id}>{c.name}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/supplier/verify')}>Continue</button>
      </div>
    </main>
  );
}
