import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/Shell.jsx';
import { UploadRow } from '../../components/Domain.jsx';
import Icon from '../../lib/icons.jsx';
import { useStore } from '../../lib/store.js';
import { api } from '../../lib/api.js';

const SUGGESTIONS = ['Hardware product', 'Electronics project', 'Consumer product', 'Prototype', 'Startup idea'];

export default function QuickStartBuild() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const setOnboarded = useStore((s) => s.setOnboarded);
  const setMode = useStore((s) => s.setMode);
  const setTmp = useStore((s) => s.setTmp);
  const showToast = useStore((s) => s.showToast);

  const start = async () => {
    if (!text.trim()) { showToast("Describe what you're building first", 'sparkle'); return; }
    setLoading(true);
    const scenario = await api.aiParseBuild(text);
    setTmp({ lastPrompt: text, lastScenario: scenario });
    setOnboarded(true);
    setMode('build');
    navigate('/build/requirements', { replace: true });
  };

  return (
    <main className="screen">
      <TopBar title="Quick start" />
      <div className="hero"><h1 style={{ fontSize: 22 }}>What are you building?</h1></div>
      <div className="pad stack">
        <div className="ai-input-card">
          <textarea
            className="input"
            placeholder="Example: I'm building a smart water bottle that tracks water consumption."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="ai-input-row">
            <UploadRow onUpload={() => showToast('Attached (demo)')} onVoice={() => showToast('Voice captured (demo)', 'mic')} />
          </div>
        </div>
        <div className="chiprow">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="selectchip" type="button" onClick={() => setText(s)}>{s}</button>
          ))}
        </div>
        <button className="btn btn-accent" style={{ marginTop: 4 }} disabled={loading} onClick={start}>
          <Icon name="sparkle" size={16} /> {loading ? 'Thinking…' : 'Start building'}
        </button>
      </div>
    </main>
  );
}
