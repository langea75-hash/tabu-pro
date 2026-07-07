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

function getPlayerName() {
  return nameInput.value.trim() || "Spieler";
}

function getRandomCard() {
  return cards[Math.floor(Math.random() * cards.length)];
}

function showStart() {
  startScreen.classList.remove("hidden");
  gameScreen.classList.add("hidden");
}

function showGame() {
  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  gameCodeLabel.innerText = gameCode;
}

function showWaiting(text, showButton = true) {
  waitingArea.classList.remove("hidden");
  cardArea.classList.add("hidden");

  statusText.innerText = text;

  if (showButton) {
    beExplainerButton.classList.remove("hidden");
  } else {
    beExplainerButton.classList.add("hidden");
  }

  clearCard();
}

function showCard(card) {
  waitingArea.classList.add("hidden");
  cardArea.classList.remove("hidden");

  category.innerText = card.category;
  word.innerText = card.word;
  taboo1.innerText = card.taboo[0];
  taboo2.innerText = card.taboo[1];
  taboo3.innerText = card.taboo[2];
}

function clearCard() {
  category.innerText = "";
  word.innerText = "";
  taboo1.innerText = "";
  taboo2.innerText = "";
  taboo3.innerText = "";
}

async function createGame() {
  const name = getPlayerName();

  gameCode = Math.floor(100000 + Math.random() * 900000).toString();
  gameRef = doc(db, "games", gameCode);

  await setDoc(gameRef, {
    red: 0,
    blue: 0,
    currentCard: getRandomCard(),
    explainer: "",
    explainerTeam: "",
    createdAt: Date.now()
  });

  showGame();
  listenGame();
}

async function joinGame() {
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

  showGame();
  listenGame();
}

function listenGame() {
  if (unsubscribe) {
    unsubscribe();
  }

  unsubscribe = onSnapshot(gameRef, (snap) => {
    if (!snap.exists()) {
      alert("Spiel wurde nicht gefunden.");
      showStart();
      return;
    }

    const data = snap.data();
    const currentPlayer = getPlayerName();

    redScore.innerText = data.red ?? 0;
    blueScore.innerText = data.blue ?? 0;

    if (!data.explainer) {
      showWaiting("Niemand erklärt gerade.", true);
      return;
    }

    if (data.explainer === currentPlayer) {
      showCard(data.currentCard);
      return;
    }

    showWaiting(`${data.explainer} erklärt gerade.`, false);
  });
}

async function becomeExplainer() {
  const snap = await getDoc(gameRef);
  const data = snap.data();

  if (data.explainer) {
    alert(`${data.explainer} erklärt bereits.`);
    return;
  }

  await updateDoc(gameRef, {
    explainer: getPlayerName(),
    explainerTeam: teamInput.value,
    currentCard: getRandomCard()
  });
}

async function correctAnswer() {
  const snap = await getDoc(gameRef);
  const data = snap.data();

  if (data.explainer !== getPlayerName()) {
    alert("Nur der Erklärer darf Punkte geben.");
    return;
  }

  const team = data.explainerTeam || teamInput.value;

  if (team === "red") {
    await updateDoc(gameRef, {
      red: (data.red ?? 0) + 1,
      currentCard: getRandomCard()
    });
  } else {
    await updateDoc(gameRef, {
      blue: (data.blue ?? 0) + 1,
      currentCard: getRandomCard()
    });
  }
}

async function skipCard() {
  const snap = await getDoc(gameRef);
  const data = snap.data();

  if (data.explainer !== getPlayerName()) {
    alert("Nur der Erklärer darf die Karte wechseln.");
    return;
  }

  await updateDoc(gameRef, {
    currentCard: getRandomCard()
  });
}

async function endExplanation() {
  const snap = await getDoc(gameRef);
  const data = snap.data();

  if (data.explainer !== getPlayerName()) {
    alert("Nur der Erklärer darf die Erklärung beenden.");
    return;
  }

  await updateDoc(gameRef, {
    explainer: "",
    explainerTeam: ""
  });
}

createButton.onclick = createGame;
joinButton.onclick = joinGame;
beExplainerButton.onclick = becomeExplainer;
correctButton.onclick = correctAnswer;
skipButton.onclick = skipCard;
endButton.onclick = endExplanation;

console.log("Tabu Online gestartet");
