import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/Shell.jsx';
import Icon from '../../lib/icons.jsx';

export default function CatalogueUpload() {
  const navigate = useNavigate();
  const upload = (kind) => navigate('/supplier/scanning', { state: { fileName: kind } });

  const Slot = ({ icon, title, desc, kind }) => (
    <button className="upload-slot tap" onClick={() => upload(kind)}>
      <span className="iconbtn"><Icon name={icon} size={18} /></span>
      <div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{title}</div><div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{desc}</div></div>
    </button>
  );

  return (
    <main className="screen">
      <TopBar title="Upload Catalogue" back />
      <div className="pad stack">
        <h1 style={{ fontSize: 18 }}>Add your products</h1>
        <p style={{ fontSize: 13, color: 'var(--text-faint)', lineHeight: 1.5 }}>
          Upload whatever you already have — a PDF catalogue, spec sheets, photos, or a spreadsheet. AI extracts the products for you.
        </p>
        <Slot icon="doc" title="PDF catalogue" desc="Multi-page product catalogues" kind="PDF catalogue" />
        <Slot icon="clip" title="Spreadsheet" desc="CSV or XLSX product list" kind="Spreadsheet" />
        <Slot icon="image" title="Product images" desc="Photos with visible specs or labels" kind="Product images" />
      </div>
    </main>
  );
}
