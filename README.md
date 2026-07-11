# Tabu Online 2.1

## Funktionen

- 2 bis 4 Spieler
- automatische Erklärer-Reihenfolge
- automatische, gemischte Kategorien ohne Wiederholung bis zum Durchlauf
- Karten je Kategorie gemischt; erst nach vollständigem Stapel erneut gemischt
- alle sehen Kategorie und Erklärer
- nur der aktuelle Erklärer sieht Begriff und Tabu-Wörter
- Punkte für Team Rot und Team Blau
- Firebase-Echtzeitsynchronisierung
- kein Timer

## Dateien

- `index.html`
- `style.css`
- `firebase.js`
- `players.js`
- `deck.js`
- `game.js`
- `cards.js`

## Veröffentlichung

Alle Dateien in das Stammverzeichnis deines GitHub-Repositories hochladen und committen.
Danach GitHub Pages aus `main` und `/ (root)` veröffentlichen.

## Wichtig

Die Karte wird in der Oberfläche nur beim Erklärer angezeigt. Da `cards.js` bei einer
statischen GitHub-Pages-Seite öffentlich ausgeliefert wird, ist dies kein kryptografischer
Schutz vor technisch versierten Spielern, die absichtlich den Quellcode untersuchen.
