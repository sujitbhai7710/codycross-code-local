'use client';

import { useMemo, useState } from 'react';

function formatArchiveDate(entry) {
  return new Date(entry.year, entry.month - 1, entry.day).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatInputDate(entry) {
  return `${entry.year}-${String(entry.month).padStart(2, '0')}-${String(entry.day).padStart(2, '0')}`;
}

export function DailyBrowser({ todayEntry, initialEntry = null, archiveEntries = [], todayPublished = true }) {
  const defaultEntry = initialEntry || todayEntry || archiveEntries[0] || null;
  const [selectedMode, setSelectedMode] = useState('small');
  const [selectedDate, setSelectedDate] = useState(defaultEntry ? formatInputDate(defaultEntry) : '');

  const byDate = useMemo(() => {
    const map = new Map();
    for (const entry of archiveEntries) {
      map.set(formatInputDate(entry), entry);
    }
    return map;
  }, [archiveEntries]);

  const currentEntry = byDate.get(selectedDate) || defaultEntry;
  const selectedPuzzle = currentEntry?.[selectedMode] || null;
  const selectedAnswers = selectedPuzzle?.answers || [];

  return (
    <section className="section-block">
      <div className="section-head">
        <div>
          <p className="section-kicker">Archive explorer</p>
          <h2 className="section-title">Pick a date, then switch between small and mid</h2>
        </div>
        <p className="section-copy">This uses the recovered daily crossword archive data directly, so past dates work without guesswork.</p>
      </div>

      {!todayPublished && todayEntry ? (
        <div className="state-card" style={{ marginBottom: '1.25rem' }}>
          <h3>Today&apos;s puzzle is not available yet</h3>
          <p>The browser opens on the latest published archive date, and you can still select today manually once it goes live.</p>
        </div>
      ) : null}

      <div className="browser-toolbar">
        <div className="toggle-row">
          <button
            type="button"
            className={`pill-toggle ${selectedMode === 'small' ? 'is-active' : ''}`}
            onClick={() => setSelectedMode('small')}
          >
            Small
          </button>
          <button
            type="button"
            className={`pill-toggle ${selectedMode === 'mid' ? 'is-active' : ''}`}
            onClick={() => setSelectedMode('mid')}
          >
            Mid
          </button>
        </div>

        <label className="date-picker">
          <span>Select date</span>
          <input
            type="date"
            value={selectedDate}
            min={archiveEntries.length ? formatInputDate(archiveEntries[archiveEntries.length - 1]) : undefined}
            max={archiveEntries.length ? formatInputDate(archiveEntries[0]) : undefined}
            onChange={(event) => setSelectedDate(event.target.value)}
          />
        </label>
      </div>

      {currentEntry ? (
        <div className="archive-browser-grid">
          <div className="panel-card panel-card--accent">
            <span className="panel-kicker">Selected puzzle</span>
            <h3>{formatArchiveDate(currentEntry)}</h3>
            <p>{selectedMode === 'small' ? 'Small crossword' : 'Mid crossword'}</p>

            {selectedPuzzle ? (
              <>
                <div className="detail-grid">
                  <div className="summary-card">
                    <span>Clues</span>
                    <strong>{selectedAnswers.length}</strong>
                  </div>
                  <div className="summary-card">
                    <span>Puzzle ID</span>
                     <strong>{selectedPuzzle.puzzleId ? `${selectedPuzzle.puzzleId.slice(0, 8)}...` : 'Unknown'}</strong>
                  </div>
                </div>

                <div className="answer-grid" style={{ marginTop: '1rem' }}>
                  {selectedAnswers.map((answer, index) => (
                    <article key={answer.id || index} className="clue-card">
                      <span className="clue-card__index">Clue {index + 1}</span>
                      <span className="clue-text">{answer.clue}</span>
                      <span className="answer-text">{answer.answer}</span>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <div className="state-card" style={{ marginTop: '1rem' }}>
                <h3>No {selectedMode} puzzle for this date</h3>
                <p>Try the other size or another date.</p>
              </div>
            )}
          </div>

          <div className="panel-card">
            <span className="panel-kicker">Quick dates</span>
            <div className="quick-date-list">
              {archiveEntries.slice(0, 18).map((entry) => {
                const value = formatInputDate(entry);
                return (
                  <button
                    key={entry.key}
                    type="button"
                    className={`quick-date ${selectedDate === value ? 'is-active' : ''}`}
                    onClick={() => setSelectedDate(value)}
                  >
                    <strong>{formatArchiveDate(entry)}</strong>
                    <span>Small {entry.small ? 'ready' : 'missing'} · Mid {entry.mid ? 'ready' : 'missing'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="state-card">
          <h3>No archive dates available</h3>
          <p>The dated archive list is empty in the current snapshot.</p>
        </div>
      )}
    </section>
  );
}
