import { buildDailySnapshot, writeDailySnapshot } from '../lib/daily.js';

async function main() {
  const snapshot = await buildDailySnapshot();
  await writeDailySnapshot(snapshot);
  console.log(`Wrote daily snapshot for ${snapshot.today.year}-${snapshot.today.month}-${snapshot.today.day}`);
  console.log(`Crossword loaded: ${Boolean(snapshot.crossword?.puzzle)}`);
  console.log(`Password ok: ${Boolean(snapshot.password?.json?.Ok)}`);
  if (snapshot.password?.decrypted?.Password) {
    console.log(`Password: ${snapshot.password.decrypted.Password}`);
  }
  if (snapshot.password?.error) console.log(`Password error: ${snapshot.password.error}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
