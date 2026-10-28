// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://smartspeechflow.de',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Statische Weiterleitung der Startseite auf die deutsche Fassung (wie heute).
  redirects: { '/': '/de/' },
});
