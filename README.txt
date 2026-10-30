FAMILIENKONTO – PWA PROTOTYP V0.1

Diese Version läuft auf iPhone und Windows im Browser. Sie ist ein lokaler Prototyp und verbindet sich NICHT mit der Sparkasse.

INSTALLATION AUF DEM IPHONE
1. Den gesamten Ordner auf einen HTTPS-Webhost hochladen (z. B. GitHub Pages).
2. Die veröffentlichte HTTPS-Adresse auf dem iPhone in Safari öffnen.
3. Teilen-Symbol antippen > „Zum Home-Bildschirm“ > Hinzufügen.
4. Danach über das neue Symbol starten.

WICHTIG: Eine PWA benötigt HTTPS für die Installations- und Offline-Funktionen. Das ZIP allein lässt sich nicht wie eine native iPhone-App installieren.

FUNKTIONEN
- Zwei manuell gepflegte Girokonten
- Gesamtkontostand
- Fixkosten hinzufügen und löschen
- Fixkosten einem der beiden Konten zuordnen
- Abbuchungen als bezahlt/offen markieren
- Sicherheitsreserve einstellen
- Frei verfügbar = Kontostände zusammen - offene Fixkosten - Reserve
- Daten bleiben lokal im Browser auf dem jeweiligen Gerät

GRENZEN DER V0.1
- Noch keine automatische Sparkassen-Anbindung
- Keine Synchronisierung zwischen dir und deiner Frau
- Markierungen „bezahlt“ müssen jeden Monat manuell zurückgesetzt werden
- Keine Erkennung von Abbuchungen aus Bankumsätzen
- Keine echte Prognose künftiger Einnahmen

BANKVERBINDUNG
Für die spätere automatische Verbindung brauchen wir einen geeigneten PSD2/Open-Banking-Anbieter, ein sicheres Backend und die Freigabe beider Kontoinhaber. Niemals Sparkassen-PIN oder TAN in diese Demo eingeben.

BEARBEITEN
Die Dateien index.html, style.css und app.js können auf Windows mit Visual Studio Code bearbeitet werden. Danach den Ordner erneut auf den Webhost hochladen.
