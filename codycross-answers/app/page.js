import Link from 'next/link';
import { SiteFooter, SiteNav, StatBadge } from '../components/site-shell';
import { WORLD_NAMES, decryptWorldData, fetchWorld } from '../lib/api';

export const revalidate = 3600;

async function getWorlds() {
  const worlds = [];
  const batchSize = 10;

  for (let batch = 0; batch < 50; batch += batchSize) {
    const promises = [];

    for (let i = batch + 1; i <= Math.min(batch + batchSize, 50); i++) {
      promises.push(
        fetchWorld(i)
          .then((data) => {
            const decrypted = decryptWorldData(data);
            const name = (decrypted?.worldMeta?.Nome || WORLD_NAMES[i] || `World ${i}`).trim();
            const puzzles = decrypted?.puzzleData || [];
            const totalClues = puzzles.reduce((sum, puzzle) => sum + (puzzle.Cifras?.length || 0), 0);

            worlds[i] = {
              num: i,
              name,
              decrypted: Boolean(decrypted),
              puzzleCount: puzzles.length,
              clueCount: totalClues,
            };
          })
          .catch(() => {
            worlds[i] = {
              num: i,
              name: (WORLD_NAMES[i] || `World ${i}`).trim(),
              decrypted: false,
              puzzleCount: 0,
              clueCount: 0,
            };
          })
      );
    }

    await Promise.all(promises);
  }

  return worlds.filter(Boolean);
}

function fmtNumber(value) {
  return value.toLocaleString('en-US');
}

export default async function Home() {
  const worlds = await getWorlds();
  const totalPuzzles = worlds.reduce((sum, world) => sum + world.puzzleCount, 0);
  const totalClues = worlds.reduce((sum, world) => sum + world.clueCount, 0);
  const availableWorlds = worlds.filter((world) => world.decrypted).length;

  return (
    <>
      <SiteNav active="home" />

      <main className="page-shell">
        <div className="container">
          <section className="hero-panel">
            <div className="hero-copy">
              <span className="eyebrow">Live answer atlas</span>
              <h1 className="hero-title">Daily answers first. The full archive right behind them.</h1>
              <p className="hero-text">
                Jump into today&apos;s crossword, today&apos;s password, or any CodyCross world without the clutter.
                Everything here is organized for quick scanning and fast navigation.
              </p>

              <div className="hero-actions">
                <Link href="/daily" className="button-primary">Open Daily Answers</Link>
                <Link href="/world/1" className="button-secondary">Browse World 1</Link>
              </div>

              <div className="stat-row">
                <StatBadge label="Worlds" value={fmtNumber(worlds.length)} tone="accent" />
                <StatBadge label="Puzzles" value={fmtNumber(totalPuzzles)} />
                <StatBadge label="Clues" value={fmtNumber(totalClues)} tone="warm" />
              </div>
            </div>

            <div className="hero-rail">
              <div className="panel-card panel-card--accent">
                <span className="panel-kicker">What&apos;s live now</span>
                <h2>Daily page, world archive, and clean answer cards.</h2>
                <p>
                  The daily page is front and center, and every world is packaged into a much easier browse than the
                  old wall of links.
                </p>
              </div>

              <div className="panel-card">
                <span className="panel-kicker">Quick status</span>
                <div className="bullet-list">
                  <div className="bullet-item">
                    <span className="bullet-dot" />
                    <div className="bullet-copy">
                      <strong>{availableWorlds} worlds ready</strong>
                      <span>Decrypted and indexed for quick navigation.</span>
                    </div>
                  </div>

                  <div className="bullet-item">
                    <span className="bullet-dot" />
                    <div className="bullet-copy">
                      <strong>Daily snapshot included</strong>
                      <span>Today&apos;s crossword and password stay one tap away.</span>
                    </div>
                  </div>

                  <div className="bullet-item">
                    <span className="bullet-dot" />
                    <div className="bullet-copy">
                      <strong>Built for GitHub Pages</strong>
                      <span>Navigation now respects the deployed repo subpath.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="section-block">
            <div className="feature-grid">
              <article className="feature-card">
                <span className="feature-chip">Daily first</span>
                <strong>Today&apos;s answers are easier to spot.</strong>
                <p>The daily page now leads with the crossword and password instead of burying them in plain blocks.</p>
              </article>

              <article className="feature-card">
                <span className="feature-chip">Fast browse</span>
                <strong>50 worlds, cleaner cards.</strong>
                <p>Each world has a stronger visual hierarchy with stats that are readable at a glance.</p>
              </article>

              <article className="feature-card">
                <span className="feature-chip">Pages-safe</span>
                <strong>Routes work on the deployed repo URL.</strong>
                <p>GitHub Pages navigation now stays inside the repository subpath instead of jumping to the site root.</p>
              </article>
            </div>
          </section>

          <section className="section-block">
            <div className="section-head">
              <div>
                <p className="section-kicker">World archive</p>
                <h2 className="section-title">All 50 worlds in one cleaner grid</h2>
              </div>
              <p className="section-copy">
                Pick a world and open every puzzle answer in a layout that is easier to skim on desktop and mobile.
              </p>
            </div>

            <div className="world-grid">
              {worlds.map((world) => (
                <Link
                  key={world.num}
                  href={`/world/${world.num}`}
                  className={`world-card${world.decrypted ? '' : ' world-card--muted'}`}
                >
                  <div className="world-card__top">
                    <span className="world-card__number">{String(world.num).padStart(2, '0')}</span>
                    <span className={`info-chip ${world.decrypted ? 'info-chip--success' : 'info-chip--warning'}`}>
                      {world.decrypted ? 'Ready' : 'Unavailable'}
                    </span>
                  </div>

                  <h3>{world.name || WORLD_NAMES[world.num] || `World ${world.num}`}</h3>
                  <p>
                    {world.decrypted
                      ? 'Open the full puzzle list, clue set, and revealed answers for this world.'
                      : 'This world could not be decrypted from the latest snapshot.'}
                  </p>

                  <div className="world-card__stats">
                    <span>{fmtNumber(world.puzzleCount)} puzzles</span>
                    <span>{fmtNumber(world.clueCount)} clues</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
