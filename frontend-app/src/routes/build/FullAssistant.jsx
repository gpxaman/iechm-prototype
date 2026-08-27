import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/Shell.jsx';
import { AiMsg, AiTyping, AiUserMsg, UploadRow } from '../../components/Domain.jsx';
import Icon from '../../lib/icons.jsx';
import { api } from '../../lib/api.js';
import { useStore } from '../../lib/store.js';

export default function FullAssistant() {
  const navigate = useNavigate();
  const tmp = useStore((s) => s.tmp);
  const setTmp = useStore((s) => s.setTmp);
  const pushChat = useStore((s) => s.pushChat);
  const popChat = useStore((s) => s.popChat);
  const showToast = useStore((s) => s.showToast);
  const inputRef = useRef(null);
  const logRef = useRef(null);

  useEffect(() => {
    if (!tmp.chatStarted) {
      setTmp({ chatStarted: true });
      pushChat({
        role: 'ai',
        content: <>Hi — tell me what you're building and I'll break it into the parts and components you'll need. For example: <i>"I'm building a smart water bottle that tracks water consumption."</i></>,
      });
    }
  }, []);

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [tmp.chat]);

  const send = async () => {
    const text = inputRef.current.value.trim();
    if (!text) return;
    inputRef.current.value = '';
    pushChat({ role: 'user', content: text });
    pushChat({ role: 'typing' });
    const scenario = await api.aiParseBuild(text);
    popChat();
    setTmp({ lastPrompt: text, lastScenario: scenario });
    const flat = scenario.groups.flatMap((g) => g.items);
    const avail = flat.filter((i) => i.status === 'available').length;
    const custom = flat.filter((i) => i.status === 'custom').length;
    pushChat({
      role: 'ai',
      content: (
        <>
          Got it — <b>{scenario.label}</b>. {scenario.summary}
          <br /><br />
          I matched <b>{avail}</b> of {flat.length} requirements to products already in our network
          {custom ? <>, and found <b>{custom}</b> that will need a custom request.</> : '.'}
          <div style={{ marginTop: 10 }}>
            <button className="btn btn-accent btn-sm" onClick={() => navigate('/build/requirements')}>
              <Icon name="layers" size={14} /> View structured requirements
            </button>
          </div>
        </>
      ),
    });
  };

  return (
    <main className="screen" style={{ display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Build Assistant" sub="AI sourcing & manufacturing expert" back />
      <div className="chat" ref={logRef} style={{ flex: 1, overflowY: 'auto' }}>
        {tmp.chat.map((m, i) =>
          m.role === 'user' ? <AiUserMsg key={i} text={m.content} /> :
          m.role === 'typing' ? <AiTyping key={i} /> :
          <AiMsg key={i}>{m.content}</AiMsg>,
        )}
      </div>
      <div style={{ padding: '0 16px 14px' }}>
        <div className="ai-input-card">
          <textarea ref={inputRef} className="input" placeholder="I'm building a smart water bottle that tracks water consumption."
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <div className="ai-input-row">
            <UploadRow onUpload={() => showToast('Attached (demo)')} onVoice={() => showToast('Voice captured (demo)', 'mic')} />
            <button className="iconbtn" style={{ marginLeft: 'auto', background: 'var(--ink-700)', color: '#fff' }} onClick={send}>
              <Icon name="send" size={15} />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
