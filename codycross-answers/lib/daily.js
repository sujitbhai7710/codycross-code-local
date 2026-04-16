import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const API_BASE = 'https://game.codycross-game.com';
const LANG_EN = '1aca585a-8e15-3029-89a0-54aa078acec2';
const AES_KEY = Buffer.from('5f109c70829c1ae6564c25c5258e10c6', 'hex');
const AES_IV = Buffer.from('38326a666d65397a77656a646b66696b', 'hex');

const PASSWORD_TOKEN = '218d45d6-921c-4964-a07f-59155f40a081';
const PASSWORD_BUILD = '411';
const PASSWORD_SEED = 'SenhaDoDia';

const DATA_DIR = path.join(process.cwd(), 'data');
const DAILY_FILE = path.join(DATA_DIR, 'daily.json');

function entryTimestamp({ year, month, day }) {
  return new Date(year, month - 1, day).getTime();
}

function sortEntriesDesc(entries) {
  return entries.sort((a, b) => entryTimestamp(b) - entryTimestamp(a));
}

function decryptRecord(encryptedBase64) {
  const encrypted = Buffer.from(encryptedBase64, 'base64');
  const decipher = crypto.createDecipheriv('aes-128-cbc', AES_KEY, AES_IV);
  decipher.setAutoPadding(true);
  return JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8'));
}

function getIstParts(now = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(now)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    millisecond: now.getUTCMilliseconds(),
  };
}

function formatDtu(now = new Date()) {
  const pad = (n, w = 2) => String(n).padStart(w, '0');
  const ist = getIstParts(now);
  return `${ist.year}-${pad(ist.month)}-${pad(ist.day)}T${pad(ist.hour)}:${pad(ist.minute)}:${pad(ist.second)}.${pad(ist.millisecond, 3)}0000+05:30`;
}

function buildPasswordHash({ token, lang, day, month, year }) {
  return crypto.createHash('md5').update(`${token}${PASSWORD_SEED}${lang}&${day}&${month}&${year}`).digest('hex');
}

async function fetchJson(url) {
  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchCrosswordArchive() {
  return fetchJson(`${API_BASE}/crossword/archive?lang=${LANG_EN}&country=US&androidLang=en&deviceType=Android&appVersion=2.9.0`);
}

export async function fetchCrosswordMonth({ year, month, country = 'IN', androidLang = 'en' }) {
  const params = new URLSearchParams({
    token: PASSWORD_TOKEN,
    lang: LANG_EN,
    androidLang,
    country,
    deviceType: 'Android',
    appVersion: '2.9.0',
    buildNumber: PASSWORD_BUILD,
    year: String(year),
    month: String(month),
  });
  return fetchJson(`${API_BASE}/crossword/getmonth?${params.toString()}`);
}

function normalizeMonthEntries(monthJson) {
  const fases = monthJson?.Records?.[0]?.CrosswordFases || [];
  const byDate = new Map();

  for (const item of fases) {
    const key = `${item.Year}-${String(item.Month).padStart(2, '0')}-${String(item.Day).padStart(2, '0')}`;
    if (!byDate.has(key)) {
      byDate.set(key, {
        key,
        year: item.Year,
        month: item.Month,
        day: item.Day,
        small: null,
        mid: null,
      });
    }

    const entry = byDate.get(key);
    const normalized = {
      puzzleId: item.PuzzleId,
      fase: item.Fase,
      size: item.Tamanho,
      status: item.Status,
      version: item.Versao,
      answers: [],
    };

    if (item.Tamanho === 1 || item.Fase === 0) entry.small = normalized;
    if (item.Tamanho === 2 || item.Fase === 1) entry.mid = normalized;
  }

  return sortEntriesDesc(Array.from(byDate.values()));
}

function hasAnswers(puzzle) {
  return Boolean(puzzle?.answers?.length);
}

function toPuzzleAnswers(puzzle, meta) {
  if (!puzzle) return null;
  return {
    ...meta,
    track: puzzle.Track || null,
    answers: (puzzle.Cifras || []).map((item) => ({
      id: item.Id,
      clue: item.Dica,
      answer: item.Resposta,
      normalized: item.RespostaNormalizada,
    })),
  };
}

export async function fetchDailyCrossword({ year, month, day, fase = 1 }) {
  const json = await fetchJson(`${API_BASE}/crossword/getpuzzle?lang=${LANG_EN}&country=US&androidLang=en&deviceType=Android&appVersion=2.9.0&year=${year}&month=${month}&day=${day}&fase=${fase}`);
  if (!json.Ok || !json.Records?.[0]) return null;
  return decryptRecord(json.Records[0]).CrosswordPuzzle;
}

export async function fetchTodaysPassword({ year, month, day, country = 'IN', androidLang = 'en', now = new Date() }) {
  const dtu = formatDtu(now);
  const hash = buildPasswordHash({ token: PASSWORD_TOKEN, lang: LANG_EN, day, month, year });
  const params = new URLSearchParams({
    token: PASSWORD_TOKEN,
    androidLang,
    country,
    deviceType: 'Android',
    appVersion: '2.9.0',
    buildNumber: PASSWORD_BUILD,
    dtu,
    hash,
  });
  const json = await fetchJson(`${API_BASE}/todayspassword/get?${params.toString()}`);
  const decrypted = json?.Ok && json.Records?.[0] ? decryptRecord(json.Records[0]) : null;
  return { json, decrypted, dtu, hash, token: PASSWORD_TOKEN };
}

export async function buildDailySnapshot(now = new Date()) {
  const ist = getIstParts(now);
  const year = ist.year;
  const month = ist.month;
  const day = ist.day;

  const archive = await fetchCrosswordArchive();
  const archiveSummary = archive?.Records?.[0]?.TodayCrosswordYearMonth || [];

  const archiveMonthResults = await Promise.all(
    archiveSummary.map(async (item) => {
      const monthData = await fetchCrosswordMonth({ year: item.Year, month: item.Month }).catch(() => null);
      return normalizeMonthEntries(monthData);
    })
  );

  const archiveEntries = sortEntriesDesc(archiveMonthResults.flat());

  const [todaySmall, todayMid, password] = await Promise.all([
    fetchDailyCrossword({ year, month, day, fase: 0 }).catch(() => null),
    fetchDailyCrossword({ year, month, day, fase: 1 }).catch(() => null),
    fetchTodaysPassword({ year, month, day, now }).catch((error) => ({ error: error.message })),
  ]);

  await Promise.all(
    archiveEntries.map(async (entry) => {
      if (entry.small) {
        const puzzle = await fetchDailyCrossword({ year: entry.year, month: entry.month, day: entry.day, fase: entry.small.fase }).catch(() => null);
        entry.small = toPuzzleAnswers(puzzle, entry.small);
      }

      if (entry.mid) {
        const puzzle = await fetchDailyCrossword({ year: entry.year, month: entry.month, day: entry.day, fase: entry.mid.fase }).catch(() => null);
        entry.mid = toPuzzleAnswers(puzzle, entry.mid);
      }
    })
  );

  const todayKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  let todayEntry = archiveEntries.find((entry) => entry.key === todayKey) || null;

  if (!todayEntry) {
    todayEntry = {
      key: todayKey,
      year,
      month,
      day,
      small: null,
      mid: null,
    };
    archiveEntries.unshift(todayEntry);
  }

  if (todaySmall) {
    todayEntry.small = toPuzzleAnswers(todaySmall, todayEntry.small || { puzzleId: todaySmall.Track || null, fase: 0, size: 1, status: 1, version: 0, answers: [] });
  }

  if (todayMid) {
    todayEntry.mid = toPuzzleAnswers(todayMid, todayEntry.mid || { puzzleId: todayMid.Track || null, fase: 1, size: 2, status: 1, version: 0, answers: [] });
  }

  const todayPublished = hasAnswers(todayEntry.small) || hasAnswers(todayEntry.mid);
  const latestAvailableEntry = archiveEntries.find((entry) => hasAnswers(entry.small) || hasAnswers(entry.mid)) || todayEntry;
  const browsingEntry = todayPublished ? todayEntry : latestAvailableEntry;

  return {
    generatedAt: now.toISOString(),
    today: { year, month, day },
    crossword: {
      archive: archiveSummary,
      archiveEntries,
      todayEntry,
      browsingEntry,
      latestAvailableEntry,
      todayPublished,
    },
    password,
  };
}

export async function writeDailySnapshot(snapshot) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DAILY_FILE, JSON.stringify(snapshot, null, 2));
}

export async function readDailySnapshot() {
  try {
    const raw = await fs.readFile(DAILY_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
