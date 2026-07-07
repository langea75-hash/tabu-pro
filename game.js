import { db } from "./firebase.js";
import { cards } from "./cards.js";

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// --------------------------------------------------
// Variablen
// --------------------------------------------------

let gameCode = "";
let gameRef = null;
let unsubscribe = null;

let currentDeck = [];
let currentIndex = 0;

// eindeutige Geräte-ID
let playerId = localStorage.getItem("tabuPlayerId");

if (!playerId) {
  playerId = crypto.randomUUID();
  localStorage.setItem("tabuPlayerId", playerId);
}

// --------------------------------------------------
// Buttons
// --------------------------------------------------

const createButton = document.getElementById("createGame");
const joinButton = document.getElementById("joinGame");

const correctButton = document.getElementById("correct");
const skipButton = document.getElementById("skip");
const endButton = document.getElementById("endExplain");

const changeCategoryButton =
  document.getElementById("changeCategory");

const beExplainerButton =
  document.getElementById("beExplainer");

// --------------------------------------------------
// Eingaben
// --------------------------------------------------

const playerNameInput =
  document.getElementById("playerName");

const teamInput =
  document.getElementById("team");

const joinCodeInput =
  document.getElementById("joinCode");

const categorySelect =
  document.getElementById("categorySelect");

// --------------------------------------------------
// Anzeigen
// --------------------------------------------------

const startScreen =
  document.getElementById("start");

const gameScreen =
  document.getElementById("game");

const waitingArea =
  document.getElementById("waitingArea");

const cardArea =
  document.getElementById("cardArea");

const statusText =
  document.getElementById("statusText");

const gameCodeLabel =
  document.getElementById("gameCode");

const redScore =
  document.getElementById("redScore");

const blueScore =
  document.getElementById("blueScore");

const category =
  document.getElementById("category");

const word =
  document.getElementById("word");

const taboo1 =
  document.getElementById("taboo1");

const taboo2 =
  document.getElementById("taboo2");

const taboo3 =
  document.getElementById("taboo3");

console.log("Tabu Online 2.0 gestartet");
function getPlayerName() {
  return playerNameInput.value.trim() || "Spieler";
}

function getPlayerTeam() {
  return teamInput.value;
}

function getSelectedCategory() {
  return categorySelect.value;
}

function getCardsForCategory(selectedCategory) {
  if (selectedCategory === "Alle") {
    return cards;
  }

  return cards.filter(card => card.category === selectedCategory);
}

function shuffleArray(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }

  return copy;
}

function createDeck(selectedCategory) {
  const filteredCards = getCardsForCategory(selectedCategory);

  if (filteredCards.length === 0) {
    return [];
  }

  return shuffleArray(filteredCards);
}

function showGameScreen() {
  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  gameCodeLabel.innerText = gameCode;
}

function showStartScreen() {
  startScreen.classList.remove("hidden");
  gameScreen.classList.add("hidden");
}

function clearCard() {
  category.innerText = "";
  word.innerText = "";
  taboo1.innerText = "";
  taboo2.innerText = "";
  taboo3.innerText = "";
}

function showWaiting(text, showButton) {
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

async function createGame() {
  const selectedCategory = getSelectedCategory();

  if (!selectedCategory) {
    alert("Bitte zuerst eine Kategorie auswählen.");
    return;
  }

  const deck = createDeck(selectedCategory);

  if (deck.length === 0) {
    alert("Keine Karten in dieser Kategorie gefunden.");
    return;
  }

  gameCode = Math.floor(100000 + Math.random() * 900000).toString();
  gameRef = doc(db, "games", gameCode);

  await setDoc(gameRef, {
    red: 0,
    blue: 0,
    category: selectedCategory,
    deck: deck,
    deckIndex: 0,
    currentCard: deck[0],
    explainerId: "",
    explainerName: "",
    explainerTeam: "",
    createdAt: Date.now()
  });

  showGameScreen();
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

  const data = snap.data();

  if (data.category) {
    categorySelect.value = data.category;
  }

  showGameScreen();
  listenGame();
}
function listenGame() {

  if (unsubscribe) {
    unsubscribe();
  }

  unsubscribe = onSnapshot(gameRef, (snap) => {

    if (!snap.exists()) {
      alert("Spiel existiert nicht mehr.");
      showStartScreen();
      return;
    }

    const data = snap.data();

    redScore.innerText = data.red ?? 0;
    blueScore.innerText = data.blue ?? 0;

    // Niemand erklärt
    if (!data.explainerId) {

      showWaiting(
        "Niemand erklärt gerade.",
        true
      );

      return;
    }

    // Nur der Erklärer darf die Karte sehen
    if (data.explainerId === playerId) {

      showCard(data.currentCard);

    } else {

      waitingArea.classList.remove("hidden");
      cardArea.classList.add("hidden");

      statusText.innerText =
        data.explainerName + " erklärt gerade.";

    }

  });

}
async function becomeExplainer() {

  const snap = await getDoc(gameRef);

  const data = snap.data();

  if (data.explainerId) {

    alert(data.explainerName + " erklärt bereits.");

    return;

  }

  await updateDoc(gameRef, {

    explainerId: playerId,

    explainerName: getPlayerName(),

    explainerTeam: getPlayerTeam()

  });

}
createButton.onclick = createGame;
joinButton.onclick = joinGame;

beExplainerButton.onclick = becomeExplainer;
