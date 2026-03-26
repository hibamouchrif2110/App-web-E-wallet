import { getbeneficiaries, finduserbyaccount, findbeneficiarieByid } from "../Model/database.js";

const user = JSON.parse(sessionStorage.getItem("currentUser"));

// DOM elements
const greetingName = document.getElementById("greetingName");
const currentDate = document.getElementById("currentDate");
const solde = document.getElementById("availableBalance");
const incomeElement = document.getElementById("monthlyIncome");
const expensesElement = document.getElementById("monthlyExpenses");
const activecards = document.getElementById("activeCards");
const transactionsList = document.getElementById("recentTransactionsList");
const transferBtn = document.getElementById("quickTransfer");
const transferSection = document.getElementById("transferPopup");
const closeTransferBtn = document.getElementById("closeTransferBtn");
const cancelTransferBtn = document.getElementById("cancelTransferBtn");
const beneficiarySelect = document.getElementById("beneficiary");
const sourceCard = document.getElementById("sourceCard");
const submitTransferBtn = document.getElementById("submitTransferBtn");

// Guard
if (!user) {
  alert("User not authenticated");
  window.location.href = "/index.html";
}

// Events
transferBtn.addEventListener("click", handleTransfersection);
closeTransferBtn.addEventListener("click", closeTransfer);
cancelTransferBtn.addEventListener("click", closeTransfer);
submitTransferBtn.addEventListener("click", handleTransfer);

// Retrieve dashboard data
const getDashboardData = () => {
  const monthlyIncome = user.wallet.transactions
    .filter((t) => t.type === "credit")
    .reduce((total, t) => total + t.amount, 0);

  const monthlyExpenses = user.wallet.transactions
    .filter((t) => t.type === "debit")
    .reduce((total, t) => total + t.amount, 0);

  return {
    userName: user.name,
    currentDate: new Date().toLocaleDateString("fr-FR"),
    availableBalance: `${user.wallet.balance} ${user.wallet.currency}`,
    activeCards: user.wallet.cards.length,
    monthlyIncome: `${monthlyIncome} MAD`,
    monthlyExpenses: `${monthlyExpenses} MAD`,
  };
};

function renderDashboard() {
  const dashboardData = getDashboardData();
  if (dashboardData) {
    greetingName.textContent = dashboardData.userName;
    currentDate.textContent = dashboardData.currentDate;
    solde.textContent = dashboardData.availableBalance;
    incomeElement.textContent = dashboardData.monthlyIncome;
    expensesElement.textContent = dashboardData.monthlyExpenses;
    activecards.textContent = dashboardData.activeCards;
  }

  transactionsList.innerHTML = "";
  user.wallet.transactions.forEach((transaction) => {
    const transactionItem = document.createElement("div");
    transactionItem.className = "transaction-item";
    transactionItem.innerHTML = `
      <div>${transaction.date}</div>
      <div>${transaction.amount} MAD</div>
      <div>${transaction.type}</div>
      <div>${transaction.status ==='failed'? 'failed':'succes'}</div>
    `;
    transactionsList.appendChild(transactionItem);
  });
}

renderDashboard();

// Transfer popup
function closeTransfer() {
  transferSection.classList.remove("active");
  document.body.classList.remove("popup-open");
}

function handleTransfersection() {
  transferSection.classList.add("active");
  document.body.classList.add("popup-open");
}

// Beneficiaries
const beneficiaries = getbeneficiaries(user.id);

function renderBeneficiaries() {
  beneficiaries.forEach((beneficiary) => {
    const option = document.createElement("option");
    option.value = beneficiary.id;
    option.textContent = beneficiary.name;
    beneficiarySelect.appendChild(option);
  });
}
renderBeneficiaries();

function renderCards() {
  user.wallet.cards.forEach((card) => {
    const option = document.createElement("option");
    option.value = card.numcards;
    option.textContent = card.type + "****" + card.numcards;
    sourceCard.appendChild(option);
  });
}
renderCards();


function checkUser(numcompte) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const beneficiary = finduserbyaccount(numcompte);
      if (beneficiary) {
        resolve(beneficiary); 
      } else {
        reject("Destinataire introuvable"); 
      }
    }, 2000);
  });
}


function checkSolde(expediteur, amount) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (expediteur.wallet.balance > amount) {
        resolve("Solde suffisant"); 
      } else {
        reject("Solde insuffisant"); 
      }
    }, 3000);
  });
}


function updateSolde(expediteur, destinataire, amount) {
  return new Promise((resolve) => {
    setTimeout(() => {
      expediteur.wallet.balance -= amount;
      destinataire.wallet.balance += amount;
      resolve("Mise à jour du solde effectuée"); 
    }, 200);
  });
}


function addtransactions(expediteur, destinataire, amount) {
  return new Promise((resolve) => {
    setTimeout(() => {
      
      const credit = {
        id: Date.now(),
        type: "credit",
        amount: amount,
        date: new Date().toLocaleString(),
        from: expediteur.name,
      };

      
      const debit = {
        id: Date.now(),
        type: "debit",
        amount: amount,
        date: new Date().toLocaleString(),
        to: destinataire.name,
      };

      expediteur.wallet.transactions.push(debit);
      destinataire.wallet.transactions.push(credit);

      resolve("Transaction ajoutée avec succès"); 
    }, 3000);
  });
}


function transfer(expediteur, numcompte, amount) {//num du dest

  checkUser(numcompte) //p0
    .then((destinataire) => {//p1
      console.log("Étape 1  : Destinataire trouvé -", destinataire.name);
      return checkSolde(expediteur, amount) // p2
        .then((soldeMessage) => { //p3
          console.log("Étape 2  :", soldeMessage);
          return updateSolde(expediteur, destinataire, amount); //p4
        })
        .then((updateMessage) => {
          console.log("Étape 3  :", updateMessage);
          return addtransactions(expediteur, destinataire, amount);
        })
        .then((addTransactionMessage) => {
          console.log("Étape 4  :", addTransactionMessage);
          console.log(" Virement effectué avec succès !");
          renderDashboard(); // on rafraîchit l'affichage
          closeTransfer();   // on ferme le popup
        });
    })
    .catch((erreur) => {
      
      console.log(" Erreur :", erreur);
      alert("Erreur : " + erreur);
    });
}

function handleTransfer(e) {
  e.preventDefault();
  const beneficiaryId = document.getElementById("beneficiary").value;
  const beneficiaryAccount = findbeneficiarieByid(user.id, beneficiaryId).account;
  const sourceCard = document.getElementById("sourceCard").value;
  const amount = Number(document.getElementById("amount").value);

  transfer(user, beneficiaryAccount, amount);
}
// RECHARGEMENT//
// 
const openTopupButton = document.getElementById("quickTopup");
const topupModal = document.getElementById("topupPopup");
const closeModalButton = document.getElementById("closeTopupBtn");
const cancelTopupButton = document.getElementById("cancelTopupBtn");
const confirmTopupButton = document.getElementById("submitTopupBtn");
const cardSelect = document.getElementById("topupCard");//select 

//events
openTopupButton.addEventListener("click", showTopupModal);
closeModalButton.addEventListener("click", hideTopupModal);
cancelTopupButton.addEventListener("click", hideTopupModal);
function showTopupModal(){
  topupModal.classList.add("active");
  document.body.classList.add("popu-open");

}
function hideTopupModal(){
  topupModal.classList.remove("active");
  document.body.classList.remove("popup-open");

}

function loadUserCards(){
  user.wallet.cards.forEach((card)=>{
    const option= document.createElement("option");
    option.value=card.numcards;
    option.textContent=`${card.type}****${card.numcards}`;
    cardSelect.appendChild(option);
  });
}
loadUserCards();
// promesse
function validateAmount(amount){
  return new Promise((resolve,reject) =>{
    setTimeout(() =>{
      if(!amount || amount<=0){
        reject("montant invalide");
      }else if(amount<10 || amount> 5000){
        reject("montant doit etre entre 10 et 5000 MAD");

      }else{
        resolve();
      }
    },500);
  });
  
}
function validateCard(user,cardNumber){
  return new Promise((resolve,reject)=>{
    setTimeout(()=>{
      const card=user.wallet.cards.find(c=>c.numcards===cardNumber);
      if(!card){
        reject("card introuvable");

      }else{
        const today=new Date();
        const expiryDate= new Date(card.expiry);
        if(expiryDate<today){
          reject("carte expiree");

        }else{
          resolve(card);
        }
      }
    },500);
  });
}
function updateBalances(user, card, amount){
  return new Promise((resolve,reject)=>{
    setTimeout(()=>{
      if(card.balance<amount){
        reject("solde insuffisant sur la carte");
      }else {
        card.balance-=amount;
        user.wallet.balance+=amount;
        resolve();
      }
      
    },500);
  });
}
function addTopupTransaction(user,amount,card,status){
  return new Promise((resolve) =>{
    setTimeout(()=>{
      const transaction= {
        id: Date.now(),
        type: "recharge",
        amount: amount,
        date: new Date().toLocaleString(),
        from: card.numcards,
        status:status

      };
      user.wallet.transactions.push(transaction);
      resolve();

    },500);
  });
}
function topup(user,cardNumber,amount) {
  validateAmount(amount)
  .then(()=> validateCard(user,cardNumber))
  .then((card)=>{return updateBalances(user,card,amount)
    .then(()=>card);

  }).then((card)=>{
    return addTopupTransaction(user,amount,card,"success");

  })
  .then(()=>{
    alert("rechargement reussi");
    renderDashboard();
    hideTopupModal();

  })
  .catch((error)=>{
    console.log(error);
    const card=user.wallet.cards.find(c=>c.numcards===cardNumber);
    if(card){
      addTopupTransaction(user,amount,card,"failed")
       .then(() => {
        renderDashboard(); 
      });
    }
    alert("erreur"+error);
  });
}
confirmTopupButton.addEventListener("click", handleTopup);
function handleTopup(e) {
  e.preventDefault();

  const selectedCardNumber = cardSelect.value;
  const enteredAmount = Number(document.getElementById("topupAmount").value);

  topup(user, selectedCardNumber, enteredAmount);
}
