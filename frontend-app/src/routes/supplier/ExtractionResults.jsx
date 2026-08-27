import { useLocation, useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/Shell.jsx';
import { useStore } from '../../lib/store.js';
import { api } from '../../lib/api.js';

export default function ExtractionResults() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const showToast = useStore((s) => s.showToast);
  const r = state || { total: 0, needMoq: 0, needPrice: 0, needSpec: 0, ready: 0, fileName: '' };

  const submitReady = async () => {
    await api.updateUser({ isSupplier: true });
    showToast(r.ready + ' products published');
    navigate('/you');
  };

  return (
    <main className="screen">
      <TopBar title="Extraction Results" back />
      <div className="pad stack">
        <div className="console" style={{ textAlign: 'center' }}>
          <div className="console-head" style={{ justifyContent: 'center' }}><span className="dot" />IECHM_SCAN &middot; COMPLETE</div>
          <div className="console-big">{r.total}</div>
          <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: '#B5A896', marginTop: 2 }}>products found</div>
        </div>
        <div className="console">
          <div className="console-row"><span className="ok">✓</span><span>Product names extracted</span></div>
          <div className="console-row"><span className="ok">✓</span><span>Images extracted</span></div>
          <div className="console-row"><span className="ok">✓</span><span>Categories identified</span></div>
          <div className="console-row"><span className="ok">✓</span><span>Specifications identified</span></div>
        </div>
        <div className="console">
          <div className="console-row"><span className="warn">⚠</span><span style={{ flex: 1 }}>{r.needMoq} products need MOQ information</span></div>
          <div className="console-row"><span className="warn">⚠</span><span style={{ flex: 1 }}>{r.needPrice} products need price confirmation</span></div>
          <div className="console-row"><span className="warn">⚠</span><span style={{ flex: 1 }}>{r.needSpec} products have incomplete specifications</span></div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/supplier/exceptions', { state: r })}>
          Review {r.needMoq + r.needPrice + r.needSpec} Items
        </button>
        <button className="btn btn-secondary" onClick={submitReady}>Submit {r.ready} Ready Products</button>
      </div>
    </main>
  );
}
