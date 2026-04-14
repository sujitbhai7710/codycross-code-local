import Link from 'next/link';
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

export default async function DailyPage() {
  const snapshot = (await readDailySnapshot()) || (await buildDailySnapshot());
  const todayLabel = fmtDate(snapshot.today);
  const crossword = snapshot.crossword?.puzzle;
  const passwordOk = snapshot.password?.json?.Ok;
  const passwordJson = snapshot.password?.json;
  const passwordData = snapshot.password?.decrypted;
  const passwordError = snapshot.password?.error;

  return (
    <>
      <header>
        <div className="container">
          <h1>Daily Crossword & Password</h1>
          <p>{todayLabel}</p>
        </div>
      </header>

      <nav>
        <div className="container">
          <Link href="/">All Worlds</Link>
          <Link href="/daily" className="active">Daily Puzzles</Link>
        </div>
      </nav>

      <main>
        <div className="container">
          <section className="daily-section">
            <h2>Today&apos;s Crossword</h2>
            <p>Publicly fetchable from `crossword/getpuzzle` and refreshed every 10 minutes.</p>
          </section>

          {crossword ? (
            <div className="puzzle-card" style={{ marginBottom: '2rem' }}>
              <div className="puzzle-number">Daily Crossword</div>
              <div className="answer main-answer">{crossword.Track}</div>
              <div className="clue-count">{crossword.Cifras?.length || 0} clues</div>
              <div className="clue-list">
                {(crossword.Cifras || []).map((cifra, index) => (
                  <div key={cifra.Id || index} className="clue-item">
                    <span className="clue-text">{cifra.Dica}</span>
                    <span className="answer-text">{cifra.Resposta}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="encrypted-notice" style={{ marginBottom: '2rem' }}>
              <h4>Crossword unavailable</h4>
              <p>The daily crossword did not load.</p>
            </div>
          )}

          <section className="daily-section">
            <h2>Today&apos;s Password</h2>
            <p>Fetched through `todayspassword/get` using the recovered request signature.</p>
          </section>

          {passwordOk ? (
            <div className="puzzle-card">
              <div className="puzzle-number">Today&apos;s Password</div>
              <div className="answer main-answer">{passwordData?.Password || '—'}</div>
              <div className="clue-count">Max guesses: {passwordData?.MaxGuesses ?? '—'}</div>
              <div className="clue-list">
                <div className="clue-item">
                  <span className="clue-text">Date</span>
                  <span className="answer-text">{passwordData?.Date || '—'}</span>
                </div>
                <div className="clue-item">
                  <span className="clue-text">Normalized</span>
                  <span className="answer-text">{passwordData?.NormalizedPassword || '—'}</span>
                </div>
                <div className="clue-item">
                  <span className="clue-text">Version</span>
                  <span className="answer-text">{passwordData?.Version ?? '—'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="encrypted-notice">
              <h4>Password response not yet usable</h4>
              <p>
                {passwordError || `API returned status ${passwordJson?.Status ?? 'unknown'}`}
              </p>
              <pre style={{ whiteSpace: 'pre-wrap', color: 'var(--text2)', fontSize: '0.85rem', marginTop: '0.75rem' }}>
                {JSON.stringify(snapshot.password, null, 2)}
              </pre>
            </div>
          )}

          <section style={{ marginTop: '2rem' }}>
            <h2 className="section-title">Crossword Archive Months</h2>
            <div className="grid grid-3">
              {(snapshot.crossword?.archive || []).map((monthItem, index) => (
                <div key={`${monthItem.Year}-${monthItem.Month}-${index}`} className="card">
                  <h3>{monthItem.Year}-{String(monthItem.Month).padStart(2, '0')}</h3>
                  <p>{monthItem.QuantidadeDeFases} puzzles</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer>
        <div className="container">
          <p>CodyCross Answers — Fan-made answer reference. Not affiliated with Fanatee.</p>
          <p style={{ marginTop: '0.5rem' }}>Generated at {snapshot.generatedAt}</p>
        </div>
      </footer>
    </>
  );
}
