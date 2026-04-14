import Link from 'next/link';

const NAV_ITEMS = [
  { href: '/', key: 'home', label: 'Archive' },
  { href: '/daily', key: 'daily', label: 'Daily Answers' },
];

function formatGeneratedAt(generatedAt) {
  if (!generatedAt) return null;

  try {
    return new Date(generatedAt).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return generatedAt;
  }
}

export function SiteNav({ active }) {
  return (
    <nav className="site-nav">
      <div className="container nav-shell">
        <Link href="/" className="brand-lockup">
          <span className="brand-mark">CC</span>
          <span className="brand-copy">
            <strong>CodyCross Atlas</strong>
            <span>Daily answers and the full 50-world archive</span>
          </span>
        </Link>

        <div className="nav-links">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`nav-link${active === item.key ? ' is-active' : ''}`}
              aria-current={active === item.key ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

export function SiteFooter({ generatedAt }) {
  const generatedLabel = formatGeneratedAt(generatedAt);

  return (
    <footer className="site-footer">
      <div className="container footer-shell">
        <p className="footer-title">CodyCross Atlas</p>
        <p className="footer-copy">Fan-made answer reference. Not affiliated with Fanatee.</p>
        <p className="footer-meta">
          Daily snapshots come from the game API and are published to GitHub Pages.
          {generatedLabel ? ` Last generated ${generatedLabel}.` : ''}
        </p>
      </div>
    </footer>
  );
}

export function StatBadge({ label, value, tone = 'cool' }) {
  return (
    <div className={`stat-badge stat-badge--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
