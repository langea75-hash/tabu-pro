import { db } from "./firebase.js";
import { cards } from "./cards.js";
import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
  cleanPlayerName,
  findPlayer,
  getPlayerId,
  nextPlayerIndex
} from "./players.js";

import {
  advanceCard,
  advanceCategory,
  getCategories,
  getCurrentCardIndex,
  getCurrentCategory,
  makeAllDecks,
  shuffle
} from "./deck.js";

const playerId = getPlayerId();

let gameCode = "";
let gameRef = null;
let unsubscribe = null;
let latestGame = null;

const $ = (id) => document.getElementById(id);

const startScreen = $("startScreen");
const gameScreen = $("gameScreen");
const playerNameInput = $("playerName");
const teamSelect = $("teamSelect");
const joinCodeInput = $("joinCode");
const createButton = $("createGame");
const joinButton = $("joinGame");
const startMessage = $("startMessage");

const gameCodeText = $("gameCode");
const roundNumber = $("roundNumber");
const redScore = $("redScore");
const blueScore = $("blueScore");
const playersList = $("playersList");
const explainerName = $("explainerName");
const categoryName = $("categoryName");
const statusText = $("statusText");
const cardArea = $("cardArea");
const cardCategory = $("cardCategory");
const wordText = $("wordText");
const taboo1 = $("taboo1");
const taboo2 = $("taboo2");
const taboo3 = $("taboo3");
const correctButton = $("correct");
const skipButton = $("skip");
const endRoundButton = $("endRound");
const gameMessage = $("gameMessage");

function setBusy(button, busy) {
  button.disabled = busy;
}

function showMessage(element, text) {
  element.textContent = text;
}

function openGame() {
  startScreen.classList.add("hidden");
  gameScreen.classList.remove("hidden");
  gameCodeText.textContent = gameCode;
}

function renderPlayers(game) {
  playersList.replaceChildren();

  game.players.forEach((player, index) => {
    const row = document.createElement("div");
    row.className = "playerRow";
    if (index === game.currentPlayerIndex) row.classList.add("active");

    const name = document.createElement("span");
    name.textContent = player.name;

    const team = document.createElement("span");
    team.className = "playerTeam";
    team.textContent = player.team === "red" ? "🔴 Rot" : "🔵 Blau";

    row.append(name, team);
    playersList.append(row);
  });
}

function hidePrivateCard() {
  cardArea.classList.add("hidden");
  cardCategory.textContent = "";
  wordText.textContent = "";
  taboo1.textContent = "";
  taboo2.textContent = "";
  taboo3.textContent = "";
}

function renderGame(game) {
  latestGame = game;

  const players = Array.isArray(game.players) ? game.players : [];
  const currentPlayer = players[Number(game.currentPlayerIndex ?? 0)];
  const category = getCurrentCategory(game);
  const me = findPlayer(players, playerId);
  const amExplainer = Boolean(me && currentPlayer?.id === playerId);
  const enoughPlayers = players.length >= 2;

  redScore.textContent = String(game.red ?? 0);
  blueScore.textContent = String(game.blue ?? 0);
  roundNumber.textContent = String(game.round ?? 1);
  explainerName.textContent = currentPlayer?.name ?? "Warte auf Spieler …";
  categoryName.textContent = category || "–";

  renderPlayers({ ...game, players });

  if (!enoughPlayers) {
    statusText.textContent = "Mindestens zwei Spieler müssen beitreten.";
    hidePrivateCard();
    return;
  }

  if (amExplainer) {
    const cardIndex = getCurrentCardIndex(game);
    const card = cards[cardIndex];

    if (!card) {
      statusText.textContent = "Für diese Kategorie wurde keine Karte gefunden.";
      hidePrivateCard();
      return;
    }

    statusText.textContent = "Du erklärst. Nur du siehst die Karte.";
    cardArea.classList.remove("hidden");
    cardCategory.textContent = card.category;
    wordText.textContent = card.word;
    taboo1.textContent = card.taboo?.[0] ?? "–";
    taboo2.textContent = card.taboo?.[1] ?? "–";
    taboo3.textContent = card.taboo?.[2] ?? "–";
  } else {
    statusText.textContent = "Ratet den Begriff. Die Karte bleibt geheim.";
    hidePrivateCard();
  }
}

function listenToGame() {
  unsubscribe?.();

  unsubscribe = onSnapshot(
    gameRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        showMessage(gameMessage, "Dieses Spiel existiert nicht mehr.");
        return;
      }

      renderGame(snapshot.data());
    },
    (error) => {
      console.error(error);
      showMessage(gameMessage, "Verbindung zur Datenbank unterbrochen.");
    }
  );
}

async function createGame() {
  const name = cleanPlayerName(playerNameInput.value);

  if (!name) {
    showMessage(startMessage, "Bitte deinen Namen eingeben.");
    return;
  }

  const categories = getCategories(cards);

  if (categories.length === 0) {
    showMessage(startMessage, "Keine Kartenkategorien gefunden.");
    return;
  }

  setBusy(createButton, true);
  showMessage(startMessage, "");

  try {
    gameCode = String(Math.floor(100000 + Math.random() * 900000));
    gameRef = doc(db, "games", gameCode);

    const categoryOrder = shuffle(categories);

    await setDoc(gameRef, {
      red: 0,
      blue: 0,
      round: 1,
      players: [{ id: playerId, name, team: teamSelect.value }],
      currentPlayerIndex: 0,
      categoryOrder,
      categoryPosition: 0,
      decks: makeAllDecks(cards, categories),
      createdAt: Date.now()
    });

    openGame();
    listenToGame();
  } catch (error) {
    console.error(error);
    showMessage(startMessage, "Spiel konnte nicht erstellt werden.");
  } finally {
    setBusy(createButton, false);
  }
}

async function joinGame() {
  const name = cleanPlayerName(playerNameInput.value);
  const code = joinCodeInput.value.trim();

  if (!name) {
    showMessage(startMessage, "Bitte deinen Namen eingeben.");
    return;
  }

  if (!/^\d{6}$/.test(code)) {
    showMessage(startMessage, "Bitte einen gültigen 6-stelligen Spielcode eingeben.");
    return;
  }

  setBusy(joinButton, true);
  showMessage(startMessage, "");

  try {
    gameCode = code;
    gameRef = doc(db, "games", gameCode);

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(gameRef);

      if (!snapshot.exists()) throw new Error("NOT_FOUND");

      const game = snapshot.data();
      const players = Array.isArray(game.players) ? [...game.players] : [];
      const existingIndex = players.findIndex((player) => player.id === playerId);

      if (existingIndex === -1 && players.length >= 4) {
        throw new Error("FULL");
      }

      if (existingIndex === -1) {
        players.push({ id: playerId, name, team: teamSelect.value });
      } else {
        players[existingIndex] = { ...players[existingIndex], name, team: teamSelect.value };
      }

      transaction.update(gameRef, { players });
    });

    openGame();
    listenToGame();
  } catch (error) {
    console.error(error);

    if (error.message === "NOT_FOUND") {
      showMessage(startMessage, "Spiel nicht gefunden.");
    } else if (error.message === "FULL") {
      showMessage(startMessage, "Das Spiel ist bereits voll (maximal 4 Spieler).");
    } else {
      showMessage(startMessage, "Beitritt fehlgeschlagen.");
    }
  } finally {
    setBusy(joinButton, false);
  }
}

async function updateAsExplainer(action) {
  if (!gameRef) return;

  try {
    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(gameRef);
      if (!snapshot.exists()) throw new Error("NOT_FOUND");

      const game = snapshot.data();
      const players = Array.isArray(game.players) ? game.players : [];
      const currentPlayer = players[Number(game.currentPlayerIndex ?? 0)];

      if (!currentPlayer || currentPlayer.id !== playerId) {
        throw new Error("NOT_EXPLAINER");
      }

      const update = action(game, currentPlayer);
      transaction.update(gameRef, update);
    });

    showMessage(gameMessage, "");
  } catch (error) {
    console.error(error);

    if (error.message === "NOT_EXPLAINER") {
      showMessage(gameMessage, "Nur der aktuelle Erklärer darf das tun.");
    } else {
      showMessage(gameMessage, "Aktion konnte nicht gespeichert werden.");
    }
  }
}

async function markCorrect() {
  await updateAsExplainer((game, currentPlayer) => {
    const update = {
      decks: advanceCard(game, cards)
    };

    if (currentPlayer.team === "red") {
      update.red = Number(game.red ?? 0) + 1;
    } else {
      update.blue = Number(game.blue ?? 0) + 1;
    }

    return update;
  });
}

async function skipCard() {
  await updateAsExplainer((game) => ({
    decks: advanceCard(game, cards)
  }));
}

async function endRound() {
  await updateAsExplainer((game) => {
    const players = Array.isArray(game.players) ? game.players : [];
    const categoryUpdate = advanceCategory(game);

    return {
      currentPlayerIndex: nextPlayerIndex(players, game.currentPlayerIndex),
      round: Number(game.round ?? 1) + 1,
      ...categoryUpdate
    };
  });
}

createButton.addEventListener("click", createGame);
joinButton.addEventListener("click", joinGame);
correctButton.addEventListener("click", markCorrect);
skipButton.addEventListener("click", skipCard);
endRoundButton.addEventListener("click", endRound);

console.log("✅ Tabu Online 2.1 gestartet");
