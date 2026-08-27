import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/Shell.jsx';
import Icon from '../../lib/icons.jsx';
import { api } from '../../lib/api.js';

export default function ScanningState() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const fileName = state?.fileName || 'catalogue.pdf';

  useEffect(() => {
    let cancelled = false;
    api.scanCatalogue(fileName).then((result) => {
      if (!cancelled) navigate('/supplier/extraction', { replace: true, state: result });
    });
    return () => { cancelled = true; };
  }, [fileName]);

  return (
    <main className="screen">
      <TopBar title="Scanning" back />
      <div className="pad" style={{ paddingTop: 28 }}>
        <div className="console">
          <div className="console-head"><span><span className="dot" />IECHM_SCAN &middot; PROCESSING</span><Icon name="scan" size={14} /></div>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>&gt; Reading <b style={{ color: '#F2A25F' }}>{fileName}</b>_</div>
          <div className="stack" style={{ marginTop: 14 }}>
            <div className="sk" style={{ height: 11, width: '88%', background: 'linear-gradient(90deg,#241B12 25%,#3A2C1C 37%,#241B12 63%)' }} />
            <div className="sk" style={{ height: 11, width: '66%', background: 'linear-gradient(90deg,#241B12 25%,#3A2C1C 37%,#241B12 63%)' }} />
            <div className="sk" style={{ height: 11, width: '76%', background: 'linear-gradient(90deg,#241B12 25%,#3A2C1C 37%,#241B12 63%)' }} />
          </div>
        </div>
        <div className="empty" style={{ paddingTop: 26 }}>
          <h3>Scanning your catalogue…</h3>
          <p>Extracting product names, images, categories, and specifications.</p>
        </div>
      </div>
    </main>
  );
}
