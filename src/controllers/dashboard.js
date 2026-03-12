import db from "../models/database.js";

let user = localStorage.getItem('currentUser');

if (!user) {
    document.location = '../view/login.html';
}

user = JSON.parse(user);

console.log(user.name);

const users = db.allUsers;

const greetingName = document.getElementById('greetingName');
const availableBalance = document.getElementById('availableBalance');
const monthlyIncome = document.getElementById('monthlyIncome');
const monthlyExpenses = document.getElementById('monthlyExpenses');
const activeCards = document.getElementById('activeCards');

const quickTransferbtn = document.getElementById('quickTransfer');
const transfersection = document.getElementById('transfer-section');
const closeTransferBtn = document.getElementById('closeTransferBtn');

const bselect = document.getElementById('beneficiary');
const sourceCardSelect = document.getElementById('sourceCard');

const cancelTransferBtn = document.getElementById('cancelTransferBtn');
const submitTransferBtn = document.getElementById('submitTransferBtn');

const amount = document.getElementById('amount');
const instantTransfer = document.getElementById('instantTransfer');

const recentTransactionsList = document.getElementById("recentTransactionsList");


// -------------------------
// affichage infos user
// -------------------------

greetingName.textContent = user.name;
availableBalance.textContent = user.wallet.balance;

let Ctransactions = user.wallet.transactions.filter((t) => t.type === 'credit');
monthlyIncome.textContent = Ctransactions.reduce((acc, curr) => acc + curr.amount, 0);

let Dtransactions = user.wallet.transactions.filter((t) => t.type === 'debit');
monthlyExpenses.textContent = Dtransactions.reduce((acc, curr) => acc + curr.amount, 0);

activeCards.textContent = user.wallet.cards.length;


// -------------------------
// afficher transactions
// -------------------------

function afficherTransactions() {

    recentTransactionsList.innerHTML = "";

    let transactions = user.wallet.transactions.slice(-5).reverse();

    transactions.forEach(t => {

        let div = document.createElement("div");
        div.className = "transaction-item";

        div.innerHTML = `
            <div>
                <strong>${t.type === "debit" ? "Envoi" : "Réception"}</strong>
                <p>${t.to}</p>
                <small>${t.date}</small>
            </div>

            <div>
                <span style="color:${t.type === "debit" ? "red" : "green"}">
                ${t.type === "debit" ? "-" : "+"}${t.amount} MAD
                </span>
            </div>
        `;

        recentTransactionsList.appendChild(div);

    });

}

afficherTransactions();


// -------------------------
// ouverture section transfert
// -------------------------

quickTransferbtn.addEventListener('click', () => {
    transfersection.classList.remove("hidden");
});

closeTransferBtn.addEventListener('click', () => {
    transfersection.classList.add("hidden");
});

cancelTransferBtn.addEventListener('click', () => {
    transfersection.classList.add("hidden");
});


// -------------------------
// afficher beneficiaires
// -------------------------

users.forEach(u => {

    if (u.id !== user.id) {

        let opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = u.name;

        bselect.appendChild(opt);
    }

});


// -------------------------
// afficher cartes
// -------------------------

user.wallet.cards.forEach(card => {

    let opt = document.createElement('option');
    opt.value = card.numcards;
    opt.textContent = card.numcards;

    sourceCardSelect.appendChild(opt);

});


// -------------------------
// verification montant
// -------------------------

const checkAmount = (mont, callback) => {

    setTimeout(() => {

        if (mont > 0) {
            callback();
        } else {
            alert("❌ Montant invalide");
        }

    }, 500);

};


// -------------------------
// verification solde
// -------------------------

const checkSolde = (mont, carte, callback) => {

    let cd = user.wallet.cards.find(card => card.numcards === carte);

    if (!cd) {
        alert("Carte introuvable");
        return;
    }

    if (cd.balance >= mont) {
        callback();
    } else {
        alert("❌ Solde insuffisant");
    }

};


// -------------------------
// verifier beneficiaire
// -------------------------

const verifyBen = (id, callback) => {

    if (db.getUserById(id)) {
        callback();
    }

};


// -------------------------
// transaction credit
// -------------------------

const creerTC = (ben, mont, card, callback) => {

    let benef = db.getUserById(ben);

    const transaction = {
        id: Math.random(),
        type: 'credit',
        amount: mont,
        date: new Date().toISOString().slice(0,10),
        from: card,
        to: benef.name
    }

    benef.wallet.transactions.push(transaction);

    callback();
};


// -------------------------
// transaction debit
// -------------------------

const creerTD = (ben, mont, carte, callback) => {

    let benef = db.getUserById(ben);

    const transaction = {
        id: Math.random(),
        type: 'debit',
        amount: mont,
        date: new Date().toISOString().slice(0,10),
        from: carte,
        to: benef.name
    }

    user.wallet.transactions.push(transaction);

    callback();
};


// -------------------------
// debit user
// -------------------------

const debiter = (usr, mont, carte, callback) => {

    usr.wallet.balance -= mont;

    let cd = usr.wallet.cards.find(card => card.numcards === carte);

    cd.balance -= mont;

    callback();
};


// -------------------------
// credit beneficiaire
// -------------------------

const credit = (benId, mont, callback) => {

    let benef = db.getUserById(benId);

    benef.wallet.balance += mont;

    callback();
};


// -------------------------
// validation transfert
// -------------------------

const valider = () => {

    alert("✅ Transfer successful!");

    availableBalance.textContent = user.wallet.balance;

    let Ctransactions = user.wallet.transactions.filter(t => t.type === 'credit');
    monthlyIncome.textContent = Ctransactions.reduce((acc, curr) => acc + curr.amount, 0);

    let Dtransactions = user.wallet.transactions.filter(t => t.type === 'debit');
    monthlyExpenses.textContent = Dtransactions.reduce((acc, curr) => acc + curr.amount, 0);

    afficherTransactions();

    localStorage.setItem("currentUser", JSON.stringify(user));

    const index = db.allUsers.findIndex(u => u.id === user.id);

    if (index !== -1) {

        db.allUsers[index] = user;

        localStorage.setItem("allUsers", JSON.stringify(db.allUsers));
    }

};


// -------------------------
// gestion transfert
// -------------------------

function handleTransfert(callback) {

    let benId = bselect.value;
    let carte = sourceCardSelect.value;
    let mont = parseFloat(amount.value);

    let amt = mont;

    if (instantTransfer.checked) {
        amt += 13.4;
    }

    checkAmount(amt, () =>
        callback(amt, carte, () =>
            verifyBen(benId, () =>
                creerTC(benId, mont, carte, () =>
                    creerTD(benId, amt, carte, () =>
                        debiter(user, amt, carte, () =>
                            credit(benId, mont, valider)
                        )
                    )
                )
            )
        )
    );

}


// -------------------------
// bouton transfert
// -------------------------

submitTransferBtn.addEventListener("click", (e) => {

    e.preventDefault();

    handleTransfert(checkSolde);

});