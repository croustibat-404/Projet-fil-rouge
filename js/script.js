const message = document.getElementById("message");

function afficherErreur(texte) {
    message.textContent = texte;
    message.className = "erreur";
}

function afficherSucces(texte) {
    message.textContent = texte;
    message.className = "succes";
}

const REGEX_MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REGEX_PSEUDO = /^[A-Za-z0-9_.-]{3,20}$/;

function mailValide(mail) {
    return REGEX_MAIL.test(mail);
}

function verifierMotDePasse(mdp) {
    let aMinuscule = false;
    let aMajuscule = false;
    let aChiffre = false;
    let aSpecial = false;

    for (let lettre of mdp) {
        if ("0123456789".includes(lettre)) {
            aChiffre = true;                        
        } else if (lettre !== lettre.toUpperCase()) {
            aMinuscule = true;                      
        } else if (lettre !== lettre.toLowerCase()) {
            aMajuscule = true;                      
        } else if (lettre !== " ") {
            aSpecial = true;                        
        }
    }
    if (mdp.length < 12) {
        return "Le mot de passe doit faire au moins 12 caractères.";
    }
    if (!aMinuscule) {
        return "Le mot de passe doit contenir une minuscule.";
    }
    if (!aMajuscule) {
        return "Le mot de passe doit contenir une majuscule.";
    }
    if (!aChiffre) {
        return "Le mot de passe doit contenir un chiffre.";
    }
    if (!aSpecial) {
        return "Le mot de passe doit contenir un caractère spécial (! ? # @ ...).";
    }
    return "";  
}

const pageActuelle = window.location.pathname.split("/").pop() || "index.html";
const pagePublique = pageActuelle === "connexion.html" || pageActuelle === "inscription.html";

async function verifierSession() {
    const { data } = await supabaseClient.auth.getSession();
    const estConnecte = data.session !== null;

    if (!estConnecte && !pagePublique) {
        window.location.href = "connexion.html";
    } else if (estConnecte && pagePublique) {
        window.location.href = "index.html";
    }
}

verifierSession();

async function assurerProfil(user) {
    const { data } = await supabaseClient.from("profiles").select("id").eq("id", user.id);

    if (data && data.length === 0) {
        await supabaseClient.from("profiles").insert([
            { id: user.id, pseudo: user.user_metadata.pseudo }
        ]);
    }
}

const formConnexion = document.getElementById("form_connexion");

if (formConnexion) {
    formConnexion.addEventListener("submit", function (event) {
        event.preventDefault();
        const mail = document.getElementById("id_mail").value.trim();
        const mdp = document.getElementById("id_pass").value;

        if (!mailValide(mail)) {
            event.preventDefault();
            afficherErreur("L'adresse mail n'est pas valide.");
            return;
        }

        if (mdp === "") {
            event.preventDefault();
            afficherErreur("Veuillez saisir votre mot de passe.");
            return;
        }

        message.textContent = "";
    });
}

const formInscription = document.getElementById("form_inscription");

if (formInscription) {
    formInscription.addEventListener("submit", function (event) {
        event.preventDefault();
        const mail = document.getElementById("id_mail").value.trim();
        const mdp = document.getElementById("id_pass").value;
        const confirmation = document.getElementById("id_pass_confirm").value;

        if (!mailValide(mail)) {
            event.preventDefault();
            afficherErreur("L'adresse mail n'est pas valide.");
            return;
        }

        const manques = verifierMotDePasse(mdp);
        if (manques.length > 0) {
            event.preventDefault();
            afficherErreur("Mot de passe invalide, il manque : " + manques.join(", ") + ".");
            return;
        }

        if (mdp !== confirmation) {
            event.preventDefault();
            afficherErreur("Les deux mots de passe ne sont pas identiques.");
            return;
        }

        message.textContent = "";
    });
}


const formulaire = document.getElementById("formulaire-message");
const champMessage = document.getElementById("champ-message");
const listeMessages = document.getElementById("liste_message");
const boutonEnvoyer = document.getElementById("bouton-envoyer");

function mettreAJourBoutonEnvoyer() {
    boutonEnvoyer.disabled = champMessage.value.trim() === "";
}

if (champMessage) {
    champMessage.addEventListener("input", mettreAJourBoutonEnvoyer);
}
function ajouterMessage(texte, type) {

    const ligne = document.createElement("div");
    ligne.classList.add("message", type);

    const bulle = document.createElement("div");
    bulle.classList.add("bulle_message");

    const texteSpan = document.createElement("span");
    texteSpan.classList.add("texte_message");
    texteSpan.textContent = texte;
    bulle.appendChild(texteSpan);

    const maintenant = new Date();
    const heures = String(maintenant.getHours()).padStart(2, '0');
    const minutes = String(maintenant.getMinutes()).padStart(2, '0');
    const heureFormatee = `${heures}:${minutes}`;

    const heureSpan = document.createElement("span");
    heureSpan.classList.add("heure_message");
    heureSpan.textContent = heureFormatee;
    bulle.appendChild(heureSpan);
    ligne.appendChild(bulle);
    listeMessages.appendChild(ligne);

    listeMessages.scrollTop = listeMessages.scrollHeight;
}

if(formulaire){
    formulaire.addEventListener("submit", function (event) {
        event.preventDefault();

        const texte = champMessage.value.trim();

        if (texte === "") {
            return;
        }

        ajouterMessage(texte, "envoye");

        champMessage.value = "";
        mettreAJourBoutonEnvoyer();
        champMessage.focus();

    });
}

const reglages = document.querySelector(".bouton_menu");

if(reglages) {
    reglages.addEventListener("click", function () {
        window.location.href = "parametres.html";
    });
}

const quitter = document.querySelector(".bouton_quitter");

if(quitter) {
    quitter.addEventListener("click", function () {
        window.location.href = "index.html";
    });
}
