// Zentrale Fakten, die nicht übersetzt werden. Offene Punkte sind mit TODO markiert.

export type PlanId = 'shared' | 'dedicated' | 'selfhosted';

export interface Plan {
  id: PlanId;
  /** Netto-Monatspreis in Euro; null = noch nicht festgelegt (Platzhalter „xy €“). */
  monthlyNet: number | null;
  /** Ob die Aktion „2 Monate gratis“ für diese Option gilt. */
  promo: boolean;
}

export const plans: Plan[] = [
  { id: 'shared', monthlyNet: 250, promo: true },
  { id: 'dedicated', monthlyNet: 1000, promo: true },
  // TODO: Preis für den Selbstbetrieb fehlt im Entwurf („xy €“).
  { id: 'selfhosted', monthlyNet: null, promo: false },
];

export const promotion = {
  /** Letzter Buchungstag der Aktion (inklusive). */
  until: '2026-12-31',
  freeMonths: 2,
  /** Laut Buchen-Wireframe gilt die Aktion nur bei 12 Monaten Vorauszahlung. TODO: bestätigen. */
  requiresPrepaid: true,
};

export const links = {
  github: 'https://github.com/smart-village-solutions/smart-speech-flow',
  // TODO: Link zur Dokumentation festlegen.
  docs: 'https://github.com/smart-village-solutions/smart-speech-flow#readme',
  smartCityKassel: 'https://www.kassel.de/einrichtungen/smartkassel/index.php',
  svs: 'https://smart-village.solutions/',
  // TODO: Ziel für „Live-Demo buchen“ und „Individueller Call“ festlegen (z. B. Buchungstool).
  // Solange null, führen die Buttons zum Kontaktformular mit vorausgewähltem Thema.
  demo: null as string | null,
  call: null as string | null,
  email: 'info@smart-village.solutions',
  phone: '033841-63969-0',
};

/** Ersparnisrechner: Annahmen. Alle Beträge netto. */
export const savings = {
  /**
   * Annahme: Kosten pro Dolmetscherstunde in Euro (im Rechner änderbar).
   * TODO: abstimmen – Vorgabe Tobias Raddatz: 40 €; im Briefing-Call (Philipp Wilimzig) genannt: ca. 83 € („Bundestarif“).
   * Von diesem Wert hängt auch der Text „Rechnet sich ab ca. … Stunden“ ab.
   */
  interpreterHourlyRate: 40,
  /** Startwerte des Rechners */
  defaultHours: 20,
  defaultPeriod: 'month' as 'month' | 'year',
  defaultPlan: 'shared' as PlanId,
};

/** Optionen mit festem Preis – nur diese kann der Rechner gegenüberstellen. */
export const pricedPlans = plans.filter((p): p is Plan & { monthlyNet: number } => p.monthlyNet !== null);

/** Ab wie vielen Dolmetscherstunden pro Monat eine Option günstiger ist (aufgerundet). */
export function breakEvenHoursPerMonth(monthlyNet: number, rate = savings.interpreterHourlyRate): number {
  return Math.ceil(monthlyNet / rate);
}

export interface SavingsResult {
  hoursPerYear: number;
  interpreterPerYear: number;
  ssfPerYear: number;
  savingPerYear: number;
  /** Zusätzliche Ersparnis im ersten Jahr durch die Aktion (bei Vorauszahlung), sonst 0. */
  promoBonus: number;
}

export function calculateSavings(input: { hours: number; period: 'month' | 'year'; monthlyNet: number; rate: number; promo: boolean }): SavingsResult {
  const hoursPerYear = input.period === 'month' ? input.hours * 12 : input.hours;
  const interpreterPerYear = hoursPerYear * input.rate;
  const ssfPerYear = input.monthlyNet * 12;
  return {
    hoursPerYear,
    interpreterPerYear,
    ssfPerYear,
    savingPerYear: interpreterPerYear - ssfPerYear,
    promoBonus: input.promo ? input.monthlyNet * promotion.freeMonths : 0,
  };
}

export function promotionActive(now = new Date()): boolean {
  return now <= new Date(`${promotion.until}T23:59:59`);
}

/** Ziel für „Live-Demo buchen“ bzw. „Individueller Call“: externes Tool oder Kontaktformular mit Thema. */
export function demoHref(contactPath: string): string {
  return links.demo ?? `${contactPath}?topic=demo`;
}
export function callHref(contactPath: string): string {
  return links.call ?? `${contactPath}?topic=call`;
}

export function formatEuro(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}
