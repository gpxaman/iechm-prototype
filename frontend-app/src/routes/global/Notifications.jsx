import { useEffect, useState } from 'react';
import { TopBar } from '../../components/Shell.jsx';
import Icon from '../../lib/icons.jsx';
import { api, timeAgo } from '../../lib/api.js';

const ROW_ICON = { order: 'truck', request: 'wrench', deal: 'handshake', project: 'layers' };

export default function Notifications() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.notifications().then(setItems); }, []);

  return (
    <main className="screen">
      <TopBar title="Notifications" back />
      <div className="pad stack" style={{ paddingBottom: 20 }}>
        {items.map((n) => (
          <div className="card card-pad" key={n.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', opacity: n.read ? 0.6 : 1 }}>
            <span className="iconbtn" style={{ width: 34, height: 34, flex: '0 0 auto' }}><Icon name={ROW_ICON[n.type] || 'layers'} size={16} /></span>
            <span style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{n.title}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 3 }}>{timeAgo(n.time)}</div>
            </span>
            {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flex: '0 0 auto', marginTop: 5 }} />}
          </div>
        ))}
      </div>
    </main>
  );
}
