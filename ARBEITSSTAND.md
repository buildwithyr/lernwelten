# Arbeitsstand

Kompakter Stand für die Weiterarbeit — auch nach einem Kontextwechsel.
Zuletzt aktualisiert: 10.09.2026.

Grundlage: „Lernwelten — Analyse und Ausbauplan für Luisas 2. Klasse",
09.09.2026, geprüfter Commit `1f81a13`.

---

## Etappen des Berichts

| Etappe | Stand |
|---|---|
| 1 · Vertrauen in Antworten | **erledigt** |
| 2 · Verlässlicher App-Alltag | **erledigt** |
| 3 · Erstes Schulstoffpaket | **erledigt** |
| 4 · Schulbuch-Modus | **erledigt** |
| 5 · Erweiterung nach Nutzung | **erledigt**, Beobachtung offen |

---

## Erledigt

### Etappe 1 — Bewertung und Aufgabenqualität

- **A** Schwierigkeit steigt frühestens nach zwei Runden auf derselben Stufe
  und höchstens um eine Stufe. Bewertet werden nur die jüngsten
  selbstständigen Erstversuche; Kurz-Checks bleiben ganz außen vor.
  → `core/progress.js`, Regressionstests in `tests/progress.test.js`
- **B** Bestwerte getrennt nach Rundenlänge, Vergleich primär nach „allein
  geschafft". 5/5 wird von 6/10 nicht mehr entwertet.
- **C** Drei Zustände: allein geschafft / mit Hilfe geschafft / noch üben.
  Bonus nur, wenn wirklich jede Aufgabe im ersten Versuch ohne Hilfe stimmte.
- **D** Alle Buchstabenlücken und Anagramme haben einen eingrenzenden Hinweis
  im Aufgabentext (`H_RZ` → „Es schlägt in deiner Brust."). `tests/content.test.js`
  erzwingt das für jeden Eintrag.
- **E** Wiederholungen über stabile Aufgabenkennungen (`topicId#signature`).
  Höchstens ein offener Eintrag je Aufgabe, auch bei mehreren Fehlversuchen.
  Offene Wiederholungen überleben das Rundenende und werden über mehrere
  Tage eingeplant (Leitner-Boxen 1–5).
- Hinweise sind gestuft: erst ein Denkanstoß, dann ein Zwischenschritt, zuletzt
  der Rechenweg. Die erste Hilfe darf die Lösung nicht enthalten — geprüft.
- Uhrzeitaufgaben nennen die Tageszeit, wenn eine 24-Stunden-Antwort erwartet
  wird. Ohne Tageszeitkontext wird nur das Zifferblatt abgefragt.
- Jede Aufgabe und jeder Rundenabschluss werden genau einmal gewertet
  (`recorded`- und `finished`-Sperren in `core/session.js`).

### Etappe 2 — App-Alltag

- Zentrale Timer mit Sitzungskennung (`core/timers.js`). Nach dem Verlassen
  einer Übung öffnet kein alter Timer mehr einen Aufgabenscreen.
- PWA-Update unterbricht keine laufende Übung. Die neue Version wartet und
  wird erst nach ausdrücklichem Tippen angewendet (`js/pwa.js`, `sw.js`).
- Offline-Liste vollständig; `tests/offline.test.js` prüft sie gegen
  `index.html`. `js/pwa.js` hatte gefehlt und ist jetzt drin.
- Export und geprüfter Import von Lernständen im Elternbereich.
  Vor jedem Import wird der aktuelle Stand zurückgesichert.
- Speicherfehler werden sichtbar gemeldet, nicht nur protokolliert.
  Bei gesperrtem Speicher erklärt die App das beim Start.
- Profilverwaltung: anlegen, wechseln, umbenennen, löschen.
- Alle Nutzereingaben werden als Text gerendert (`Util.escapeHtml`).
- Zoom wieder erlaubt, Fokusfalle und Escape in Dialogen, `aria-live`-Ansagen,
  große Touchflächen, `prefers-reduced-motion` plus eigene Einstellung.
- Schriften liegen lokal (SIL OFL). Vercel Analytics und Google Fonts entfernt.
  Der Browsertest prüft, dass die App keine fremde Adresse anfragt.

### Etappe 3 und 5 — Inhalte

**Mathematik Klasse 2** (41 Lernziele): Stellenwert, Bündeln, Hunderterfeld,
Zahlenstrahl, Vergleichen, Nachbarzahlen, gerade/ungerade; Plus und Minus mit
Zehnern, ohne und **mit** Zehnerübergang als getrennte Themen; Ergänzen zum
Zehner und auf 100; Umkehraufgaben; Rechenmauern; Rechenweg prüfen;
Verdoppeln/Halbieren; Zahlenreihen; gleich große Gruppen; Punktefelder;
neun einzeln freischaltbare Malreihen; Tausch- und Nachbaraufgaben; Verteilen
und Gruppenbilden; Umkehrung Mal/Geteilt; Münzen, Euro/Cent, Rückgeld; Uhr
(volle, halbe, Viertelstunden), Kalender; Längen (cm/dm/m), Gewichte (dag/kg);
Sachaufgaben; Flächen und Körper; Spiegeln; Diagramme. Zahlen bis 1.000 sind
vorbereitet und standardmäßig **aus**.

**Deutsch Klasse 2** (24 Lernziele): ABC ordnen und Buchstaben-Nachbarn;
Namenwörter, Begleiter, Einzahl/Mehrzahl, zusammengesetzte Wörter;
Zeitwörter erkennen und beugen; Eigenschaftswörter; Satzzeichen, Satzanfang,
Satzbau; Silben; St/Sp; Umlaute ableiten; langes i; doppelte Mitlaute;
Verlängern; Fehler verbessern; Merkwörter; persönliche Lernwörter;
genau lesen, Bild und Satz, Tabellen, Sachtexte, Schritte ordnen, Packliste.

Insgesamt **93 Lernziele mit 45 Generatoren**.

### Etappe 4 — Schulbuch-Modus

- Elternbereich mit fünf Bereichen: Themen, Lernstand, Lernwörter, Daten, Profile.
- Buchseite nachschlagen: nur belegte Zuordnungen; fehlt eine, sagt die App das
  ausdrücklich statt zu raten.
- Themen einzeln freigeben, Schwerpunkt setzen, Rundenlänge wählen.
- „Heute üben" auf dem Dorfplatz mischt Einstieg, Schwerpunkt und fällige
  Wiederholungen.
- Drei getrennte Betriebsarten: Üben, Kurz-Check (ein Versuch, keine Hilfen,
  keine Stufenänderung), freies Spielen.
- Die zehn Mathe-Checks als Themenraster mit gedruckter Seite, PDF-Seite und Band.
- Lernstandsübersicht mit Beobachtungen statt Noten und konkretem nächsten Vorschlag.

### Zusatzfunktionen

Oskars Werkzeugkiste (12 Hilfen), Sammelalbum (24 Motive, drei Sammlungen),
Oskars Laden, Spiegelatelier (Rätsel und freies Spiegeln), druckbare
Arbeitsblätter mit getrennter Lösungsseite.

---

## Nicht erledigt und warum

| Punkt | Grund |
|---|---|
| **Vorlesen (Sprachausgabe)** | Der Bericht empfiehlt vorab geprüfte Audiodateien für einen verlässlichen Offline-Modus. Die müssten aufgenommen werden. `SpeechSynthesis` wäre online-abhängig und auf iOS unzuverlässig — das wurde bewusst nicht eingebaut, statt eine wackelige Lösung zu liefern. Vorbereitet ist alles: Jede Aufgabe hat ein `prompt`-Feld mit reinem Text. |
| **Oskar-Posen (winken, nachdenken, jubeln)** | Es gibt weiterhin nur `assets/oskar-cartoon.png`. Die Registry in `js/oskar.js` nimmt weitere Posen sofort auf — die Bilder fehlen. Es wurden keine erfunden. |
| **Illustrierte Gebäude am Dorfplatz** | Der Bericht nennt das als Idee, nicht als Bedarf. Ohne Zeichnungen bleibt es bei farbigen Karten. |
| **„Gemeinsam üben"-Modus** | Kleiner Nutzen gegenüber dem Aufwand; der Elternbereich zeigt Lösungen bereits über die Arbeitsblätter. Zurückgestellt. |
| **Geräteübergreifende Synchronisation** | Wie im Bericht: erst Export/Import (erledigt), Synchronisation später. Braucht ein Backend — ausdrücklich nicht Teil dieser Überarbeitung. |
| **Foto einer Buchseite, KI-Chat, KI-Benotung** | Im Bericht nachrangig, hier nicht umgesetzt. |
| **Vollständige Seiteninventur der Schulbücher** | Es liegen nur die im Bericht belegten Zuordnungen vor. Siehe unten. |

---

## Offener Quellenbedarf

Damit der Schulbuch-Modus vollständig wird, fehlen belegte Zuordnungen für:

1. **Zahlenreise 2, Teil 1** — Seiten außerhalb von 21, 27–29, 33, 41, 45–48,
   51–59, 61–66, 68, 72–90.
2. **Zahlenreise 2, Teil 2** — Seiten außerhalb von 112–147, 150, 165–171,
   180–197.
3. **Flex und Flora 2** — alle Hefte jenseits der im Bericht genannten
   Kapitelgrenzen; insbesondere „Texte verfassen" ist nur grob erfasst.
4. **PDF-Seitenzahlen** — belegt sind nur die zehn Mathe-Checks. Alle anderen
   Referenzen führen `pdf: null`.

Bis dahin gilt: Die App meldet „keine belegte Zuordnung" und die Freigabe
erfolgt von Hand. **Es wird nichts geraten.**

---

## Bekannte Einschränkungen

- **Nicht auf einem echten iPhone getestet.** Geprüft wurde Chromium bei
  390×844 mit Touch-Emulation. Safari-eigene Themen (Bildschirmtastatur,
  Home-Indikator, „Zum Home-Bildschirm") sind nach Regeln umgesetzt, aber
  nicht am Gerät verifiziert.
- **Update-Verhalten nur statisch und im Testlauf geprüft.** Ein echter
  Versionswechsel mit installierter App auf einem iPhone steht aus.
- **Die Inhalte sind fachlich durchgesehen, aber nicht von einer Lehrperson
  freigegeben.** Die automatische Prüfung fängt Struktur und Eindeutigkeit —
  keine didaktische Eignung.
- **Rundenmischung ist eine Startidee.** Die Verteilung 20/50/30 stammt aus
  dem Bericht und ist ausdrücklich nicht pädagogisch validiert.
- **Der Elternzugang ist eine Rechenfrage, kein Passwort.** Er hält
  Zweitklässlerinnen ab, mehr nicht — das ist Absicht.

---

## Nächste konkrete Schritte

1. **Auf Luisas iPhone durchspielen.** Besonders: Bildschirmtastatur bei den
   Zahlenfeldern, Installation über Safari, Offline-Start nach Installation,
   ein echter Versionswechsel.
2. **Beobachten, was der Bericht fragt:** Findet sie ohne Erklärung zur
   nächsten Aufgabe? Versteht sie die Hilfen? Kommen falsche Antworten vom
   Rechnen oder vom Lesen? Passt die Rundenlänge?
3. **Danach nachschärfen:** Die Regel „zwei Runden, dann höchstens eine Stufe"
   ist ein Startwert (`MIN_ROUNDS_ON_LEVEL`, `MIN_FIRST_TRIES`, `RAISE_AT` in
   `core/progress.js`) und gehört an Luisas Nutzung angepasst.
4. **Themen im Takt des Unterrichts freigeben.** Am Schuljahresanfang stehen
   bewusst nur die Grundlagen offen; Malreihen, Zehnerübergang, Längen und
   Gewichte sind gesperrt.
5. **Fehlende Buchzuordnungen ergänzen**, sobald die Originale vorliegen —
   Format siehe `CLAUDE.md`, Abschnitt 5.
6. **Oskar-Posen zeichnen lassen** (winken, nachdenken, jubeln) und in
   `CHARACTERS.oskar.poses` eintragen.

---

## Testlage

```bash
npm test                        # 215 Modultests
npm run test:browser            # 30 Ende-zu-Ende-Prüfungen in Chromium
node tests/walkthrough-run.js   # jedes Lernziel und jeder Bildschirm
```

Nicht automatisiert geprüft — ausdrücklich als **nicht geprüft** zu behandeln:

- echtes iPhone / Safari
- Installation als PWA auf einem Gerät
- Versionswechsel bei installierter App
- Ausdruck eines Arbeitsblatts auf Papier
- didaktische Eignung der Aufgaben
