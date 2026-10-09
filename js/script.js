console.log("Bonjour");

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

