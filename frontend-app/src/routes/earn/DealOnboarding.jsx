import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/Shell.jsx';
import { Timeline } from '../../components/Domain.jsx';
import { api } from '../../lib/api.js';
import { useStore } from '../../lib/store.js';

const STEPS = ['register', 'verify', 'submit', 'track', 'convert', 'earn'];
const LABELS = { register: 'Register', verify: 'Get verified', submit: 'Submit a deal', track: 'Track progress', convert: 'Deal converts', earn: 'Earn commission' };
const DESCS = {
  register: 'Tell us a little about yourself.', verify: 'Quick identity check — usually same day.',
  submit: 'Refer a business that needs sourcing or manufacturing.', track: 'Watch it move through our pipeline.',
  convert: 'We close the business.', earn: 'Commission lands in your account.',
};
const ROLES = ['Consultant', 'Salesperson', 'Student', 'Industry connector', 'Freelancer', 'Entrepreneur'];

export default function DealOnboarding() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [role, setRole] = useState(null);
  const setMode = useStore((s) => s.setMode);

  const register = async () => {
    await api.updateUser({ name: name.trim() || 'Alex Rivera', isPartner: true, mode: 'earn' });
    setMode('earn');
    navigate('/earn');
  };

  return (
    <main className="screen">
      <TopBar title="Become a Deal Partner" back />
      <div className="pad stack">
        <p style={{ fontSize: 13.5, color: 'var(--text-faint)', lineHeight: 1.5 }}>
          Anyone with access to potential customers can become a Deal Partner — no sales experience required. Here's how it works:
        </p>
        <div className="card card-pad"><Timeline stages={STEPS} labels={LABELS} descs={DESCS} currentKey="register" /></div>
        <div className="field">
          <label>Full name</label>
          <input className="input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>How do you know potential customers?</label>
          <div className="chiprow">
            {ROLES.map((r) => (
              <button key={r} className={'selectchip' + (role === r ? ' sel' : '')} type="button" onClick={() => setRole(r)}>{r}</button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" onClick={register}>Become a Deal Partner</button>
      </div>
    </main>
  );
}
