# Tic Tac Toe 9x9 mit Supabase Multiplayer

Das Spiel läuft weiterhin ohne Backend im lokalen Zwei-Spieler- oder Computer-Modus. Für den Remote-Modus werden anonyme Supabase-Accounts, Postgres als autoritative Spielinstanz und Supabase Realtime verwendet. Der Ersteller spielt **X**, der beitretende Spieler **O**.

## Supabase einmalig einrichten

1. Auf [supabase.com](https://supabase.com) ein Projekt erstellen.
2. Im Dashboard unter **Authentication → Providers → Anonymous Sign-Ins** anonyme Anmeldungen aktivieren. Für eine öffentliche Installation sollten außerdem CAPTCHA und die von Supabase empfohlenen Rate Limits aktiviert werden.
3. Im **SQL Editor** den kompletten Inhalt aus `supabase/migrations/20260915000000_remote_multiplayer.sql` ausführen. Wer die Supabase CLI verwendet, kann stattdessen im Projektordner `supabase link` und danach `supabase db push` ausführen.
4. Unter **Project Settings → API** die **Project URL** und den öffentlichen **anon/publishable key** kopieren. Niemals den `service_role`- oder Secret-Key in diese Web-App eintragen.
5. `supabase-config.example.js` als `supabase-config.js` kopieren und beide Werte einsetzen:

   ```js
   window.SUPABASE_CONFIG = {
       url: "https://abcdefgh.supabase.co",
       anonKey: "dein-oeffentlicher-anon-key"
   };
   ```

6. Die Dateien über einen Webserver ausliefern (nicht direkt als `file://` öffnen), beispielsweise mit `python3 -m http.server 8080`, und dieselbe veröffentlichte Anwendung in zwei Browsern öffnen.

`supabase-config.js` ist absichtlich in `.gitignore`: Der anon Key darf zwar in einem Browser verwendet werden, projektspezifische Konfiguration soll aber nicht versehentlich eingecheckt werden. Beim Hosting muss die Datei zusätzlich zu den versionierten Dateien bereitgestellt werden.

## Spielen

1. Optional vor dem Erstellen **Nur 3x3 spielen?** auswählen.
2. **Online-Spiel erstellen** drücken und den angezeigten sechsstelligen Code teilen.
3. Der zweite Spieler gibt den Code ein und drückt **Beitreten**.
4. Beide Browser erhalten Züge und Spielstatus automatisch über Realtime. Bei einem kurzzeitigen Reconnect werden die gespeicherten Züge erneut aus Postgres geladen, wenn die Seite mit dem Spiel neu betreten wird.

## Sicherheitsmodell

- Row Level Security erlaubt ausschließlich den beiden Spielteilnehmern, ein Spiel und dessen Züge zu lesen.
- Browser dürfen Tabellen nicht direkt beschreiben. Die `security definer`-RPCs erstellen Spiele, nehmen den zweiten Spieler auf und validieren jeden Zug atomar unter einer Datenbanksperre.
- Die Datenbank prüft Identität, Zugreihenfolge, Zielbrett, bereits belegte Zellen und Gewinner. Dadurch kann ein manipulierter Browser keinen regelwidrigen Zug direkt speichern.
- Der kurze Code dient zum Einladen und ist kein langfristiges Geheimnis. Für öffentliche Communities empfiehlt sich später ein Login mit E-Mail/OAuth sowie eine Aufräumroutine für alte Spiele.

## Lokale Entwicklung

Ohne `supabase-config.js` bleiben lokales Spiel und KI vollständig verwendbar; der Online-Bereich zeigt lediglich an, dass Supabase noch nicht konfiguriert ist.
