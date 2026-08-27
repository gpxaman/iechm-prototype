import { useNavigate } from 'react-router-dom';
import Icon from '../lib/icons.jsx';
import { money, timeAgo } from '../lib/api.js';
import { productIcon } from '../lib/constants.js';

const CHIP_MAP = {
  available: { cls: 'chip-available', label: 'Available' },
  similar: { cls: 'chip-similar', label: 'Similar option' },
  custom: { cls: 'chip-custom', label: 'Custom' },
  info: { cls: 'chip-info', label: 'Need info' },
  neutral: { cls: 'chip-neutral', label: '' },
  danger: { cls: 'chip-danger', label: '' },
};

export function StatusChip({ status, text }) {
  const m = CHIP_MAP[status] || CHIP_MAP.neutral;
  return (
    <span className={'chip ' + m.cls}>
      <span className="dot" />
      {text || m.label}
    </span>
  );
}

export function ProductCardGrid({ product }) {
  const navigate = useNavigate();
  return (
    <div className="pcard tap" onClick={() => navigate(`/product/${product.id}`)}>
      <div className="thumb"><Icon name={productIcon(product.category)} size={30} /></div>
      <div className="pname">{product.name}</div>
      <div className="pprice">{money(product.price)}<span style={{ color: 'var(--text-faint)', fontWeight: 500 }}>/unit</span></div>
      <div className="pmeta"><span>MOQ {product.moq.toLocaleString()}</span><span>&middot;</span><span>{product.leadTimeDays}d lead</span></div>
    </div>
  );
}

export function ProductCardRow({ product, onAdd }) {
  const navigate = useNavigate();
  return (
    <div className="card card-pad tap pcard-row" onClick={() => navigate(`/product/${product.id}`)}>
      <div className="thumb"><Icon name={productIcon(product.category)} size={26} /></div>
      <div className="info">
        <div className="pname" style={{ marginTop: 0 }}>{product.name}</div>
        <div className="pmeta" style={{ marginTop: 5 }}>
          <span>MOQ {product.moq.toLocaleString()}</span><span>&middot;</span>
          <span>{product.leadTimeDays}d lead</span><span>&middot;</span><span>{product.stock}</span>
        </div>
        <div className="pprice" style={{ marginTop: 5 }}>
          {money(product.price)}<span style={{ color: 'var(--text-faint)', fontWeight: 500, fontFamily: 'var(--font-body)' }}> /unit</span>
        </div>
      </div>
      {onAdd && (
        <button className="iconbtn" title="Add to cart" onClick={(e) => { e.stopPropagation(); onAdd(product); }}>
          <Icon name="plus" size={16} />
        </button>
      )}
    </div>
  );
}

export function RequirementRow({ req, onOpen }) {
  return (
    <button className="card card-pad tap" onClick={onOpen} style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%' }}>
        <div style={{ fontWeight: 600, fontSize: 14, flex: 1, minWidth: 0 }}>{req.name}</div>
        <StatusChip status={req.status} />
      </div>
      <div className="tag">{req.group}</div>
      {req.note && <div style={{ fontSize: 12.5, color: 'var(--text-faint)', lineHeight: 1.4 }}>{req.note}</div>}
    </button>
  );
}

export function ProjectCard({ project }) {
  const navigate = useNavigate();
  const total = project.requirements.length;
  const avail = project.requirements.filter((r) => r.status === 'available').length;
  const review = project.requirements.filter((r) => r.status === 'similar' || r.status === 'info').length;
  const custom = project.requirements.filter((r) => r.status === 'custom').length;
  const pct = total ? Math.round((avail / total) * 100) : 0;
  return (
    <div className="card card-pad tap" onClick={() => navigate(`/project/${project.id}`)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15.5 }}>{project.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>Updated {timeAgo(project.createdAt)}</div>
        </div>
        <Icon name="chevron" size={16} />
      </div>
      <div className="progress" style={{ marginTop: 12 }}><i style={{ width: pct + '%' }} /></div>
      <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--text-faint)' }}><b style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{total}</b> requirements</span>
        <span style={{ fontSize: 12, color: 'var(--success-600)' }}><b style={{ fontFamily: 'var(--font-mono)' }}>{avail}</b> available</span>
        <span style={{ fontSize: 12, color: 'var(--teal-600)' }}><b style={{ fontFamily: 'var(--font-mono)' }}>{review}</b> review</span>
        <span style={{ fontSize: 12, color: 'var(--copper-600)' }}><b style={{ fontFamily: 'var(--font-mono)' }}>{custom}</b> custom</span>
      </div>
    </div>
  );
}

export function CustomRequestCard({ cr, stageLabel, stages }) {
  const navigate = useNavigate();
  const idx = stages.indexOf(cr.status);
  return (
    <div className="card card-pad tap" onClick={() => navigate(`/request/${cr.id}`)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>{cr.title}</div>
        <Icon name="chevron" size={16} />
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 4, lineHeight: 1.4 }}>{cr.description}</div>
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="chip chip-neutral">{stageLabel[cr.status]}</span>
        <span className="tag" style={{ marginLeft: 'auto' }}>{idx + 1}/{stages.length}</span>
      </div>
    </div>
  );
}

export function DealCard({ deal, stageLabel }) {
  const navigate = useNavigate();
  return (
    <div className="card card-pad tap" onClick={() => navigate(`/deal/${deal.id}`)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14.5 }}>{deal.customer}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 2 }}>{deal.need}</div>
        </div>
        <Icon name="chevron" size={16} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
        <span className={'chip ' + (deal.status === 'won' ? 'chip-available' : deal.status === 'lost' ? 'chip-danger' : 'chip-neutral')}>
          {stageLabel[deal.status]}
        </span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>{money(deal.value)}</span>
      </div>
    </div>
  );
}

export function Timeline({ stages, labels, descs, currentKey, extraNote }) {
  const idx = stages.indexOf(currentKey);
  return (
    <div className="timeline">
      {stages.map((s, i) => {
        const done = i < idx, now = i === idx;
        return (
          <div className="tl-step" key={s}>
            <div className="tl-marker">
              <div className={'tl-dot' + (done ? ' done' : now ? ' now' : '')} />
              {i < stages.length - 1 && <div className={'tl-line' + (done ? ' done' : '')} />}
            </div>
            <div className="tl-body">
              <div className={'tl-title' + (!(done || now) ? ' faint' : '')}>{labels[s]}</div>
              {now && <div className="tl-desc">{descs[s]}{extraNote ? ' ' + extraNote : ''}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function EmptyState({ icon = 'box', title, body, ctaLabel, onCta }) {
  return (
    <div className="empty">
      <div className="ic"><Icon name={icon} size={26} /></div>
      <h3>{title}</h3>
      <p>{body}</p>
      {ctaLabel && (
        <button className="btn btn-accent" style={{ width: 'auto', marginTop: 6, padding: '12px 20px' }} onClick={onCta}>
          {ctaLabel}
        </button>
      )}
    </div>
  );
}

export function AiUserMsg({ text }) {
  return <div className="bubble-user">{text}</div>;
}
export function AiMsg({ children }) {
  return (
    <div className="bubble-ai">
      <div className="avatar"><Icon name="sparkle" size={14} /></div>
      <div className="content">{children}</div>
    </div>
  );
}
export function AiTyping() {
  return (
    <div className="bubble-ai">
      <div className="avatar"><Icon name="sparkle" size={14} /></div>
      <div className="content typing"><span /><span /><span /></div>
    </div>
  );
}

export function UploadRow({ onUpload, onVoice }) {
  return (
    <div className="chiprow">
      <button className="selectchip" type="button" onClick={() => onUpload('Image')}><Icon name="image" size={14} /> Image</button>
      <button className="selectchip" type="button" onClick={() => onUpload('Document')}><Icon name="doc" size={14} /> Document</button>
      <button className="selectchip" type="button" onClick={() => onUpload('CAD file')}><Icon name="box" size={14} /> CAD</button>
      <button className="selectchip" type="button" onClick={onVoice}><Icon name="mic" size={14} /> Voice</button>
    </div>
  );
}

export function FileList({ files, onRemove }) {
  if (!files || !files.length) return null;
  return (
    <div className="chiprow">
      {files.map((f, i) => (
        <span className="filechip" key={f + i}>
          <Icon name="file" size={13} /> {f}
          {onRemove && (
            <span style={{ cursor: 'pointer', color: 'var(--text-faint)' }} onClick={() => onRemove(i)}>
              <Icon name="close" size={12} />
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

export function RequirementGroupBlock({ groups }) {
  return groups.map((g) => (
    <div key={g.group} style={{ marginBottom: 4 }}>
      <div className="tag" style={{ margin: '14px 0 8px' }}>{g.group}</div>
      <div className="stack">
        {g.items.map((it) => (
          <div className="card card-pad" key={it.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{it.name}</span>
            <StatusChip status={it.status} />
          </div>
        ))}
      </div>
    </div>
  ));
}
