import { db } from "./firebase.js";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

export async function createGame(name, team) {

  const gameCode = Math.floor(100000 + Math.random() * 900000).toString();

  await setDoc(doc(db, "games", gameCode), {
    red: 0,
    blue: 0,
    currentCard: null,
    currentExplainer: "",
    status: "lobby"
  });

  await addDoc(collection(db, "games", gameCode, "players"), {
    name: name,
    team: team
  });

  return gameCode;
}

export async function joinGame(gameCode, name, team) {

  const game = await getDoc(doc(db, "games", gameCode));

  if (!game.exists()) {
    throw new Error("Spiel nicht gefunden");
  }

  await addDoc(collection(db, "games", gameCode, "players"), {
    name: name,
    team: team
  });

  return true;
}
