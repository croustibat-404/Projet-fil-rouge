const message = document.getElementById("message");
let conversationActive = null;

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

async function chargerMessages(conversationId) {
    if (conversationActive === null) {
        return;
    }
    const { data:dataMessages, error:errorMessages } = await supabaseClient.from("messages").select("*").eq("conversation_id", conversationId).order("id", { ascending: true });
    if (errorMessages) {
        console.error("Erreur lors de la récupération des messages :", errorMessages);
        return;
    }
    const { data: dataUser, error: errorUser } = await supabaseClient.auth.getUser();
    if (errorUser) {
        console.error("Erreur lors de la récupération de l'utilisateur :", errorUser);
        return;
    }
    const listeMessages = document.getElementById("liste_message");
    listeMessages.textContent = "";
    for (let msg of dataMessages) {
        const type = (msg.user_id === dataUser.user.id) ? "envoye" : "recu";
        ajouterMessage(msg.content, type, msg.created_at);
    }
}

async function ouvrirConversation(conversationId, pseudo) {
    conversationActive = conversationId;
    const entete = document.querySelector(".nom_contact");
    entete.textContent = pseudo;
    for (let conv of document.querySelectorAll(".conversation")) {
        conv.classList.remove("conversation_active");
    }
    document.getElementById("conv-" + conversationId).classList.add("conversation_active");

    const champ = document.getElementById("champ-message");
    champ.disabled = false;
    champ.placeholder = "Écrire un message...";
    document.getElementById("liste_message").dataset.vide = "Aucun message pour l'instant, dites bonjour !";

    await chargerMessages(conversationId);
    champ.focus();
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
    liste_conv.textContent = "";
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
        conversation.addEventListener("click", function () {
            ouvrirConversation(conv.conversation_id, dataPseudo[0].pseudo);
        });
        conversation.classList.add("conversation");
        conversation.id = "conv-" + conv.conversation_id;
        if (conv.conversation_id === conversationActive) {
            conversation.classList.add("conversation_active");
        }

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
            window.location.href = "index.html";
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
            window.location.href = "index.html";
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
function ajouterMessage(texte, type, dateMessage = new Date()) {

    const ligne = document.createElement("div");
    ligne.classList.add("message", type);

    const bulle = document.createElement("div");
    bulle.classList.add("bulle_message");

    const texteSpan = document.createElement("span");
    texteSpan.classList.add("texte_message");
    texteSpan.textContent = texte;
    bulle.appendChild(texteSpan);

    const maintenant = new Date(dateMessage);
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

const deco = document.querySelector(".bouton_deconnexion");

if (deco) {
    deco.addEventListener("click", async function(){
        const { error } = await supabaseClient.auth.signOut();
        if (!error) {
            window.location.href = "./connexion.html";
        }
        else {
            alert("Une erreur est survenue au moment de la déconnexion.");
            console.error(error);
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
        await chargerConversations();
    });
}

chargerConversations();


const onglets = document.querySelectorAll(".onglet");

function activerOnglet(ongletChoisi) {
    for (let onglet of onglets) {
        const estChoisi = onglet === ongletChoisi;
        const panneau = document.getElementById(onglet.getAttribute("aria-controls"));

        onglet.classList.toggle("onglet_actif", estChoisi);
        onglet.setAttribute("aria-selected", estChoisi ? "true" : "false");
        panneau.hidden = !estChoisi;
    }
}

for (let onglet of onglets) {
    onglet.addEventListener("click", function () {
        activerOnglet(onglet);
    });
}

let listeDeContacts = [];

const listeContactsHTML = document.getElementById("liste_contacts");
const rechercheContact = document.getElementById("recherche_contact");
const compteurContacts = document.getElementById("compteur_contacts");
const contactsVide = document.getElementById("contacts_vide");
const texteContactsVide = document.getElementById("texte_contacts_vide");

function initiales(texte) {
    return texte.slice(0, 2).toUpperCase();
}

function couleurAvatar(texte) {
    let somme = 0;
    for (let lettre of texte) {
        somme += lettre.charCodeAt(0);
    }
    return "hsl(" + ((somme * 37) % 360) + ", 55%, 45%)";
}

function creerLigneContact(contact) {
    const ligne = document.createElement("li");
    ligne.classList.add("contact");

    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.classList.add("contact_principal");

    const avatar = document.createElement("span");
    avatar.classList.add("avatar_contact");
    avatar.style.backgroundColor = couleurAvatar(contact.pseudo);
    avatar.textContent = initiales(contact.pseudo);

    // Cliquer sur la photo d'un contact qui a une story l'ouvre
    if (contact.stories && contact.stories.length > 0) {
        avatar.classList.add("a_story");
        avatar.classList.toggle("story_vue", contact.storyVue === true);
        avatar.title = "Voir la story de " + contact.pseudo;

        avatar.addEventListener("click", function (event) {
            event.stopPropagation();
            contact.storyVue = true;
            avatar.classList.add("story_vue");
            ouvrirStory(contact, contact.stories);
        });
    }

    const infos = document.createElement("span");
    infos.classList.add("contact_infos");

    const nom = document.createElement("span");
    nom.classList.add("contact_nom");
    nom.textContent = contact.pseudo;

    const statut = document.createElement("span");
    statut.classList.add("contact_statut");
    statut.textContent = ((contact.prenom || "") + " " + (contact.nom || "")).trim();

    infos.appendChild(nom);
    infos.appendChild(statut);
    bouton.appendChild(avatar);
    bouton.appendChild(infos);
    ligne.appendChild(bouton);

    const boutonRetirer = document.createElement("button");
    boutonRetirer.type = "button";
    boutonRetirer.classList.add("contact_retirer");
    boutonRetirer.title = "Retirer " + contact.pseudo;
    boutonRetirer.setAttribute("aria-label", "Retirer " + contact.pseudo);
    boutonRetirer.innerHTML = '<i class="fa-solid fa-user-minus"></i>';
    boutonRetirer.addEventListener("click", function () {
        ouvrirRetraitContact(contact);
    });
    ligne.appendChild(boutonRetirer);

    return ligne;
}

function afficherContacts() {
    if (!listeContactsHTML) {
        return;
    }

    const recherche = rechercheContact.value.trim().toLowerCase();
    const contactsFiltres = listeDeContacts
        .filter(function (contact) {
            return contact.pseudo.toLowerCase().includes(recherche);
        })
        .sort(function (a, b) {
            return a.pseudo.localeCompare(b.pseudo);
        });

    listeContactsHTML.textContent = "";
    let lettreActuelle = "";

    for (let contact of contactsFiltres) {
        const lettre = contact.pseudo[0].toUpperCase();
        if (lettre !== lettreActuelle) {
            lettreActuelle = lettre;
            const separateur = document.createElement("li");
            separateur.classList.add("lettre_contact");
            separateur.textContent = lettre;
            listeContactsHTML.appendChild(separateur);
        }
        listeContactsHTML.appendChild(creerLigneContact(contact));
    }

    if (listeDeContacts.length === 0) {
        compteurContacts.textContent = "";
    } else if (recherche !== "") {
        compteurContacts.textContent = contactsFiltres.length + " résultat(s)";
    } else {
        compteurContacts.textContent = listeDeContacts.length + " contact(s)";
    }

    contactsVide.hidden = contactsFiltres.length > 0;
    if (listeDeContacts.length === 0) {
        texteContactsVide.textContent = "Vous n'avez encore aucun contact. Ajoutez-en un avec le bouton ci-dessous.";
    } else {
        texteContactsVide.textContent = "Aucun contact ne correspond à « " + recherche + " ».";
    }
}

if (rechercheContact) {
    rechercheContact.addEventListener("input", afficherContacts);
}

afficherContacts();

for (let boutonFermer of document.querySelectorAll("[data-fermer]")) {
    boutonFermer.addEventListener("click", function () {
        boutonFermer.closest("dialog").close();
    });
}

for (let modale of document.querySelectorAll("dialog.modale")) {
    modale.addEventListener("click", function (event) {
        if (event.target === modale) {
            modale.close();
        }
    });
}

const boutonAjoutContact = document.getElementById("bouton_ajout_contact");

// À compléter avec Supabase : chercher l'utilisateur par son pseudo,
// l'ajouter à listeDeContacts puis renvoyer "" si tout s'est bien passé,
// ou un message d'erreur sinon.
async function ajouterContact(pseudo) {
    return "L'ajout de contact n'est pas encore relié au serveur.";
}

if (boutonAjoutContact) {
    boutonAjoutContact.addEventListener("click", async function () {
        let pseudo = prompt("Entrez le pseudo de la personne :");
        if (pseudo === null) {
            return;
        }
        pseudo = pseudo.trim().toLowerCase();

        if (!pseudoValide(pseudo)) {
            alert("Ce pseudo n'est pas valide.");
            return;
        }

        for (let contact of listeDeContacts) {
            if (contact.pseudo === pseudo) {
                alert("Cette personne est déjà dans vos contacts.");
                return;
            }
        }

        const erreur = await ajouterContact(pseudo);
        if (erreur !== "") {
            alert(erreur);
            return;
        }
        afficherContacts();
    });
}

const modaleRetraitContact = document.getElementById("modale_retrait_contact");
const nomRetraitContact = document.getElementById("nom_retrait_contact");
const confirmerRetraitContact = document.getElementById("confirmer_retrait_contact");
let contactARetirer = null;

function ouvrirRetraitContact(contact) {
    contactARetirer = contact;
    nomRetraitContact.textContent = contact.pseudo;
    modaleRetraitContact.showModal();
}

if (confirmerRetraitContact) {
    confirmerRetraitContact.addEventListener("click", function () {
        listeDeContacts = listeDeContacts.filter(function (contact) {
            return contact !== contactARetirer;
        });
        contactARetirer = null;
        afficherContacts();
        modaleRetraitContact.close();
    });
}

for (let boutonOeil of document.querySelectorAll(".bouton_oeil")) {
    boutonOeil.addEventListener("click", function () {
        const champ = boutonOeil.parentElement.querySelector("input");
        const icone = boutonOeil.querySelector("i");
        const estCache = champ.type === "password";

        champ.type = estCache ? "text" : "password";
        icone.classList.toggle("fa-eye", !estCache);
        icone.classList.toggle("fa-eye-slash", estCache);
        boutonOeil.setAttribute("aria-label", estCache ? "Masquer le mot de passe" : "Afficher le mot de passe");
    });
}

const modaleSuppression = document.getElementById("modale_suppression");
const ouvrirSuppression = document.getElementById("ouvrir_suppression");
const champConfirmationSuppression = document.getElementById("confirmation_suppression");
const confirmerSuppression = document.getElementById("confirmer_suppression");
const messageSuppression = document.getElementById("message_suppression");

if (ouvrirSuppression) {
    ouvrirSuppression.addEventListener("click", function () {
        champConfirmationSuppression.value = "";
        confirmerSuppression.disabled = true;
        messageSuppression.textContent = "";
        modaleSuppression.showModal();
        champConfirmationSuppression.focus();
    });

    champConfirmationSuppression.addEventListener("input", function () {
        confirmerSuppression.disabled = champConfirmationSuppression.value.trim() !== "SUPPRIMER";
    });
}

const avatarsProposes = document.querySelectorAll(".avatar_propose");
const avatarProfil = document.getElementById("avatar_profil");
const apercuAvatar = document.getElementById("apercu_avatar");

function afficherAvatarProfil(url) {
    apercuAvatar.src = url;
    avatarProfil.classList.add("avec_photo");

    for (let bouton of avatarsProposes) {
        const estChoisi = bouton.querySelector("img").src === url;
        bouton.setAttribute("aria-pressed", estChoisi ? "true" : "false");
    }
}

const messageProfil = document.getElementById("message_profil");

async function enregistrerAvatar(url) {
    const { error } = await supabaseClient.auth.updateUser({
        data: { avatar: url }
    });

    if (error) {
        messageProfil.textContent = "Impossible d'enregistrer l'avatar, réessayez.";
        messageProfil.className = "message_formulaire";
        return;
    }
    messageProfil.textContent = "Avatar enregistré !";
    messageProfil.className = "message_formulaire succes";
}

for (let bouton of avatarsProposes) {
    bouton.addEventListener("click", function () {
        const url = bouton.querySelector("img").src;
        afficherAvatarProfil(url);
        enregistrerAvatar(url);
    });
}

const formProfil = document.getElementById("form_profil");
const monAvatar = document.getElementById("mon_avatar");

// Remplit la page paramètres ou l'avatar de l'accueil avec les infos du compte
async function chargerMesInfos() {
    const { data, error } = await supabaseClient.auth.getUser();
    if (error || data.user === null) {
        return;
    }

    const infos = data.user.user_metadata;

    if (formProfil) {
        document.getElementById("pseudo").value = infos.pseudo || "";
        document.getElementById("email").value = data.user.email;
        document.getElementById("prenom").value = infos.prenom || "";
        document.getElementById("nom").value = infos.nom || "";

        if (infos.avatar) {
            afficherAvatarProfil(infos.avatar);
        }
    }

    if (monAvatar) {
        monAvatar.title = infos.pseudo || "";

        if (infos.avatar) {
            const image = document.createElement("img");
            image.src = infos.avatar;
            image.alt = "Mon avatar";
            monAvatar.appendChild(image);
        } else if (infos.pseudo) {
            monAvatar.textContent = initiales(infos.pseudo);
            monAvatar.style.backgroundColor = couleurAvatar(infos.pseudo);
        }
    }
}

if (formProfil || monAvatar) {
    chargerMesInfos();
}

const lecteurStory = document.getElementById("lecteur_story");
const storyProgression = document.getElementById("story_progression");
const storyAvatar = document.getElementById("story_avatar");
const storyPseudo = document.getElementById("story_pseudo");
const storyDate = document.getElementById("story_date");
const storyImage = document.getElementById("story_image");
const storyTexte = document.getElementById("story_texte");
const storyPrecedente = document.getElementById("story_precedente");
const storySuivante = document.getElementById("story_suivante");

let storiesEnCours = [];
let indexStory = 0;
let debutAppui = 0;

function tempsEcoule(date) {
    const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (minutes < 1) {
        return "à l'instant";
    }
    if (minutes < 60) {
        return "il y a " + minutes + " min";
    }
    return "il y a " + Math.floor(minutes / 60) + " h";
}

function afficherStory(index) {
    indexStory = index;
    const story = storiesEnCours[index];

    storyImage.src = story.image;
    storyImage.alt = "Story de " + storyPseudo.textContent;
    storyTexte.textContent = story.texte || "";
    storyDate.textContent = story.date ? tempsEcoule(story.date) : "";

    // La barre attend que l'image soit chargée avant d'avancer
    lecteurStory.classList.toggle("en_pause", !storyImage.complete);

    const segments = storyProgression.children;
    for (let i = 0; i < segments.length; i++) {
        segments[i].classList.remove("vu", "en_cours");
        if (i < index) {
            segments[i].classList.add("vu");
        }
    }
    // Force le navigateur à relancer l'animation de la barre
    void segments[index].offsetWidth;
    segments[index].classList.add("en_cours");
}

function allerStorySuivante() {
    if (indexStory < storiesEnCours.length - 1) {
        afficherStory(indexStory + 1);
    } else {
        lecteurStory.close();
    }
}

function allerStoryPrecedente() {
    afficherStory(Math.max(indexStory - 1, 0));
}

// stories : tableau de { image, texte, date }
function ouvrirStory(contact, stories) {
    if (!lecteurStory || stories.length === 0) {
        return;
    }

    storiesEnCours = stories;
    storyPseudo.textContent = contact.pseudo;
    storyAvatar.textContent = initiales(contact.pseudo);
    storyAvatar.style.backgroundColor = couleurAvatar(contact.pseudo);

    storyProgression.textContent = "";
    for (let i = 0; i < stories.length; i++) {
        const segment = document.createElement("span");
        segment.classList.add("story_segment");
        const remplissage = document.createElement("span");
        remplissage.classList.add("story_remplissage");
        segment.appendChild(remplissage);
        storyProgression.appendChild(segment);
    }

    lecteurStory.showModal();
    afficherStory(0);
}

if (lecteurStory) {
    // Quand la barre en cours est pleine, on passe à la story suivante
    storyProgression.addEventListener("animationend", allerStorySuivante);

    for (let evenement of ["load", "error"]) {
        storyImage.addEventListener(evenement, function () {
            lecteurStory.classList.remove("en_pause");
        });
    }

    // Maintenir le clic sur la story la met en pause, un clic rapide change de story
    for (let zone of [storyPrecedente, storySuivante]) {
        zone.addEventListener("pointerdown", function () {
            debutAppui = Date.now();
            lecteurStory.classList.add("en_pause");
        });
        zone.addEventListener("pointerup", function () {
            lecteurStory.classList.remove("en_pause");
        });
        zone.addEventListener("pointerleave", function () {
            lecteurStory.classList.remove("en_pause");
        });
    }

    storyPrecedente.addEventListener("click", function (event) {
        if (event.detail === 0 || Date.now() - debutAppui < 250) {
            allerStoryPrecedente();
        }
    });

    storySuivante.addEventListener("click", function (event) {
        if (event.detail === 0 || Date.now() - debutAppui < 250) {
            allerStorySuivante();
        }
    });

    lecteurStory.addEventListener("keydown", function (event) {
        if (event.key === "ArrowRight") {
            allerStorySuivante();
        } else if (event.key === "ArrowLeft") {
            allerStoryPrecedente();
        }
    });

    lecteurStory.addEventListener("click", function (event) {
        if (event.target === lecteurStory) {
            lecteurStory.close();
        }
    });

    lecteurStory.addEventListener("close", function () {
        storiesEnCours = [];
        storyProgression.textContent = "";
        storyImage.removeAttribute("src");
        lecteurStory.classList.remove("en_pause");
    });
}

const boutonAjoutStory = document.getElementById("bouton_ajout_story");
const inputStory = document.getElementById("input_story");

// CELIAN A COMPLETER AVEC SUPABASE ICI
// ajouter la story dans la table puis renvoyer "" si tout s'est bien passé, ou un message d'erreur sinon.
async function publierStory(fichier, texte) {
    return "La publication de story n'est pas encore reliée au serveur.";
}

if (boutonAjoutStory) {
    boutonAjoutStory.addEventListener("click", function () {
        inputStory.click();
    });

    inputStory.addEventListener("change", async function () {
        const fichier = inputStory.files[0];
        // On vide le champ pour pouvoir choisir la même image une prochaine fois
        inputStory.value = "";

        if (!fichier) {
            return;
        }
        if (!["image/png", "image/jpeg", "image/webp"].includes(fichier.type)) {
            alert("L'image doit être au format PNG, JPG ou WEBP.");
            return;
        }
        if (fichier.size > 5 * 1024 * 1024) {
            alert("L'image ne doit pas dépasser 5 Mo.");
            return;
        }

        const texte = prompt("Ajoutez une légende (facultatif) :");
        if (texte === null) {
            return;
        }

        const erreur = await publierStory(fichier, texte.trim());
        if (erreur !== "") {
            alert(erreur);
            return;
        }
        alert("Story publiée !");
    });
}
