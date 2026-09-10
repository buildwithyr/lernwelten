# CLAUDE.md — Lernwelten

Anleitung für Menschen und KI-Agenten, die an diesem Projekt weiterarbeiten.
Stand: Version 2 (Überarbeitung nach dem Analysebericht vom 09.09.2026).

---

## 1. Worum es geht

**Lernwelten** ist eine Lern-App für die Volksschule (Klasse 1 und 2).
Hauptnutzerin ist Luisa, 2. Klasse in Österreich. Die App läuft im Browser,
ist als PWA installierbar und funktioniert offline.

**Leitlinien** (aus dem Analysebericht):

- Kurze, klare deutsche Anweisungen, österreichische Begriffe („Jänner", „Bub").
- Wörter und kurze Sätze statt langer Geschichten.
- Eindeutige Aufgaben, faire Rückmeldungen.
- In Mathematik überwiegend eigene Zahleneingabe statt bloßes Auswählen.
- Kurze Runden mit 5 oder 10 Aufgaben.
- Lernhilfen, die den Lösungsweg zeigen — schrittweise, nicht sofort die Lösung.
- Kein Zeitdruck, keine Ranglisten, keine Bestrafung für Lernpausen.
- Keine externen Dienste. Kein Konto. Keine Datenübertragung nach außen.

**Technik:** Vanilla JavaScript, HTML, CSS. Kein Build-Schritt, keine
Laufzeit-Abhängigkeiten. Die einzige npm-Abhängigkeit ist Playwright für
die Browsertests.

---

## 2. Architektur

```
index.html            Einstiegspunkt; Ladereihenfolge ist dort dokumentiert
sw.js                 Service Worker (Offline-Liste, Update-Verhalten)
manifest.json         PWA-Manifest

css/
  fonts.css           lokale Schriften (SIL OFL, siehe assets/fonts/README.md)
  main.css            Design-Tokens, Basis, Buttons, Dialoge, Zugänglichkeit
  village.css         Dorfplatz und Profilanlage
  workshop.css        Übungsmenüs, Aufgabenscreen, Abschluss, Extras
  modules.css         Darstellungen (Zahlenstrahl, Hunderterfeld, Münzen …)
  parents.css         Elternbereich
  oskar.css           Maskottchen
  print.css           Arbeitsblätter (nur media="print")

js/core/              Fachlogik ohne DOM — vollständig in Node testbar
  util.js             Zufall mit Startwert, Escaping, Datum, kleine Helfer
  topics.js           Themenkatalog (Lernziele) + belegte Buchzuordnungen
  answer.js           Antwortprüfung und -normalisierung
  storage.js          Persistenz, Schema-Version, Migration, Export/Import
  progress.js         Lernstand, Stufenanpassung, Wiederholungsplanung
  rewards.js          Sterne und Sammelalbum
  timers.js           zentrale Timer mit Sitzungskennung
  session.js          gemeinsame Sitzungssteuerung (braucht das DOM)

js/content/           reine Daten, keine Logik
  words-data.js       Wortschatz, Buchstabenlücken, Gegenteile, Monate
  german-data.js      Deutschinhalte Klasse 2 (Wortarten, Sätze, Rechtschreibung)
  science-data.js     Sachwissen
  logic-data.js       Wortgruppen, Formen, Spiegelvorlagen

js/generators/        erzeugen Aufgaben, wechseln nie den Bildschirm
  math-gen.js         Mathematik (Klasse 1 und 2)
  german-gen.js       Deutsch
  misc-gen.js         Sachwissen und Logik
  index.js            Registry, stabile Aufgabenkennungen, Anti-Wiederholung

js/ui/                Darstellung
  clock.js            Analoguhr als HTML-String
  widgets.js          Zahlenstrahl, Hunderterfeld, Zehnerstangen, Münzen,
                      Rechenmauer, Punktefeld, Tabellen, Diagramme, Raster
  dom.js              Bildschirmwechsel, Dialoge, Ansagen, Speicherfehler
  taskview.js         14 Eingabearten
  profile.js          Profilanlage und Profilkarte
  workshop.js         Menü eines Lerngebäudes

js/features/          eigenständige Bildschirme
  daily.js            „Heute üben" und Kurz-Checks
  parents.js          Elternbereich (Themen, Lernstand, Lernwörter, Daten, Profile)
  toolbox.js          Oskars Werkzeugkiste
  album.js            Sammelalbum
  shop.js             Oskars Laden
  mirror.js           Spiegelatelier
  worksheet.js        druckbare Arbeitsblätter

js/oskar.js           Maskottchen
js/app.js             Start, Dorfplatz, Navigation
js/pwa.js             Service-Worker-Registrierung, Update- und Installhinweis

tests/
  harness.js          lädt die Browser-Module in einen Node-Kontext
  *.test.js           Modultests (npm test)
  browser-run.js      Ende-zu-Ende-Durchlauf in Chromium
  walkthrough-run.js  jede Übung und jeder Bildschirm im Browser
```

### Verantwortlichkeiten — was gehört wohin

| Frage | Zuständig |
|---|---|
| Welche Lernziele gibt es? Welche Buchseite gehört dazu? | `core/topics.js` |
| Wie sieht eine konkrete Aufgabe aus? | `generators/*` |
| Ist die Antwort richtig? | `core/answer.js` |
| Wie wird das verbucht? | `core/progress.js` |
| Wie läuft eine Runde ab? | `core/session.js` |
| Wie sieht es aus? | `ui/*`, `css/*` |
| Wo liegen die Daten? | `core/storage.js` |

**Regel:** Ein Generator kennt kein DOM. Eine Darstellung kennt keinen
Lernstand. Die Sitzungssteuerung ist die einzige Stelle, die beides verbindet.

---

## 3. Datenmodell und Migration

### Profil (Schema-Version 2)

```js
{
  id, schemaVersion: 2, name, avatarId, grade, createdAt,
  stars, level,
  settings:   { roundLength: 5|10, reduceMotion, showInstallHint },
  unlocked:   { [topicId]: true },        // im Elternbereich freigegeben
  focusTopics: [topicId],                 // Schwerpunkt für "Heute üben"
  skills: {
    [topicId]: {
      level: 1..3, levelSince, roundsOnLevel,
      firstTry: [1,0,…],                  // jüngste Erstversuche DIESER Stufe
      solo, helped, failed, attempts,     // die drei Zustände
      last, box: 1..5, dueAt,             // Wiederholungsplanung
    }
  },
  sessions: {
    [topicId]: { plays, best: { '5': {...}, '10': {...} }, last, history }
  },
  rounds:     [ … ],                      // gemischte Runden (Heute üben, Check)
  retry:      [ { taskId, topicId, dueAt, tries, seed } ],
  learnWords: [ { word, addedAt } ],
  book:       { series, volume, page },
  album:      { unlocked: [stickerId] },
  daily:      { lastDay, rounds },
  legacy_v1:  { adaptive, sessions, progress }   // Rohdaten aus Version 1
}
```

### Migrationsregeln

1. Vor der ersten Migration wird der unveränderte v1-Rohstand unter
   `lw_backup_v1` gesichert. **Diese Sicherung wird nie automatisch gelöscht.**
2. Ist keine Sicherung möglich (Speicher voll), wird **nicht** migriert.
   Lieber alte Logik als Datenverlust.
3. Alte Übungs-IDs (`additionRound100`, `missingLetter` …) werden über
   `topic.legacyIds` auf neue Lernziele abgebildet.
4. Unbekannte alte IDs bleiben in `legacy_v1` erhalten.
5. Ein einzelnes fehlerhaftes Profil bricht die Migration nicht ab; es bleibt
   unverändert bestehen und wird im Bericht gemeldet.
6. **Es gibt keinen stillen Reset.** Nie.

### Ein neues Schema einführen

1. `SCHEMA_VERSION` in `core/storage.js` erhöhen.
2. Eine Funktion `_migrateProfileV2toV3` schreiben, die nur ergänzt.
3. In `runMigrations` einhängen — Sicherung zuerst.
4. In `tests/storage.test.js` einen realistischen Altbestand ergänzen.

---

## 4. Neue Aufgaben hinzufügen

### Neues Lernziel

1. **Eintrag in `js/core/topics.js`:**

```js
{
  id: 'm2.meinThema',            // niemals später umbenennen: steckt in Nutzerdaten
  subject: 'math', grade: 2,
  group: 'Plus und Minus bis 100',
  title: 'Mein Thema', short: 'Kurzbeschreibung', icon: '🎯',
  gen: 'meinGenerator',
  unlock: 'default',             // 'always' | 'default' | 'off'
  goal: 'Was das Kind danach kann.',
  book: [zr(2, '135–143', 'Fundstelle im Buch')],   // nur wenn belegt!
}
```

2. **Generator in `js/generators/math-gen.js`:**

```js
const meinGenerator = {
  generate(ctx) {                       // ctx = { level, rng, seed, profile, args }
    const a = Util.randomInt(10, 90, ctx.rng);
    return {
      signature: `mt-${a}`,             // stabil, beschreibt die Aufgabe
      prompt: `Was ist ${a} plus 10?`,  // reiner Text, wird angesagt
      questionHtml: Widgets.equation([a, '+', 10, '=', '?']),
      input: { kind: 'number', max: 100 },
      answerMode: AnswerCheck.MODE.NUMBER,
      answer: a + 10,
      hints: [
        'Was passiert mit den Zehnern?',   // qualitativ
        `${a} und ein Zehner mehr.`,       // konkreter
        `${a} + 10 = ${a + 10}.`,          // Lösungsweg
      ],
      tool: 'hunderterfeld',            // optional, Oskars Werkzeugkiste
    };
  },
};
// … und im return-Block exportieren
```

3. Fertig. Menü, Lernstand, Elternbereich, Arbeitsblatt und Tests greifen
   automatisch. `npm test` prüft den neuen Generator sofort mit.

### Regeln für Aufgaben (nicht verhandelbar)

- **Genau eine richtige Lösung.** Ist eine zweite denkbar, gehört sie in
  `accept` oder die Aufgabe braucht einen eingrenzenden Hinweis im Text
  (so wie bei `H_RZ` → „Es schlägt in deiner Brust.").
- **Mindestens zwei Hilfen, gestuft.** Die erste darf die Lösung nicht nennen.
  `tests/generators.test.js` prüft das.
- **`signature` beschreibt die Aufgabe, nicht die Antwort.** `15 + 5` und
  `10 + 10` müssen verschiedene Kennungen haben.
- **Schwierigkeit heißt nicht „größere Zahlen".** Sie unterscheidet
  Anforderungen: mit/ohne Zehnerübergang, Anzahl Schritte, Stützpunkte.
- **Zahlenraum und Anforderung sind getrennte Themen.** „bis 100" ist etwas
  anderes als „mit Zehnerübergang".
- **Groß-/Kleinschreibung nur prüfen, wenn sie das Lernziel ist**
  (`strictCase: true`). Sonst tolerant vergleichen.
- **Uhrzeit:** Wird eine 24-Stunden-Antwort erwartet, muss die Aufgabe die
  Tageszeit nennen. Ein Zifferblatt allein unterscheidet Vormittag und
  Nachmittag nicht.

---

## 5. Themen und Buchseiten zuordnen

Im Elternbereich unter „Themen" gibt es eine Suche „Buchseite nachschlagen".
Sie greift auf `topic.book` in `core/topics.js` zu.

**Die wichtigste Regel:** Dort stehen **ausschließlich Seitenangaben, die im
Analysebericht belegt sind.** Es wird nichts geraten. Findet die Suche zu
einer Seite nichts, sagt die App das ausdrücklich („keine belegte Zuordnung")
— sie erfindet keine Zuordnung.

Format einer Referenz:

```js
{ series: 'zahlenreise2', volume: 1, printed: '45–48', pdf: null, label: '…' }
```

`pdf: null` heißt: Die PDF-Seite ist nicht belegt. Nicht schätzen.

Belegt sind derzeit (Quelle: Bericht, Abschnitte 4, 5 und 7):

- Zahlenreise 2, Teil 1: S. 21, 27–29, 33, 41, 45–48, 51–59, 61–66, 68,
  72–76, 77–78, 79–90, 84
- Zahlenreise 2, Teil 2: S. 112–114, 116, 117–119, 123–125, 126–132,
  134, 135–143, 144–147, 150, 165, 166–171, 180, 181, 186–190, 191–195, 197
- Flex und Flora 2: Sprache untersuchen S. 4–9, 16–25, 28–35, 38–55, 58–63;
  Richtig schreiben S. 8–15, 16–42, 43–49; Lesen S. 4–17, 36–47;
  Texte verfassen S. 11–29, 58–61; Mein Trainingsheft S. 5–8

Die zehn Mathe-Checks stehen in `Topics.CHECKS` mit gedruckter Seite, PDF-Seite
und Band. Sie dienen als **Themenraster** — die App stellt eigene Aufgaben zu
den dort genannten Lernzielen, sie reproduziert keine Buchseiten.

---

## 6. Tests, lokaler Start, Bereitstellung

```bash
npm test              # 215 Modultests (Node, kein Browser nötig)
npm run test:browser  # 30 Prüfungen in Chromium (Ende zu Ende)
node tests/walkthrough-run.js          # jede Übung im Browser durchspielen
node tests/walkthrough-run.js --topic m2.symmetrie   # nur ein Thema

npm start             # python3 -m http.server 8080
```

Für den Service Worker braucht es einen echten Server — `file://` genügt nicht.

**Bereitstellung:** statisches Hosting, kein Build. Der Ordner wird
unverändert ausgeliefert.

**Achtung bei einem Domainwechsel:** `localStorage` hängt an der Adresse.
Vor einem Umzug im Elternbereich eine Sicherung herunterladen und danach
wieder einspielen.

---

## 7. Offline- und Update-Verhalten

- `sw.js` listet **alle** Dateien der App in `STATIC_ASSETS`.
  `tests/offline.test.js` prüft diese Liste gegen `index.html` — eine
  vergessene Datei fällt sofort auf, nicht erst offline beim Kind.
- Der Service Worker ruft **kein** `self.skipWaiting()` im Install-Handler.
  Eine neue Version wartet.
- `js/pwa.js` bietet das Update erst an, wenn `Session.isActive()` falsch ist
  — also am Dorfplatz oder nach einer abgeschlossenen Runde. Angewendet wird
  es erst auf Tippen.
- Nach inhaltlichen Änderungen die `CACHE_VERSION` erhöhen, sonst sehen
  installierte Nutzerinnen nichts.
- Der Installationshinweis erscheint frühestens nach einer abgeschlossenen
  Runde und lässt sich im Elternbereich abschalten.

---

## 8. Stolpersteine

- **Kein Build-Schritt.** Änderungen sind sofort aktiv.
- **Ladereihenfolge in `index.html` ist Pflicht.** Sie ist dort kommentiert.
  `tests/offline.test.js` prüft, dass jede JS-Datei eingebunden ist.
- **`const` auf oberster Ebene** landet im lexikalischen Gültigkeitsbereich,
  nicht auf `window`. Deshalb holt `tests/harness.js` die Module ausdrücklich
  heraus.
- **Topic-IDs sind Nutzerdaten.** Umbenennen setzt Fortschritte zurück.
  Braucht ein Thema einen neuen Namen: `title` ändern, `id` behalten.
- **Alle Nutzereingaben durch `Util.escapeHtml`.** Profilname, Lernwörter,
  importierte Daten. Nie roh in ein Template.
- **Timer nur über `Timers.after` / `Timers.every`.** Ein direktes
  `setTimeout` überlebt den Bildschirmwechsel und öffnet nachträglich einen
  Aufgabenscreen.
- **`MAX_WRONG_ATTEMPTS` steht nur in `core/session.js`.** Nicht kopieren.
- **Sterne werden am Rundenende vergeben**, nicht pro Antwort — sonst zählt
  eine abgebrochene Runde doppelt.

---

## 9. Was ohne Rückfrage nicht geändert werden sollte

- **`core/storage.js`** — Schema-Änderungen können bestehende Lernstände
  beschädigen. Immer mit Migration und Test.
- **Topic-IDs und `legacyIds`** in `core/topics.js`.
- **`sw.js` und `js/pwa.js`** — Caching-Fehler treffen installierte Nutzer
  direkt und sind schwer zu debuggen.
- **Buchzuordnungen** — nichts hinzufügen, was nicht belegt ist.
- **Die drei Zustände solo / helped / failed** — sie tragen die gesamte
  Bewertung. Wer sie zusammenlegt, macht den Lernstand wertlos.

---

## 10. Aktueller Stand und offene Punkte

Siehe `ARBEITSSTAND.md` im Projektstamm. Dort stehen erledigte Arbeiten,
offene Fehler und die nächsten konkreten Schritte.
