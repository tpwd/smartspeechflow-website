# Smart Speech Flow – Landingpage (Astro)

Statische, mehrsprachige Website für smartspeechflow.de. Grundgerüst auf Basis der Figma-Datei „Smart Speech Flow-LP (Copy)“: HiFi-Library, Desktop-, Tablet- und Mobil-Entwürfe.

**Stand:** lokal lauffähig, vorbereitet für Netlify. Buchung und Kontakt schreiben direkt in Pipedrive. Es gibt noch kein Online-Repository und kein Deployment.

## Lokal starten

Voraussetzung: **Node.js 22.12 oder neuer** (`node -v`). Mit nvm: `nvm use`.

```sh
npm install          # einmalig
npm run dev          # Entwicklungsserver: http://localhost:4321/de/
```

Weitere Befehle:

```sh
npm run build        # für Netlify bauen (Seiten nach dist/, Formular-API als Netlify Function)
npm run check        # Typprüfung + Übersicht fehlender Übersetzungen
npm run i18n:check   # nur fehlende Übersetzungen
npm run validate     # bauen + alle Seiten mit html-validate prüfen
```

Optional: `.env.example` nach `.env` kopieren. Die Einstellungen darin sind dort erklärt.

**Hinweis:** `npm run dev` ist der Weg zum lokalen Testen, auch für die Formulare. `astro preview` gibt es mit dem Netlify-Adapter nicht (Astro meldet „adapter does not support the preview command“). Wer die gebaute Fassung samt Function lokal sehen will, kann die Netlify CLI nutzen (`npx netlify-cli serve`); das ist hier nicht getestet.

## Was drin ist

| Seite | Deutsch | andere Sprachen | Stand |
|---|---|---|---|
| Startseite | `/de/` | `/en/` … | fertig nach HiFi-Entwurf |
| Buchen | `/de/buchen/` | `/en/booking/` | fertig, legt in Pipedrive Organisation, Person, Deal und Notiz an |
| Danke | `/de/buchen/danke/` | `/en/booking/thank-you/` | fertig, zeigt die Buchungsnummer `SSF-<Deal-ID>`; Hinweis auf Bestätigungsmail nur, wenn eine verschickt wurde |
| Produkt, Einsatzfelder, Projekt, Open Source | wie heute | wie heute | Inhalte der Bestandsseite, neu geschrieben mit Fokus auf Buchung |
| Kontakt | `/de/kontakt/` | `/en/contact/` | fertig, legt in Pipedrive einen Lead an (oder einen Deal, siehe unten), Thema per `?topic=demo` vorwählbar |
| Impressum, Datenschutz | wie heute | wie heute | Rechtstexte **wörtlich** aus der Bestandsseite, Datenschutz mit markiertem Platzhalter für das Buchungsformular |

**Ersparnisrechner** (Startseite, Anker `#ersparnis`): Dolmetscherstunden pro Monat oder Jahr × Stundensatz (Startwert 83 € laut Briefing, im Rechner änderbar) minus Jahrespreis der gewählten Option. Zeigt die Ersparnis pro Jahr, die Gewinnschwelle, den Aktionsbonus und den eingesparten Aufwand. „Mit dieser Option buchen“ übergibt Option und Schätzung an die Buchen-Seite. Ohne JavaScript steht eine fertige Beispielrechnung da.

- **9 Sprachen** wie auf der heutigen Seite: de, en, hi, fr, it, pl, es, tr, ar. Das URL-Schema ist übernommen, damit alle bestehenden Links gültig bleiben.
- **Arabisch** wird mit `dir="rtl"` gespiegelt. Alle Abstände nutzen logische CSS-Eigenschaften.
- **Schriften selbst gehostet**, keine Google-Fonts-Anfragen: Hanken Grotesk, dazu Noto Sans Arabic und Noto Sans Devanagari für Arabisch und Hindi.
- **SEO:** `hreflang` für alle Sprachen, `canonical`, `sitemap.xml` mit Sprachalternativen. `/` leitet auf `/de/` weiter.
- **Noch nicht für Suchmaschinen freigegeben:** `noindex` auf allen Seiten und eine sperrende `robots.txt`. Siehe „Go-live“.
- **Chat-Mockup im Hero** ist HTML statt Bild und lässt sich daher übersetzen.
- **Responsiv:** Mobil (ab 375 px), Tablet (ab 768 px), Desktop-Navigation ab 1024 px, Desktop-Layout bis 1440 px.

## Buchung und Kontakt: Pipedrive, E-Mail und Netlify

Die Formulare senden an `/api/booking/` und `/api/contact/`. Diese beiden Routen laufen serverseitig (auf Netlify als Function, lokal in `npm run dev`). Der Pipedrive-Token bleibt auf dem Server und erscheint nie im Browser.

**Was passiert bei einer Buchung**
1. Prüfung: Herkunft (nur von der eigenen Seite), Pflichtfelder, Spam-Schutz (unsichtbares Feld und Mindestzeit von 3 Sekunden; Bots bekommen eine Schein-Bestätigung, es wird nichts gespeichert).
2. Pipedrive: Organisation (mit Adresse) und Person werden gesucht und nur bei Bedarf neu angelegt (Organisation nach exaktem Namen, Person nach E-Mail).
3. Deal „Smart Speech Flow – Option – Kommune“ in der Pipeline „Smart Speech Flow Form“, Wert = Netto-Betrag des ersten Jahres (inkl. Aktion), berechnet auf dem Server.
4. Notiz am Deal mit allen Angaben und der Schätzung aus dem Rechner.
5. Optional: Bestätigungsmail an die Kommune und Benachrichtigung an das Team (über Resend).
6. Weiterleitung auf die Danke-Seite mit der Buchungsnummer `SSF-<Deal-ID>`.

**Kontaktanfrage:** Lead mit Notiz (Leads-Eingang). Ist `PIPEDRIVE_CONTACT_STAGE_ID` gesetzt, wird stattdessen ein Deal in dieser Phase angelegt.

**Fehlerfälle:** fehlerhafte Eingaben → Meldung und Fokus auf das erste Feld; Pipedrive nicht konfiguriert → Hinweis auf E-Mail/Telefon; Pipedrive nicht erreichbar → Hinweis, es später erneut zu versuchen oder direkt Kontakt aufzunehmen.

### Stand der Einrichtung (28.10.2026)

| Baustein | Stand |
|---|---|
| Netlify-Projekt `smartspeechflowwebsite` | läuft unter https://smartspeechflowwebsite.netlify.app/ (Build aus GitHub `main`) |
| Formular-API | läuft; ohne Pipedrive-Werte melden die Formulare „noch nicht eingerichtet“ und speichern nichts |
| Resend (E-Mail) | Domain `mail.smartspeechflow.de` im Resend-Konto von **TPWD** angelegt, **DNS-Einträge fehlen noch** → noch nicht verifiziert, es gehen keine Mails raus |
| Netlify-Variablen für Mail | `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_NOTIFY_TO` sind eingetragen |
| Pipedrive (SVS) | **offen** – Pipeline, Token und IDs müssen von jemandem mit Zugang zum SVS-Pipedrive kommen |

### Anleitung 1: E-Mail-Versand (Resend)

Wer macht das: wer Zugriff auf die DNS-Verwaltung von smartspeechflow.de hat.

**1. DNS-Einträge bei smartspeechflow.de anlegen.** Die Namen gelten relativ zur Domain `smartspeechflow.de` (bei manchen Anbietern muss der volle Name eingetragen werden, z. B. `resend._domainkey.mail.smartspeechflow.de`). Die Einträge betreffen nur die Subdomain `mail.` – das bestehende Postfach unter smartspeechflow.de bleibt unberührt.

| Typ | Name | Wert | Priorität |
|---|---|---|---|
| TXT | `resend._domainkey.mail` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDoiQcsW9mZmZ+OCmeqNtifsLu50lWgN4fyIWksRcG/FeaDsuFIa8sf8SsAUNllrK40jxO8/865plZpeh8BvnLlK4ObSVTjU+npDSDZOFkFk92bfOz5R6el3QB/c9uwZ86MrclMKQraD4L5p9/2yWtHDjVRk8bZYLJ25StWWDHXHwIDAQAB` | – |
| MX | `send.mail` | `feedback-smtp.eu-west-1.amazonses.com` | 10 |
| TXT | `send.mail` | `v=spf1 include:amazonses.com ~all` | – |
| CNAME | `rsend.mail` | `send.forge.rmta.net` | – |

**2. Domain in Resend bestätigen:** resend.com → *Domains* → `mail.smartspeechflow.de` → *Verify*. Das kann je nach DNS-Anbieter einige Minuten bis Stunden dauern. Status muss „Verified“ sein.

**3. Netlify-Variablen** (bereits eingetragen, hier nur zur Kontrolle; *Project configuration → Environment variables*, Scope **Functions**):

| Variable | Wert |
|---|---|
| `RESEND_API_KEY` | Sende-Schlüssel „smartspeechflow-website (Netlify)“ aus dem Resend-Konto von TPWD, nur für diese Domain; als *secret*, Kontext Production. Der Wert steht nicht in diesem Repository. Geht er verloren: in Resend neuen Schlüssel anlegen (*API Keys → Create*, Berechtigung „Sending access“, Domain `mail.smartspeechflow.de`) und bei Netlify ersetzen. |
| `MAIL_FROM` | `Smart Speech Flow <buchung@mail.smartspeechflow.de>` |
| `MAIL_NOTIFY_TO` | `p.wilimzig@smart-village.solutions, eh@tpwd.de, tr@tpwd.de` (mehrere Adressen mit Komma) |

**4. Neu deployen:** Netlify → *Deploys → Trigger deploy*. Variablen wirken erst nach einem neuen Deploy.

**Was dann passiert**
- Buchung: Die Kommune erhält eine Bestätigung in der Sprache der Seite; die Adressen aus `MAIL_NOTIFY_TO` erhalten eine Benachrichtigung mit Link zum Deal in Pipedrive.
- Kontaktanfrage: Benachrichtigung an die Adressen aus `MAIL_NOTIFY_TO`.
- „Antworten“ in einer Benachrichtigung geht direkt an die Person, die das Formular ausgefüllt hat.
- Mails werden nur verschickt, wenn Pipedrive eingerichtet ist (die Buchungsnummer ist die Deal-ID).

### Anleitung 2: Pipedrive (SVS-Konto)

Wer macht das: jemand mit Admin-Zugang zum Pipedrive von SVS. Gebraucht werden am Ende **vier Werte**.

**1. Pipeline anlegen:** *Deals* → Pipeline-Auswahl oben links → *Pipeline hinzufügen* → Name „Smart Speech Flow Form“. Vorschlag für Phasen: „Buchung eingegangen“, „Server eingerichtet“, „Aktiv“, optional „Anfrage“ (für Kontaktanfragen).

**2. API-Token:** Profilbild → *Persönliche Einstellungen* → *API* → Token kopieren. Empfehlung: einen eigenen Pipedrive-Nutzer nur für die Website anlegen, dann hängt der Token nicht an einer Person und lässt sich gezielt erneuern. Achtung bei Logins mit mehreren Firmenkonten: vorher oben rechts auf das **SVS**-Konto wechseln – der Token ist je Firmenkonto verschieden.

**3. Subdomain:** der Teil vor `.pipedrive.com` in der Adresszeile (bei `https://svs-gmbh.pipedrive.com` also `svs-gmbh`).

**4. IDs ablesen:** im Browser öffnen (Subdomain und Token einsetzen):
- `https://<subdomain>.pipedrive.com/api/v1/pipelines?api_token=<TOKEN>` → bei „Smart Speech Flow Form“ steht die `id` = **Pipeline-ID**
- `https://<subdomain>.pipedrive.com/api/v1/stages?pipeline_id=<PIPELINE-ID>&api_token=<TOKEN>` → bei „Buchung eingegangen“ steht die `id` = **Phasen-ID** (optional auch die von „Anfrage“)

Diese Adressen enthalten den Token. Danach den Browserverlauf dafür löschen oder ein privates Fenster verwenden.

**5. Bei Netlify eintragen** (*Project configuration → Environment variables → Add a variable*, jeweils Scope **Functions**):

| Variable | Wert | Pflicht |
|---|---|---|
| `PIPEDRIVE_API_TOKEN` | Token aus Schritt 2, als *secret* markieren | ja |
| `PIPEDRIVE_DOMAIN` | Subdomain aus Schritt 3 | ja |
| `PIPEDRIVE_PIPELINE_ID` | Pipeline-ID aus Schritt 4 | ja* |
| `PIPEDRIVE_BOOKING_STAGE_ID` | Phasen-ID „Buchung eingegangen“ | ja* |
| `PIPEDRIVE_CONTACT_STAGE_ID` | Phasen-ID „Anfrage“ – nur setzen, wenn Kontaktanfragen Deals statt Leads werden sollen | nein |

\* Technisch optional, aber ohne diese Werte landen Buchungen in der Standard-Pipeline des Kontos.

**6. Neu deployen:** *Deploys → Trigger deploy*.

**7. Testen:** Auf https://smartspeechflowwebsite.netlify.app/de/buchen/ eine Buchung mit erkennbaren Testdaten abschicken (Organisation z. B. „TEST Musterstadt“). In Pipedrive prüfen: Organisation, Person, Deal in „Smart Speech Flow Form“ mit Notiz. Danach alles wieder löschen. Ebenso eine Kontaktanfrage (landet als Lead im Leads-Eingang).

### Fehlersuche

| Meldung im Formular | Ursache |
|---|---|
| „Das Formular ist noch nicht eingerichtet …“ | `PIPEDRIVE_API_TOKEN` oder `PIPEDRIVE_DOMAIN` fehlt, Scope ohne „Functions“ oder nicht neu deployt |
| „Das hat leider nicht geklappt …“ | Pipedrive hat die Anfrage abgelehnt: Token falsch/abgelaufen, Subdomain falsch, Pipeline- oder Phasen-ID gehört nicht zum Konto. Details: Netlify → *Logs → Functions* (Einträge „booking: Pipedrive-Fehler“ bzw. „contact: Pipedrive-Fehler“) |
| Buchung klappt, aber keine Mail | Resend-Domain nicht verifiziert, `RESEND_API_KEY`/`MAIL_FROM` fehlt oder Absender passt nicht zur verifizierten Domain. Details: resend.com → *Emails* bzw. *Logs* |

### Lokal testen (Entwickler)

`.env.example` nach `.env` kopieren, Werte eintragen, `npm run dev`, Formular unter http://localhost:4321/de/buchen/ abschicken. Die `.env` wird nie hochgeladen.

**Ohne Pipedrive vorführen:** `FORMS_DEMO=true` – die Formulare melden Erfolg, speichern aber nichts. Nur lokal oder auf einer Vorschau-Adresse verwenden, nie live.

**Datenschutz:** Für Pipedrive, Netlify und ggf. Resend braucht es Auftragsverarbeitungsverträge. Der Abschnitt dazu in der Datenschutzerklärung ist ein markierter Entwurf und muss geprüft werden.

## Projektstruktur

```
src/
  i18n/config.ts        Sprachen, URL-Slugs je Sprache, pathFor()
  i18n/locales/*.json   Texte je Sprache (de = Referenz)
  i18n/index.ts         t()/tv() mit Fallback auf Deutsch
  data/site.ts          Preise, Aktion, externe Links (offene Punkte als TODO)
  styles/tokens.css     Design-Tokens aus den Figma-Variablen
  styles/global.css     Basis, Layout, Typografie-Klassen
  components/           Bausteine (Button, Badge, Header, Footer, Hero, PricingCard …)
  views/                Seiteninhalte (Home, Booking, Thanks, Contact …)
  pages/[lang]/[...slug].astro   erzeugt alle Seiten für alle Sprachen
  pages/api/            Formular-API (booking.ts, contact.ts) – läuft auf dem Server
  lib/forms.ts          Prüfregeln und Preisberechnung der Formulare
  lib/pipedrive.ts      Pipedrive-Anbindung (API v2 für Personen, Organisationen, Deals; v1 für Leads, Notizen)
  lib/mail.ts           optionaler Mailversand über Resend
  assets/               Bilder und Logos aus Figma, Icons (Phosphor Light, MIT)
```

## Barrierefreiheit, SEO und KI-Lesbarkeit

**Barrierefreiheit (Ziel: WCAG 2.2 AA / BITV 2.0)**
- Skip-Link, sinnvolle Überschriftenhierarchie (je Seite genau eine `h1`), Landmarks mit eindeutigen Namen
- komplett per Tastatur bedienbar: Mobilmenü und Sprachauswahl mit Enter/Escape, Radio-Gruppen mit Pfeiltasten, sichtbarer Fokusrahmen (auf dunklen Flächen weiß)
- Formulare mit Labels, Pflichtfeld-Kennzeichnung, `autocomplete`; Ergebnisse des Rechners und der Buchungssumme werden per `aria-live` angesagt
- Kontraste nach WCAG AA, kein horizontales Scrollen bei 320 px Breite und 200 % Zoom, `prefers-reduced-motion` wird beachtet
- `role="list"` an Listen ohne Aufzählungszeichen ist Absicht (Safari/VoiceOver), daher ist die html-validate-Regel `no-redundant-role` aus

Geprüft beim Aufbau mit html-validate (alle Seiten), axe-core 4.10 (WCAG 2.0–2.2 A/AA + Best Practices, 15 Seiten in 375 und 1440 px) und einem Tastatur-Durchlauf. Automatische Tests ersetzen keinen Test mit echten Screenreadern (NVDA, VoiceOver) – vor dem Go-live empfohlen.

**SEO**
- eigener Seitentitel (≤ 60 Zeichen) und eigene Beschreibung je Seite und Sprache (`seo.*` in den Sprachdateien)
- `canonical`, `hreflang` + `x-default`, `sitemap.xml`, Open-Graph-Bilder (`public/og/`), strukturierte Daten (schema.org JSON-LD: Organisation, Website, Produkt mit Preisen, Brotkrumen)
- Sprachen ohne vollständige Übersetzung zeigen deutschen Text und sind deshalb `noindex` mit `canonical` auf die deutsche Seite; sie erscheinen weder in `hreflang` noch in der Sitemap. Sobald eine Sprache vollständig ist, wird sie automatisch indexiert.
- `robots.txt` wird erzeugt: vor dem Go-live alles gesperrt, danach alles erlaubt inkl. Sitemap

**KI-Assistenten**
- alle Inhalte stehen als fertiges HTML im Quelltext (kein JavaScript nötig), auch die Beispielrechnung des Rechners
- `/llms.txt` fasst Produkt, Fakten, Preise und Seiten kompakt zusammen – automatisch aus denselben Daten wie die Seite (Vorschlag llmstxt.org, kein offizieller Standard)
- JSON-LD liefert Preise und Anbieter maschinenlesbar

## Übersetzungen

`de.json` ist die Referenz. Fehlt ein Text in einer anderen Sprache, erscheint dort der deutsche Text. `npm run i18n:check` zeigt, was fehlt.

- **Stand:** Alle 9 Sprachen sind vollständig und werden damit indexiert (sobald `PUBLIC_NOINDEX=false`).
- **Übersetzungen von Claude, nicht fachlich geprüft:** en, fr, it, es, pl, tr, hi, ar. Vor dem Go-live sollten Muttersprachler sie gegenlesen, besonders Rechtstexte (Impressum/Datenschutz sind als Information übersetzt, die deutsche Fassung gilt), Tarifnamen und Fachbegriffe (z. B. „Protokoll-Modus“, „netto“, Kommune/Landkreis).
- **Chat-Mockup im Hero:** Die Bürgerin spricht die Sprache der Seite (auf Deutsch: Englisch), die Mitarbeiterseite bleibt Deutsch.
- **Bestätigungsmail** geht in der Sprache der Seite raus, auf der gebucht wurde.
- **Neue Sprache übersetzen:** Struktur aus `de.json` kopieren und übersetzen. Für unveränderte Texte lassen sich die vorhandenen Übersetzungen der heutigen Seite übernehmen.

## Offene Punkte (vor Go-live)

- [ ] Pipeline „Smart Speech Flow Form“ im SVS-Pipedrive anlegen, Token und IDs eintragen (siehe oben)
- [ ] AV-Verträge Pipedrive, Netlify, ggf. Resend; Datenschutz-Abschnitt dazu prüfen lassen
- [ ] Impressum/Datenschutz: Die Bestandstexte nennen das TMG, das 2024 durch das Digitale-Dienste-Gesetz (DDG) abgelöst wurde – rechtlich prüfen lassen. Abschnitt zu den Formularen ist als Entwurf ergänzt und muss geprüft werden.
- [ ] Serverstandort: „Server in Deutschland“ ist laut Briefing nicht belegt (Hosting bei Hetzner) – Formulierung bestätigen
- [ ] Preis „Betrieb in der Kommune“ (`src/data/site.ts`, derzeit `null` → „xy €“)
- [ ] Ziele für „Live-Demo buchen“ und „Individueller Call“ (`links.demo`, `links.call`; derzeit Kontaktseite)
- [ ] Aktion: Gilt sie nur bei 12 Monaten Vorauszahlung? (`promotion.requiresPrepaid`)
- [ ] Testimonials: Namen, Funktionen, Freigaben, Wappen
- [ ] Bildrechte prüfen. Die Fotos stammen aus Figma, Dateinamen dort deuten auf Getty Images hin. Das Hero-Foto liegt nur in 509 × 339 px vor, für scharfe Darstellung wird eine größere Fassung gebraucht.
- [ ] Nutzungsrechte und Belege für die Pressen-Logos (hr, Kommune21, RTL)
- [ ] Alleinstellungs-Aussage „Einziges deutsches Open-Source-Tool …“ rechtlich prüfen lassen
- [ ] Inhalte der Unterseiten
- [ ] Vertragsbedingungen für die Buchung klären (die AGB-Seite und die AGB-Zustimmung im Buchungsformular wurden auf Wunsch entfernt)
- [ ] Übersetzungen von Muttersprachlern prüfen lassen (alle außer Deutsch)
- [ ] Video (Open Source Business Award) von der heutigen Startseite: übernehmen oder nicht?

## Go-live (später)

1. Bei Netlify `PUBLIC_NOINDEX=false` setzen. Dann erlaubt die erzeugte `robots.txt` alles und verweist auf die Sitemap, und `noindex` entfällt.
2. Domain smartspeechflow.de bei Netlify verbinden.
3. Die Weiterleitung `/` → `/de/` (301) und die 404-Seite erzeugt der Build automatisch für Netlify (`dist/_redirects`, `dist/404.html`).
4. Nach dem Go-live eine echte Testbuchung durchführen und in Pipedrive prüfen.
