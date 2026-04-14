import Link from 'next/link';
import { WORLD_NAMES, fetchWorld, decryptWorldData } from '../lib/api';

export const revalidate = 3600;

async function getWorlds() {
  const worlds = [];
  const batchSize = 10;
  for (let batch = 0; batch < 50; batch += batchSize) {
    const promises = [];
    for (let i = batch + 1; i <= Math.min(batch + batchSize, 50); i++) {
      promises.push(
        fetchWorld(i)
          .then(data => {
            const decrypted = decryptWorldData(data);
            const name = decrypted?.worldMeta?.Nome || WORLD_NAMES[i] || `World ${i}`;
            const puzzles = decrypted?.puzzleData || [];
            const totalClues = puzzles.reduce((s, p) => s + (p.Cifras?.length || 0), 0);
            worlds[i] = { num: i, name, decrypted: !!decrypted, puzzleCount: puzzles.length, clueCount: totalClues };
          })
          .catch(() => {
            worlds[i] = { num: i, name: WORLD_NAMES[i] || `World ${i}`, decrypted: false, puzzleCount: 0, clueCount: 0 };
          })
      );
    }
    await Promise.all(promises);
  }
  return worlds.filter(Boolean);
}

export default async function Home() {
  const worlds = await getWorlds();
  const totalPuzzles = worlds.reduce((s, w) => s + w.puzzleCount, 0);
  const totalClues = worlds.reduce((s, w) => s + w.clueCount, 0);

  return (
    <>
      <header>
        <div className="container">
          <h1>CodyCross Answers</h1>
          <p>{totalPuzzles.toLocaleString()} puzzles with {totalClues.toLocaleString()} clues across {worlds.length} worlds</p>
        </div>
      </header>

      <nav>
        <div className="container">
          <Link href="/" className="active">All Worlds</Link>
          <Link href="/daily">Daily Puzzles</Link>
        </div>
      </nav>

      <main>
        <div className="container">
          <section className="daily-section">
            <h2>Daily Crossword & Password</h2>
            <p>Today&apos;s mini and mid crossword and password puzzles.</p>
            <div style={{ marginTop: '1rem' }}>
              <Link href="/daily" className="btn-primary">View Today&apos;s Answers</Link>
            </div>
          </section>

          <h2 className="section-title">All Worlds</h2>
          <div className="grid grid-3">
            {worlds.map(w => (
              <Link key={w.num} href={`/world/${w.num}`} className="card world-link">
                <div className="world-number">{w.num}</div>
                <div className="world-info">
                  <h3>{w.name}</h3>
                  <p>
                    {w.decrypted ? (
                      <>{w.puzzleCount} puzzles &middot; {w.clueCount} clues</>
                    ) : (
                      <span className="badge badge-warning">Unavailable</span>
                    )}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <footer>
        <div className="container">
          <p>CodyCross Answers — Fan-made answer reference. Not affiliated with Fanatee.</p>
          <p style={{ marginTop: '0.5rem' }}>Data from game API &middot; Auto-updated hourly</p>
        </div>
      </footer>
    </>
  );
}
