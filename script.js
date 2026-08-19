document.addEventListener("DOMContentLoaded", function () {

    const loginScherm = document.getElementById("loginScherm");
    const appInhoud = document.getElementById("appInhoud");
    const loginKnop = document.getElementById("loginKnop");
    const loginFout = document.getElementById("loginFout");
    const uitloggenKnop = document.getElementById("uitloggenKnop");

    const leadFormulier = document.getElementById("leadFormulier");
    const leadLijst = document.getElementById("leadLijst");
    const zoekveld = document.getElementById("zoekveld");

    let leads =
        JSON.parse(localStorage.getItem("leadflowLeads")) || [];

    let huidigeFilter = "ALLE";
    let zoekterm = "";


    // =========================
    // LOGIN
    // =========================

    appInhoud.style.display = "none";

    loginKnop.addEventListener("click", function () {

        const gebruikersnaam =
            document.getElementById("gebruikersnaam").value.trim();

        const wachtwoord =
            document.getElementById("wachtwoord").value;

        if (gebruikersnaam === "admin" && wachtwoord === "leadflow") {

            loginScherm.style.display = "none";
            appInhoud.style.display = "block";
            loginFout.textContent = "";

            toonLeads();
            updateStatistieken();

        } else {

            loginFout.textContent =
                "Gebruikersnaam of wachtwoord is niet juist.";
        }

    });


    // =========================
    // UITLOGGEN
    // =========================

    uitloggenKnop.addEventListener("click", function () {

        appInhoud.style.display = "none";
        loginScherm.style.display = "block";

        document.getElementById("gebruikersnaam").value = "";
        document.getElementById("wachtwoord").value = "";

    });


    // =========================
    // SCORE BEREKENEN
    // =========================

    function berekenScore(urgentie, budget, project) {

        let score = 0;

        if (urgentie === "Vandaag") {
            score += 40;
        } else if (urgentie === "Deze week") {
            score += 25;
        } else if (urgentie === "Later") {
            score += 10;
        }

        if (budget === "Hoog") {
            score += 30;
        } else if (budget === "Middel") {
            score += 20;
        } else if (budget === "Laag") {
            score += 10;
        }

        if (project === "Grote installatie") {
            score += 30;
        } else if (project === "Nieuwe installatie") {
            score += 20;
        } else if (project === "Kleine reparatie") {
            score += 10;
        }

        return Math.min(score, 100);
    }


    function classificatie(score) {

        if (score >= 70) {
            return "HOT";
        }

        if (score >= 40) {
            return "WARM";
        }

        return "COLD";
    }


    // =========================
    // NIEUWE LEAD
    // =========================

    leadFormulier.addEventListener("submit", function (event) {

        event.preventDefault();

        const urgentie =
            document.getElementById("urgentie").value;

        const budget =
            document.getElementById("budget").value;

        const project =
            document.getElementById("project").value;

        const score =
            berekenScore(
                urgentie,
                budget,
                project
            );

        const nieuweLead = {

            id: Date.now(),

            naam:
                document.getElementById("naam").value,

            email:
                document.getElementById("email").value,

            telefoon:
                document.getElementById("telefoon").value,

            postcode:
                document.getElementById("postcode").value,

            urgentie: urgentie,

            budget: budget,

            project: project,

            score: score,

            classificatie:
                classificatie(score),

            status: "Nieuw"
        };


        leads.push(nieuweLead);


        localStorage.setItem(
            "leadflowLeads",
            JSON.stringify(leads)
        );


        leadFormulier.reset();

        toonLeads();
        updateStatistieken();

    });


    // =========================
    // LEADS TONEN
    // =========================

    function toonLeads() {

        leadLijst.innerHTML = "";


        const zichtbareLeads =
            leads.filter(function (lead) {

                const filterKlopt =
                    huidigeFilter === "ALLE" ||
                    lead.classificatie === huidigeFilter;


                const zoek =
                    zoekterm.toLowerCase();


                const naam =
                    (lead.naam || "").toLowerCase();

                const email =
                    (lead.email || "").toLowerCase();

                const postcode =
                    (lead.postcode || "").toLowerCase();


                const zoekKlopt =
                    naam.includes(zoek) ||
                    email.includes(zoek) ||
                    postcode.includes(zoek);


                return filterKlopt && zoekKlopt;

            });


        zichtbareLeads.forEach(function (lead) {

            const kaart =
                document.createElement("div");


            kaart.className =
                "lead-kaart " +
                lead.classificatie.toLowerCase();


            kaart.innerHTML = `

                <h3>${lead.naam}</h3>

                <p>
                    E-mail:
                    ${lead.email}
                </p>

                <p>
                    Telefoon:
                    ${lead.telefoon}
                </p>

                <p>
                    Postcode:
                    ${lead.postcode}
                </p>

                <p>
                    Score:
                    <strong>${lead.score}/100</strong>
                </p>

                <p>
                    Classificatie:
                    <strong>${lead.classificatie}</strong>
                </p>


                <label>
                    Status:

                    <select class="status-keuze">

                        <option value="Nieuw"
                            ${lead.status === "Nieuw" ? "selected" : ""}>
                            Nieuw
                        </option>

                        <option value="Contact opgenomen"
                            ${lead.status === "Contact opgenomen" ? "selected" : ""}>
                            Contact opgenomen
                        </option>

                        <option value="Afspraak gepland"
                            ${lead.status === "Afspraak gepland" ? "selected" : ""}>
                            Afspraak gepland
                        </option>

                        <option value="Gewonnen"
                            ${lead.status === "Gewonnen" ? "selected" : ""}>
                            Gewonnen
                        </option>

                        <option value="Verloren"
                            ${lead.status === "Verloren" ? "selected" : ""}>
                            Verloren
                        </option>

                    </select>

                </label>

                <br><br>

                <button class="verwijder-knop">
                    Verwijder lead
                </button>

            `;


            // =========================
            // STATUS OPSLAAN
            // =========================

            const statusKeuze =
                kaart.querySelector(".status-keuze");


            statusKeuze.addEventListener(
                "change",
                function () {

                    lead.status = this.value;

                    localStorage.setItem(
                        "leadflowLeads",
                        JSON.stringify(leads)
                    );

                }
            );


            // =========================
            // VERWIJDEREN
            // =========================

            const verwijderKnop =
                kaart.querySelector(".verwijder-knop");


            verwijderKnop.addEventListener(
                "click",
                function () {

                    const bevestiging =
                        confirm(
                            "Weet je zeker dat je deze lead wilt verwijderen?"
                        );


                    if (!bevestiging) {
                        return;
                    }


                    leads =
                        leads.filter(function (item) {

                            return item.id !== lead.id;

                        });


                    localStorage.setItem(
                        "leadflowLeads",
                        JSON.stringify(leads)
                    );


                    toonLeads();
                    updateStatistieken();

                }
            );


            leadLijst.appendChild(kaart);

        });

    }


    // =========================
    // STATISTIEKEN
    // =========================

    function updateStatistieken() {

        const totaal =
            document.getElementById("totaalLeads");

        const hot =
            document.getElementById("hotLeads");

        const warm =
            document.getElementById("warmLeads");

        const cold =
            document.getElementById("coldLeads");


        if (totaal) {

            totaal.textContent =
                leads.length;

        }


        if (hot) {

            hot.textContent =
                leads.filter(function (lead) {

                    return lead.classificatie === "HOT";

                }).length;

        }


        if (warm) {

            warm.textContent =
                leads.filter(function (lead) {

                    return lead.classificatie === "WARM";

                }).length;

        }


        if (cold) {

            cold.textContent =
                leads.filter(function (lead) {

                    return lead.classificatie === "COLD";

                }).length;

        }

    }


    // =========================
    // FILTERS
    // =========================

    document
        .querySelectorAll("[data-filter]")
        .forEach(function (knop) {

            knop.addEventListener(
                "click",
                function () {

                    huidigeFilter =
                        this.dataset.filter;

                    toonLeads();

                }
            );

        });


    // =========================
    // ZOEKEN
    // =========================

    if (zoekveld) {

        zoekveld.addEventListener(
            "input",
            function () {

                zoekterm =
                    this.value;

                toonLeads();

            }
        );

    }


    // =========================
    // START
    // =========================

    toonLeads();
    updateStatistieken();

});