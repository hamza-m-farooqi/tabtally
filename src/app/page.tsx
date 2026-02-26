import Link from "next/link";

export default function Home() {
  return (
    <main className="landing-shell">
      {/* ── Decorative background blobs ── */}
      <div className="landing-blob landing-blob-1" />
      <div className="landing-blob landing-blob-2" />
      <div className="landing-blob landing-blob-3" />

      {/* ── Nav bar ── */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          {/* Brand */}
          <div className="landing-nav-brand">
            <div className="landing-nav-logo">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <rect x="2" y="3" width="20" height="14" rx="3" fill="currentColor" opacity="0.25" />
                <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M2 3h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <span className="landing-nav-name">TabTally</span>
          </div>

          {/* CTA buttons */}
          <div className="landing-nav-cta">
            <Link className="landing-cta-ghost" href="/signin">Sign in</Link>
            <Link className="landing-cta-primary" href="/signup">Get started</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          {/* Pill badge */}
          <div className="landing-badge">
            <span className="landing-badge-dot" />
            Shared expense tracking, simplified
          </div>

          <h1 className="landing-hero-title">
            Settle shared expenses<br />
            <span className="landing-hero-accent">with clarity.</span>
          </h1>

          <p className="landing-hero-subtitle">
            Track daily expenses across your team, split costs evenly, and
            see exactly who owes whom — with admin approval baked in.
          </p>

          <div className="landing-hero-actions">
            <Link className="landing-btn-primary" href="/signup" id="landing-signup-btn">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
              Create free account
            </Link>
            <Link className="landing-btn-ghost" href="/signin" id="landing-signin-btn">
              Sign in to workspace
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>

        {/* ── Visual card mockup ── */}
        <div className="landing-hero-visual">
          <div className="landing-mockup-card">
            <div className="landing-mockup-header">
              <div className="landing-mockup-avatar">A</div>
              <div>
                <div className="landing-mockup-title">February 2026</div>
                <div className="landing-mockup-sub">Month-to-date snapshot</div>
              </div>
            </div>
            <div className="landing-mockup-stats">
              <div className="landing-mockup-stat">
                <span className="landing-mockup-stat-label">Total spend</span>
                <span className="landing-mockup-stat-val">PKR 48,200</span>
              </div>
              <div className="landing-mockup-stat">
                <span className="landing-mockup-stat-label">You will receive</span>
                <span className="landing-mockup-stat-val landing-teal">PKR 12,600</span>
              </div>
              <div className="landing-mockup-stat">
                <span className="landing-mockup-stat-label">You will pay</span>
                <span className="landing-mockup-stat-val landing-rose">PKR 4,800</span>
              </div>
              <div className="landing-mockup-stat landing-mockup-stat-featured">
                <span className="landing-mockup-stat-label">Net position</span>
                <span className="landing-mockup-stat-val landing-teal landing-mockup-stat-big">+PKR 7,800</span>
              </div>
            </div>
            <div className="landing-mockup-row">
              <span>2026-02-24</span>
              <span>PKR 14,500</span>
              <span className="landing-pill-settled">Settled</span>
            </div>
            <div className="landing-mockup-row">
              <span>2026-02-25</span>
              <span>PKR 9,200</span>
              <span className="landing-pill-pending">Pending</span>
            </div>
            <div className="landing-mockup-row landing-mockup-row-last">
              <span>2026-02-26</span>
              <span>PKR 6,100</span>
              <span className="landing-pill-pending">Pending</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature grid ── */}
      <section className="landing-features">
        <h2 className="landing-section-title">Everything your team needs</h2>
        <p className="landing-section-sub">
          Purpose-built for small teams who share expenses daily.
        </p>
        <div className="landing-feature-grid">
          <div className="landing-feature-card">
            <div className="landing-feature-icon landing-icon-teal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <h3 className="landing-feature-title">Record expenses</h3>
            <p className="landing-feature-desc">Log any expense for the day with amount, note, category, and participants.</p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon landing-icon-blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <h3 className="landing-feature-title">Track history</h3>
            <p className="landing-feature-desc">Browse daily summaries, filter by month, and drill into individual expenses.</p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon landing-icon-emerald">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <h3 className="landing-feature-title">Smart settlements</h3>
            <p className="landing-feature-desc">Automatically calculate who owes whom and send settlement requests with one click.</p>
          </div>

          <div className="landing-feature-card">
            <div className="landing-feature-icon landing-icon-orange">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="landing-feature-title">Admin controls</h3>
            <p className="landing-feature-desc">Approve new users, manage workspace members, and maintain full oversight.</p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-nav-brand" style={{ justifyContent: "center" }}>
          <div className="landing-nav-logo" style={{ width: "28px", height: "28px", borderRadius: "8px" }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
              <rect x="2" y="3" width="20" height="14" rx="3" fill="currentColor" opacity="0.25" />
              <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M2 3h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="landing-footer-name">TabTally</span>
        </div>
        <p className="landing-footer-copy">Shared expenses, approvals, and daily settlement.</p>
      </footer>
    </main>
  );
}
