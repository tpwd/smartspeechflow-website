// Sprachen und URL-Schema – übernommen von der heutigen Seite smartspeechflow.de:
// Präfix je Sprache, deutsche Slugs nur für Deutsch, englische Slugs für alle anderen.

export const locales = ['de', 'en', 'hi', 'fr', 'it', 'pl', 'es', 'tr', 'ar'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'de';

/** Name der Sprache in der Sprache selbst (für den Sprachumschalter). */
export const localeLabels: Record<Locale, string> = {
  de: 'Deutsch',
  en: 'English',
  hi: 'हिन्दी',
  fr: 'Français',
  it: 'Italiano',
  pl: 'Polski',
  es: 'Español',
  tr: 'Türkçe',
  ar: 'العربية',
};

/** BCP-47-Tags für hreflang und <html lang>. */
export const localeTags: Record<Locale, string> = {
  de: 'de-DE',
  en: 'en',
  hi: 'hi',
  fr: 'fr',
  it: 'it',
  pl: 'pl',
  es: 'es',
  tr: 'tr',
  ar: 'ar',
};

export const isRtl = (locale: Locale) => locale === 'ar';

export const pages = [
  'home',
  'product',
  'useCases',
  'project',
  'openSource',
  'contact',
  'booking',
  'thanks',
  'legalNotice',
  'privacy',
  'terms',
] as const;
export type PageKey = (typeof pages)[number];

const englishSlugs: Record<PageKey, string> = {
  home: '',
  product: 'product',
  useCases: 'use-cases',
  project: 'project',
  openSource: 'open-source',
  contact: 'contact',
  booking: 'booking',
  thanks: 'booking/thank-you',
  legalNotice: 'legal-notice',
  privacy: 'privacy',
  terms: 'terms',
};

export const slugs: Record<Locale, Record<PageKey, string>> = {
  de: {
    home: '',
    product: 'produkt',
    useCases: 'einsatzfelder',
    project: 'projekt',
    openSource: 'open-source',
    contact: 'kontakt',
    booking: 'buchen',
    thanks: 'buchen/danke',
    legalNotice: 'impressum',
    privacy: 'datenschutz',
    terms: 'agb',
  },
  en: englishSlugs,
  hi: englishSlugs,
  fr: englishSlugs,
  it: englishSlugs,
  pl: englishSlugs,
  es: englishSlugs,
  tr: englishSlugs,
  ar: englishSlugs,
};

export function pathFor(locale: Locale, page: PageKey, hash?: string): string {
  const slug = slugs[locale][page];
  const path = slug ? `/${locale}/${slug}/` : `/${locale}/`;
  return hash ? `${path}#${hash}` : path;
}
