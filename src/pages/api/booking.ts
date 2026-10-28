import type { APIRoute } from 'astro';
import {
  FORMS_DEMO, MAIL_FROM, MAIL_NOTIFY_TO, PIPEDRIVE_API_TOKEN, PIPEDRIVE_BOOKING_STAGE_ID, PIPEDRIVE_BASE_URL, PIPEDRIVE_DOMAIN, PIPEDRIVE_PIPELINE_ID, RESEND_API_KEY,
} from 'astro:env/server';
import { bookingPrice, bookingSchema, fieldErrors, looksLikeBot } from '../../lib/forms';
import { createPipedrive, noteHtml } from '../../lib/pipedrive';
import { sendMail } from '../../lib/mail';
import { json, readJson, sameOrigin } from '../../lib/form-response';
import { t } from '../../i18n';
import { localeTags } from '../../i18n/config';
import { formatEuro } from '../../data/site';

export const prerender = false;

export const POST: APIRoute = async ({ request, url }) => {
  if (!sameOrigin(request, url)) return json(403, { ok: false, error: 'forbidden' });
  const parsed = bookingSchema.safeParse(await readJson(request));
  if (!parsed.success) return json(400, { ok: false, error: 'invalid', fields: fieldErrors(parsed.error) });
  const input = parsed.data;
  // Bots bekommen eine scheinbar erfolgreiche Antwort, es wird nichts gespeichert.
  if (input.website || looksLikeBot(input)) return json(200, { ok: true, number: null, emailSent: false });

  const price = bookingPrice(input.option, input.term);
  const de = (key: string) => t('de', key);
  const optionLabel = de(`pricing.plans.${input.option}.title`);
  const termLabel = de(`booking.terms.${input.term}.label`);

  if (!PIPEDRIVE_API_TOKEN || !PIPEDRIVE_DOMAIN) {
    if (FORMS_DEMO) return json(200, { ok: true, number: 'DEMO', emailSent: false, demo: true });
    return json(503, { ok: false, error: 'not_configured' });
  }

  try {
    const pd = createPipedrive({ token: PIPEDRIVE_API_TOKEN, domain: PIPEDRIVE_DOMAIN, baseUrl: PIPEDRIVE_BASE_URL });
    const address = `${input.street}, ${input.zip} ${input.city}`;
    const orgId = await pd.upsertOrganization(input.organisation, address);
    const personId = await pd.upsertPerson({ name: input.name, email: input.email, phone: input.phone, orgId, jobTitle: input.role });
    const dealId = await pd.createDeal({
      title: `Smart Speech Flow – ${optionLabel} – ${input.organisation}`,
      value: price.firstYearNet,
      personId,
      orgId,
      pipelineId: PIPEDRIVE_PIPELINE_ID,
      stageId: PIPEDRIVE_BOOKING_STAGE_ID,
    });
    const estimate = input.estimate
      ? `${input.estimate.hours} Std. pro ${input.estimate.period === 'month' ? 'Monat' : 'Jahr'} × ${input.estimate.rate} €`
      : undefined;
    await pd.addNote({
      dealId,
      content: noteHtml('Buchung über smartspeechflow.de', [
        ['Option', optionLabel],
        ['Laufzeit', termLabel],
        ['Preis', price.monthlyNet === null ? 'auf Anfrage' : `${formatEuro(price.monthlyNet, 'de-DE')} pro Monat netto`],
        ['Aktion', price.promo ? de('promo.short') : 'keine'],
        ['Wert erstes Jahr', price.firstYearNet === null ? undefined : `${formatEuro(price.firstYearNet, 'de-DE')} netto`],
        ['Kommune / Organisation', input.organisation],
        ['Ansprechperson', input.name],
        ['Funktion', input.role],
        ['E-Mail', input.email],
        ['Telefon', input.phone],
        ['Rechnungsadresse', address],
        ['Wunschtermin', input.start],
        ['Nachricht', input.message],
        ['Schätzung aus Ersparnisrechner', estimate],
        ['Sprache der Seite', input.locale],
        ['Zustimmung Datenschutz', `ja (${new Date().toISOString()})`],
      ]),
    });

    const number = `SSF-${dealId}`;
    const mail = { apiKey: RESEND_API_KEY, from: MAIL_FROM };
    const lang = input.locale;
    const emailSent = await sendMail(mail, {
      to: input.email,
      subject: `${t(lang, 'mail.bookingSubject')} ${number}`,
      text: [
        t(lang, 'mail.greeting').replace('{name}', input.name),
        '',
        t(lang, 'mail.bookingIntro'),
        '',
        `${t(lang, 'thanks.number')}: ${number}`,
        `${t(lang, 'booking.summary.option')}: ${t(lang, `pricing.plans.${input.option}.title`)}`,
        `${t(lang, 'booking.summary.term')}: ${t(lang, `booking.terms.${input.term}.label`)}`,
        price.monthlyNet === null ? '' : `${t(lang, 'booking.summary.price')}: ${formatEuro(price.monthlyNet, localeTags[lang])}${t(lang, 'pricing.perMonth')}`,
        price.promo ? `${t(lang, 'booking.summary.promo')}: ${t(lang, 'promo.short')}` : '',
        '',
        t(lang, 'mail.bookingNext'),
        '',
        t(lang, 'mail.signature'),
      ].filter((line, i, all) => line !== '' || all[i - 1] !== '').join('\n'),
    }).catch(() => false);
    if (MAIL_NOTIFY_TO) {
      await sendMail(mail, { to: MAIL_NOTIFY_TO, replyTo: input.email, subject: `Neue Buchung ${number}: ${optionLabel} – ${input.organisation}`, text: `Neue Buchung über smartspeechflow.de.\nDeal in Pipedrive: https://${PIPEDRIVE_DOMAIN}.pipedrive.com/deal/${dealId}` }).catch(() => false);
    }
    return json(200, { ok: true, number, emailSent });
  } catch (error) {
    console.error('booking: Pipedrive-Fehler', error instanceof Error ? error.message : error);
    return json(502, { ok: false, error: 'upstream' });
  }
};
