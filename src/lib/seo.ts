// Strukturierte Daten (schema.org, JSON-LD) für Suchmaschinen und KI-Assistenten.
import { localeTags, pathFor, type Locale, type PageKey } from '../i18n/config';
import { t } from '../i18n';
import { links, plans } from '../data/site';

const SITE = 'https://smartspeechflow.de';
const abs = (path: string) => new URL(path, SITE).href;

const pageTypes: Partial<Record<PageKey, string>> = {
  contact: 'ContactPage',
  project: 'AboutPage',
};

export function structuredData(locale: Locale, page: PageKey, title: string, description: string) {
  const lang = localeTags[locale];
  const url = abs(pathFor(locale, page));
  const organization = {
    '@type': 'Organization',
    '@id': `${SITE}/#organization`,
    name: 'Smart Village Solutions SVS GmbH',
    url: links.svs,
    email: links.email,
    telephone: '+49 33841 639690',
    address: { '@type': 'PostalAddress', streetAddress: 'Klein Glien 25', postalCode: '14806', addressLocality: 'Bad Belzig', addressCountry: 'DE' },
  };
  const website = {
    '@type': 'WebSite',
    '@id': `${SITE}/#website`,
    url: `${SITE}/`,
    name: 'Smart Speech Flow',
    inLanguage: lang,
    publisher: { '@id': `${SITE}/#organization` },
  };
  const software = {
    '@type': 'SoftwareApplication',
    '@id': `${SITE}/#software`,
    name: 'Smart Speech Flow',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web browser',
    description: t(locale, 'seo.home.description'),
    url: abs(pathFor(locale, 'home')),
    license: 'https://opensource.org/license/mit',
    isAccessibleForFree: false,
    codeRepository: links.github,
    provider: { '@id': `${SITE}/#organization` },
    offers: plans
      .filter((p) => p.monthlyNet !== null)
      .map((p) => ({
        '@type': 'Offer',
        name: t(locale, `pricing.plans.${p.id}.title`),
        price: p.monthlyNet,
        priceCurrency: 'EUR',
        url: `${abs(pathFor(locale, 'booking'))}?option=${p.id}`,
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: p.monthlyNet,
          priceCurrency: 'EUR',
          valueAddedTaxIncluded: false,
          unitText: 'MON',
        },
      })),
  };
  const webpage: Record<string, unknown> = {
    '@type': pageTypes[page] ?? 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: title,
    description,
    inLanguage: lang,
    isPartOf: { '@id': `${SITE}/#website` },
  };
  if (page === 'home' || page === 'product') webpage.about = { '@id': `${SITE}/#software` };
  const graph: Record<string, unknown>[] = [organization, website, webpage];
  if (page === 'home' || page === 'product' || page === 'booking') graph.push(software);
  if (page !== 'home') {
    const current = page === 'booking' || page === 'thanks' ? t(locale, 'booking.breadcrumbCurrent') : t(locale, `seo.${page}.title`).split(' – ')[0];
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t(locale, 'nav.home'), item: abs(pathFor(locale, 'home')) },
        { '@type': 'ListItem', position: 2, name: current, item: url },
      ],
    });
  }
  return { '@context': 'https://schema.org', '@graph': graph };
}
