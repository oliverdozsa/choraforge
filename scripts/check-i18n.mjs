// Verifies that every language file has the same keys as en.json, and that every
// statically referenced translation key in src/ exists. Run with `npm run i18n:check`.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );

const dir = 'public/i18n';
const langs = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));
const keys = Object.fromEntries(
  langs.map((l) => [l, new Set(flatten(JSON.parse(readFileSync(join(dir, `${l}.json`), 'utf8'))))]),
);

let failed = false;
const report = (msg) => {
  failed = true;
  console.error(msg);
};

for (const lang of langs.filter((l) => l !== 'en')) {
  for (const k of keys.en) if (!keys[lang].has(k)) report(`${lang}.json is missing "${k}"`);
  for (const k of keys[lang]) if (!keys.en.has(k)) report(`${lang}.json has extra key "${k}"`);
}

const walk = (d) =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? walk(p) : /\.(html|ts)$/.test(p) ? [p] : [];
  });

// Dynamic keys like 'enums.rarity.' + value are checked as prefixes.
const re = /'((?:app|board|card|common|completion|confirm|designer|enums|errors|formats|header|language|leaderboard|login|profile|team|templates)\.[A-Za-z0-9_.]*)'/g;
for (const file of walk('src')) {
  const text = readFileSync(file, 'utf8');
  for (const [, key] of text.matchAll(re)) {
    const ok = key.endsWith('.') ? [...keys.en].some((k) => k.startsWith(key)) : keys.en.has(key);
    if (!ok) report(`${file}: unknown translation key "${key}"`);
  }
}

if (failed) process.exit(1);
console.log(`i18n OK (${keys.en.size} keys, languages: ${langs.join(', ')})`);
