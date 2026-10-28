import type { APIRoute } from 'astro';
import { locales, localeTags, pages, pathFor } from '../i18n/config';

// Sitemap mit hreflang-Alternativen. Die Danke-Seite ist ausgenommen.
export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://smartspeechflow.de');
  const urls = pages
    .filter((page) => page !== 'thanks')
    .flatMap((page) =>
      locales.map((locale) => {
        const alternates = locales
          .map((l) => `    <xhtml:link rel="alternate" hreflang="${localeTags[l]}" href="${new URL(pathFor(l, page), base).href}"/>`)
          .join('\n');
        return `  <url>\n    <loc>${new URL(pathFor(locale, page), base).href}</loc>\n${alternates}\n  </url>`;
      }),
    );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
