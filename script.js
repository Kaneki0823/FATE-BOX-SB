console.log("APP LOADED");
// 🔥 FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCdZb1-Wd_zDE3WqyqtNISpX2Iji9ihCU",
  authDomain: "sb-fb-4cd02.firebaseapp.com",
  databaseURL: "https://sb-fb-4cd02-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sb-fb-4cd02",
  storageBucket: "sb-fb-4cd02.firebasestorage.app",
  messagingSenderId: "780009138847",
  appId: "1:780009138847:web:c3369337b1519fba5bd0aa"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let players = {};

//////////////////////////////////////////////////////
// 🔄 REALTIME LOAD
//////////////////////////////////////////////////////

db.ref("players").on("value", snap => {
  players = snap.val() || {};
  render();
});

//////////////////////////////////////////////////////
// ➕ OPEN FORM
//////////////////////////////////////////////////////

function openForm(id = null) {
  const p = players[id] || {};

  document.getElementById("form").innerHTML = `
    <div class="card">
      <h3>${id ? "Edit Player" : "Add Player"}</h3>

      <input id="name" placeholder="Name" value="${p.name || ""}">
      <input id="bet" type="number" placeholder="Bet" value="${p.bet || 0}">

      <button onclick="savePlayer('${id || ""}')">💾 Save</button>
    </div>
  `;
}

//////////////////////////////////////////////////////
// 💾 SAVE PLAYER
//////////////////////////////////////////////////////

function savePlayer(id) {
  const name = document.getElementById("name").value.trim();
  const bet = Number(document.getElementById("bet").value || 0);

  if (!name) return alert("Enter name");

  const player = {
    name,
    bet,
    rounds: [],
    marks: []
  };

  console.log("Saving:", player);

  if (id) {
    db.ref("players/" + id).set(player);
  } else {
    db.ref("players").push(player);
  }

  document.getElementById("form").innerHTML = "";
}

//////////////////////////////////////////////////////
// 📦 RENDER PLAYERS
//////////////////////////////////////////////////////

function render() {
  let html = "";

  Object.entries(players).forEach(([id, p]) => {
    html += `
      <div class="card">
        <b>${p.name}</b> - Bet: ${p.bet}

        <br>

        <button onclick="openForm('${id}')">✏️ Edit</button>
        <button onclick="removePlayer('${id}')">🗑 Remove</button>
      </div>
    `;
  });

  document.getElementById("players").innerHTML = html;
}

//////////////////////////////////////////////////////
// 🗑 REMOVE
//////////////////////////////////////////////////////

function removePlayer(id) {
  db.ref("players/" + id).remove();
}
