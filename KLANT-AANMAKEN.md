# Een nieuwe klant aanmaken (Noord Installatie LeadFlow)

Gebruik deze handleiding voor elke nieuwe klant. Je werkt in de Firebase Console, project **leadflow-47ab3**. Je hoeft niets aan de code te veranderen.

Een klant bestaat uit drie dingen die bij elkaar horen:

1. een **bedrijf** (collectie `bedrijven`)
2. een **account** (Authentication)
3. een **koppeling** tussen account en bedrijf (collectie `gebruikers`)

Zonder koppeling ziet een account geen leads en kan het geen AI-analyse draaien. Dat is bedoeld.

---

## Stap 1: het bedrijf aanmaken

1. Ga naar **Firestore Database** > **Data**.
2. Klik in de eerste kolom op de bestaande collectie **bedrijven**.
3. Klik in de middelste kolom op **Add document**.
4. **Document ID**: een korte naam in kleine letters met koppeltekens, zonder spaties.
   Voorbeeld: `loodgieter-jansen`
5. Maak één veld: naam `naam`, type `string`, waarde de echte bedrijfsnaam.
6. Klik op **Save**.

Onthoud het Document ID. Dat is straks het `bedrijfId`.

## Stap 2: het account aanmaken

1. Ga naar **Authentication** > **Users** > **Add user**.
2. Vul het e-mailadres van de klant in en kies een wachtwoord.
3. Klik op **Add user**.
4. Geef het wachtwoord veilig door aan de klant (niet via een openbaar kanaal).

## Stap 3: de uid kopiëren

1. Zoek in **Authentication** > **Users** de rij van het nieuwe account.
2. Klik bij **User UID** op het kopieer-icoon.
3. **Kopieer en plak** de uid. Typ hem nooit over: een hoofdletter **I** en een kleine letter **l** zien er hetzelfde uit.

## Stap 4: het account aan het bedrijf koppelen

1. Ga naar **Firestore Database** > **Data**.
2. Klik in de eerste kolom op de bestaande collectie **gebruikers**.
3. Klik in de middelste kolom op **Add document**.
4. **Document ID**: plak de uid uit stap 3.
5. Maak één veld: naam `bedrijfId`, type `string`, waarde het Document ID uit stap 1 (bijvoorbeeld `loodgieter-jansen`). Het moet exact gelijk zijn.
6. Klik op **Save**.

## Stap 5: controleren

1. Controleer de uid: plak het Document ID uit stap 4 in het zoekveld van **Authentication** > **Users**. Verschijnt de rij met het juiste e-mailadres, dan klopt de uid.
2. Log in op de app met het nieuwe account (eerst uitloggen, daarna `Ctrl + F5`).
3. Je moet **0 leads** zien en **geen** melding "Je account is nog niet aan een bedrijf gekoppeld."
4. Voeg een testlead toe. Kijk in Firestore of die lead `bedrijfId` met de juiste waarde heeft.
5. Verwijder de testlead weer met **Verwijder lead**.

---

## Let op

- Gebruik nooit het `bedrijfId` van een ander bedrijf, tenzij de medewerker echt bij dat bedrijf hoort.
- Meerdere medewerkers van één bedrijf: maak voor elk een eigen account en eigen document in `gebruikers`, met hetzelfde `bedrijfId`.
- Verwijder nooit het document in `gebruikers` van je eigen account. Daarna ziet je eigen account geen leads meer.
- Klik nooit op de drie puntjes naast de naam van een collectie (`bedrijven`, `gebruikers`, `leads`). Daar kun je de hele collectie wissen.
- De Firestore-rules en de AI-worker hoef je niet aan te passen voor een nieuwe klant.

## Een klant opruimen

1. Verwijder het document in `gebruikers` met de uid van het account.
2. Verwijder het account in **Authentication** > **Users**.
3. De leads en het bedrijf blijven staan. Verwijder die alleen als je zeker weet dat ze weg mogen.

## Accounts aanmaken en wachtwoorden

- **Sign-up staat uit.** In Firebase (Authentication > Settings > User actions) staat "Enable create (sign-up)" uit. Niemand kan zelf een account aanmaken. Jij maakt accounts aan in de Firebase Console (stap 2 hierboven). Dat blijft werken.
- **Wachtwoord vergeten.** Een klant kan op het inlogscherm op "Wachtwoord vergeten?" klikken. Hij vult zijn e-mailadres in en krijgt van Firebase een Nederlandse mail met een link om een nieuw wachtwoord te kiezen. Kijk ook in de spam.
- Het scherm toont altijd dezelfde melding, ook als het adres niet bij een account hoort. Zo kan niemand uitzoeken welke e-mailadressen een account hebben.
- Plak herstelmails nooit in een chat of document. De link in de mail geeft toegang tot het account.