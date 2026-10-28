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

## Buchung und Kontakt: Pipedrive und Netlify

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

### Einrichtung (einmalig)

1. **Pipedrive (SVS-Konto):** Pipeline „Smart Speech Flow Form“ anlegen, Phasen z. B. „Buchung eingegangen“, „Server eingerichtet“, „Aktiv“ (optional „Anfrage“ für Kontakte).
2. **IDs herausfinden:** Pipeline in Pipedrive öffnen – die Zahl in der Adresszeile (`…/pipeline/<ID>`) ist die Pipeline-ID. Phasen-IDs: `https://<firma>.pipedrive.com/api/v1/stages?pipeline_id=<ID>&api_token=<TOKEN>` im Browser öffnen, dort steht je Phase `id`.
3. **API-Token:** Pipedrive → Persönliche Einstellungen → API. Am besten einen eigenen Pipedrive-Nutzer nur für die Website verwenden, dann hängt der Token nicht an einer Person.
4. **Lokal testen:** `.env.example` nach `.env` kopieren, `PIPEDRIVE_API_TOKEN`, `PIPEDRIVE_DOMAIN`, `PIPEDRIVE_PIPELINE_ID`, `PIPEDRIVE_BOOKING_STAGE_ID` eintragen, `npm run dev`, Testbuchung abschicken, Deal in Pipedrive prüfen und wieder löschen.
5. **Netlify:** Repository verbinden (Build-Befehl `npm run build`, Ordner `dist`, Node 22). Dieselben Variablen unter *Site configuration → Environment variables* eintragen. Die `.env` wird nie hochgeladen.
6. **Bestätigungsmails (optional):** Konto bei Resend, Domain smartspeechflow.de dort verifizieren (DNS-Einträge), dann `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_NOTIFY_TO` setzen. Ohne diese Werte wird keine Mail verschickt, und die Danke-Seite verspricht auch keine.

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
