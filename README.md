# Noord Installatie LeadFlow

Een webapplicatie waarmee installatiebedrijven inkomende offerte-aanvragen (leads) opslaan, automatisch laten beoordelen door AI, opvolgen in een pipeline en exporteren.

Live: https://senne2620-png.github.io/leadflow/

## Wat een installatiebedrijf eraan heeft

- **Geen aanvraag meer die blijft liggen.** Elke aanvraag staat op één plek, met een opvolgdatum. Aanvragen waarvan de opvolging te laat is, staan apart bovenaan met het aantal dagen dat ze te laat zijn.
- **Weten wie je als eerste belt.** De AI geeft elke aanvraag een score en een classificatie (HOT, WARM of COLD), met een korte reden en een advies. Zo begin je met de klanten met de meeste kans op een opdracht.
- **Sneller reageren.** Bij elke aanvraag staat een conceptmail klaar die je kopieert en aanpast.
- **Overzicht van de hele aanpak.** In de pipeline zie je in één oogopslag hoeveel aanvragen nieuw zijn, hoeveel afspraken er staan en hoeveel je hebt gewonnen of verloren.
- **Gegevens bij de hand.** Je kunt aanvragen zoeken, filteren en exporteren naar Excel.
- **Veilig voor meerdere bedrijven.** Elk bedrijf ziet alleen zijn eigen aanvragen.

## Wat het doet

- **Leads opslaan en bewerken:** naam, e-mail, telefoon, postcode, project, urgentie, budget, bericht en opvolgdatum.
- **AI-beoordeling:** elke nieuwe lead krijgt een score, een classificatie (HOT, WARM of COLD), een advies en een conceptmail.
- **Pipeline:** leads sleep je tussen de kolommen Nieuw, Contact opgenomen, Afspraak gepland, Gewonnen en Verloren.
- **Opvolging:** een overzicht van leads die vandaag worden opgevolgd en van leads waarvan de opvolging te laat is.
- **Zoeken en filteren** op naam, e-mail, telefoon en postcode, en op HOT, WARM en COLD.
- **Exporteren** van alle leads naar een CSV-bestand dat in Excel opent.
- **Meerdere bedrijven:** elk bedrijf ziet alleen zijn eigen leads.
- **Wachtwoord vergeten:** klanten herstellen zelf hun wachtwoord via een e-mail.

## Hoe het werkt

- **Frontend:** HTML, CSS en JavaScript, gehost op GitHub Pages.
- **Inloggen en database:** Firebase Authentication en Cloud Firestore.
- **AI:** een Cloudflare Worker met Workers AI. De worker controleert het Firebase-token en of het account aan een bedrijf is gekoppeld.
- **Beveiliging:** de Firestore-regels laten een gebruiker alleen leads van het eigen bedrijf lezen en wijzigen.

## Een nieuwe klant aanmaken

Zie [KLANT-AANMAKEN.md](KLANT-AANMAKEN.md).

## Lokaal werken

De map is `C:\Users\senne\Documents\leadflow`. Wijzigingen worden met Git naar GitHub gestuurd, en GitHub Pages zet ze online.