import { useLocation, useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/Shell.jsx';
import { ProductCardRow, EmptyState } from '../../components/Domain.jsx';
import Icon from '../../lib/icons.jsx';
import { api } from '../../lib/api.js';
import { useStore } from '../../lib/store.js';

export default function SearchResults() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const showToast = useStore((s) => s.showToast);
  const setCartCount = useStore((s) => s.setCartCount);
  const { kind = 'exact', products = [], query = '' } = state || {};

  const addToCart = async (p) => {
    await api.addToCart(p.id, p.moq);
    const c = await api.cart();
    setCartCount(c.reduce((n, l) => n + l.qty, 0));
    showToast('Added to cart');
  };

  return (
    <main className="screen">
      <TopBar title="Results" sub={query ? `"${query}"` : ''} back />
      {kind === 'none' ? (
        <EmptyState
          icon="search"
          title="Couldn't find an exact match."
          body="Describe what you need and we'll help you get it."
          ctaLabel="Request Custom Component"
          onCta={() => navigate('/custom-request/new', { state: { prefill: query } })}
        />
      ) : (
        <div className="pad" style={{ paddingBottom: 4 }}>
          {kind === 'exact' ? (
            <div className="chip chip-available" style={{ marginBottom: 10 }}><Icon name="check" size={13} /> We have what you need</div>
          ) : (
            <div className="chip chip-similar" style={{ marginBottom: 10 }}>We found close options</div>
          )}
          <div className="stack">
            {products.map((p) => <ProductCardRow key={p.id} product={p} onAdd={addToCart} />)}
          </div>
          {kind === 'similar' && (
            <div className="card card-pad" style={{ marginTop: 14, textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Still not right?</div>
              <p style={{ fontSize: 12.5, color: 'var(--text-faint)', margin: '4px 0 12px' }}>
                We can source or manufacture a custom version.
              </p>
              <button className="btn btn-outline-accent" onClick={() => navigate('/custom-request/new', { state: { prefill: query } })}>
                Request a Custom Version
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
