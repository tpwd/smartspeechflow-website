import type { APIRoute } from 'astro';

// Vor dem Go-live (PUBLIC_NOINDEX nicht "false") werden alle Crawler ausgesperrt.
// Danach sind Suchmaschinen und KI-Crawler zugelassen. Die Danke-Seite schließt sich per noindex selbst aus
// (nicht per Disallow – sonst sähe der Crawler das noindex nie).
export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://smartspeechflow.de');
  const live = import.meta.env.PUBLIC_NOINDEX === 'false';
  const body = live
    ? `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', base).href}\n`
    : `# Noch nicht live: Crawler gesperrt (PUBLIC_NOINDEX).\nUser-agent: *\nDisallow: /\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
