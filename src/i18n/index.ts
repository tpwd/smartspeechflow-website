import { defaultLocale, locales, type Locale } from './config';

// Alle Sprachdateien werden zur Build-Zeit eingelesen. Fehlt ein Schlüssel in einer
// Sprache, wird der deutsche Text verwendet (Fallback). `npm run i18n:check` listet fehlende Schlüssel.
const files = import.meta.glob<Record<string, unknown>>('./locales/*.json', { eager: true, import: 'default' });

const dictionaries = Object.fromEntries(
  locales.map((l) => [l, files[`./locales/${l}.json`] ?? {}]),
) as Record<Locale, Record<string, unknown>>;

function lookup(dict: Record<string, unknown>, key: string): unknown {
  return key.split('.').reduce<unknown>((node, part) => {
    if (node && typeof node === 'object') return (node as Record<string, unknown>)[part];
    return undefined;
  }, dict);
}

function flatKeys(node: unknown, prefix = ''): string[] {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return [prefix];
  return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) => flatKeys(v, prefix ? `${prefix}.${k}` : k));
}
const referenceKeys = flatKeys(dictionaries[defaultLocale]);

/** Vollständig übersetzt = jeder Schlüssel aus de.json ist vorhanden. Nur solche Sprachen werden indexiert. */
export function isComplete(locale: Locale): boolean {
  if (locale === defaultLocale) return true;
  return referenceKeys.every((key) => lookup(dictionaries[locale], key) !== undefined);
}
export const indexableLocales = locales.filter(isComplete);

/** Wert zu einem Schlüssel (String, Liste oder Objekt) mit Fallback auf Deutsch. */
export function tv<T = unknown>(locale: Locale, key: string): T {
  const value = lookup(dictionaries[locale], key) ?? lookup(dictionaries[defaultLocale], key);
  if (value === undefined) throw new Error(`i18n: Schlüssel "${key}" fehlt auch in ${defaultLocale}.json`);
  return value as T;
}

/** Text zu einem Schlüssel mit Fallback auf Deutsch. */
export function t(locale: Locale, key: string): string {
  const value = tv(locale, key);
  if (typeof value !== 'string') throw new Error(`i18n: Schlüssel "${key}" ist kein Text`);
  return value;
}

/** Ersetzt Platzhalter wie {hours} im Text. */
export function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

export function useTranslations(locale: Locale) {
  return {
    t: (key: string, vars?: Record<string, string | number>) => (vars ? fill(t(locale, key), vars) : t(locale, key)),
    tv: <T = unknown>(key: string) => tv<T>(locale, key),
  };
}
