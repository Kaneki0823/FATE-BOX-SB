console.log("APP LOADED");
// 🔥 FIREBASE
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

// 🔥 REAL HEROES LIST
const HEROES = [
  "Miya","Karina","Harith","Masha","Aulus","Julian","Saber","Minotaur",
  "Khufra","Gloo","Xavier","Fredrinn","Hayabusa","Roger","Gusion",
  "Esmeralda","Barats","Valentina","Cyclops","Pharsa","Hanabi",
  "Yu Zhong","Floryn","Rafaela","Ruby","Lesley","Ling","Edith",
  "Chou","Lancelot","Valir","Benedetta"
];

// 🔥 REAL ITEMS LIST
const ITEMS = [
  "Blade of Despair","Demon Hunter Sword","Sea Halberd","Golden Staff",
  "Berserker's Fury","Haas's Claws","War Axe","Enchanted Talisman",
  "Feather of Heaven","Glowing Wand","Ice Queen Wand","Holy Crystal",
  "Blade Armor","Guardian Helmet","Antique Cuirass",
  "Brute Force Breastplate","Oracle","Dominance Ice",
  "Winter Crown","Purple Buff","Hunter Strike"
];

// 🔄 LOAD
db.ref("players").on("value", snap => {
  players = snap.val() || {};
  render();
});

//////////////////////////////////////////////////////
// ➕ FORM
//////////////////////////////////////////////////////

function openForm(id = null) {
  const p = players[id] || {};

  document.getElementById("form").innerHTML = `
    <div class="card">
      <input id="name" placeholder="Name" value="${p.name || ""}">
      <input id="bet" type="number" placeholder="Bet" value="${p.bet || 0}">

      ${roundUI(1,p)}
      ${roundUI(2,p)}
      ${roundUI(3,p)}
      ${roundUI(4,p)}

      <button onclick="savePlayer('${id || ""}')">💾 Save</button>
    </div>
  `;
}

//////////////////////////////////////////////////////
// 🎯 ROUND UI (WITH HERO + ITEM)
//////////////////////////////////////////////////////

function roundUI(n,p){
  return `
    <b>Round ${n}</b>

    <select id="h${n}">
      ${HEROES.map(h=>`<option ${p?.rounds?.[n-1]?.[0]===h?"selected":""}>${h}</option>`).join("")}
    </select>

    <select id="i${n}">
      ${ITEMS.map(i=>`<option ${p?.rounds?.[n-1]?.[1]===i?"selected":""}>${i}</option>`).join("")}
    </select>
  `;
}

//////////////////////////////////////////////////////
// 💾 SAVE
//////////////////////////////////////////////////////

function savePlayer(id){
  const player = {
    name: name.value,
    bet: Number(bet.value || 0),

    rounds: [
      [h1.value,i1.value],
      [h2.value,i2.value],
      [h3.value,i3.value],
      [h4.value,i4.value]
    ],

    marks: [[0,0],[0,0],[0,0],[0,0]]
  };

  if(!player.name) return alert("Enter name");

  if(id){
    db.ref("players/"+id).set(player);
  } else {
    db.ref("players").push(player);
  }

  document.getElementById("form").innerHTML="";
}

//////////////////////////////////////////////////////
// 📦 RENDER
//////////////////////////////////////////////////////

function render(){
  let html="";
  let pot=0;

  Object.entries(players).forEach(([id,p])=>{
    pot += Number(p.bet||0);

    html += `
      <div class="card">
        <b>${p.name}</b> (${p.bet})

        <button onclick="openForm('${id}')">✏️ Edit</button>
        <button onclick="removePlayer('${id}')">🗑 Remove</button>

        ${p.rounds.map((r,i)=>`
          <div class="guess">
            <span>${r[0]}</span>
            <button onclick="mark('${id}',${i},0,1)">✔</button>
            <button onclick="mark('${id}',${i},0,-1)">✖</button>
          </div>

          <div class="guess">
            <span>${r[1]}</span>
            <button onclick="mark('${id}',${i},1,1)">✔</button>
            <button onclick="mark('${id}',${i},1,-1)">✖</button>
          </div>
        `).join("")}
      </div>
    `;
  });

  playersDiv.innerHTML = html;
  potEl.innerText = pot;

  renderChecker();
  renderScores();
}

//////////////////////////////////////////////////////
// 🗑 REMOVE
//////////////////////////////////////////////////////

function removePlayer(id){
  db.ref("players/"+id).remove();
}

//////////////////////////////////////////////////////
// ✔ MARK SYSTEM
//////////////////////////////////////////////////////

function mark(id,round,type,val){
  const p = players[id];
  if(!p.marks) p.marks=[[0,0],[0,0],[0,0],[0,0]];
  p.marks[round][type]=val;

  db.ref("players/"+id).update({marks:p.marks});
}

//////////////////////////////////////////////////////
// 🎯 CHECKER PANEL (GROUPED)
//////////////////////////////////////////////////////

function renderChecker(){
  let rounds=[[],[],[],[]];

  Object.values(players).forEach(p=>{
    p.rounds.forEach((r,i)=>{
      r.forEach(g=>{
        if(!rounds[i].includes(g)) rounds[i].push(g);
      });
    });
  });

  let html=`<div class="card">`;

  rounds.forEach((r,i)=>{
    html += `<h3>Round ${i+1}</h3>`;
    r.forEach(g=>{
      html += `<div>${g}</div>`;
    });
  });

  checker.innerHTML = html+"</div>";
}

//////////////////////////////////////////////////////
// 🏆 SCORES + WINNER
//////////////////////////////////////////////////////

function renderScores(){
  let arr = Object.values(players).map(p=>{
    let s=0;
    p.marks?.forEach(r=>r.forEach(v=>v===1&&s++));
    return {name:p.name,score:s};
  });

  let max = Math.max(...arr.map(a=>a.score),0);

  scores.innerHTML=`<tr><th>Name</th><th>Score</th><th>Status</th></tr>`;

  arr.forEach(s=>{
    scores.innerHTML += `
      <tr>
        <td>${s.name}</td>
        <td>${s.score}</td>
        <td>${s.score===max&&max>0?"🏆 WINNER":"❌"}</td>
      </tr>
    `;
  });
}
