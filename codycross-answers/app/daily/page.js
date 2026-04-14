import Link from 'next/link';
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

function fmtMonth(monthItem) {
  return new Date(monthItem.Year, monthItem.Month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

function fmtArchiveDay(item) {
  return new Date(item.year, item.month - 1, item.day).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
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
  const crossword = snapshot.crossword?.puzzle;
  const archive = snapshot.crossword?.archive || [];
  const archiveEntries = snapshot.crossword?.archiveEntries || [];
  const clueList = crossword?.Cifras || [];
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
              <h1 className="hero-title hero-title--compact">Today&apos;s crossword and password, cleaned up.</h1>
              <p className="hero-text">
                This page highlights the daily answers first, then keeps the extra archive context underneath so it
                stays useful without feeling noisy.
              </p>

              <div className="stat-row">
                <StatBadge label="Date" value={todayLabel} tone="accent" />
                <StatBadge label="Clues" value={String(clueList.length)} />
                <StatBadge label="Password" value={passwordOk ? 'Ready' : 'Pending'} tone="warm" />
              </div>
            </div>

            <div className="hero-rail">
              <div className="panel-card panel-card--accent">
                <span className="panel-kicker">Snapshot status</span>
                <h2>Freshly published and easy to scan.</h2>
                <p>The current snapshot was generated {generatedLabel} and packaged for static GitHub Pages delivery.</p>
              </div>

              <div className="panel-card">
                <span className="panel-kicker">Open next</span>
                <div className="inline-links" style={{ marginTop: '1rem' }}>
                  <Link href="/" className="pill-link">Browse all worlds</Link>
                  <Link href="/world/1" className="pill-link">Start at World 1</Link>
                </div>
              </div>
            </div>
          </section>

          <section className="daily-layout">
            <div className="panel-card panel-card--accent">
              <span className="panel-kicker">Daily crossword</span>
              {crossword ? (
                <>
                  <h2>Today&apos;s grid is ready</h2>
                  <p>Fetched from the public crossword endpoint and surfaced in a clearer answer-card layout.</p>

                  <div className="answer-spotlight">
                    <span className="answer-label">Daily crossword</span>
                    <span className="answer-value">{clueList.length} clue answers</span>
                    <p className="answer-note">Puzzle ID: {crossword.Track || 'Not available'}</p>
                  </div>

                  <div className="detail-grid">
                    <div className="summary-card">
                      <span>Clues</span>
                      <strong>{clueList.length}</strong>
                    </div>
                    <div className="summary-card">
                      <span>Date</span>
                      <strong>{todayLabel}</strong>
                    </div>
                  </div>

                  <div className="answer-grid">
                    {clueList.map((cifra, index) => (
                      <article key={cifra.Id || index} className="clue-card">
                        <span className="clue-card__index">Clue {index + 1}</span>
                        <span className="clue-text">{cifra.Dica}</span>
                        <span className="answer-text">{cifra.Resposta}</span>
                      </article>
                    ))}
                  </div>
                </>
              ) : (
                <div className="state-card" style={{ marginTop: '1rem' }}>
                  <h3>Crossword unavailable</h3>
                  <p>The crossword payload did not load in the current snapshot.</p>
                </div>
              )}
            </div>

            <div className="hero-rail">
              {passwordOk ? (
                <div className="panel-card panel-card--warm">
                  <span className="panel-kicker">Today&apos;s password</span>
                  <h2>Password ready</h2>
                  <p>Recovered through the signed password endpoint and shown with the supporting metadata.</p>

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

                  <div className="bullet-list">
                    <div className="bullet-item">
                      <span className="bullet-dot" />
                      <div className="bullet-copy">
                        <strong>Date</strong>
                        <span>{passwordData?.Date || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="bullet-item">
                      <span className="bullet-dot" />
                      <div className="bullet-copy">
                        <strong>Normalized</strong>
                        <span>{passwordData?.NormalizedPassword || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="panel-card panel-card--warm">
                  <span className="panel-kicker">Today&apos;s password</span>
                  <h2>Password still locked</h2>
                  <p>{passwordError || `The API returned status ${passwordJson?.Status ?? 'unknown'}.`}</p>

                  <details className="debug-block">
                    <summary>Show debug payload</summary>
                    <pre>{JSON.stringify(snapshot.password, null, 2)}</pre>
                  </details>
                </div>
              )}

              <div className="panel-card">
                <span className="panel-kicker">Archive months</span>
                <h3>{archive.length} month buckets tracked</h3>
                <p>The archive view below now lists each dated entry with both small and mid crossword slots.</p>
              </div>
            </div>
          </section>

          <section className="section-block">
            <div className="section-head">
              <div>
                <p className="section-kicker">Archive context</p>
                <h2 className="section-title">Daily crossword archive by month</h2>
              </div>
              <p className="section-copy">Useful when you want to jump backward and see how much daily history is available.</p>
            </div>

            <div className="month-grid">
              {archive.map((monthItem, index) => (
                <article key={`${monthItem.Year}-${monthItem.Month}-${index}`} className="month-card">
                  <strong>{fmtMonth(monthItem)}</strong>
                  <span>{monthItem.QuantidadeDeFases} puzzle phases</span>
                </article>
              ))}
            </div>
          </section>

          <section className="section-block">
            <div className="section-head">
              <div>
                <p className="section-kicker">Dated archive</p>
                <h2 className="section-title">Daily archive entries for {fmtMonth({ Year: snapshot.today.year, Month: snapshot.today.month })}</h2>
              </div>
              <p className="section-copy">Each date exposes both crossword sizes. Small maps to size 1 and mid maps to size 2.</p>
            </div>

            <div className="month-grid">
              {archiveEntries.map((entry) => (
                <article key={entry.key} className="month-card">
                  <strong>{fmtArchiveDay(entry)}</strong>
                  <span>Small: {entry.small ? `ready (${entry.small.puzzleId.slice(0, 8)}...)` : 'missing'}</span>
                  <span>Mid: {entry.mid ? `ready (${entry.mid.puzzleId.slice(0, 8)}...)` : 'missing'}</span>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>

      <SiteFooter generatedAt={snapshot.generatedAt} />
    </>
  );
}
