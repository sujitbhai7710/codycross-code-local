import { fetchWorld, decryptWorldData, WORLD_NAMES } from '../../../lib/api';
import Link from 'next/link';

export const revalidate = 3600;

export async function generateStaticParams() {
  return Array.from({ length: 50 }, (_, i) => ({ id: String(i + 1) }));
}

export default async function WorldPage({ params }) {
  const worldNum = parseInt(params.id);
  const data = await fetchWorld(worldNum);
  const decrypted = decryptWorldData(data);

  if (!decrypted?.puzzleData) {
    return (
      <>
        <header><div className="container"><h1>World {worldNum}</h1><p>Unable to load</p></div></header>
        <nav><div className="container"><Link href="/">All Worlds</Link></div></nav>
        <main><div className="container"><div className="encrypted-notice"><h4>Data Not Available</h4></div></div></main>
      </>
    );
  }

  const { worldMeta, puzzleData } = decrypted;
  const groups = worldMeta?.GruposDeFases || [];
  const puzzles = Array.isArray(puzzleData) ? puzzleData : [];

  return (
    <>
      <header>
        <div className="container">
          <h1>World {worldNum}: {worldMeta?.Nome || WORLD_NAMES[worldNum]}</h1>
          <p>{puzzles.length} puzzles with {puzzles.reduce((s, p) => s + (p.Cifras?.length || 0), 0)} clues</p>
        </div>
      </header>

      <nav>
        <div className="container">
          <Link href="/">All Worlds</Link>
          <Link href={`/world/${worldNum}`} className="active">{worldMeta?.Nome}</Link>
        </div>
      </nav>

      <main>
        <div className="container">
          <div className="stats-bar">
            <div className="stat"><div className="value">{worldNum}</div><div className="label">World</div></div>
            <div className="stat"><div className="value">{groups.length}</div><div className="label">Groups</div></div>
            <div className="stat"><div className="value">{puzzles.length}</div><div className="label">Puzzles</div></div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <h2 className="section-title">All Puzzles & Answers</h2>
            <div className="puzzle-grid">
              {puzzles.map((puzzle, i) => (
                <div key={puzzle.Id || i} className="puzzle-card">
                  <div className="puzzle-number">Puzzle {i + 1}</div>
                  <div className="answer main-answer">{puzzle.Resposta || '—'}</div>
                  <div className="clue-count">{puzzle.Cifras?.length || 0} clues</div>
                  <details className="clue-details">
                    <summary>Show all clues</summary>
                    <div className="clue-list">
                      {(puzzle.Cifras || []).map((c, ci) => (
                        <div key={ci} className="clue-item">
                          <span className="clue-text">{c.Dica}</span>
                          <span className="answer-text">{c.Resposta}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <h2 className="section-title">Nearby Worlds</h2>
            <div className="grid grid-4">
              {[worldNum - 1, worldNum + 1].filter(n => n >= 1 && n <= 50).map(n => (
                <Link key={n} href={`/world/${n}`} className="card">
                  <h3>World {n}</h3>
                  <p>{WORLD_NAMES[n] || ''}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer>
        <div className="container">
          <p>CodyCross Answers — Fan-made answer reference. Not affiliated with Fanatee.</p>
        </div>
      </footer>
    </>
  );
}
