// 🔥 FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCdZb1-Wd_zDE3-WqyqtNISpX2Iji9ihCU",
  authDomain: "sb-fb-4cd02.firebaseapp.com",
  databaseURL: "https://console.firebase.google.com/project/sb-fb-4cd02/database/sb-fb-4cd02-default-rtdb/data/~2F",
  projectId: "sb-fb-4cd02"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let players = {};

const HEROES = ["Miya","Karina","Gusion","Chou","Ling"];
const ITEMS = ["Blade of Despair","War Axe","Hunter Strike"];

//////////////////////////////////////////////////////
// 🔄 LISTEN REALTIME
//////////////////////////////////////////////////////

db.ref("players").on("value", snap => {
  players = snap.val() || {};
  render();
});

//////////////////////////////////////////////////////
// ➕ ADD / EDIT PLAYER
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

      <button onclick="save('${id || ""}')">Save</button>
    </div>
  `;
}

function roundUI(n,p){
  return `
    <b>Round ${n}</b>

    <select class="h${n}">
      ${HEROES.map(h=>`<option ${p?.rounds?.[n-1]?.[0]==h?"selected":""}>${h}</option>`)}
    </select>

    <select class="i${n}">
      ${ITEMS.map(i=>`<option ${p?.rounds?.[n-1]?.[1]==i?"selected":""}>${i}</option>`)}
    </select>
  `;
}

//////////////////////////////////////////////////////
// 💾 SAVE TO FIREBASE
//////////////////////////////////////////////////////

function save(id){
  const player = {
    name: name.value,
    bet: Number(bet.value),
    rounds: [
      [h1.value,i1.value],
      [h2.value,i2.value],
      [h3.value,i3.value],
      [h4.value,i4.value]
    ],
    marks: [[0,0],[0,0],[0,0],[0,0]]
  };

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

  let pot = 0;
  let scores = [];

  Object.entries(players).forEach(([id,p])=>{

    pot += Number(p.bet || 0);

    html += `
      <div class="card">
        <b>${p.name}</b> (${p.bet})

        <button onclick="openForm('${id}')">Edit</button>
        <button onclick="remove('${id}')">Remove</button>

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

function remove(id){
  db.ref("players/"+id).remove();
}

//////////////////////////////////////////////////////
// ✔ MARK
//////////////////////////////////////////////////////

function mark(id,round,type,state){
  const p = players[id];
  if(!p.marks) p.marks=[[0,0],[0,0],[0,0],[0,0]];

  p.marks[round][type] = state;

  db.ref("players/"+id).update({marks:p.marks});
}

//////////////////////////////////////////////////////
// 🎯 CHECKER PANEL
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

  let html="<div class='card'><h2>Checker</h2>";

  rounds.forEach((r,i)=>{
    html+=`<h3>Round ${i+1}</h3>`;
    r.forEach(g=>{
      html+=`<div class="guess">${g}</div>`;
    });
  });

  checker.innerHTML=html+"</div>";
}

//////////////////////////////////////////////////////
// 🏆 SCORES
//////////////////////////////////////////////////////

function renderScores(){
  let arr = Object.values(players).map(p=>{
    let s=0;
    p.marks?.forEach(r=>r.forEach(v=>v===1&&s++));
    return {name:p.name,score:s};
  });

  let max=Math.max(...arr.map(a=>a.score),0);

  scores.innerHTML="<tr><th>Name</th><th>Score</th><th>Status</th></tr>";

  arr.forEach(s=>{
    scores.innerHTML+=`
      <tr>
        <td>${s.name}</td>
        <td>${s.score}</td>
        <td>${s.score===max&&max>0?"🏆 WINNER":"❌"}</td>
      </tr>
    `;
  });
}
