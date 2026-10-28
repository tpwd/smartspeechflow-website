import type { APIRoute } from 'astro';
import { FORMS_DEMO, MAIL_FROM, MAIL_NOTIFY_TO, PIPEDRIVE_API_TOKEN, PIPEDRIVE_CONTACT_STAGE_ID, PIPEDRIVE_BASE_URL, PIPEDRIVE_DOMAIN, PIPEDRIVE_PIPELINE_ID, RESEND_API_KEY } from 'astro:env/server';
import { contactSchema, fieldErrors, looksLikeBot } from '../../lib/forms';
import { createPipedrive, noteHtml } from '../../lib/pipedrive';
import { sendMail } from '../../lib/mail';
import { json, readJson, sameOrigin } from '../../lib/form-response';
import { t } from '../../i18n';

export const prerender = false;

export const POST: APIRoute = async ({ request, url }) => {
  if (!sameOrigin(request, url)) return json(403, { ok: false, error: 'forbidden' });
  const parsed = contactSchema.safeParse(await readJson(request));
  if (!parsed.success) return json(400, { ok: false, error: 'invalid', fields: fieldErrors(parsed.error) });
  const input = parsed.data;
  if (input.website || looksLikeBot(input)) return json(200, { ok: true });

  if (!PIPEDRIVE_API_TOKEN || !PIPEDRIVE_DOMAIN) {
    if (FORMS_DEMO) return json(200, { ok: true, demo: true });
    return json(503, { ok: false, error: 'not_configured' });
  }

  try {
    const pd = createPipedrive({ token: PIPEDRIVE_API_TOKEN, domain: PIPEDRIVE_DOMAIN, baseUrl: PIPEDRIVE_BASE_URL });
    const topic = t('de', `contact.categories.${input.category}`);
    const orgId = input.organisation ? await pd.upsertOrganization(input.organisation) : undefined;
    const personId = await pd.upsertPerson({ name: input.name, email: input.email, orgId });
    const title = `Smart Speech Flow – ${topic} – ${input.organisation || input.name}`;
    const note = noteHtml('Kontaktanfrage über smartspeechflow.de', [
      ['Thema', topic],
      ['Name', input.name],
      ['Organisation', input.organisation],
      ['E-Mail', input.email],
      ['Nachricht', input.message],
      ['Sprache der Seite', input.locale],
      ['Zustimmung Datenschutz', `ja (${new Date().toISOString()})`],
    ]);
    // Mit PIPEDRIVE_CONTACT_STAGE_ID landen Anfragen als Deal in der Pipeline, sonst im Lead-Eingang.
    if (PIPEDRIVE_CONTACT_STAGE_ID) {
      const dealId = await pd.createDeal({ title, personId, orgId, pipelineId: PIPEDRIVE_PIPELINE_ID, stageId: PIPEDRIVE_CONTACT_STAGE_ID });
      await pd.addNote({ dealId, content: note });
    } else {
      const leadId = await pd.createLead({ title, personId, orgId });
      await pd.addNote({ leadId, content: note });
    }
    if (MAIL_NOTIFY_TO) {
      await sendMail({ apiKey: RESEND_API_KEY, from: MAIL_FROM }, { to: MAIL_NOTIFY_TO, replyTo: input.email, subject: `Neue Anfrage (${topic}): ${input.organisation || input.name}`, text: `${input.name} <${input.email}>\n\n${input.message}` }).catch(() => false);
    }
    return json(200, { ok: true });
  } catch (error) {
    console.error('contact: Pipedrive-Fehler', error instanceof Error ? error.message : error);
    return json(502, { ok: false, error: 'upstream' });
  }
};
