import type { APIRoute } from 'astro';
import { pathFor, type Locale } from '../i18n/config';
import { fill, indexableLocales, t, tv } from '../i18n';
import { breakEvenHoursPerMonth, formatEuro, links, plans, pricedPlans, promotion, savings } from '../data/site';

// llms.txt: kompakte, maschinenlesbare Zusammenfassung für KI-Assistenten (Vorschlag llmstxt.org).
// Wird aus denselben Texten und Daten erzeugt wie die Seite – kein zweiter Pflegeort.
export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://smartspeechflow.de');
  const url = (l: Locale, p: Parameters<typeof pathFor>[1]) => new URL(pathFor(l, p), base).href;
  const cheapest = pricedPlans.reduce((a, b) => (b.monthlyNet < a.monthlyNet ? b : a));
  const de: Locale = 'de';

  const planLines = plans.map((p) => {
    const price = p.monthlyNet === null ? t(de, 'pricing.pricePlaceholder') : `${formatEuro(p.monthlyNet, 'de-DE')} ${t(de, 'pricing.perMonth')}`;
    return `- ${t(de, `pricing.plans.${p.id}.title`)}: ${price}. ${tv<string[]>(de, `pricing.plans.${p.id}.features`).join('; ')}`;
  });

  const body = `# Smart Speech Flow

> ${t(de, 'seo.home.description')}

Smart Speech Flow ist eine browserbasierte Open-Source-Anwendung (MIT License) zum Dolmetschen von Gesprächen in Echtzeit, entwickelt für Kommunen und öffentliche Einrichtungen. Anbieter: Smart Village Solutions SVS GmbH. Entstanden mit Smart City Kassel.

## Fakten
- ${tv<string[]>(de, 'savings.effort.items').join('\n- ')}
- ${t(de, 'why.modes.title')}: ${tv<string[]>(de, 'why.modes.items').join(' / ')}
- ${fill(t(de, 'why.items.4.text'), { hours: breakEvenHoursPerMonth(cheapest.monthlyNet), rate: savings.interpreterHourlyRate })}
- Aktion: Bei Buchung bis ${promotion.until} mit 12 Monaten Vorauszahlung ${promotion.freeMonths} Monate gratis.

## Preise (netto)
${planLines.join('\n')}

## Seiten
- [Startseite mit Ersparnisrechner](${url(de, 'home')}#ersparnis)
- [Produkt](${url(de, 'product')})
- [Einsatzfelder](${url(de, 'useCases')})
- [Projekt](${url(de, 'project')})
- [Open Source](${url(de, 'openSource')})
- [Online buchen](${url(de, 'booking')})
- [Kontakt und Live-Demo](${url(de, 'contact')})
- [Impressum](${url(de, 'legalNotice')})

## Weitere Sprachen
${indexableLocales.filter((l) => l !== de).map((l) => `- ${l}: ${url(l, 'home')}`).join('\n')}

## Optional
- [Quellcode auf GitHub](${links.github})
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
