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

function pseudoValide(pseudo) {
    return REGEX_PSEUDO.test(pseudo);
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
    formConnexion.addEventListener("submit", async function (event) {
        event.preventDefault();
        const mail = document.getElementById("id_mail").value.trim();
        const mdp = document.getElementById("id_pass").value;

        if (!mailValide(mail)) {
            afficherErreur("L'adresse mail n'est pas valide.");
            return;
        }

        if (mdp === "") {
            afficherErreur("Veuillez saisir votre mot de passe.");
            return;
        }

        const { data : dataConnexion, error : errorConnexion } = await supabaseClient.auth.signInWithPassword({
            email : mail,
            password : mdp
        });

        if (errorConnexion !== null) {
            afficherErreur("Adresse mail ou mot de passe incorrect.");
            return;
        }
        await assurerProfil(dataConnexion.user);
        afficherSucces("Connexion réussie !");
        window.location.href = "./";
    });
}

const formInscription = document.getElementById("form_inscription");

if (formInscription) {
    formInscription.addEventListener("submit", async function (event) {
        event.preventDefault();
        const mail = document.getElementById("id_mail").value.trim();
        const mdp = document.getElementById("id_pass").value;
        const confirmation = document.getElementById("id_pass_confirm").value;
        const pseudo = document.getElementById("id_pseudo").value.trim().toLowerCase();
        const nom = document.getElementById("id_nom").value.trim();
        const prenom = document.getElementById("id_prenom").value.trim();
        const phone = document.getElementById("id_phone").value.trim();


        if (!pseudoValide(pseudo)) {
            afficherErreur("Le pseudo n'est pas valide");
            return;
        }

        if (!mailValide(mail)) {
            afficherErreur("L'adresse mail n'est pas valide.");
            return;
        }

        const manques = verifierMotDePasse(mdp);
        if (manques.length > 0) {
            afficherErreur("Mot de passe invalide : " + manques);
            return;
        }

        if (mdp !== confirmation) {
            afficherErreur("Les deux mots de passe ne sont pas identiques.");
            return;
        }
        
        const { data, error } = await supabaseClient    
        .from("profiles")
        .select("id")
        .eq("pseudo",pseudo);

        if (error !== null){
            afficherErreur("Impossible de vérifier le pseudo, veuillez réessayer.");
            return;
        } else if (data.length > 0) {
            afficherErreur("Ce pseudo est déjà pris.");
            return;
        }

        const { data: dataInscription, error: errorInscription } = await supabaseClient.auth.signUp({
            email: mail,
            password: mdp,
            options: {
                data: {
                    pseudo: pseudo,
                    nom: nom,
                    prenom: prenom,
                    phone: phone
                }
            }
        });

        if (errorInscription !== null) {
            afficherErreur("Inscription impossible : " + errorInscription.message);
            return;
        }

        await assurerProfil(dataInscription.user);

        message.textContent = "";

        afficherSucces("Compte créé ! Redirection...");
        window.location.href = "./";
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
        window.location.href = "./";
    });
}

const deco = document.querySelector(".bouton_deconnexion");

if (deco) {
    deco.addEventListener("click", async function(){
        const { error } = await supabaseClient.auth.signOut();
        if (!error) {
            window.location.href = "./connexion.html";
        }
        else {
            alert("Une erreur est survenue au moment de la déconnexion.");
            console.error(error)
        }
    });
}
