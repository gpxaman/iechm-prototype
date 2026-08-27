import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/Shell.jsx';
import { UploadRow, FileList } from '../../components/Domain.jsx';
import Icon from '../../lib/icons.jsx';
import { api } from '../../lib/api.js';
import { useStore } from '../../lib/store.js';

const QTY_OPTIONS = ['Prototype', 'Under 10', '10–100', '100–1,000', '1,000+'];

export default function CustomRequestForm() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const showToast = useStore((s) => s.showToast);
  const [text, setText] = useState(state?.prefill || '');
  const [files, setFiles] = useState([]);
  const [extracted, setExtracted] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const projectId = state?.projectId;

  const extract = async () => {
    if (!text.trim()) { showToast('Describe what you need made', 'sparkle'); return; }
    setExtracting(true);
    const x = await api.aiParseCustomRequest(text);
    if (x.quantity === 'Not specified') x.quantity = 'Prototype';
    setExtracted(x);
    setExtracting(false);
  };

  const upload = (kind) => {
    const ext = kind === 'Image' ? '.jpg' : kind === 'CAD file' ? '.step' : '.pdf';
    setFiles((f) => [...f, kind.toLowerCase().replace(/\s+/g, '-') + '-' + Math.floor(Math.random() * 90 + 10) + ext]);
  };
  const removeFile = (i) => setFiles((f) => f.filter((_, idx) => idx !== i));

  return (
    <main className="screen">
      <TopBar title="Custom Component Request" back />
      <div className="pad stack">
        <h1 style={{ fontSize: 18 }}>What do you need made?</h1>
        <div className="ai-input-card">
          <textarea className="input" placeholder="I need a waterproof aluminum enclosure for an IoT device." value={text} onChange={(e) => setText(e.target.value)} />
          <div className="ai-input-row"><UploadRow onUpload={upload} onVoice={() => showToast('Voice captured (demo)', 'mic')} /></div>
        </div>
        <FileList files={files} onRemove={removeFile} />
        <button className="btn btn-accent" disabled={extracting} onClick={extract}>
          <Icon name="sparkle" size={16} /> {extracting ? 'Structuring…' : 'Let AI structure this'}
        </button>
        {extracted && (
          <ExtractedForm
            extracted={extracted}
            setExtracted={setExtracted}
            onSubmit={async (fields) => {
              const cr = await api.createCustomRequest({ ...fields, description: text, files, projectId });
              showToast('Request submitted');
              navigate(`/request/${cr.id}`, { replace: true });
            }}
          />
        )}
      </div>
    </main>
  );
}

function ExtractedForm({ extracted, setExtracted, onSubmit }) {
  const materialRef = useRef(null);
  const dimsRef = useRef(null);
  const finishRef = useRef(null);
  const timelineRef = useRef(null);

  const submit = () => {
    onSubmit({
      title: extracted.component,
      material: materialRef.current.textContent.trim(),
      dims: dimsRef.current.textContent.trim(),
      finish: finishRef.current.textContent.trim(),
      timeline: timelineRef.current.textContent.trim(),
      quantity: extracted.quantity,
    });
  };

  return (
    <>
      <div className="card card-pad" style={{ marginTop: 4 }}>
        <div className="section-title" style={{ marginBottom: 8 }}>Custom Component Request</div>
        <div className="kv"><span className="k">Component</span><span className="v" style={{ textAlign: 'right', maxWidth: '60%' }}>{extracted.component}</span></div><hr className="divider" />
        <div className="kv"><span className="k">Material</span><span className="v" ref={materialRef} contentEditable suppressContentEditableWarning>{extracted.material}</span></div><hr className="divider" />
        <div className="kv"><span className="k">Dimensions</span><span className="v" ref={dimsRef} contentEditable suppressContentEditableWarning>{extracted.dims}</span></div><hr className="divider" />
        <div className="kv"><span className="k">Finish</span><span className="v" ref={finishRef} contentEditable suppressContentEditableWarning>{extracted.finish}</span></div><hr className="divider" />
        <div className="kv"><span className="k">Target timeline</span><span className="v" ref={timelineRef} contentEditable suppressContentEditableWarning>{extracted.timeline}</span></div>
      </div>
      <div className="field" style={{ marginTop: 14 }}>
        <label>Approximate quantity for your first run</label>
        <div className="chiprow">
          {QTY_OPTIONS.map((q) => (
            <button key={q} className={'selectchip' + (extracted.quantity === q ? ' sel' : '')} type="button"
              onClick={() => setExtracted({ ...extracted, quantity: q })}>{q}</button>
          ))}
        </div>
      </div>
      <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={submit}>Submit Request</button>
      <p style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--text-faint)', marginTop: 8 }}>
        Missing details are fine — we'll follow up if needed.
      </p>
    </>
  );
}
