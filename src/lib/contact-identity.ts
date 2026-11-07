import { fill, t } from '../i18n';
import type { Locale } from '../i18n/config';

export type Salutation = 'frau' | 'herr' | 'neutral';
export interface ContactIdentity {
  name: string;
  salutation?: Salutation;
  firstName?: string;
  lastName?: string;
}

export function greetingFor(locale: Locale, identity: ContactIdentity): string {
  // Bereits geöffnete Formulare mit dem alten Namensfeld dürfen weiter absenden.
  // Daraus werden weder Anrede noch Vor-/Nachname abgeleitet.
  const key = identity.salutation ? `forms.identity.greetings.${identity.salutation}` : 'mail.greeting';
  return fill(t(locale, key), { name: identity.name, lastName: identity.lastName ?? '' });
}

export function identityRows(identity: ContactIdentity): [string, string | undefined][] {
  return [
    ['Anrede', identity.salutation ? t('de', `forms.identity.${identity.salutation}`) : undefined],
    ['Vorname', identity.firstName],
    ['Nachname', identity.lastName],
    ['Grußformel', greetingFor('de', identity)],
  ];
}
