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

function decryptRecord(encryptedBase64) {
  const encrypted = Buffer.from(encryptedBase64, 'base64');
  const decipher = crypto.createDecipheriv('aes-128-cbc', AES_KEY, AES_IV);
  decipher.setAutoPadding(true);
  return JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8'));
}

function formatDtu(date = new Date()) {
  const pad = (n, w = 2) => String(n).padStart(w, '0');
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const oh = pad(Math.floor(abs / 60));
  const om = pad(abs % 60);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}0000${sign}${oh}:${om}`;
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

export async function fetchDailyCrossword({ year, month, day, fase = 1 }) {
  const json = await fetchJson(`${API_BASE}/crossword/getpuzzle?lang=${LANG_EN}&country=US&androidLang=en&deviceType=Android&appVersion=2.9.0&year=${year}&month=${month}&day=${day}&fase=${fase}`);
  if (!json.Ok || !json.Records?.[0]) return null;
  return decryptRecord(json.Records[0]).CrosswordPuzzle;
}

export async function fetchTodaysPassword({ year, month, day, country = 'IN', androidLang = 'en' }) {
  const dtu = formatDtu();
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
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  const [archive, crossword, password] = await Promise.all([
    fetchCrosswordArchive(),
    fetchDailyCrossword({ year, month, day, fase: 1 }),
    fetchTodaysPassword({ year, month, day }).catch((error) => ({ error: error.message })),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    today: { year, month, day },
    crossword: {
      archive: archive?.Records?.[0]?.TodayCrosswordYearMonth || [],
      puzzle: crossword,
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
