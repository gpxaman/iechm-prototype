import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/Shell.jsx';
import { useStore } from '../../lib/store.js';
import { api } from '../../lib/api.js';

const QUICKSTART = { buy: '/quickstart/buy', build: '/quickstart/build', earn: '/quickstart/earn' };

export default function AccountCreate() {
  const navigate = useNavigate();
  const intent = useStore((s) => s.intent);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const submit = async () => {
    const finalName = name.trim() || 'Alex Rivera';
    const finalEmail = email.trim() || 'alex@company.com';
    await api.updateUser({ name: finalName, email: finalEmail }).catch(() => {});
    navigate(QUICKSTART[intent] || '/quickstart/buy');
  };

  return (
    <main className="screen">
      <TopBar title="Create your account" back />
      <div className="pad stack">
        <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>
          Just enough to get you in — you can fill in the rest later.
        </p>
        <div className="field">
          <label>Full name</label>
          <input className="input" placeholder="Aviraj Shah" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Email or phone</label>
          <input className="input" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Password</label>
          <input className="input" type="password" placeholder="Create a password" />
        </div>
        <button className="btn btn-primary" style={{ marginTop: 6 }} onClick={submit}>
          Create account
        </button>
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-faint)' }}>
          By continuing you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </main>
  );
}
