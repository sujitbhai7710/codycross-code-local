import crypto from 'crypto';

const KEY = Buffer.from('5f109c70829c1ae6564c25c5258e10c6', 'hex');
const IV = Buffer.from('38326a666d65397a77656a646b66696b', 'hex');
const TOKEN = '218d45d6-921c-4964-a07f-59155f40a081';
const LANG = '1aca585a-8e15-3029-89a0-54aa078acec2';
const BASE = 'https://game.codycross-game.com';

function decryptRecord(record) {
  const decipher = crypto.createDecipheriv('aes-128-cbc', KEY, IV);
  decipher.setAutoPadding(true);
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(record, 'base64')), decipher.final()]).toString('utf8'));
}

async function probe(url) {
  const res = await fetch(url);
  const json = await res.json();
  console.log('\nURL:', url);
  console.log('Ok:', json.Ok, 'Status:', json.Status, 'Records:', json.Records?.length || 0);
  if (json.Records?.[0]) {
    try {
      const payload = decryptRecord(json.Records[0]);
      const puzzle = payload.CrosswordPuzzle || payload;
      console.log('Track:', puzzle?.Track);
      console.log('Clues:', puzzle?.Cifras?.length || 0);
      console.log('First answer:', puzzle?.Cifras?.[0]?.Resposta || null);
    } catch (error) {
      console.log('Decrypt failed:', error.message);
    }
  }
}

const urls = [
  `${BASE}/crossword/getpuzzle?lang=${LANG}&country=US&androidLang=en&deviceType=Android&appVersion=2.9.0&year=2026&month=4&day=16&fase=0`,
  `${BASE}/crossword/getpuzzle?lang=${LANG}&country=IN&androidLang=en&deviceType=Android&appVersion=2.9.0&year=2026&month=4&day=16&fase=0`,
  `${BASE}/crossword/getpuzzle?token=${TOKEN}&lang=${LANG}&country=IN&androidLang=en&deviceType=Android&appVersion=2.9.0&buildNumber=411&year=2026&month=4&day=16&fase=0`,
  `${BASE}/crossword/getpuzzle?token=${TOKEN}&lang=${LANG}&country=IN&androidLang=en&deviceType=Android&appVersion=2.9.0&buildNumber=411&year=2026&month=4&day=16&fase=1`,
];

for (const url of urls) {
  await probe(url);
}
