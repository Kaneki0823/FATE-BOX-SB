//////////////////////////////////////////////////////
// 🔗 GOOGLE SHEETS BACKEND
//////////////////////////////////////////////////////

const API_URL =
  https://script.google.com/macros/s/AKfycbxmYurPZmpzeGLeoYCJXdRCNV1ae06oXMwZAf-hLXLXBtzgyVlQP2DfRCu-ZExqVgZ_/exec

//////////////////////////////////////////////////////
// 🎯 DATA
//////////////////////////////////////////////////////

let players = [];

const HEROES = [
  "Miya","Karina","Harith","Masha","Aulus","Julian","Saber","Minotaur",
  "Khufra","Gloo","Xavier","Freddrin","Hayabusa","Roger","Gusion",
  "Esmeralda","Barats","Valentina","Cyclops","Pharsa","Hanabi",
  "Yu Zhong","Terry Bogart","Floryn","Rafaela","Ruby","Lesley",
  "Ling","Edith","Chou","Lancelot","Valir","Benedetta"
];

const ITEMS = [
  "Blade of Despair","Demon Hunter Sword","Sea Halberd","Golden Staff",
  "Berserker's Fury","Haas's Claws","War Axe","Enchanted Talisman",
  "Feather of Heaven","Glowing Wand","Ice Queen Wand","Holy Crystal",
  "Blade Armor","Guardian Helmet","Antique Cuirass","Brute Force Breastplate",
  "Oracle","Dominance Ice","Winter Crown","Purple Buff"
];

//////////////////////////////////////////////////////
// 🔄 LOAD
//////////////////////////////////////////////////////

async function loadPlayers() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();

    players = Array.isArray(data) ? data : [];

    renderPlayers();
    updatePot();
    updateScores();
    renderCheckerPanel();

  } catch (err) {
    console.error("Load error:", err);
    players = [];
    renderPlayers();
  }
}

//////////////////////////////////////////////////////
// 💾 SAVE TO SHEETS
//////////////////////////////////////////////////////

async function saveToSheet(payload) {
  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

//////////////////////////////////////////////////////
// ➕ FORM
//////////////////////////////////////////////////////

function openForm(index = null) {
  const p = index !== null ? players[index] : null;

  document.getElementById("formContainer").innerHTML = `
    <div class="card">

      <input id="name" placeholder="Name" value="${p?.name || ""}">
      <input id="bet" type="number" placeholder="Bet" value="${p?.bet || 0}">

      ${createRound(1,p)}
      ${createRound(2,p)}
      ${createRound(3,p)}
      ${createRound(4,p)}

      <button onclick="savePlayer(${index ?? "null"})">💾 Save</button>
      <button onclick="closeForm()">❌ Cancel</button>

    </div>
  `;
}

function createRound(n,p){
  return `
    <b>Round ${n}</b>

    <select class="r${n}h">
      <option value="">Hero</option>
      ${HEROES.map(h =>
        `<option ${p?.rounds?.[n-1]?.[0]===h?"selected":""}>${h}</option>`
      ).join("")}
    </select>

    <select class="r${n}i">
      <option value="">Item</option>
      ${ITEMS.map(i =>
        `<option ${p?.rounds?.[n-1]?.[1]===i?"selected":""}>${i}</option>`
      ).join("")}
    </select>
  `;
}

function closeForm(){
  document.getElementById("formContainer").innerHTML = "";
}

//////////////////////////////////////////////////////
// 💾 SAVE PLAYER
//////////////////////////////////////////////////////

async function savePlayer(index) {
  const form = document.getElementById("formContainer");

  const player = {
    name: form.querySelector("#name").value.trim(),
    bet: Number(form.querySelector("#bet").value || 0),

    rounds: [
      [form.querySelector(".r1h").value, form.querySelector(".r1i").value],
      [form.querySelector(".r2h").value, form.querySelector(".r2i").value],
      [form.querySelector(".r3h").value, form.querySelector(".r3i").value],
      [form.querySelector(".r4h").value, form.querySelector(".r4i").value]
    ],

    marks: index !== null && players[index]?.marks
      ? players[index].marks
      : [[0,0],[0,0],[0,0],[0,0]]
  };

  if (!player.name) return alert("Enter name");

  await saveToSheet({
    action: index !== null ? "update" : "add",
    index,
    player
  });

  closeForm();
  loadPlayers();
}

//////////////////////////////////////////////////////
// 📦 RENDER PLAYERS
//////////////////////////////////////////////////////

function renderPlayers() {
  const container = document.getElementById("playersContainer");
  container.innerHTML = "";

  players.forEach((p,i)=>{

    const rounds = p.rounds || [[],[],[],[]];

    let html = `
      <div class="card">
        <b>${p.name || "No Name"}</b> (Bet: ${p.bet || 0})

        <div id="r-${i}" style="display:none;">
    `;

    rounds.forEach((r,ri)=>{
      html += `
        <b>Round ${ri+1}</b>

        <div class="guess">
          <span>${r?.[0] || ""}</span>
          <button onclick="mark('${r?.[0]}',1)">✔</button>
          <button onclick="mark('${r?.[0]}',-1)">✖</button>
        </div>

        <div class="guess">
          <span>${r?.[1] || ""}</span>
          <button onclick="mark('${r?.[1]}',1)">✔</button>
          <button onclick="mark('${r?.[1]}',-1)">✖</button>
        </div>
      `;
    });

    html += `
        </div>

        <button onclick="toggle(${i})">👁</button>
        <button onclick="openForm(${i})">✏️</button>
        <button onclick="removePlayer(${i})">🗑</button>
      </div>
    `;

    container.innerHTML += html;
  });
}

//////////////////////////////////////////////////////
// 👁 TOGGLE
//////////////////////////////////////////////////////

function toggle(i){
  const el=document.getElementById(`r-${i}`);
  if(!el) return;
  el.style.display = el.style.display==="none"?"block":"none";
}

//////////////////////////////////////////////////////
// 🗑 REMOVE (FIXED: NO RE-ADD BUG)
//////////////////////////////////////////////////////

async function removePlayer(i){
  await saveToSheet({
    action:"delete",
    index:i
  });

  loadPlayers();
}

//////////////////////////////////////////////////////
// ✔ MARK SYSTEM
//////////////////////////////////////////////////////

function mark(value,state){
  if(!value) return;

  players.forEach(p=>{
    p.rounds?.forEach((r,ri)=>{
      r?.forEach(g=>{
        if(g===value){
          if(!p.marks) p.marks=[[0,0],[0,0],[0,0],[0,0]];
          p.marks[ri][0]=state;
        }
      });
    });
  });

  saveToSheet({action:"bulk",players});
  loadPlayers();
}

//////////////////////////////////////////////////////
// 💰 POT
//////////////////////////////////////////////////////

function updatePot(){
  const el=document.getElementById("pot");
  if(!el) return;
  el.innerText = players.reduce((a,p)=>a+(p.bet||0),0);
}

//////////////////////////////////////////////////////
// 🧠 SCORES
//////////////////////////////////////////////////////

function updateScores(){
  const table=document.getElementById("scoreTable");
  if(!table) return;

  const scores = players.map(p=>{
    let s=0;
    p.marks?.forEach(r=>r.forEach(m=>m===1&&s++));
    return {name:p.name,score:s};
  });

  const max=Math.max(...scores.map(s=>s.score),0);

  table.innerHTML=`<tr><th>Name</th><th>Score</th><th>Status</th></tr>`;

  scores.forEach(s=>{
    table.innerHTML+=`
      <tr>
        <td>${s.name}</td>
        <td>${s.score}</td>
        <td>${s.score===max&&max>0?"🏆 WINNER":"❌"}</td>
      </tr>
    `;
  });
}

//////////////////////////////////////////////////////
// 🎯 CHECKER PANEL (FIXED + ALWAYS SHOWS)
//////////////////////////////////////////////////////

function renderCheckerPanel(){
  const container=document.getElementById("checkerPanel");
  if(!container) return;

  if(!players.length){
    container.innerHTML=`<div class="card"><h2>🎯 Checker Panel</h2><p>No players yet</p></div>`;
    return;
  }

  const rounds=[[],[],[],[]];

  players.forEach(p=>{
    p.rounds?.forEach((r,i)=>{
      r?.forEach(g=>{
        if(g && !rounds[i].includes(g)) rounds[i].push(g);
      });
    });
  });

  let html=`<div class="card"><h2>🎯 Checker Panel</h2>`;

  rounds.forEach((r,ri)=>{
    html+=`<h3>Round ${ri+1}</h3>`;

    r.forEach(g=>{
      html+=`
        <div class="guess">
          <span>${g}</span>
          <button onclick="mark('${g}',1)">✔</button>
          <button onclick="mark('${g}',-1)">✖</button>
        </div>
      `;
    });
  });

  html+=`</div>`;
  container.innerHTML=html;
}

//////////////////////////////////////////////////////
// 🚀 START
//////////////////////////////////////////////////////

loadPlayers();
