import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/Shell.jsx';
import Icon from '../../lib/icons.jsx';
import { useStore } from '../../lib/store.js';

export default function GstVerification() {
  const navigate = useNavigate();
  const showToast = useStore((s) => s.showToast);

  const submit = () => {
    showToast('Verification submitted');
    navigate('/supplier/catalogue');
  };

  return (
    <main className="screen">
      <TopBar title="Business Verification" back />
      <div className="pad stack">
        <h1 style={{ fontSize: 18 }}>Verify your business</h1>
        <p style={{ fontSize: 13, color: 'var(--text-faint)', lineHeight: 1.5 }}>
          Verification builds trust with buyers and unlocks catalogue publishing.
        </p>
        <div className="field"><label>GST / business registration number</label><input className="input" placeholder="e.g. 22AAAAA0000A1Z5" /></div>
        <div className="field"><label>Registered business address</label><input className="input" placeholder="Street, city, state" /></div>
        <button className="upload-slot tap" onClick={() => showToast('File attached (demo)')}>
          <span className="iconbtn"><Icon name="doc" size={18} /></span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13.5 }}>Upload registration certificate</div>
            <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>PDF or image</div>
          </div>
        </button>
        <button className="btn btn-primary" onClick={submit}>Submit for verification</button>
      </div>
    </main>
  );
}
