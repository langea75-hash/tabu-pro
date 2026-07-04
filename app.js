import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCLmKBM8OoqcLAVZhIHvuF0_e0trsu8-5Q",
  authDomain: "tabu-pro-online-7cf64.firebaseapp.com",
  projectId: "tabu-pro-online-7cf64",
  storageBucket: "tabu-pro-online-7cf64.firebasestorage.app",
  messagingSenderId: "498221308101",
  appId: "1:498221308101:web:fa6b8efea669a6d10db8ac"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const karten = [
  { kategorie: "Natur", begriff: "Sonnenblume", tabu: ["gelb", "Blume", "Garten"] },
  { kategorie: "Essen", begriff: "Pizza", tabu: ["Käse", "Italien", "Tomate"] },
  { kategorie: "Tiere", begriff: "Hund", tabu: ["bellen", "Leine", "Haustier"] },
  { kategorie: "Tiere", begriff: "Katze", tabu: ["miauen", "Maus", "Haustier"] },
  { kategorie: "Essen", begriff: "Apfel", tabu: ["Obst", "Baum", "Kern"] },
  { kategorie: "Essen", begriff: "Kaffee", tabu: ["Tasse", "trinken", "Bohnen"] },
  { kategorie: "Berufe", begriff: "Arzt", tabu: ["Patient", "Praxis", "Krankenhaus"] },
  { kategorie: "Verkehr", begriff: "Auto", tabu: ["Lenkrad", "Motor", "Reifen"] },
  { kategorie: "Natur", begriff: "Baum", tabu: ["Wald", "Blätter", "Stamm"] },
  { kategorie: "Freizeit", begriff: "Fußball", tabu: ["Ball", "Tor", "Spiel"] }
];

let spielCode = "";
let spielRef = null;
let istModerator = false;

document.getElementById("createGame").onclick = async () => {
  istModerator = true;
  spielCode = Math.floor(100000 + Math.random() * 900000).toString();
  spielRef = doc(db, "spiele", spielCode);

  await setDoc(spielRef, {
    rot: 0,
    blau: 0,
    karte: karten[0],
    gespielt: [karten[0].begriff]
  });

  starten();
};

document.getElementById("joinGame").onclick = async () => {
  istModerator = false;
  spielCode = document.getElementById("joinCode").value.trim();
  spielRef = doc(db, "spiele", spielCode);

  const snap = await getDoc(spielRef);

  if (!snap.exists()) {
    alert("Spiel nicht gefunden");
    return;
  }

  starten();
};

function starten() {
  document.getElementById("start").classList.add("hidden");
  document.getElementById("game").classList.remove("hidden");
  document.getElementById("gameCode").innerText = spielCode;

  onSnapshot(spielRef, (docSnap) => {
    const d = docSnap.data();

    document.getElementById("redScore").innerText = d.rot;
    document.getElementById("blueScore").innerText = d.blau;

    if (istModerator) {
      zeigeKarte(d.karte);
    } else {
      versteckeKarte();
    }
  });
}

function zeigeKarte(karte) {
  document.getElementById("category").innerText = karte.kategorie;
  document.getElementById("word").innerText = karte.begriff;
  document.getElementById("taboo1").innerText = karte.tabu[0];
  document.getElementById("taboo2").innerText = karte.tabu[1];
  document.getElementById("taboo3").innerText = karte.tabu[2];
}

function versteckeKarte() {
  document.getElementById("category").innerText = "Mitspieler";
  document.getElementById("word").innerText = "Karte verborgen";
  document.getElementById("taboo1").innerText = "";
  document.getElementById("taboo2").innerText = "";
  document.getElementById("taboo3").innerText = "";
}

document.getElementById("redPoint").onclick = async () => {
  const snap = await getDoc(spielRef);
  const d = snap.data();

  await updateDoc(spielRef, {
    rot: d.rot + 1
  });
};

document.getElementById("bluePoint").onclick = async () => {
  const snap = await getDoc(spielRef);
  const d = snap.data();

  await updateDoc(spielRef, {
    blau: d.blau + 1
  });
};

document.getElementById("resetScores").onclick = async () => {
  await updateDoc(spielRef, {
    rot: 0,
    blau: 0
  });
};

document.getElementById("newCard").onclick = async () => {
  if (!istModerator) {
    alert("Nur der Moderator kann eine neue Karte ziehen.");
    return;
  }

  const snap = await getDoc(spielRef);
  const d = snap.data();

  let gespielt = d.gespielt || [];

  let freieKarten = karten.filter(
    karte => !gespielt.includes(karte.begriff)
  );

  if (freieKarten.length === 0) {
    gespielt = [];
    freieKarten = karten;
  }

  const neueKarte = freieKarten[
    Math.floor(Math.random() * freieKarten.length)
  ];

  gespielt.push(neueKarte.begriff);

  await updateDoc(spielRef, {
    karte: neueKarte,
    gespielt: gespielt
  });
};
