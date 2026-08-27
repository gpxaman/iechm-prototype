import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/Shell.jsx';
import Icon from '../../lib/icons.jsx';
import { api } from '../../lib/api.js';
import { useStore } from '../../lib/store.js';

export default function SubmitOpportunity() {
  const navigate = useNavigate();
  const showToast = useStore((s) => s.showToast);
  const setMode = useStore((s) => s.setMode);
  const [text, setText] = useState('');
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [need, setNeed] = useState('');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');

  const extractFromText = () => {
    if (!text.trim()) return;
    const match = text.match(/\$?([\d,]{3,})/);
    setNeed(text);
    if (match) setValue(match[1].replace(/,/g, ''));
    showToast('Filled in from your description', 'sparkle');
  };

  const submit = async () => {
    const deal = await api.createDeal({
      customer: company.trim() || 'New opportunity',
      contact: contact.trim() || 'Contact pending',
      need: need.trim() || text.trim() || 'Details pending',
      value: parseInt(value, 10) || 5000,
      notes: notes.trim(),
    });
    await api.updateUser({ isPartner: true, mode: 'earn' });
    setMode('earn');
    showToast('Opportunity submitted');
    navigate(`/deal/${deal.id}`, { replace: true });
  };

  return (
    <main className="screen">
      <TopBar title="Submit Opportunity" back />
      <div className="pad stack">
        <h1 style={{ fontSize: 18 }}>Who is the potential customer?</h1>
        <div className="ai-input-card">
          <textarea className="input" placeholder="A startup I know is looking for 5,000 electronic components for a new device."
            value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <button className="btn btn-outline-accent btn-sm" style={{ width: 'auto' }} onClick={extractFromText}>
          <Icon name="sparkle" size={14} /> Let AI structure this
        </button>
        <div className="field"><label>Company / person</label><input className="input" placeholder="Company or contact name" value={company} onChange={(e) => setCompany(e.target.value)} /></div>
        <div className="field"><label>Contact details</label><input className="input" placeholder="Email or phone" value={contact} onChange={(e) => setContact(e.target.value)} /></div>
        <div className="field"><label>What do they need?</label><textarea className="input" placeholder="Brief description of the need" value={need} onChange={(e) => setNeed(e.target.value)} /></div>
        <div className="field"><label>Estimated opportunity value</label><input className="input" placeholder="e.g. 12000" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} /></div>
        <div className="field"><label>Notes (optional)</label><textarea className="input" placeholder="Anything else worth knowing" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        <button className="btn btn-primary" onClick={submit}>Submit Opportunity</button>
      </div>
    </main>
  );
}
