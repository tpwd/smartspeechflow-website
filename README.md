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
```

Optional: `.env.example` nach `.env` kopieren. Die Einstellungen darin sind dort erklärt.

## Was drin ist

| Seite | Deutsch | andere Sprachen | Stand |
|---|---|---|---|
| Startseite | `/de/` | `/en/` … | fertig nach HiFi-Entwurf |
| Buchen | `/de/buchen/` | `/en/booking/` | fertig, **ohne Backend** (Demo-Modus) |
| Danke | `/de/buchen/danke/` | `/en/booking/thank-you/` | fertig, Buchungsnummer und E-Mail sind Platzhalter |
| Produkt, Einsatzfelder, Projekt, Open Source, Kontakt | wie heute | wie heute | Platzhalter, Inhalt aus Bestandsseite übernehmen |
| Impressum, Datenschutz | wie heute | wie heute | Platzhalter, Inhalt aus Bestandsseite übernehmen |
| AGB | `/de/agb/` | `/en/terms/` | Platzhalter, **Text fehlt** (vom Buchungsformular vorausgesetzt) |

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

## Übersetzungen

`de.json` ist die Referenz. Fehlt ein Text in einer anderen Sprache, erscheint dort der deutsche Text. `npm run i18n:check` zeigt, was fehlt.

- **Stand:** Deutsch und Englisch sind vollständig. Hi, fr, it, pl, es, tr und ar sind noch leer und zeigen daher Deutsch.
- **Englisch:** Die Texte sind von Claude übersetzt und noch nicht fachlich geprüft.
- **Neue Sprache übersetzen:** Struktur aus `de.json` kopieren und übersetzen. Für unveränderte Texte lassen sich die vorhandenen Übersetzungen der heutigen Seite übernehmen.

## Offene Punkte (vor Go-live)

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
