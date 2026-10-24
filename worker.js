const FIREBASE_PROJECT_ID = "leadflow-47ab3";

const FIREBASE_CERTS_URL =
    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";


export default {
    async fetch(request, env) {

        const corsHeaders = {
            "Access-Control-Allow-Origin":
                "https://senne2620-png.github.io",

            "Access-Control-Allow-Methods":
                "POST, OPTIONS",

            "Access-Control-Allow-Headers":
                "Content-Type, Authorization"
        };


        // =========================
        // CORS
        // =========================

        if (request.method === "OPTIONS") {

            return new Response(null, {
                status: 204,
                headers: corsHeaders
            });
        }


        // =========================
        // GET TEST
        // =========================

        if (request.method !== "POST") {

            return Response.json(
                {
                    message:
                        "LeadFlow AI is actief via Cloudflare Workers AI."
                },
                {
                    headers: corsHeaders
                }
            );
        }


        try {

            // =========================
            // AUTHORIZATION HEADER
            // =========================

            const authorization =
                request.headers.get(
                    "Authorization"
                );


            if (
                !authorization ||
                !authorization.startsWith(
                    "Bearer "
                )
            ) {

                return Response.json(
                    {
                        error:
                            "Niet geautoriseerd."
                    },
                    {
                        status: 401,
                        headers: corsHeaders
                    }
                );
            }


            const idToken =
                authorization.substring(7);


            // =========================
            // FIREBASE TOKEN CONTROLEREN
            // =========================

            const gebruiker =
                await verifyFirebaseToken(
                    idToken
                );


            console.log(
                "Firebase gebruiker:",
                gebruiker.sub
            );


            // =========================
            // LEAD ONTVANGEN
            // =========================
            // =========================
            // BEDRIJF CONTROLEREN
            // =========================

            const bedrijfResponse =
                await fetch(
                    `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/gebruikers/${gebruiker.sub}`,
                    {
                        headers: {
                            "Authorization":
                                `Bearer ${idToken}`
                        }
                    }
                );

            let bedrijfId = null;

            if (bedrijfResponse.ok) {

                const bedrijfDocument =
                    await bedrijfResponse.json();

                bedrijfId =
                    bedrijfDocument.fields?.bedrijfId?.stringValue;
            }

            if (!bedrijfId) {

                return Response.json(
                    {
                        error:
                            "Je account is niet aan een bedrijf gekoppeld."
                    },
                    {
                        status: 403,
                        headers: corsHeaders
                    }
                );
            }
                        // =========================
            // LIMIET PER ACCOUNT
            // =========================

            const MAX_PER_DAG = 50;

            const vandaag =
                new Date().toISOString().slice(0, 10);

            const sleutel =
                `gebruik:${gebruiker.sub}:${vandaag}`;

            const aantalTekst =
                await env.GEBRUIK.get(sleutel);

            const aantal =
                parseInt(aantalTekst || "0", 10);

            if (aantal >= MAX_PER_DAG) {

                return Response.json(
                    {
                        error:
                            "Je hebt vandaag het maximale aantal analyses bereikt. Probeer het morgen opnieuw."
                    },
                    {
                        status: 429,
                        headers: corsHeaders
                    }
                );
            }

            await env.GEBRUIK.put(
                sleutel,
                String(aantal + 1),
                { expirationTtl: 172800 }
            );
            const lead =
                await request.json();


            const prompt = `
Je bent de AI-assistent van Noord Installatie.

Analyseer deze potentiële klant:

Naam: ${lead.naam || ""}
E-mail: ${lead.email || ""}
Telefoon: ${lead.telefoon || ""}
Postcode: ${lead.postcode || ""}
Urgentie: ${lead.urgentie || ""}
Budget: ${lead.budget || ""}
Project: ${lead.project || ""}
Bericht: ${lead.bericht || ""}

Beoordeel:

- koopintentie
- urgentie
- projectomvang
- budget

Geef ALLEEN geldige JSON terug.

Gebruik exact deze structuur:

{
  "score": 0,
  "classificatie": "HOT",
  "reden": "",
  "advies": "",
  "prioriteit": "",
  "emailOnderwerp": "",
  "emailBericht": ""
}

Regels:

- score is een geheel getal tussen 0 en 100.
- classificatie is alleen HOT, WARM of COLD.
- reden legt kort uit waarom.
- advies geeft een concrete volgende actie.
- prioriteit is alleen "Zeer hoog", "Hoog", "Gemiddeld" of "Laag".
- schrijf een korte professionele Nederlandse conceptmail.
- verzin geen ontbrekende klantgegevens.
- gebruik geen markdown of codeblokken.
`;


            // =========================
            // CLOUDFLARE AI
            // =========================

            const response =
                await env.AI.run(
                    "@cf/meta/llama-3.1-8b-instruct-fp8-fast",
                    {
                        messages: [
                            {
                                role: "system",
                                content:
                                    "Je bent een Nederlandse assistent voor Noord Installatie. Antwoord uitsluitend met geldige JSON."
                            },
                            {
                                role: "user",
                                content: prompt
                            }
                        ],

                        max_tokens: 700,

                        temperature: 0.2
                    }
                );


            const analyse =
                response.response;


            if (
                !analyse ||
                typeof analyse !== "object"
            ) {

                throw new Error(
                    "Geen geldige AI-analyse ontvangen."
                );
            }


            // =========================
            // RESULTAAT
            // =========================

            return Response.json(
                analyse,
                {
                    headers: corsHeaders
                }
            );


        } catch (error) {

            console.error(
                "LeadFlow fout:",
                error
            );


            const isAuthError =
                error.message.startsWith(
                    "AUTH:"
                );


            return Response.json(
                {
                    error:
                        isAuthError
                            ? "Ongeldige of verlopen login."
                            : "De AI-analyse kon niet worden uitgevoerd.",

                    details:
                        error.message
                },
                {
                    status:
                        isAuthError
                            ? 401
                            : 500,

                    headers:
                        corsHeaders
                }
            );
        }
    }
};


// =====================================
// FIREBASE ID TOKEN VERIFIËREN
// =====================================

async function verifyFirebaseToken(token) {

    const delen =
        token.split(".");


    if (delen.length !== 3) {

        throw new Error(
            "AUTH: Ongeldig tokenformaat."
        );
    }


    const [
        encodedHeader,
        encodedPayload,
        encodedSignature
    ] = delen;


    let header;
    let payload;


    try {

        header =
            JSON.parse(
                decodeBase64UrlText(
                    encodedHeader
                )
            );


        payload =
            JSON.parse(
                decodeBase64UrlText(
                    encodedPayload
                )
            );

    } catch {

        throw new Error(
            "AUTH: Token kan niet worden gelezen."
        );
    }


    // =========================
    // HEADER CONTROLEREN
    // =========================

    if (header.alg !== "RS256") {

        throw new Error(
            "AUTH: Verkeerd algoritme."
        );
    }


    if (
        !header.kid ||
        typeof header.kid !== "string"
    ) {

        throw new Error(
            "AUTH: Geen geldige key ID."
        );
    }


    // =========================
    // CLAIMS CONTROLEREN
    // =========================

    const nu =
        Math.floor(
            Date.now() / 1000
        );


    if (
        payload.aud !==
        FIREBASE_PROJECT_ID
    ) {

        throw new Error(
            "AUTH: Verkeerde audience."
        );
    }


    if (
        payload.iss !==
        `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`
    ) {

        throw new Error(
            "AUTH: Verkeerde issuer."
        );
    }


    if (
        typeof payload.sub !==
            "string" ||
        payload.sub.length === 0
    ) {

        throw new Error(
            "AUTH: Ongeldige gebruiker."
        );
    }


    if (
        typeof payload.exp !==
            "number" ||
        payload.exp <= nu
    ) {

        throw new Error(
            "AUTH: Token is verlopen."
        );
    }


    if (
        typeof payload.iat !==
            "number" ||
        payload.iat > nu
    ) {

        throw new Error(
            "AUTH: Ongeldige uitgiftetijd."
        );
    }


    if (
        typeof payload.auth_time !==
            "number" ||
        payload.auth_time > nu
    ) {

        throw new Error(
            "AUTH: Ongeldige inlogtijd."
        );
    }


    // =========================
    // GOOGLE PUBLIC KEYS OPHALEN
    // =========================

    const certResponse =
        await fetch(
            FIREBASE_CERTS_URL
        );


    if (!certResponse.ok) {

        throw new Error(
            "AUTH: Firebase sleutels konden niet worden opgehaald."
        );
    }


    const certificaten =
        await certResponse.json();


    const certificaat =
        certificaten[
            header.kid
        ];


    if (!certificaat) {

        throw new Error(
            "AUTH: Onbekende Firebase sleutel."
        );
    }


    // =========================
    // CERTIFICAAT → PUBLIC KEY
    // =========================

    let publicKey;


    try {

        const certDer =
            pemCertificateToArrayBuffer(
                certificaat
            );


        publicKey =
            await crypto.subtle.importKey(
                "spki",
                extractPublicKeyFromCertificate(
                    certDer
                ),
                {
                    name: "RSASSA-PKCS1-v1_5",
                    hash: "SHA-256"
                },
                false,
                ["verify"]
            );

    } catch (error) {

        console.error(
            "Public key fout:",
            error
        );

        throw new Error(
            "AUTH: Firebase sleutel kon niet worden verwerkt."
        );
    }


    // =========================
    // HANDTEKENING CONTROLEREN
    // =========================

    const signedData =
        new TextEncoder().encode(
            encodedHeader +
            "." +
            encodedPayload
        );


    const signature =
        base64UrlToArrayBuffer(
            encodedSignature
        );


    const geldig =
        await crypto.subtle.verify(
            {
                name:
                    "RSASSA-PKCS1-v1_5"
            },
            publicKey,
            signature,
            signedData
        );


    if (!geldig) {

        throw new Error(
            "AUTH: Ongeldige handtekening."
        );
    }


    return payload;
}


// =====================================
// BASE64URL HULPFUNCTIES
// =====================================

function decodeBase64UrlText(value) {

    const bytes =
        new Uint8Array(
            base64UrlToArrayBuffer(
                value
            )
        );


    return new TextDecoder().decode(
        bytes
    );
}


function base64UrlToArrayBuffer(value) {

    let base64 =
        value
            .replace(/-/g, "+")
            .replace(/_/g, "/");


    while (
        base64.length % 4
    ) {

        base64 += "=";
    }


    const binary =
        atob(base64);


    const bytes =
        new Uint8Array(
            binary.length
        );


    for (
        let i = 0;
        i < binary.length;
        i++
    ) {

        bytes[i] =
            binary.charCodeAt(i);
    }


    return bytes.buffer;
}


// =====================================
// PEM CERTIFICAAT LEZEN
// =====================================

function pemCertificateToArrayBuffer(
    pem
) {

    const base64 =
        pem
            .replace(
                "-----BEGIN CERTIFICATE-----",
                ""
            )
            .replace(
                "-----END CERTIFICATE-----",
                ""
            )
            .replace(
                /\s/g,
                ""
            );


    const binary =
        atob(base64);


    const bytes =
        new Uint8Array(
            binary.length
        );


    for (
        let i = 0;
        i < binary.length;
        i++
    ) {

        bytes[i] =
            binary.charCodeAt(i);
    }


    return bytes.buffer;
}


// =====================================
// X.509 → SUBJECT PUBLIC KEY INFO
// =====================================

function extractPublicKeyFromCertificate(
    certBuffer
) {

    const bytes =
        new Uint8Array(
            certBuffer
        );


    let offset = 0;


    const certSequence =
        readDerElement(
            bytes,
            offset
        );


    offset =
        certSequence.contentStart;


    const tbsCertificate =
        readDerElement(
            bytes,
            offset
        );


    let tbsOffset =
        tbsCertificate.contentStart;


    // Version is optioneel en heeft tag A0
    if (
        bytes[tbsOffset] === 0xA0
    ) {

        const version =
            readDerElement(
                bytes,
                tbsOffset
            );

        tbsOffset =
            version.end;
    }


    // serialNumber
    let element =
        readDerElement(
            bytes,
            tbsOffset
        );

    tbsOffset =
        element.end;


    // signature
    element =
        readDerElement(
            bytes,
            tbsOffset
        );

    tbsOffset =
        element.end;


    // issuer
    element =
        readDerElement(
            bytes,
            tbsOffset
        );

    tbsOffset =
        element.end;


    // validity
    element =
        readDerElement(
            bytes,
            tbsOffset
        );

    tbsOffset =
        element.end;


    // subject
    element =
        readDerElement(
            bytes,
            tbsOffset
        );

    tbsOffset =
        element.end;


    // subjectPublicKeyInfo
    const spki =
        readDerElement(
            bytes,
            tbsOffset
        );


    return bytes
        .slice(
            spki.start,
            spki.end
        )
        .buffer;
}


// =====================================
// DER ELEMENT LEZEN
// =====================================

function readDerElement(
    bytes,
    start
) {

    let offset =
        start;


    const tag =
        bytes[offset++];


    let length =
        bytes[offset++];


    if (
        length & 0x80
    ) {

        const aantalBytes =
            length & 0x7f;


        length = 0;


        for (
            let i = 0;
            i < aantalBytes;
            i++
        ) {

            length =
                (
                    length << 8
                ) |
                bytes[offset++];
        }
    }


    const contentStart =
        offset;


    const end =
        contentStart +
        length;


    return {
        tag,
        start,
        contentStart,
        end
    };
}
