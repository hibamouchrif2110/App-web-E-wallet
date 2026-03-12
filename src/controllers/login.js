import db from "../models/database.js";

const submitbtn = document.getElementById('submitbtn');
const mailinput = document.getElementById('mail');
const passwordinput = document.getElementById('password');

submitbtn.addEventListener('click', handlesubmit);

function handlesubmit() {
    const user = db.finduserbymail(mailinput.value, passwordinput.value);
    submitbtn.textContent='checking.....';
    setTimeout(() => {
        if (user) {
            localStorage.setItem('currentUser',JSON.stringify(user));
            document.location = '../view/dashboard.html';
        } else {
            alert('bad credentials !!!');
        }
    },3000)

}