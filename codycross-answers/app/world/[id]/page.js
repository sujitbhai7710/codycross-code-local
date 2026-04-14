import Link from 'next/link';
import { SiteFooter, SiteNav, StatBadge } from '../../../components/site-shell';
import { WORLD_NAMES, decryptWorldData, fetchWorld } from '../../../lib/api';

export const revalidate = 3600;

export async function generateStaticParams() {
  return Array.from({ length: 50 }, (_, i) => ({ id: String(i + 1) }));
}

export default async function WorldPage({ params }) {
  const worldNum = parseInt(params.id, 10);
  const data = await fetchWorld(worldNum);
  const decrypted = decryptWorldData(data);

  if (!decrypted?.puzzleData) {
    return (
      <>
        <SiteNav active="home" />
        <main className="page-shell">
          <div className="container">
            <section className="state-card">
              <h2>World {worldNum} is unavailable</h2>
              <p>The latest archive data for this world could not be decrypted.</p>
              <div className="hero-actions">
                <Link href="/" className="button-primary">Back to archive</Link>
              </div>
            </section>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const { worldMeta, puzzleData } = decrypted;
  const groups = worldMeta?.GruposDeFases || [];
  const puzzles = Array.isArray(puzzleData) ? puzzleData : [];
  const worldName = (worldMeta?.Nome || WORLD_NAMES[worldNum] || `World ${worldNum}`).trim();
  const clueTotal = puzzles.reduce((sum, puzzle) => sum + (puzzle.Cifras?.length || 0), 0);
  const prevWorld = worldNum > 1 ? worldNum - 1 : null;
  const nextWorld = worldNum < 50 ? worldNum + 1 : null;

  return (
    <>
      <SiteNav active="home" />

      <main className="page-shell">
        <div className="container">
          <section className="hero-panel">
            <div className="hero-copy">
              <div className="breadcrumb">
                <Link href="/">Archive</Link>
                <span>/</span>
                <span>World {worldNum}</span>
              </div>

              <span className="eyebrow">World {String(worldNum).padStart(2, '0')}</span>
              <h1 className="hero-title hero-title--compact">{worldName}</h1>
              <p className="hero-text">
                All puzzle answers for this world are grouped into cleaner cards, with clue details tucked behind
                expandable panels so the page stays readable.
              </p>

              <div className="hero-actions">
                <Link href="/daily" className="button-primary">Open Daily Page</Link>
                {prevWorld ? <Link href={`/world/${prevWorld}`} className="button-secondary">Previous World</Link> : null}
                {nextWorld ? <Link href={`/world/${nextWorld}`} className="button-secondary">Next World</Link> : null}
              </div>

              <div className="stat-row">
                <StatBadge label="Groups" value={String(groups.length)} tone="accent" />
                <StatBadge label="Puzzles" value={String(puzzles.length)} />
                <StatBadge label="Clues" value={String(clueTotal)} tone="warm" />
              </div>
            </div>

            <div className="hero-rail">
              <div className="panel-card panel-card--accent">
                <span className="panel-kicker">World summary</span>
                <h2>{puzzles.length} answer cards ready</h2>
                <p>Open each puzzle to reveal the clue list without losing the full-world overview.</p>
              </div>

              <div className="panel-card">
                <span className="panel-kicker">Nearby worlds</span>
                <div className="inline-links" style={{ marginTop: '1rem' }}>
                  {prevWorld ? <Link href={`/world/${prevWorld}`} className="pill-link">World {prevWorld}</Link> : null}
                  {nextWorld ? <Link href={`/world/${nextWorld}`} className="pill-link">World {nextWorld}</Link> : null}
                  <Link href="/" className="pill-link">Back to archive</Link>
                </div>
              </div>
            </div>
          </section>

          <section className="section-block">
            <div className="section-head">
              <div>
                <p className="section-kicker">Puzzle answers</p>
                <h2 className="section-title">All puzzles in this world</h2>
              </div>
              <p className="section-copy">
                Every card shows the main answer first, then expands into the clue-by-clue breakdown when you need it.
              </p>
            </div>

            <div className="puzzle-grid">
              {puzzles.map((puzzle, index) => (
                <article key={puzzle.Id || index} className="puzzle-card">
                  <div className="puzzle-number">Puzzle {index + 1}</div>
                  <div className="main-answer">{puzzle.Resposta || 'Not available'}</div>
                  <div className="clue-count">{puzzle.Cifras?.length || 0} clues</div>

                  <details className="clue-details">
                    <summary>Show clue list</summary>
                    <div className="clue-list">
                      {(puzzle.Cifras || []).map((clue, clueIndex) => (
                        <div key={clueIndex} className="clue-item">
                          <span className="clue-text">{clue.Dica}</span>
                          <span className="answer-text">{clue.Resposta}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
