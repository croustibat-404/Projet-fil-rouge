console.log("Bonjour");

/*
const courriel = document.querySelector("#id_mail");
const courrielMessage = document.querySelector("#message");

console.log(courriel.value);

courriel.addEventListener("input", function(event) {
    const valeur = courriel.value;

    const estvide = valeur === "";
    const aUnArobase = valeur.includes("@");

    console.log("Courriel : ", valeur);

    if (estvide){
        courrielMessage.textContent = "Le courriel est vide";
    } else if (!aUnArobase) {
        courrielMessage.textContent = "Le courriel n'est pas valide";
    } else {
        courrielMessage.textContent = "Tout semble correct";
    }
});
*/

const formulaire = document.getElementById("formulaire-message");
const champMessage = document.getElementById("champ-message");
const listeMessages = document.getElementById("liste_message");

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

formulaire.addEventListener("submit", function (event) {
    event.preventDefault();

    const texte = champMessage.value.trim();

    if (texte === "") {
        return;
    }

    ajouterMessage(texte, "envoye");

    champMessage.value = "";
    champMessage.focus();
});




