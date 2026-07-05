import { db } from "./firebase.js";
import { cards } from "./cards.js";

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

let gameCode = "";
let gameRef = null;

const createButton = document.getElementById("createGame");
const joinButton = document.getElementById("joinGame");

const nameInput = document.getElementById("playerName");
const teamInput = document.getElementById("team");
const joinCodeInput = document.getElementById("joinCode");

const startScreen = document.getElementById("start");
const gameScreen = document.getElementById("game");

const gameCodeLabel = document.getElementById("gameCode");

const redScore = document.getElementById("redScore");
const blueScore = document.getElementById("blueScore");

const category = document.getElementById("category");
const word = document.getElementById("word");

const taboo1 = document.getElementById("taboo1");
const taboo2 = document.getElementById("taboo2");
const taboo3 = document.getElementById("taboo3");

console.log("Tabu Online gestartet");

createButton.onclick = async () => {

    gameCode = Math.floor(
        100000 + Math.random() * 900000
    ).toString();

    gameRef = doc(db, "games", gameCode);

    await setDoc(gameRef, {

        red:0,
        blue:0,

        currentCard:cards[0]

    });

    startScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");

    gameCodeLabel.innerText = gameCode;

    listenGame();

};

joinButton.onclick = async ()=>{

    gameCode = joinCodeInput.value;

    gameRef = doc(db,"games",gameCode);

    const snap = await getDoc(gameRef);

    if(!snap.exists()){

        alert("Spiel nicht gefunden");

        return;

    }

    startScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");

    gameCodeLabel.innerText = gameCode;

    listenGame();

};

function listenGame(){

    onSnapshot(gameRef,(snap)=>{

        const d = snap.data();

        redScore.innerText = d.red;
        blueScore.innerText = d.blue;

        category.innerText = d.currentCard.category;
        word.innerText = d.currentCard.word;

        taboo1.innerText = d.currentCard.taboo[0];
        taboo2.innerText = d.currentCard.taboo[1];
        taboo3.innerText = d.currentCard.taboo[2];

    });
document.getElementById("correct").onclick = async () => {

    const snap = await getDoc(gameRef);
    const d = snap.data();

    const team = teamInput.value;

    if (team === "red") {
        await updateDoc(gameRef, {
            red: d.red + 1,
            currentCard: cards[Math.floor(Math.random() * cards.length)]
        });
    } else {
        await updateDoc(gameRef, {
            blue: d.blue + 1,
            currentCard: cards[Math.floor(Math.random() * cards.length)]
        });
    }

};

document.getElementById("skip").onclick = async () => {

    await updateDoc(gameRef, {
        currentCard: cards[Math.floor(Math.random() * cards.length)]
    });

};

document.getElementById("endExplain").onclick = () => {
    alert("Runde beendet!");
};

