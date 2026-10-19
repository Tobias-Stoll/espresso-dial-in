# Espresso Dial-In Companion (MVP)

Leichte App, die Home-Baristas in wenigen Shots zu einem trinkbaren Espresso führt.
Eine Anweisung pro Shot, z. B. **"Mahle 2 Klicks feiner"**.

- **Plattform:** Android zuerst (Pixel 10 Pro als Testgerät), iOS später
- **Stack:** Expo SDK 58, React Native, TypeScript (strict), Material Design 3 (React Native Paper, folgt)
- **Daten:** Offline, lokal (SQLite, folgt)
- **Team:** Tobias (Product Design), Claude (Development)

## Status

| Baustein | Stand |
| :--- | :--- |
| Calibration Engine v2 | ✅ fertig, 29 Tests |
| Datenbank (SQLite) | offen |
| Screens (Material Design 3) | offen |
| OCR Etikett-Scan | offen |
| Paywall (eingebaut, inaktiv) | offen |
| Android APK | offen |

## Engine-Regeln v2 (freigegeben 19.10.2026)

1. **Geschmack gewinnt:** "Ausgewogen" speichert immer das Rezept. Lag die Zeit klar daneben, gibt es einen optionalen Tipp zum Ausprobieren.
2. **Sauer/bitter + Zeit klar daneben → Mühle:** zu schnell = feiner, zu langsam = gröber.
3. **Sauer/bitter + Zeit passt → Menge:** sauer +4 g, bitter minus 4 g.

| Parameter | Wert |
| :--- | :--- |
| Zeitfenster Dunkel / Medium / Hell | 24 bis 27 s / 25 bis 29 s / 27 bis 31 s |
| Puffer, bevor die Mühle geändert wird | 2 s außerhalb des Fensters |
| Ratio-Grenzen für die Menge | 1:1,5 bis 1:3 (am Limit greift die Mühle) |
| Schrittweite Klicks / Stufenlos / Stufen | 2 / 0,5 Markierung / 1 |
| Hinweis "Weitere Hilfe" | ab Shot 3 ohne Ergebnis (Platzhalter) |

Pro Shot ändert sich immer nur **eine** Variable. Die Mühle wird nur **relativ** verstellt, mit der Feiner-Richtung aus dem Onboarding.

## Struktur

```
src/engine/
  types.ts         Domain-Typen
  constants.ts     Alle Stellschrauben an einem Ort
  recipe.ts        Startrezept je Röstgrad
  grinder.ts       Übersetzung feiner/gröber auf die echte Mühle
  evaluateShot.ts  Entscheidungslogik
  copy.ts          Deutsche UI-Texte (vom Design anpassbar)
```

## Befehle

```bash
npm install
npm test           # Engine-Tests
npm run typecheck  # TypeScript prüfen
```
