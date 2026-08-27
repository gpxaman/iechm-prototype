import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/Shell.jsx';
import { Timeline } from '../../components/Domain.jsx';
import Icon from '../../lib/icons.jsx';
import { useStore } from '../../lib/store.js';

const STEPS = ['register', 'verify', 'submit', 'track', 'convert', 'earn'];
const LABELS = { register: 'Register', verify: 'Get verified', submit: 'Submit a deal', track: 'Track progress', convert: 'Deal converts', earn: 'Earn commission' };
const DESCS = {
  register: 'Tell us a little about yourself.',
  verify: 'Quick identity check — usually same day.',
  submit: 'Refer a business that needs sourcing or manufacturing.',
  track: 'Watch it move through our pipeline.',
  convert: 'We close the business.',
  earn: 'Commission lands in your account.',
};

export default function QuickStartEarn() {
  const navigate = useNavigate();
  const setOnboarded = useStore((s) => s.setOnboarded);
  const setMode = useStore((s) => s.setMode);

  const go = () => {
    setOnboarded(true);
    setMode('earn');
    navigate('/earn/onboarding');
  };

  return (
    <main className="screen">
      <TopBar title="Quick start" />
      <div className="hero"><h1 style={{ fontSize: 22 }}>Earn by bringing opportunities to us.</h1></div>
      <div className="pad stack">
        <div className="card card-pad">
          <Timeline stages={STEPS} labels={LABELS} descs={DESCS} currentKey="register" />
        </div>
        <button className="btn btn-accent" onClick={go}>
          <Icon name="handshake" size={16} /> Become a Deal Partner
        </button>
      </div>
    </main>
  );
}
