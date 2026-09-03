# CLAUDE.md — Lernwelten

## 1. Projekt-Übersicht

**Name:** Lernwelten  
**Zweck:** Spielerische Lern-App für Volksschulkinder (Klasse 1 & 2). Kinder erkunden ein Dorf mit vier Lerngebäuden und üben Mathe, Lesen, Logik und Sachwissen.  
**Tech-Stack:**

- Vanilla JavaScript (keine Frameworks, kein Build-Step)
- CSS (mehrere Dateien, kein Preprocessor)
- PWA (manifest.json, sw.js, installierbar auf Mobilgeräten)
- Schriftart: Nunito via Google Fonts
- Keine npm-Abhängigkeiten zur Laufzeit (README erwähnt `npm install`, aber es gibt keine package.json — ignorieren)
- Hosting: unklar, aber als statische Seite deploybar (GitHub Pages, Netlify, etc.)

**Sprache der UI:** Deutsch  
**Zielgruppe:** Kinder ca. 6–8 Jahre → kindgerechtes Design, große Buttons, Emojis, Maskottchen Oskar (Klasse 1) bzw. Samson (Klasse 2)

---

## 2. Dateistruktur

```
index.html              Einstiegspunkt; lädt alle CSS + JS; kommentiert Ladereihenfolge
manifest.json           PWA-Manifest
sw.js                   Service Worker (Offline-Caching)
favicon.ico
assets/
  oskar-cartoon.png     Oskar-Maskottchen (Klasse 1)
  samson-cartoon.png    Samson-Maskottchen (Klasse 2)
  oskar-default.png     zweites Oskar-Bild (wo genau genutzt?)
  icons/                PWA-Icons in allen Größen
css/
  main.css              Basisstyles, globale Variablen, Utility-Klassen
  village.css           Dorfplatz-Screen (Gebäude-Grid, Header)
  workshop.css          Lerngebäude-Screens (Quiz-Karten, Buttons)
  oskar.css             Maskottchen-Positionierung und Sprechblase
  modules.css           modulspezifische Styles (Dot-Grid, Pattern-Aufgaben etc.)
js/
  storage.js            Zentrales localStorage-Interface (alle Persistenz läuft hier durch)
  adaptive.js           Schwierigkeitsgrad- und Gewichtungslogik (keine Cloud, lokal)
  oskar.js              Maskottchen-Modul: Posen + Nachrichten-Pools je Figur (Oskar/Samson), DOM-Management
  profile.js            Profilerstellung, Avatar-Auswahl, Setup-Screen
  app.js                Haupt-Controller: Screen-Management, Dorfplatz, Overlays
  pwa.js                PWA-Installbanner-Logik
  modules/
    math.js             Rechenwerkstatt (Zahlen erkennen, Zählen, Addition, Subtraktion)
    words.js            Wörterhaus (fehlende Buchstaben, Buchstaben sortieren, Kategorien, Gegenteile)
    puzzles.js          Rätselhöhle (Muster, Außenseiter, Gedächtnis, Mini-Sudoku)
    science.js          Forscherlabor (Wissensquiz, Wahr/Falsch, Zuordnung)
```

---

## 3. Aktueller Stand

**Fertig/stabil:**

- Alle 4 Lerngebäude sind aktiv und spielbar
- Profil-System (Name + Avatar-Auswahl, lokal gespeichert)
- Sterne & Level-System (alle 10 Sterne → nächstes Level)
- Adaptives Lernsystem: Schwierigkeitsgrad 1–3 pro Übungsart, passt sich nach ≥5 Versuchen an (>85% Erfolg → schwerer, <50% → leichter)
- Anti-Wiederholungs-Queue (letzte 5 Antworten werden nicht nochmal gestellt)
- PWA: installierbar, Offline-Fähigkeit via Service Worker
- Mobiles Layout: aktuell gefixt für schmale Displays (letzter Commit)
- Maskottchen erscheint auf dem Dorfplatz und in Modulen mit zufälligen Nachrichten — Oskar (Hund) bei Klasse 1, Samson (Katze) bei Klasse 2. Welche Figur aktiv ist, entscheidet `oskar.js` intern über `Storage.getGrade()`; alle Aufrufstellen (`Oskar.show(...)` etc.) bleiben unverändert
- Klassenstufen-Auswahl (1./2. Klasse) beim App-Start, jederzeit über Button im Dorfplatz-Header wechselbar (`Storage.getGrade()/setGrade()`)

**In Arbeit / bekannt offen:**

- Beide Maskottchen haben nur eine Pose (`oskar-cartoon.png`/`samson-cartoon.png`). Im Code sind `happy`, `thinking`, `wave` als auskommentierte Platzhalter in `oskar.js` — die PNG-Dateien fehlen noch
- `oskar-default.png` existiert in assets/, aber unklar wo/ob genutzt (offene Frage)
- Zweiter Branch `claude/clever-ride-85shxx` existiert — unklar was da drin ist, nicht gemergt

**Nicht vorhanden (trotz README-Erwähnung):**

- Kein `package.json`, kein `node_modules`, kein Build-System — die App ist reines Vanilla HTML/CSS/JS

---

## 4. Technische Konventionen

**Modul-Pattern:** Jedes JS-File ist ein IIFE (`const Foo = (() => { ... return {...}; })()`) — kein ES-Module-System, globale Variablen. Ladereihenfolge in `index.html` ist daher kritisch (in den HTML-Kommentaren dokumentiert).

**Neues Lernfach hinzufügen:** `app.js` oben erklärt's: 1. `js/modules/<fach>.js` nach Muster von `math.js` erstellen, 2. im `BUILDINGS`-Array in `app.js` eintragen, 3. `<script>`-Tag in `index.html` ergänzen.

**Neue Maskottchen-Pose:** PNG in `assets/` ablegen, in `CHARACTERS.<oskar|samson>.poses` in `oskar.js` eintragen, dann per `Oskar.show(container, { pose: 'name' })` nutzen. Welche Figur angezeigt wird, hängt automatisch von der Klassenstufe ab (`Storage.getGrade()`) — nicht am Aufruf selbst wählbar.

**Storage:** Alles geht durch `storage.js` — nie direkt `localStorage` anschreiben. Profil-Daten, Adaptive-Stats und Session-Ergebnisse sind getrennte Felder im Profil-Objekt.

**CSS:** Keine CSS-Variablen-Architektur erkennbar außer inline style-Attributen bei Gebäudefarben (`--building-color`, `--building-bg`). Farben für die Module sind in `app.js` als Hex-Werte im `BUILDINGS`-Array definiert.

**Sprachkonvention:** Code-Kommentare und Variablennamen sind gemischt (Deutsch und Englisch). UI ist komplett Deutsch.

---

## 5. Bekannte Eigenheiten / Stolpersteine

- **Kein Build-Step:** Änderungen sind sofort aktiv. Kein `npm run build` nötig/möglich.
- **Service Worker cacht aggressiv:** Bei Änderungen kann der SW veraltete Assets ausliefern. `sw.js` hat eine Cache-Version — bei größeren Änderungen die Version hochzählen, sonst sehen Nutzer nichts.
- **Ladereihenfolge in index.html ist Pflicht:** `storage.js` muss vor `adaptive.js` und `oskar.js` kommen, die müssen vor `profile.js` und den Modulen sein — das ist im HTML-Kommentar dokumentiert.
- **`recentAnswers`-Queue ist nur im RAM:** Wird beim Seitenladen zurückgesetzt. Kein Problem für den Normalbetrieb, aber beim Testing auffällig.
- **Kein echtes Routing:** Alle Screens werden per `innerHTML` in `#app` gerendert. Browser-Back-Button funktioniert nicht wie erwartet.
- **Adaptive-Stats und Session-Stats sind zwei verschiedene Datentöpfe:** `profile.adaptive[exerciseId]` (für Schwierigkeit) und `profile.sessions[exerciseId]` (für Bestscores/Sterne) — nicht verwechseln.
- **MAX_WRONG_ATTEMPTS = 3** ist in jedem Modul einzeln definiert (`math.js`, `words.js`, `puzzles.js`) — wenn man das ändern will, muss man es an mehreren Stellen tun.

---

## 6. Was NICHT ohne Rückfrage geändert werden soll

- **`storage.js`** — alle anderen Module hängen daran. Schema-Änderungen am Profil-Objekt können bestehende localStorage-Daten von Nutzern korrupten.
- **Ladereihenfolge in `index.html`** — bitte nicht umstellen ohne die Abhängigkeiten zu prüfen.
- **`sw.js` / PWA-Logik** — Caching-Bugs sind schwer zu debuggen und betreffen installierte App-Nutzer direkt.
- **Bestehende `exerciseIds`** in `app.js` (`numberRecognition`, `counting`, etc.) — diese sind Keys in den gespeicherten Nutzerdaten. Umbenennen würde alle Fortschritte zurücksetzen.
- **`BUILDINGS`-Array in `app.js`** — `active: false` sollte nicht leichtfertig auf `true` gesetzt werden, solange das Modul noch nicht implementiert ist.
