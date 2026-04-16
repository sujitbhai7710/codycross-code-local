import { DailyBrowser } from '../../components/daily-browser';
import { SiteFooter, SiteNav, StatBadge } from '../../components/site-shell';
import { buildDailySnapshot, readDailySnapshot } from '../../lib/daily';

export const revalidate = 600;

function fmtDate({ year, month, day }) {
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function fmtDateTime(value) {
  return new Date(value).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default async function DailyPage() {
  const snapshot = (await readDailySnapshot()) || (await buildDailySnapshot().catch(() => null));

  if (!snapshot) {
    return (
      <>
        <SiteNav active="daily" />
        <main className="page-shell">
          <div className="container">
            <section className="state-card">
              <h2>Daily answers are not ready yet</h2>
              <p>The daily snapshot could not be loaded. Try the archive for world answers while the snapshot refreshes.</p>
              <div className="hero-actions">
                <Link href="/" className="button-primary">Open Archive</Link>
              </div>
            </section>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const todayLabel = fmtDate(snapshot.today);
  const archiveEntries = snapshot.crossword?.archiveEntries || [];
  const todayEntry = snapshot.crossword?.todayEntry || archiveEntries.find((entry) => entry.day === snapshot.today.day) || archiveEntries[0] || null;
  const initialClues = todayEntry?.small?.answers?.length || 0;
  const passwordOk = snapshot.password?.json?.Ok;
  const passwordJson = snapshot.password?.json;
  const passwordData = snapshot.password?.decrypted;
  const passwordError = snapshot.password?.error;
  const generatedLabel = snapshot.generatedAt ? fmtDateTime(snapshot.generatedAt) : 'Unknown';

  return (
    <>
      <SiteNav active="daily" />

      <main className="page-shell">
        <div className="container">
          <section className="hero-panel">
            <div className="hero-copy">
              <span className="eyebrow">Daily answers</span>
              <h1 className="hero-title hero-title--compact">Pick a date, switch small or mid, and see the real answers.</h1>
              <p className="hero-text">
                The daily page now opens straight into the archive browser, so you can jump between sizes and dates without the duplicate summary sections.
              </p>

              <div className="stat-row">
                <StatBadge label="Date" value={todayLabel} tone="accent" />
                <StatBadge label="Small clues" value={String(initialClues)} />
                <StatBadge label="Password" value={passwordOk ? 'Ready' : 'Pending'} tone="warm" />
              </div>
            </div>

            <div className="hero-rail">
              <div className="panel-card panel-card--accent">
                <span className="panel-kicker">Snapshot status</span>
                <h2>Published with IST-aware dates.</h2>
                <p>The current snapshot was generated {generatedLabel}. Daily selection now follows Asia/Kolkata instead of the runner timezone.</p>
              </div>
            </div>
          </section>

          <DailyBrowser todayEntry={todayEntry} archiveEntries={archiveEntries} />

          <section className="section-block">
            {passwordOk ? (
              <div className="panel-card panel-card--warm">
                <span className="panel-kicker">Today&apos;s password</span>
                <div className="answer-spotlight answer-spotlight--warm">
                  <span className="answer-label">Password</span>
                  <span className="answer-value">{passwordData?.Password || 'Not available'}</span>
                </div>

                <div className="detail-grid">
                  <div className="summary-card">
                    <span>Max guesses</span>
                    <strong>{passwordData?.MaxGuesses ?? 'N/A'}</strong>
                  </div>
                  <div className="summary-card">
                    <span>Version</span>
                    <strong>{passwordData?.Version ?? 'N/A'}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <div className="panel-card panel-card--warm">
                <span className="panel-kicker">Today&apos;s password</span>
                <h2>Password still locked</h2>
                <p>{passwordError || `The API returned status ${passwordJson?.Status ?? 'unknown'}.`}</p>
              </div>
            )}
          </section>
        </div>
      </main>

      <SiteFooter generatedAt={snapshot.generatedAt} />
    </>
  );
}
