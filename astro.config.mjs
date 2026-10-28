// @ts-check
import { defineConfig, envField } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  site: 'https://smartspeechflow.de',
  // Alle Seiten werden statisch erzeugt. Nur die Formular-Endpunkte unter /api/ laufen
  // als Netlify Functions (dort: export const prerender = false).
  output: 'static',
  adapter: netlify(),
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Statische Weiterleitung der Startseite auf die deutsche Fassung (wie heute).
  redirects: { '/': '/de/' },
  env: {
    schema: {
      // Pipedrive (SVS). Ohne Token antworten die Formulare mit „nicht eingerichtet“ (außer FORMS_DEMO=true).
      PIPEDRIVE_API_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
      PIPEDRIVE_DOMAIN: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Nur für Tests (Mock-Server); in Produktion leer lassen.
      PIPEDRIVE_BASE_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      PIPEDRIVE_PIPELINE_ID: envField.number({ context: 'server', access: 'secret', optional: true }),
      PIPEDRIVE_BOOKING_STAGE_ID: envField.number({ context: 'server', access: 'secret', optional: true }),
      PIPEDRIVE_CONTACT_STAGE_ID: envField.number({ context: 'server', access: 'secret', optional: true }),
      // Optional: Bestätigungs- und Benachrichtigungsmails über Resend
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      MAIL_FROM: envField.string({ context: 'server', access: 'secret', optional: true }),
      MAIL_NOTIFY_TO: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Nur lokal: Formulare ohne Pipedrive „erfolgreich“ beantworten, nichts wird übertragen.
      FORMS_DEMO: envField.boolean({ context: 'server', access: 'secret', default: false }),
    },
  },
});
