
const REGEX_MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function mailValide(mail) {
    return REGEX_MAIL.test(mail);
}

function verifierMotDePasse(mdp) {
    const manques = [];

    if (mdp.length < 12) manques.push("12 caractères minimum");
    if (!/\p{Ll}/u.test(mdp)) manques.push("une minuscule");
    if (!/\p{Lu}/u.test(mdp)) manques.push("une majuscule");
    if (!/\d/.test(mdp)) manques.push("un chiffre");
    if (!/[^\p{L}\p{N}\s]/u.test(mdp)) manques.push("un caractère spécial");

    return manques;
}

const message = document.getElementById("message");

function afficherErreur(texte) {
    message.textContent = texte;
    message.className = "erreur";
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
