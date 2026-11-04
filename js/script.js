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
    const { data, error } = await supabaseClient.auth.getUser();
    const estConnecte = (error === null) && (data.user !== null);

    if (!estConnecte) {
        await supabaseClient.auth.signOut({ scope: "local" });
    }

    if (!estConnecte && !pagePublique) {
        window.location.href = "connexion.html";
    } else if (estConnecte && pagePublique) {
        window.location.href = "./";
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

async function chargerConversations() {
    const liste_conv = document.querySelector(".liste_conversation");
    if (!liste_conv) {
        return;
    }
    const { data,error} = await supabaseClient.auth.getUser();
    if (error) {
        console.error("Erreur lors de la récupération de l'utilisateur :", error);
        return;
    }
    const monId = data.user.id;
    const { data: mesConversations, error: errorConversations } = await supabaseClient.from("membres").select("conversation_id").eq("user_id", monId);
    if (errorConversations) {
        console.error("Erreur lors de la récupération des conversations :", errorConversations);
        return;
    }
    for (let conv of mesConversations) {
        const { data: dataConversation, error: errorConversation } = await supabaseClient.from("membres").select("user_id").eq("conversation_id", conv.conversation_id).neq("user_id", monId);
        if (errorConversation) {
            console.error("Erreur lors de la récupération des membres de la conversation :", errorConversation);
            continue;
        }
        if (dataConversation.length === 0) {
            console.warn("Aucun autre membre trouvé pour la conversation :", conv.conversation_id);
            continue;
        }
        const { data: dataPseudo, error: errorPseudo } = await supabaseClient.from("profiles").select("pseudo").eq("id", dataConversation[0].user_id);
        if (errorPseudo) {
            console.error("Erreur lors de la récupération du pseudo :", errorPseudo);
            continue;
        }
                if (dataPseudo.length === 0) {
            continue;
        }

        const conversation = document.createElement("li");
        conversation.classList.add("conversation");
        conversation.id = "conv-" + conv.conversation_id;

        const avatar = document.createElement("div");
        avatar.classList.add("petit_avatar");

        const span = document.createElement("span");
        span.textContent = dataPseudo[0].pseudo;

        conversation.appendChild(avatar);
        conversation.appendChild(span);

        liste_conv.appendChild(conversation);
    }
}

const formConnexion = document.getElementById("form_connexion");

if (formConnexion) {
    formConnexion.addEventListener("submit", async function (event) {
        event.preventDefault();
        message.textContent = "";

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

        const connexion = formConnexion.querySelector('input[type="submit"]');
        const texteBouton = connexion.value;
        let reussi = false;

        connexion.disabled = true;
        connexion.value = "Connexion en cours...";
        document.body.classList.add("chargement");
        afficherSucces("Connexion en cours...");

        try {
            const { data: dataConnexion, error: errorConnexion } = await supabaseClient.auth.signInWithPassword({
                email: mail,
                password: mdp
            });

            if (errorConnexion !== null) {
                afficherErreur("Adresse mail ou mot de passe incorrect.");
                return;
            }

            await assurerProfil(dataConnexion.user);
            reussi = true;
            afficherSucces("Connexion réussie !");
            window.location.href = "./";
        } catch (e) {
            afficherErreur("Problème de connexion au serveur, réessaie.");
        } finally {
            if (!reussi) {
                connexion.disabled = false;
                connexion.value = texteBouton;
                document.body.classList.remove("chargement");
            }
        }
    });
}

const formInscription = document.getElementById("form_inscription");

if (formInscription) {
    formInscription.addEventListener("submit", async function (event) {
        event.preventDefault();
        message.textContent = "";

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

        const inscription = formInscription.querySelector('input[type="submit"]');
        const texteBouton = inscription.value;
        let reussi = false;

        inscription.disabled = true;
        inscription.value = "Inscription en cours...";
        document.body.classList.add("chargement");
        afficherSucces("Inscription en cours...");

        try {
            const { data, error } = await supabaseClient
                .from("profiles")
                .select("id")
                .eq("pseudo", pseudo);

            if (error !== null) {
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
            reussi = true;
            afficherSucces("Compte créé ! Redirection...");
            window.location.href = "./";
        } catch (e) {
            afficherErreur("Problème de connexion au serveur, réessaie.");
        } finally {
            if (!reussi) {
                inscription.disabled = false;
                inscription.value = texteBouton;
                document.body.classList.remove("chargement");
            }
        }
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

const boutonConversation = document.querySelector(".nouvelle_conversation");

if (boutonConversation) {
    boutonConversation.addEventListener("click", async function () {
        let pseudo = prompt("Entrez le pseudo de la personne :");
        if (pseudo === null) {
            return;
        } else {
            pseudo = pseudo.trim().toLowerCase();
        }
        const { data,error } = await supabaseClient.from("profiles").select("id").eq("pseudo", pseudo);
        const { data:dataUser,error:errorUser } = await supabaseClient.auth.getUser();
        if (error) {
            alert("Une erreur est survenue.");
            return;
        } else if (data.length === 0) {
            alert("Aucun utilisateur avec ce pseudo");
            return;
        } else {
            if (errorUser) {
                alert("Une erreur est survenue.");
                return;
            }
            else if (data[0].id === dataUser.user.id) {
                alert("Vous ne pouvez pas créer une conversation avec vous-même.");
                return;
            }
        }
        const autreId = data[0].id;
        const monId = dataUser.user.id;
        const { data:dataConv,error: errorConv } = await supabaseClient.from("conversations").insert([
            { est_groupe: false }
        ]).select();
        if (errorConv) {
            alert("Une erreur est survenue lors de la création de la conversation.");
            return;
        }
        const idConv = dataConv[0].id;
        const { error: errorMembres } = await supabaseClient.from("membres").insert([
            { conversation_id: idConv, user_id: monId },
            { conversation_id: idConv, user_id: autreId }
        ]);
        if (errorMembres) {
            alert("Une erreur est survenue lors de l'ajout des membres à la conversation.");
            return;
        } 
        alert("Conversation créée avec succès !");
    });
}
