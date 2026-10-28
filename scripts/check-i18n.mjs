// Vergleicht alle Sprachdateien mit de.json und listet fehlende Schlüssel.
// Fehlende Texte werden auf der Seite durch Deutsch ersetzt – dieses Skript zeigt, was noch zu übersetzen ist.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = new URL('../src/i18n/locales/', import.meta.url);
const read = (file) => JSON.parse(readFileSync(join(dir.pathname, file), 'utf8'));
const flatten = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v) ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );

const reference = new Set(flatten(read('de.json')));
let complete = true;
for (const file of readdirSync(dir.pathname).filter((f) => f.endsWith('.json') && f !== 'de.json').sort()) {
  const keys = new Set(flatten(read(file)));
  const missing = [...reference].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !reference.has(k));
  const status = missing.length === 0 ? 'vollständig' : `${missing.length} von ${reference.size} Schlüsseln fehlen (Fallback: Deutsch)`;
  console.log(`${file.padEnd(8)} ${status}${extra.length ? `, ${extra.length} unbekannte Schlüssel: ${extra.join(', ')}` : ''}`);
  if (missing.length) complete = false;
}
if (!complete) console.log('\nHinweis: Fehlende Übersetzungen blockieren den Build nicht.');
