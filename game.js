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
let unsubscribe = null;

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

const waitingArea = document.getElementById("waitingArea");
const cardArea = document.getElementById("cardArea");
const statusText = document.getElementById("statusText");

const category = document.getElementById("category");
const word = document.getElementById("word");
const taboo1 = document.getElementById("taboo1");
const taboo2 = document.getElementById("taboo2");
const taboo3 = document.getElementById("taboo3");

const beExplainerButton = document.getElementById("beExplainer");
const correctButton = document.getElementById("correct");
const skipButton = document.getElementById("skip");
const endButton = document.getElementById("endExplain");

console.log("🎲 Tabu Online gestartet");

function playerName() {
  return nameInput.value.trim() || "Spieler";
}

function randomCard() {
  return cards[Math.floor(Math.random() * cards.length)];
}

function openGameScreen() {
  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  gameCodeLabel.innerText = gameCode;
}

createButton.onclick = async () => {
  gameCode = Math.floor(100000 + Math.random() * 900000).toString();
  gameRef = doc(db, "games", gameCode);

  await setDoc(gameRef, {
    red: 0,
    blue: 0,
    currentCard: randomCard(),
    explainer: ""
  });

  openGameScreen();
  listenGame();
};

joinButton.onclick = async () => {
  gameCode = joinCodeInput.value.trim();

  if (!gameCode) {
    alert("Bitte Spielcode eingeben.");
    return;
  }

  gameRef = doc(db, "games", gameCode);
  const snap = await getDoc(gameRef);

  if (!snap.exists()) {
    alert("Spiel nicht gefunden.");
    return;
  }

  openGameScreen();
  listenGame();
};

function listenGame() {
  if (unsubscribe) {
    unsubscribe();
  }

  unsubscribe = onSnapshot(gameRef, (snap) => {
    if (!snap.exists()) {
      alert("Spiel wurde nicht gefunden.");
      return;
    }

    const d = snap.data();

    redScore.innerText = d.red ?? 0;
    blueScore.innerText = d.blue ?? 0;

    if (d.currentCard) {
      category.innerText = d.currentCard.category;
      word.innerText = d.currentCard.word;
      taboo1.innerText = d.currentCard.taboo[0];
      taboo2.innerText = d.currentCard.taboo[1];
      taboo3.innerText = d.currentCard.taboo[2];
    }

    if (!d.explainer) {
      waitingArea.classList.remove("hidden");
      cardArea.classList.add("hidden");
      statusText.innerText = "Niemand erklärt gerade.";
      beExplainerButton.classList.remove("hidden");
      return;
    }

    if (d.explainer === playerName()) {
      waitingArea.classList.add("hidden");
      cardArea.classList.remove("hidden");
      return;
    }

    waitingArea.classList.remove("hidden");
    cardArea.classList.add("hidden");
    statusText.innerText = d.explainer + " erklärt gerade.";
    beExplainerButton.classList.add("hidden");
  });
}

beExplainerButton.onclick = async () => {
  await updateDoc(gameRef, {
    explainer: playerName()
  });
};

correctButton.onclick = async () => {
  const snap = await getDoc(gameRef);
  const d = snap.data();

  if (teamInput.value === "red") {
    await updateDoc(gameRef, {
      red: (d.red ?? 0) + 1,
      currentCard: randomCard()
    });
  } else {
    await updateDoc(gameRef, {
      blue: (d.blue ?? 0) + 1,
      currentCard: randomCard()
    });
  }
};

skipButton.onclick = async () => {
  await updateDoc(gameRef, {
    currentCard: randomCard()
  });
};

endButton.onclick = async () => {
  await updateDoc(gameRef, {
    explainer: ""
  });
};
