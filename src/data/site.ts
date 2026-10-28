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
  // TODO: Ziel für „Live-Demo buchen“ und „Individueller Call“ festlegen (Buchungstool oder Kontaktformular).
  demo: null as string | null,
  call: null as string | null,
};

export function formatEuro(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}
