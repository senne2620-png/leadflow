// =========================
// FIREBASE
// =========================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "AIzaSyA9CMAh0JDZFh0pIbQP_5oX4ZzbR8IwNl0",
    authDomain: "leadflow-47ab3.firebaseapp.com",
    projectId: "leadflow-47ab3",
    storageBucket: "leadflow-47ab3.firebasestorage.app",
    messagingSenderId: "169270287112",
    appId: "1:169270287112:web:662da5bb112acd449eeabd"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


// =========================
// START APP
// =========================

document.addEventListener("DOMContentLoaded", function () {

    const AI_URL =
        "https://leadflow-ai.senne2620.workers.dev/";


    // =========================
    // ELEMENTEN
    // =========================

    const loginScherm =
        document.getElementById("loginScherm");

    const appInhoud =
        document.getElementById("appInhoud");

    const loginKnop =
        document.getElementById("loginKnop");

    const loginFout =
        document.getElementById("loginFout");

    const uitloggenKnop =
        document.getElementById("uitloggenKnop");

    const leadFormulier =
        document.getElementById("leadFormulier");

    const leadLijst =
        document.getElementById("leadLijst");

    const zoekveld =
        document.getElementById("zoekveld");

    const analyseKnop =
        document.getElementById("analyseKnop");

    const analyseStatus =
        document.getElementById("analyseStatus");


    let leads = [];

    let huidigeFilter = "ALLE";

    let zoekterm = "";


    // =========================
    // FIRESTORE LEADS LADEN
    // =========================

    async function laadLeadsUitFirestore() {

        try {

            const snapshot =
                await getDocs(
                    collection(db, "leads")
                );

            leads = [];

            snapshot.forEach(function (documentSnapshot) {

                leads.push({
                    id: documentSnapshot.id,
                    ...documentSnapshot.data()
                });

            });

            toonLeads();

            updateStatistieken();

        } catch (error) {

            console.error(
                "Leads laden mislukt:",
                error
            );

            analyseStatus.textContent =
                "Leads konden niet uit Firestore worden geladen.";
        }
    }


    // =========================
    // FIREBASE LOGIN
    // =========================

    appInhoud.style.display = "none";


    loginKnop.addEventListener(
        "click",
        async function () {

            const email =
                document
                    .getElementById("gebruikersnaam")
                    .value
                    .trim();

            const wachtwoord =
                document
                    .getElementById("wachtwoord")
                    .value;

            loginFout.textContent = "";

            loginKnop.disabled = true;

            loginKnop.textContent =
                "Inloggen...";


            try {

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    wachtwoord
                );

            } catch (error) {

                console.error(
                    "Inloggen mislukt:",
                    error
                );

                loginFout.textContent =
                    "E-mailadres of wachtwoord is niet juist.";

            } finally {

                loginKnop.disabled = false;

                loginKnop.textContent =
                    "Inloggen";
            }
        }
    );


    // =========================
    // UITLOGGEN
    // =========================

    uitloggenKnop.addEventListener(
        "click",
        async function () {

            try {

                await signOut(auth);

            } catch (error) {

                console.error(
                    "Uitloggen mislukt:",
                    error
                );
            }
        }
    );


    // =========================
    // LOGINSTATUS
    // =========================

    onAuthStateChanged(
        auth,
        async function (gebruiker) {

            if (gebruiker) {

                loginScherm.style.display =
                    "none";

                appInhoud.style.display =
                    "block";

                loginFout.textContent = "";

                await laadLeadsUitFirestore();

            } else {

                leads = [];

                toonLeads();

                updateStatistieken();

                appInhoud.style.display =
                    "none";

                loginScherm.style.display =
                    "block";

                document
                    .getElementById("wachtwoord")
                    .value = "";
            }
        }
    );


    // =========================
    // NIEUWE LEAD + AI
    // =========================

    leadFormulier.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const leadGegevens = {

                naam:
                    document
                        .getElementById("naam")
                        .value
                        .trim(),

                email:
                    document
                        .getElementById("email")
                        .value
                        .trim(),

                telefoon:
                    document
                        .getElementById("telefoon")
                        .value
                        .trim(),

                postcode:
                    document
                        .getElementById("postcode")
                        .value
                        .trim(),

                urgentie:
                    document
                        .getElementById("urgentie")
                        .value,

                budget:
                    document
                        .getElementById("budget")
                        .value,

                project:
                    document
                        .getElementById("project")
                        .value,

                bericht:
                    document
                        .getElementById("bericht")
                        .value
                        .trim()
            };


            analyseKnop.disabled = true;

            analyseKnop.textContent =
                "AI analyseert...";

            analyseStatus.textContent =
                "De AI analyseert deze lead...";


            try {

                // =========================
                // FIREBASE TOKEN
                // =========================

                const gebruiker =
                    auth.currentUser;


                if (!gebruiker) {

                    throw new Error(
                        "Je bent niet ingelogd."
                    );
                }


                const idToken =
                    await gebruiker.getIdToken();


                // =========================
                // AI AANROEP
                // =========================

                const response =
                    await fetch(
                        AI_URL,
                        {
                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${idToken}`
                            },

                            body:
                                JSON.stringify(
                                    leadGegevens
                                )
                        }
                    );


                const analyse =
                    await response.json();


                if (!response.ok) {

                    throw new Error(

                        analyse.details ||

                        analyse.error ||

                        "AI-analyse mislukt."
                    );
                }


                // =========================
                // AI ANTWOORD CONTROLEREN
                // =========================

                if (
                    typeof analyse.score !== "number" ||

                    ![
                        "HOT",
                        "WARM",
                        "COLD"
                    ].includes(
                        analyse.classificatie
                    )
                ) {

                    throw new Error(
                        "De AI gaf geen geldige analyse terug."
                    );
                }


                // =========================
                // NIEUWE LEAD MAKEN
                // =========================

                const nieuweLead = {

                    ...leadGegevens,

                    score:
                        Math.max(
                            0,
                            Math.min(
                                100,
                                Math.round(
                                    analyse.score
                                )
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


                // =========================
                // OPSLAAN IN FIRESTORE
                // =========================

                const documentReferentie =
                    await addDoc(
                        collection(db, "leads"),
                        nieuweLead
                    );


                nieuweLead.id =
                    documentReferentie.id;


                leads.push(
                    nieuweLead
                );


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
                    "LeadFlow fout:",
                    error
                );


                analyseStatus.textContent =
                    "AI-analyse mislukt: " +
                    error.message;


            } finally {

                analyseKnop.disabled =
                    false;

                analyseKnop.textContent =
                    "Lead analyseren met AI";
            }
        }
    );


    // =========================
    // HTML VEILIG TONEN
    // =========================

    function escapeHtml(waarde) {

        return String(
            waarde || ""
        )
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
            leads.filter(
                function (lead) {

                    const filterKlopt =

                        huidigeFilter === "ALLE" ||

                        lead.classificatie ===
                            huidigeFilter;


                    const zoek =
                        zoekterm.toLowerCase();


                    const naam =
                        (
                            lead.naam || ""
                        ).toLowerCase();


                    const email =
                        (
                            lead.email || ""
                        ).toLowerCase();


                    const telefoon =
                        (
                            lead.telefoon || ""
                        ).toLowerCase();


                    const postcode =
                        (
                            lead.postcode || ""
                        ).toLowerCase();


                    const zoekKlopt =

                        naam.includes(zoek) ||

                        email.includes(zoek) ||

                        telefoon.includes(zoek) ||

                        postcode.includes(zoek);


                    return (
                        filterKlopt &&
                        zoekKlopt
                    );
                }
            );


        zichtbareLeads.forEach(
            function (lead) {

                const kaart =
                    document.createElement(
                        "div"
                    );


                const leadClassificatie =

                    [
                        "HOT",
                        "WARM",
                        "COLD"
                    ].includes(
                        lead.classificatie
                    )

                        ? lead.classificatie

                        : "COLD";


                kaart.className =

                    "lead-kaart " +

                    leadClassificatie
                        .toLowerCase();


                kaart.innerHTML = `

                    <h3>
                        ${escapeHtml(
                            lead.naam
                        )}
                    </h3>

                    <p>
                        E-mail:
                        ${escapeHtml(
                            lead.email
                        )}
                    </p>

                    <p>
                        Telefoon:
                        ${escapeHtml(
                            lead.telefoon
                        )}
                    </p>

                    <p>
                        Postcode:
                        ${escapeHtml(
                            lead.postcode
                        )}
                    </p>

                    <p>
                        Project:
                        ${escapeHtml(
                            lead.project
                        )}
                    </p>

                    <p>
                        Urgentie:
                        ${escapeHtml(
                            lead.urgentie
                        )}
                    </p>

                    <p>
                        Budget:
                        ${escapeHtml(
                            lead.budget
                        )}
                    </p>


                    ${
                        lead.bericht

                            ? `
                                <p>
                                    <strong>
                                        Bericht:
                                    </strong>

                                    <br>

                                    ${escapeHtml(
                                        lead.bericht
                                    )}
                                </p>
                            `

                            : ""
                    }


                    <hr>


                    <h4>
                        AI-analyse
                    </h4>


                    <p>
                        Score:

                        <strong>
                            ${escapeHtml(
                                lead.score
                            )}/100
                        </strong>
                    </p>


                    <p>
                        Classificatie:

                        <strong>
                            ${escapeHtml(
                                leadClassificatie
                            )}
                        </strong>
                    </p>


                    ${
                        lead.prioriteit

                            ? `
                                <p>
                                    Prioriteit:

                                    <strong>
                                        ${escapeHtml(
                                            lead.prioriteit
                                        )}
                                    </strong>
                                </p>
                            `

                            : ""
                    }


                    ${
                        lead.reden

                            ? `
                                <p>
                                    <strong>
                                        Waarom:
                                    </strong>

                                    <br>

                                    ${escapeHtml(
                                        lead.reden
                                    )}
                                </p>
                            `

                            : ""
                    }


                    ${
                        lead.advies

                            ? `
                                <p>
                                    <strong>
                                        Opvolgadvies:
                                    </strong>

                                    <br>

                                    ${escapeHtml(
                                        lead.advies
                                    )}
                                </p>
                            `

                            : ""
                    }


                    ${
                        lead.emailBericht

                            ? `
                                <div class="conceptmail">

                                    <h4>
                                        AI-conceptmail
                                    </h4>

                                    <p>
                                        <strong>
                                            Onderwerp:
                                        </strong>

                                        <br>

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

                        <select
                            class="status-keuze"
                        >

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
                                    lead.status ===
                                        "Gewonnen"

                                        ? "selected"

                                        : ""
                                }
                            >
                                Gewonnen
                            </option>


                            <option
                                value="Verloren"
                                ${
                                    lead.status ===
                                        "Verloren"

                                        ? "selected"

                                        : ""
                                }
                            >
                                Verloren
                            </option>

                        </select>

                    </label>


                    <br><br>


                    <button
                        class="verwijder-knop"
                    >
                        Verwijder lead
                    </button>
                `;


                // =========================
                // STATUS IN FIRESTORE
                // =========================

                const statusKeuze =
                    kaart.querySelector(
                        ".status-keuze"
                    );


                statusKeuze.addEventListener(
                    "change",
                    async function () {

                        const oudeStatus =
                            lead.status;

                        const nieuweStatus =
                            this.value;


                        try {

                            await updateDoc(
                                doc(
                                    db,
                                    "leads",
                                    lead.id
                                ),
                                {
                                    status:
                                        nieuweStatus
                                }
                            );


                            lead.status =
                                nieuweStatus;


                        } catch (error) {

                            console.error(
                                "Status opslaan mislukt:",
                                error
                            );


                            lead.status =
                                oudeStatus;


                            this.value =
                                oudeStatus || "Nieuw";


                            alert(
                                "De status kon niet worden opgeslagen."
                            );
                        }
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

                                (
                                    lead.emailOnderwerp ||
                                    ""
                                ) +

                                "\n\n" +

                                (
                                    lead.emailBericht ||
                                    ""
                                );


                            try {

                                await navigator
                                    .clipboard
                                    .writeText(
                                        mailTekst
                                    );


                                const oudeTekst =
                                    kopieerKnop
                                        .textContent;


                                kopieerKnop.textContent =
                                    "Gekopieerd!";


                                setTimeout(
                                    function () {

                                        kopieerKnop
                                            .textContent =
                                            oudeTekst;

                                    },
                                    1500
                                );


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
                // VERWIJDEREN UIT FIRESTORE
                // =========================

                const verwijderKnop =
                    kaart.querySelector(
                        ".verwijder-knop"
                    );


                verwijderKnop.addEventListener(
                    "click",
                    async function () {

                        const bevestiging =
                            confirm(
                                "Weet je zeker dat je deze lead wilt verwijderen?"
                            );


                        if (!bevestiging) {

                            return;
                        }


                        try {

                            await deleteDoc(
                                doc(
                                    db,
                                    "leads",
                                    lead.id
                                )
                            );


                            leads =
                                leads.filter(
                                    function (item) {

                                        return (
                                            item.id !==
                                            lead.id
                                        );
                                    }
                                );


                            toonLeads();

                            updateStatistieken();


                        } catch (error) {

                            console.error(
                                "Lead verwijderen mislukt:",
                                error
                            );


                            alert(
                                "De lead kon niet worden verwijderd."
                            );
                        }
                    }
                );


                leadLijst.appendChild(
                    kaart
                );
            }
        );
    }


    // =========================
    // STATISTIEKEN
    // =========================

    function updateStatistieken() {

        const totaal =
            document.getElementById(
                "totaalLeads"
            );

        const hot =
            document.getElementById(
                "hotLeads"
            );

        const warm =
            document.getElementById(
                "warmLeads"
            );

        const cold =
            document.getElementById(
                "coldLeads"
            );


        if (totaal) {

            totaal.textContent =
                leads.length;
        }


        if (hot) {

            hot.textContent =
                leads.filter(
                    function (lead) {

                        return (
                            lead.classificatie ===
                            "HOT"
                        );
                    }
                ).length;
        }


        if (warm) {

            warm.textContent =
                leads.filter(
                    function (lead) {

                        return (
                            lead.classificatie ===
                            "WARM"
                        );
                    }
                ).length;
        }


        if (cold) {

            cold.textContent =
                leads.filter(
                    function (lead) {

                        return (
                            lead.classificatie ===
                            "COLD"
                        );
                    }
                ).length;
        }
    }


    // =========================
    // FILTERS
    // =========================

    document
        .querySelectorAll(
            "[data-filter]"
        )
        .forEach(
            function (knop) {

                knop.addEventListener(
                    "click",
                    function () {

                        huidigeFilter =
                            this.dataset.filter;

                        toonLeads();
                    }
                );
            }
        );


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

});