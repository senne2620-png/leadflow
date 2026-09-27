document.addEventListener("DOMContentLoaded", function () {

    // =========================
    // INSTELLINGEN
    // =========================

    const AI_URL = "https://leadflow-ai.senne2620.workers.dev/";


    // =========================
    // ELEMENTEN
    // =========================

    const loginScherm = document.getElementById("loginScherm");
    const appInhoud = document.getElementById("appInhoud");
    const loginKnop = document.getElementById("loginKnop");
    const loginFout = document.getElementById("loginFout");
    const uitloggenKnop = document.getElementById("uitloggenKnop");

    const leadFormulier = document.getElementById("leadFormulier");
    const leadLijst = document.getElementById("leadLijst");
    const zoekveld = document.getElementById("zoekveld");

    const analyseKnop = document.getElementById("analyseKnop");
    const analyseStatus = document.getElementById("analyseStatus");


    // =========================
    // LEADS LADEN
    // =========================

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

        if (
            gebruikersnaam === "admin" &&
            wachtwoord === "leadflow"
        ) {
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
    // NIEUWE LEAD + AI
    // =========================

    leadFormulier.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const leadGegevens = {
                naam:
                    document.getElementById("naam").value.trim(),

                email:
                    document.getElementById("email").value.trim(),

                telefoon:
                    document.getElementById("telefoon").value.trim(),

                postcode:
                    document.getElementById("postcode").value.trim(),

                urgentie:
                    document.getElementById("urgentie").value,

                budget:
                    document.getElementById("budget").value,

                project:
                    document.getElementById("project").value,

                bericht:
                    document.getElementById("bericht").value.trim()
            };


            analyseKnop.disabled = true;
            analyseKnop.textContent = "AI analyseert...";

            analyseStatus.textContent =
                "De AI analyseert deze lead...";


            try {

                const response = await fetch(AI_URL, {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(leadGegevens)
                });


                const analyse = await response.json();


                if (!response.ok) {
                    throw new Error(
                        analyse.details ||
                        analyse.error ||
                        "AI-analyse mislukt."
                    );
                }


                if (
                    typeof analyse.score !== "number" ||
                    !["HOT", "WARM", "COLD"].includes(
                        analyse.classificatie
                    )
                ) {
                    throw new Error(
                        "De AI gaf geen geldige analyse terug."
                    );
                }


                const nieuweLead = {

                    id: Date.now(),

                    ...leadGegevens,

                    score: Math.max(
                        0,
                        Math.min(
                            100,
                            Math.round(analyse.score)
                        )
                    ),

                    classificatie:
                        analyse.classificatie,

                    reden:
                        analyse.reden || "",

                    advies:
                        analyse.advies || "",

                    prioriteit:
                        analyse.prioriteit || "",

                    emailOnderwerp:
                        analyse.emailOnderwerp || "",

                    emailBericht:
                        analyse.emailBericht || "",

                    status: "Nieuw"
                };


                leads.push(nieuweLead);

                slaLeadsOp();

                leadFormulier.reset();

                analyseStatus.textContent =
                    "AI-analyse voltooid: " +
                    nieuweLead.classificatie +
                    " (" +
                    nieuweLead.score +
                    "/100)";

                toonLeads();
                updateStatistieken();


            } catch (error) {

                console.error(
                    "LeadFlow AI fout:",
                    error
                );

                analyseStatus.textContent =
                    "AI-analyse mislukt: " +
                    error.message;

            } finally {

                analyseKnop.disabled = false;

                analyseKnop.textContent =
                    "Lead analyseren met AI";
            }
        }
    );


    // =========================
    // OPSLAAN
    // =========================

    function slaLeadsOp() {

        localStorage.setItem(
            "leadflowLeads",
            JSON.stringify(leads)
        );
    }


    // =========================
    // HTML VEILIG TONEN
    // =========================

    function escapeHtml(waarde) {

        return String(waarde || "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


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

                const telefoon =
                    (lead.telefoon || "").toLowerCase();

                const postcode =
                    (lead.postcode || "").toLowerCase();

                const zoekKlopt =
                    naam.includes(zoek) ||
                    email.includes(zoek) ||
                    telefoon.includes(zoek) ||
                    postcode.includes(zoek);

                return filterKlopt && zoekKlopt;
            });


        zichtbareLeads.forEach(function (lead) {

            const kaart =
                document.createElement("div");

            const leadClassificatie =
                ["HOT", "WARM", "COLD"].includes(
                    lead.classificatie
                )
                    ? lead.classificatie
                    : "COLD";

            kaart.className =
                "lead-kaart " +
                leadClassificatie.toLowerCase();


            kaart.innerHTML = `

                <h3>${escapeHtml(lead.naam)}</h3>

                <p>
                    E-mail:
                    ${escapeHtml(lead.email)}
                </p>

                <p>
                    Telefoon:
                    ${escapeHtml(lead.telefoon)}
                </p>

                <p>
                    Postcode:
                    ${escapeHtml(lead.postcode)}
                </p>

                <p>
                    Project:
                    ${escapeHtml(lead.project)}
                </p>

                <p>
                    Urgentie:
                    ${escapeHtml(lead.urgentie)}
                </p>

                <p>
                    Budget:
                    ${escapeHtml(lead.budget)}
                </p>

                ${
                    lead.bericht
                        ? `
                        <p>
                            <strong>Bericht:</strong><br>
                            ${escapeHtml(lead.bericht)}
                        </p>
                        `
                        : ""
                }

                <hr>

                <h4>AI-analyse</h4>

                <p>
                    Score:
                    <strong>
                        ${escapeHtml(lead.score)}/100
                    </strong>
                </p>

                <p>
                    Classificatie:
                    <strong>
                        ${escapeHtml(leadClassificatie)}
                    </strong>
                </p>

                ${
                    lead.prioriteit
                        ? `
                        <p>
                            Prioriteit:
                            <strong>
                                ${escapeHtml(lead.prioriteit)}
                            </strong>
                        </p>
                        `
                        : ""
                }

                ${
                    lead.reden
                        ? `
                        <p>
                            <strong>Waarom:</strong><br>
                            ${escapeHtml(lead.reden)}
                        </p>
                        `
                        : ""
                }

                ${
                    lead.advies
                        ? `
                        <p>
                            <strong>Opvolgadvies:</strong><br>
                            ${escapeHtml(lead.advies)}
                        </p>
                        `
                        : ""
                }

                ${
                    lead.emailBericht
                        ? `
                        <div class="conceptmail">

                            <h4>AI-conceptmail</h4>

                            <p>
                                <strong>Onderwerp:</strong><br>
                                ${escapeHtml(
                                    lead.emailOnderwerp
                                )}
                            </p>

                            <p>
                                ${escapeHtml(
                                    lead.emailBericht
                                )}
                            </p>

                            <button
                                type="button"
                                class="kopieer-mail-knop"
                            >
                                Kopieer conceptmail
                            </button>

                        </div>
                        `
                        : ""
                }

                <br>

                <label>
                    Status:

                    <select class="status-keuze">

                        <option
                            value="Nieuw"
                            ${
                                lead.status === "Nieuw" ||
                                lead.status === "nieuw"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Nieuw
                        </option>

                        <option
                            value="Contact opgenomen"
                            ${
                                lead.status ===
                                "Contact opgenomen"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Contact opgenomen
                        </option>

                        <option
                            value="Afspraak gepland"
                            ${
                                lead.status ===
                                "Afspraak gepland"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Afspraak gepland
                        </option>

                        <option
                            value="Gewonnen"
                            ${
                                lead.status === "Gewonnen"
                                    ? "selected"
                                    : ""
                            }
                        >
                            Gewonnen
                        </option>

                        <option
                            value="Verloren"
                            ${
                                lead.status === "Verloren"
                                    ? "selected"
                                    : ""
                            }
                        >
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

                    slaLeadsOp();
                }
            );


            // =========================
            // CONCEPTMAIL KOPIËREN
            // =========================

            const kopieerKnop =
                kaart.querySelector(
                    ".kopieer-mail-knop"
                );

            if (kopieerKnop) {

                kopieerKnop.addEventListener(
                    "click",
                    async function () {

                        const mailTekst =
                            "Onderwerp: " +
                            (lead.emailOnderwerp || "") +
                            "\n\n" +
                            (lead.emailBericht || "");

                        try {

                            await navigator.clipboard.writeText(
                                mailTekst
                            );

                            const oudeTekst =
                                kopieerKnop.textContent;

                            kopieerKnop.textContent =
                                "Gekopieerd!";

                            setTimeout(function () {
                                kopieerKnop.textContent =
                                    oudeTekst;
                            }, 1500);

                        } catch (error) {

                            console.error(
                                "Kopiëren mislukt:",
                                error
                            );

                            alert(
                                "De conceptmail kon niet worden gekopieerd."
                            );
                        }
                    }
                );
            }


            // =========================
            // VERWIJDEREN
            // =========================

            const verwijderKnop =
                kaart.querySelector(
                    ".verwijder-knop"
                );

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

                    slaLeadsOp();

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
            totaal.textContent = leads.length;
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

                zoekterm = this.value;

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