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

let playerId = localStorage.getItem("tabuPlayerId");
if (!playerId) {
  playerId = crypto.randomUUID();
  localStorage.setItem("tabuPlayerId", playerId);
}

const $ = (id) => document.getElementById(id);

const startScreen = $("startScreen");
const gameScreen = $("gameScreen");

const playerName = $("playerName");
const teamSelect = $("teamSelect");
const startCategory = $("startCategory");
const joinCode = $("joinCode");

const createGameBtn = $("createGame");
const joinGameBtn = $("joinGame");

const gameCodeText = $("gameCode");
const redScore = $("redScore");
const blueScore = $("blueScore");

const gameCategory = $("gameCategory");
const changeCategoryBtn = $("changeCategory");

const waitingArea = $("waitingArea");
const cardArea = $("cardArea");
const statusText = $("statusText");

const beExplainerBtn = $("beExplainer");
const correctBtn = $("correct");
const skipBtn = $("skip");
const endBtn = $("endExplain");

const categoryText = $("categoryText");
const wordText = $("wordText");
const taboo1 = $("taboo1");
const taboo2 = $("taboo2");
const taboo3 = $("taboo3");

function getName() {
  return playerName.value.trim() || "Spieler";
}

function makeDeck(category) {
  const deck = [];

  cards.forEach((card, index) => {
    if (category === "Alle" || card.category === category) {
      deck.push(index);
    }
  });

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

function showGameScreen() {
  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  gameCodeText.innerText = gameCode;
}

function showWaiting(text, showButton) {
  waitingArea.classList.remove("hidden");
  cardArea.classList.add("hidden");

  statusText.innerText = text;
  beExplainerBtn.style.display = showButton ? "block" : "none";
}

function showCard(card) {
  waitingArea.classList.add("hidden");
  cardArea.classList.remove("hidden");

  categoryText.innerText = card.category;
  wordText.innerText = card.word;
  taboo1.innerText = card.taboo[0];
  taboo2.innerText = card.taboo[1];
  taboo3.innerText = card.taboo[2];
}

async function createGame() {
  const category = startCategory.value;

  if (!category) {
    alert("Bitte zuerst eine Kategorie auswählen.");
    return;
  }

  const deck = makeDeck(category);

  if (deck.length === 0) {
    alert("Keine Karten in dieser Kategorie gefunden.");
    return;
  }

  gameCode = Math.floor(100000 + Math.random() * 900000).toString();
  gameRef = doc(db, "games", gameCode);

  await setDoc(gameRef, {
    red: 0,
    blue: 0,
    category: category,
    deck: deck,
    deckPosition: 0,
    cardIndex: deck[0],
    explainerId: playerId,
    explainerName: getName(),
    explainerTeam: teamSelect.value
  });

  gameCategory.value = category;
  showGameScreen();
  listenGame();
}

async function joinGame() {
  gameCode = joinCode.value.trim();

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
  gameCategory.value = data.category || "Alle";

  showGameScreen();
  listenGame();
}

function listenGame() {
  if (unsubscribe) {
    unsubscribe();
  }

  unsubscribe = onSnapshot(gameRef, (snap) => {
    if (!snap.exists()) {
      alert("Spiel wurde nicht gefunden.");
      return;
    }

    const data = snap.data();

    redScore.innerText = data.red ?? 0;
    blueScore.innerText = data.blue ?? 0;
    gameCategory.value = data.category || "Alle";

    if (!data.explainerId) {
      showWaiting("Niemand erklärt gerade.", true);
      return;
    }

    if (data.explainerId === playerId) {
      const card = cards[data.cardIndex];
      showCard(card);
      return;
    }

    showWaiting(data.explainerName + " erklärt gerade.", false);
  });
}

async function nextCard() {
  const snap = await getDoc(gameRef);
  const data = snap.data();

  let deck = [...data.deck];
  let position = data.deckPosition + 1;

  if (position >= deck.length) {
    deck = makeDeck(data.category || "Alle");
    position = 0;
  }

  await updateDoc(gameRef, {
    deck: deck,
    deckPosition: position,
    cardIndex: deck[position]
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
    explainerName: getName(),
    explainerTeam: teamSelect.value
  });
}

async function correct() {
  const snap = await getDoc(gameRef);
  const data = snap.data();

  if (data.explainerId !== playerId) {
    alert("Nur der Erklärer darf Punkte geben.");
    return;
  }

  if (data.explainerTeam === "red") {
    await updateDoc(gameRef, {
      red: (data.red ?? 0) + 1
    });
  } else {
    await updateDoc(gameRef, {
      blue: (data.blue ?? 0) + 1
    });
  }

  await nextCard();
}

async function skip() {
  const snap = await getDoc(gameRef);
  const data = snap.data();

  if (data.explainerId !== playerId) {
    alert("Nur der Erklärer darf Karten überspringen.");
    return;
  }

  await nextCard();
}

async function endExplain() {
  const snap = await getDoc(gameRef);
  const data = snap.data();

  if (data.explainerId !== playerId) {
    alert("Nur der Erklärer darf beenden.");
    return;
  }

  await updateDoc(gameRef, {
    explainerId: "",
    explainerName: "",
    explainerTeam: ""
  });
}

async function changeCategory() {
  const category = gameCategory.value;

  const deck = makeDeck(category);

  if (deck.length === 0) {
    alert("Keine Karten in dieser Kategorie gefunden.");
    return;
  }

  await updateDoc(gameRef, {
    category: category,
    deck: deck,
    deckPosition: 0,
    cardIndex: deck[0],
    explainerId: "",
    explainerName: "",
    explainerTeam: ""
  });
}

createGameBtn.onclick = createGame;
joinGameBtn.onclick = joinGame;
beExplainerBtn.onclick = becomeExplainer;
correctBtn.onclick = correct;
skipBtn.onclick = skip;
endBtn.onclick = endExplain;
changeCategoryBtn.onclick = changeCategory;

console.log("✅ Tabu Online 2.0 gestartet");
