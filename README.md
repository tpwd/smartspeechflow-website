# Smart Speech Flow – Landingpage (Astro)

Statische, mehrsprachige Website für smartspeechflow.de. Grundgerüst auf Basis der Figma-Datei „Smart Speech Flow-LP (Copy)“: HiFi-Library, Desktop-, Tablet- und Mobil-Entwürfe.

**Stand:** lokal lauffähig. Es gibt noch kein Online-Repository und kein Deployment.

## Lokal starten

Voraussetzung: **Node.js 22.12 oder neuer** (`node -v`). Mit nvm: `nvm use`.

```sh
npm install          # einmalig
npm run dev          # Entwicklungsserver: http://localhost:4321/de/
```

Weitere Befehle:

```sh
npm run build        # statische Seite nach dist/ bauen
npm run preview      # gebaute Seite lokal ansehen (wie später auf dem Server)
npm run check        # Typprüfung + Übersicht fehlender Übersetzungen
npm run i18n:check   # nur fehlende Übersetzungen
npm run validate     # bauen + alle Seiten mit html-validate prüfen
```

Optional: `.env.example` nach `.env` kopieren. Die Einstellungen darin sind dort erklärt.

## Was drin ist

| Seite | Deutsch | andere Sprachen | Stand |
|---|---|---|---|
| Startseite | `/de/` | `/en/` … | fertig nach HiFi-Entwurf |
| Buchen | `/de/buchen/` | `/en/booking/` | fertig, **ohne Backend** (Demo-Modus) |
| Danke | `/de/buchen/danke/` | `/en/booking/thank-you/` | fertig, Buchungsnummer und E-Mail sind Platzhalter |
| Produkt, Einsatzfelder, Projekt, Open Source | wie heute | wie heute | Inhalte der Bestandsseite, neu geschrieben mit Fokus auf Buchung |
| Kontakt | `/de/kontakt/` | `/en/contact/` | Formular **ohne Backend** (Demo-Modus), Thema per `?topic=demo` vorwählbar |
| Impressum, Datenschutz | wie heute | wie heute | Rechtstexte **wörtlich** aus der Bestandsseite, Datenschutz mit markiertem Platzhalter für das Buchungsformular |
| AGB | `/de/agb/` | `/en/terms/` | Platzhalter, **Text fehlt** (vom Buchungsformular vorausgesetzt) |

**Ersparnisrechner** (Startseite, Anker `#ersparnis`): Dolmetscherstunden pro Monat oder Jahr × Stundensatz (Startwert 83 € laut Briefing, im Rechner änderbar) minus Jahrespreis der gewählten Option. Zeigt die Ersparnis pro Jahr, die Gewinnschwelle, den Aktionsbonus und den eingesparten Aufwand. „Mit dieser Option buchen“ übergibt Option und Schätzung an die Buchen-Seite. Ohne JavaScript steht eine fertige Beispielrechnung da.

- **9 Sprachen** wie auf der heutigen Seite: de, en, hi, fr, it, pl, es, tr, ar. Das URL-Schema ist übernommen, damit alle bestehenden Links gültig bleiben.
- **Arabisch** wird mit `dir="rtl"` gespiegelt. Alle Abstände nutzen logische CSS-Eigenschaften.
- **Schriften selbst gehostet**, keine Google-Fonts-Anfragen: Hanken Grotesk, dazu Noto Sans Arabic und Noto Sans Devanagari für Arabisch und Hindi.
- **SEO:** `hreflang` für alle Sprachen, `canonical`, `sitemap.xml` mit Sprachalternativen. `/` leitet auf `/de/` weiter.
- **Noch nicht für Suchmaschinen freigegeben:** `noindex` auf allen Seiten und eine sperrende `robots.txt`. Siehe „Go-live“.
- **Chat-Mockup im Hero** ist HTML statt Bild und lässt sich daher übersetzen.
- **Responsiv:** Mobil (ab 375 px), Tablet (ab 768 px), Desktop-Navigation ab 1024 px, Desktop-Layout bis 1440 px.

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
  views/                Seiteninhalte (Home, Booking, Thanks, Placeholder)
  pages/[lang]/[...slug].astro   erzeugt alle Seiten für alle Sprachen
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

- **Stand:** Deutsch und Englisch sind vollständig. Hi, fr, it, pl, es, tr und ar sind noch leer und zeigen daher Deutsch.
- **Englisch:** Die Texte sind von Claude übersetzt und noch nicht fachlich geprüft.
- **Neue Sprache übersetzen:** Struktur aus `de.json` kopieren und übersetzen. Für unveränderte Texte lassen sich die vorhandenen Übersetzungen der heutigen Seite übernehmen.

## Offene Punkte (vor Go-live)

- [ ] Kontaktformular-Backend: Ziel-URL in `PUBLIC_CONTACT_ENDPOINT`
- [ ] Impressum/Datenschutz: Die Bestandstexte nennen das TMG, das 2024 durch das Digitale-Dienste-Gesetz (DDG) abgelöst wurde – rechtlich prüfen lassen. Abschnitt zum Buchungsformular ergänzen.
- [ ] Serverstandort: „Server in Deutschland“ ist laut Briefing nicht belegt (Hosting bei Hetzner) – Formulierung bestätigen
- [ ] Preis „Betrieb in der Kommune“ (`src/data/site.ts`, derzeit `null` → „xy €“)
- [ ] Ziele für „Live-Demo buchen“ und „Individueller Call“ (`links.demo`, `links.call`; derzeit Kontaktseite)
- [ ] Aktion: Gilt sie nur bei 12 Monaten Vorauszahlung? (`promotion.requiresPrepaid`)
- [ ] Buchungs-Backend: Ziel-URL in `PUBLIC_BOOKING_ENDPOINT`. Ohne Backend sendet das Formular nichts. Buchungsnummer und Bestätigungs-E-Mail brauchen eine Server-Komponente.
- [ ] Testimonials: Namen, Funktionen, Freigaben, Wappen
- [ ] Bildrechte prüfen. Die Fotos stammen aus Figma, Dateinamen dort deuten auf Getty Images hin. Das Hero-Foto liegt nur in 509 × 339 px vor, für scharfe Darstellung wird eine größere Fassung gebraucht.
- [ ] Nutzungsrechte und Belege für die Pressen-Logos (hr, Kommune21, RTL)
- [ ] Alleinstellungs-Aussage „Einziges deutsches Open-Source-Tool …“ rechtlich prüfen lassen
- [ ] Inhalte der Unterseiten und AGB-Text
- [ ] Übersetzungen für hi, fr, it, pl, es, tr, ar
- [ ] Video (Open Source Business Award) von der heutigen Startseite: übernehmen oder nicht?

## Go-live (später)

1. `PUBLIC_NOINDEX=false` setzen und `public/robots.txt` freigeben (Vorlage steht in der Datei).
2. `npm run build`. Der Ordner `dist/` ist die komplette Website und kann auf jedem statischen Webserver liegen.
3. **Weiterleitungen auf dem Server:** `/` → `/de/` als 301-Weiterleitung, außerdem `404.html` als Fehlerseite. Eine Weiterleitungsseite ist zwar enthalten, eine Server-Regel ist aber sauberer.
