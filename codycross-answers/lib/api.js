const API_BASE = 'https://game.codycross-game.com';
const LANG_EN = '1aca585a-8e15-3029-89a0-54aa078acec2';
const API_COUNTRY = 'IN';
const API_ANDROID_LANG = 'en';
const API_DEVICE_TYPE = 'Android';
const API_APP_VERSION = '2.9.0';

const AES_KEY = Buffer.from('5f109c70829c1ae6564c25c5258e10c6', 'hex');
const AES_IV = Buffer.from('38326a666d65397a77656a646b66696b', 'hex');

export async function fetchWorld(worldNum, lang = LANG_EN) {
  const params = new URLSearchParams({
    lang,
    country: API_COUNTRY,
    androidLang: API_ANDROID_LANG,
    deviceType: API_DEVICE_TYPE,
    appVersion: API_APP_VERSION,
    mundo: String(worldNum),
  });
  const url = `${API_BASE}/Puzzle/GetMundo?${params.toString()}`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function decryptRecord(encryptedBase64) {
  if (!encryptedBase64 || typeof encryptedBase64 !== 'string') return null;
  try {
    const encrypted = Buffer.from(encryptedBase64, 'base64');
    const crypto = require('crypto');
    const decipher = crypto.createDecipheriv('aes-128-cbc', AES_KEY, AES_IV);
    decipher.setAutoPadding(true);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return JSON.parse(decrypted.toString('utf8'));
  } catch {
    return null;
  }
}

export function decryptWorldData(apiResponse) {
  if (!apiResponse?.Ok || !apiResponse?.Records || apiResponse.Records.length < 2) return null;

  const worldMeta = decryptRecord(apiResponse.Records[0]);
  const puzzleData = decryptRecord(apiResponse.Records[1]);

  return { worldMeta, puzzleData };
}

export const WORLD_NAMES = {
  1: 'Earth',
  2: 'Under the Sea',
  3: 'Inventions',
  4: 'Seasons',
  5: 'Circus',
  6: 'Transport',
  7: 'Culinary Arts',
  8: 'Sports',
  9: 'Fauna and Flora',
  10: 'Ancient Egypt',
  11: 'Amusement Park',
  12: 'Medieval Times',
  13: 'Paris',
  14: 'Casino',
  15: 'World of Books',
  16: 'Science Lab',
  17: "The 70's",
  18: 'Pet Shop',
  19: 'New York, New York!',
  20: 'Popcorn Time',
  21: 'La Bella Roma',
  22: 'Wild West',
  23: 'Airport',
  24: 'Farm',
  25: 'London',
  26: 'Department Store',
  27: 'Fashion Show',
  28: 'Resorts',
  29: 'Welcome to Japan',
  30: 'Concert Hall',
  31: 'TV Station',
  32: 'Home Sweet Home',
  33: 'Cruise Ship',
  34: 'Greece',
  35: 'Small World',
  36: 'Train Travel',
  37: 'Art Museum',
  38: 'Water Park',
  39: 'Brazilian Tour',
  40: 'The 80s',
  41: 'Spa Time',
  42: 'Campsite Adventures',
  43: 'Trip to Spain',
  44: 'Fantasy World',
  45: 'Performing Arts',
  46: 'Space Exploration',
  47: 'Student Life',
  48: 'Games',
  49: 'Mesopotamia',
  50: 'Futuristic City',
};
