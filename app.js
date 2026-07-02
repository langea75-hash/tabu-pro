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
  apiKey: "AIzaSyChTETGFMkLEBnkFG30K5s66k3uxvl_gLc",
  authDomain: "tabu-pro-online.firebaseapp.com",
  projectId: "tabu-pro-online",
  storageBucket: "tabu-pro-online.firebasestorage.app",
  messagingSenderId: "912894114247",
  appId: "1:912894114247:web:723dd7817505ab9d89c1e2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const karten = [
  {
    kategorie: "Natur",
    begriff: "Sonnenblume",
    tabu: ["gelb", "Blume", "Garten"]
  },
  {
    kategorie: "Essen",
    begriff: "Pizza",
    tabu: ["Käse", "Italien", "Tomate"]
  },
  {
    kategorie: "Tiere",
    begriff: "Hund",
    tabu: ["bellen", "Leine", "Katze"]
  }
];

let spielCode = "";
let spielRef = null;

document.getElementById("createGame").onclick = async () => {

  spielCode = Math.floor(100000 + Math.random()*900000).toString();

  spielRef = doc(db,"spiele",spielCode);

  await setDoc(spielRef,{
    rot:0,
    blau:0,
    karte:karten[0]
  });

  starten();

};

document.getElementById("joinGame").onclick = async ()=>{

  spielCode=document.getElementById("joinCode").value;

  spielRef=doc(db,"spiele",spielCode);

  const snap=await getDoc(spielRef);

  if(!snap.exists()){
    alert("Spiel nicht gefunden");
    return;
  }

  starten();

};

function starten(){

 document.getElementById("start").classList.add("hidden");
 document.getElementById("game").classList.remove("hidden");

 document.getElementById("gameCode").innerText=spielCode;

 onSnapshot(spielRef,(docSnap)=>{

   const d=docSnap.data();

   document.getElementById("redScore").innerText=d.rot;
   document.getElementById("blueScore").innerText=d.blau;

   document.getElementById("category").innerText=d.karte.kategorie;
   document.getElementById("word").innerText=d.karte.begriff;

   document.getElementById("taboo1").innerText=d.karte.tabu[0];
   document.getElementById("taboo2").innerText=d.karte.tabu[1];
   document.getElementById("taboo3").innerText=d.karte.tabu[2];

 });

}
