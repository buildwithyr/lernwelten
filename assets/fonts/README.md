# Schriften

Beide Schriften liegen lokal im Projekt. Die App lädt keine externen Schriften
und stellt damit auch offline keine Verbindung nach außen her.

| Schrift | Verwendung | Lizenz |
|---|---|---|
| **Baloo 2** | Überschriften, Zahlen | SIL Open Font License 1.1 — `OFL-Baloo2.txt` |
| **Atkinson Hyperlegible** | Fließtext, Eingaben | SIL Open Font License 1.1 — `OFL-AtkinsonHyperlegible.txt` |

Atkinson Hyperlegible wurde vom Braille Institute of America für besonders gute
Unterscheidbarkeit ähnlicher Buchstaben entworfen — passend für Leseanfängerinnen.

Enthalten sind nur die Teilmengen `latin` und `latin-ext` im Format WOFF2.
Baloo 2 ist eine variable Schrift (Gewichtsachse 400–800) und wird deshalb mit
einer einzigen Datei je Teilmenge eingebunden.

Die Dateien stammen aus dem Google-Fonts-Repository
(https://github.com/google/fonts) und wurden unverändert übernommen.
Erzeugt mit den `@font-face`-Angaben aus `css/fonts.css`.
