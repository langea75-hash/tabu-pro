import { db } from "./firebase.js";
import { cards } from "./cards.js";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

let gameCode = "";
let gameRef = null;

let playerName = "";
let playerTeam = "";

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

const playerNameInput = document.getElementById("playerName");
const teamSelect = document.getElementById("team");
const joinCodeInput = document.getElementById("joinCode");

const createButton = document.getElementById("createGame");
const joinButton = document.getElementById("joinGame");

const correctButton = document.getElementById("correct");
const skipButton = document.getElementById("skip");
const endButton = document.getElementById("endExplain");

const explainerButton = document.getElementById("beExplainer");

console.log("🎲 Tabu Online gestartet");