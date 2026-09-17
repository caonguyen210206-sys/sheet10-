import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore, doc, setDoc, onSnapshot, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDFdtfRSDDMw7KvxpOYDCi-vxBwpiZUK1U",
  authDomain: "sheet10-96b28.firebaseapp.com",
  projectId: "sheet10-96b28",
  storageBucket: "sheet10-96b28.firebasestorage.app",
  messagingSenderId: "294910235179",
  appId: "1:294910235179:web:abe39ce01b034bd67a506e"
};

(function () {
  "use strict";

  var GAME_ID = "vault-20";
  var CHANNEL = "vault-ppt-live-v4";
  var STATE_KEY = "vault-ppt-state-v4";
  var CARD_PREFIX = "vault-ppt-card-v4-";
  var LEGACY_BET_PREFIX = "vault-ppt-legacy-";
  var TEAM_SELECTION_KEY = "vault-ppt-team-choice-v4";
  var selectedTeamId = 0;
  var audioContext = null;
  var lastStageCelebration = "";
  var lastSpokenQuestion = "";
  var role = "home";
  var state = null;
  var firebaseApp = initializeApp(firebaseConfig);
  var auth = getAuth(firebaseApp);
  var db = getFirestore(firebaseApp);
  var gameRef = doc(db, "games", GAME_ID);
  var firebaseReady = false;
  var firebaseError = "";
  var remoteStateKnown = false;
  var remoteStateExists = false;
  var remoteCards = {};
  var stateUnsubscribe = null;
  var cardUnsubscribe = null;
  var pendingRemoteCreate = false;
  var cardNumbers = Array.from({ length: 20 }, function (_, i) { return i + 1; });

  var teamNames = ["Team North Star","Team Cat Eyes","Team Cipher","Team Night Raven","Team Lightning","Team Music Box","Team Kaleidoscope","Team Moon Shadow","Team Night Owl","Team Compass","Team Maze","Team Puzzle Piece","Team Clockwork","Team Light Trail","Team Door"];


  var difficultyMeta = {
    1: { stars: "★", points: 10, format: "CHOOSE A / B / C / D", media: "none", short: "MULTIPLE CHOICE" },
    2: { stars: "★★", points: 15, format: "AI VOICE · A / B / C / D", media: "audio", short: "LISTEN · CHOOSE" },
    3: { stars: "★★★", points: 25, format: "AI VOICE · OPEN ANSWER", media: "audio", short: "LISTEN · ANSWER" },
    4: { stars: "★★★★", points: 40, format: "IMAGE REVEAL · A / B / C / D", media: "image", short: "IMAGE · CHOOSE" },
    5: { stars: "★★★★★", points: 60, format: "RAPID VIDEO · OPEN ANSWER", media: "video", short: "VIDEO · ANSWER" }
  };

  var questionBank = [{"title":"Downsizing","visual":"downsize","difficulty":1,"question":"A company has suffered a fall in sales and decides to permanently reduce the number of employees in order to lower labour costs. What is this strategy called?","options":["Rightsizing","Downsizing","Recruitment","Job sharing"],"answer":"B","hint":"The workforce is permanently reduced to lower labour costs."},{"title":"Delayering","visual":"delayer","difficulty":1,"question":"A business keeps most of its employees but removes several levels of managers so that information can move more quickly between senior leaders and workers. What is this called?","options":["Delayering","Expansion","Subcontracting","Reorganization of staff benefits"],"answer":"A","hint":"The company removes layers of management."},{"title":"Outsourcing","visual":"outsource","difficulty":1,"question":"Instead of maintaining an internal accounting department, a company pays an independent firm to perform all of its accounting activities. Which practice is being used?","options":["Outsourcing","Recruitment","Manufacturing","Appointment"],"answer":"A","hint":"An outside company performs the activity."},{"title":"Job Sharing","visual":"jobshare","difficulty":1,"question":"Anna works Monday to Wednesday morning, while another employee works Wednesday afternoon to Friday. Together, they are responsible for one full-time position. What arrangement is this?","options":["Temporary employment","Job sharing","Overtime work","Shift work"],"answer":"B","hint":"Two employees share one full-time position."},{"title":"Privatization","visual":"privatize","difficulty":1,"question":"A postal company that used to belong to the government is transferred into private ownership and begins operating for private investors. Which verb describes this action?","options":["Modernize","Privatize","Reorganize","Appoint"],"answer":"B","hint":"Ownership moves from the government to private investors."},{"title":"Job Security","visual":"security","difficulty":1,"question":"An employee chooses a company partly because it has rarely dismissed workers during economic downturns. Which employment benefit is the employee mainly concerned about?","options":["Higher productivity","Job security","Promotion opportunities","Flexible working hours"],"answer":"B","hint":"The employee wants protection from losing the job."},{"title":"Rightsizing","visual":"rightsize","difficulty":2,"question":"A firm realizes that its current workforce is too large for present demand, but managers do not want to cut as many employees as possible. Instead, they calculate the number of workers actually required and adjust staffing to that level. What is this process called?","options":["Rightsizing","Dismissal","Reallocation of salaries","Staff training"],"answer":"A","hint":"Staffing is adjusted to the number of workers actually needed."},{"title":"Flexible Labour Market","visual":"flexmarket","difficulty":2,"question":"In one country, companies can quickly employ people on temporary contracts when demand rises and reduce the number of non-permanent employees when demand falls. Which term best describes this labour environment?","options":["Permanent employment system","Flexible labour market","Public sector employment","Management hierarchy"],"answer":"B","hint":"The workforce can expand and shrink quickly."},{"title":"Subcontractor","visual":"subcontract","difficulty":2,"question":"A construction company wins a large project but does not have specialists to install the electrical system. It hires another independent company to complete only that part of the project. What is the second company called?","options":["Shareholder","Subcontractor","Trade representative","Permanent employee"],"answer":"B","hint":"The independent company completes one contracted part of a larger project."},{"title":"Redundancy Package","visual":"redundancy","difficulty":2,"question":"Twenty employees lose their positions after a factory introduces new technology. Because the workers are not responsible for losing their jobs, the company gives each of them financial compensation and other benefits. What is this compensation called?","options":["Annual bonus","Redundancy package","Commission payment","Pension contribution"],"answer":"B","hint":"The payment supports employees whose jobs disappear."},{"title":"Delocalization","visual":"delocalize","difficulty":2,"question":"A clothing company closes one of its factories in its home country and moves production to another country where wages and operating costs are considerably lower. Which term most precisely describes this decision?","options":["Delocalization","Relocation","Outsourcing","Restructuring"],"answer":"A","hint":"Production moves abroad to reduce operating costs."},{"title":"Rationalization","visual":"rationalize","difficulty":3,"question":"A company changes the way its departments operate, removes inefficient activities and simplifies procedures with the specific aim of reducing costs and increasing efficiency. What is this process called?","options":null,"answer":"Rationalization","hint":"The process removes waste and makes operations more efficient."},{"title":"Contract Work","visual":"contract","difficulty":3,"question":"A graphic designer is employed by a company only to complete a six-month advertising project. After the project ends, the employment agreement also ends. What type of work is this?","options":null,"answer":"Contract work","hint":"The job lasts for a specified project and period."},{"title":"Casual Work","visual":"casual","difficulty":3,"question":"A restaurant calls additional workers only when it is unusually busy. Their hours are irregular and there is no guarantee that they will work every week. What type of employment is this?","options":null,"answer":"Casual work","hint":"Workers are called in when extra help is needed."},{"title":"Turnover","visual":"turnover","difficulty":3,"question":"A company reports that the total value of its sales for the year increased from €15 million to €19 million. Which business term refers to this total sales figure?","options":null,"answer":"Turnover","hint":"This term means the total sales revenue for a period."},{"title":"Monopoly","visual":"monopoly","difficulty":4,"question":"Which market situation is represented by the image?","options":["Monopoly","Perfect competition","Oligopoly","Monopolistic competition"],"answer":"A","hint":"One company supplies the entire market."},{"title":"Trade Union","visual":"union","difficulty":4,"question":"Which organization is most likely being represented?","options":["Board of directors","Trade union","Employee association","Management committee"],"answer":"B","hint":"Workers join together to negotiate working conditions, salaries and job losses."},{"title":"Automated Machine","visual":"machine","difficulty":4,"question":"What has most likely replaced part of the manual sorting work?","options":["Temporary workers","Automated machines","Outsourced workers","Additional permanent staff"],"answer":"B","hint":"Machines now sort parcels on the conveyor belt."},{"title":"Technological Progress","visual":"progress","difficulty":5,"question":"What major economic development connects all of these changes?","options":null,"answer":"Technological progress","hint":"Technology raises productivity, changes jobs and creates new technical work."},{"title":"Preserve Jobs","visual":"jobs","difficulty":5,"question":"Instead of dismissing workers, what is the company trying to do?","options":null,"answer":"Preserve jobs","hint":"The company reduces working hours so employees can stay."}];
  var fixedOrder = [0, 6, 1, 11, 7, 15, 2, 12, 8, 18, 3, 16, 9, 13, 4, 19, 10, 17, 5, 14];
  var rounds = fixedOrder.map(function (sourceIndex, index) {
    var round = questionBank[sourceIndex];
    var meta = difficultyMeta[round.difficulty];
    return { id: "Q" + String(index + 1).padStart(2, "0"), sourceNumber: sourceIndex + 1, title: round.title, visual: round.visual, difficulty: round.difficulty, points: meta.points, format: meta.format, media: meta.media, question: round.question, options: round.options, answer: round.answer, hint: round.hint };
  });


  function makeSessionId() { return String(Date.now()) + "-" + Math.random().toString(36).slice(2, 7); }
  function freshState() {
    return {
      version: 4,
      sessionId: makeSessionId(),
      phase: "cover",
      roundIndex: 0,
      winnerTeam: null,
      winnerCard: null,
      cardPicks: {},
      timerEnd: null,
      autoAt: null,
      scores: teamNames.map(function (name, i) { return { id: i + 1, name: name, score: 0, wins: 0, rightsWon: 0, correctCount: 0, usedCards: [] }; }),
      history: [],
      lastAward: null,
      sound: true
    };
  }

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function normalizeScores(scores) {
    return scores.map(function (t, i) {
      t.id = Number(t.id) || i + 1;
      t.name = t.name || teamNames[i] || ("Team " + String(i + 1).padStart(2, "0"));
      t.score = Number(t.score) || 0;
      t.wins = Number(t.wins) || 0;
      t.rightsWon = Number(t.rightsWon) || Number(t.wins) || 0;
      t.correctCount = Number(t.correctCount) || 0;
      t.usedCards = Array.isArray(t.usedCards) ? t.usedCards.map(Number).filter(function (n) { return n >= 1 && n <= 20; }) : [];
      return t;
    });
  }
  function loadState() {
    try {
      var raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        var loaded = JSON.parse(raw);
        if (loaded && Number(loaded.version) === 4 && Array.isArray(loaded.scores) && loaded.scores.length === 15 && loaded.phase) {
          loaded.scores = normalizeScores(loaded.scores);
          loaded.cardPicks = loaded.cardPicks || {};
          if (loaded.phase === "mascot") loaded.phase = "ready";
          return loaded;
        }
      }
    } catch (e) {}
    return freshState();
  }
  state = loadState();

  var bus = null;
  try { bus = new BroadcastChannel(CHANNEL); } catch (e) {}
  if (bus) {
    bus.onmessage = function (event) {
      var data = event.data || {};
      if (!firebaseReady && data.type === "state" && data.state && validState(data.state)) { state = data.state; render(); }
      if (!firebaseReady && data.type === "card" && data.pick && role === "host") scanCards();
    };
  }
  window.addEventListener("storage", function (event) {
    if (!firebaseReady && event.key === STATE_KEY && event.newValue) { try { var incoming = JSON.parse(event.newValue); if (validState(incoming)) { state = incoming; render(); } } catch (e) {} }
    if (!firebaseReady && role === "host" && event.key && event.key.indexOf(CARD_PREFIX + state.sessionId + "-" + state.roundIndex + "-") === 0) scanCards();
  });

  function validState(value) { if (value && value.phase === "mascot") value.phase = "ready"; return !!(value && Number(value.version) === 4 && Array.isArray(value.scores) && value.scores.length === 15 && value.phase); }
  function setFirebaseError(error) { firebaseReady = false; firebaseError = error && error.message ? error.message : String(error || "Không kết nối được Firebase"); render(); }
  function persistLocal() { try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (e) {} }
  function save(reason) {
    persistLocal();
    if (firebaseReady && gameRef) {
      var outgoing = clone(state);
      outgoing.updatedAt = Date.now();
      outgoing.lastReason = reason || "";
      setDoc(gameRef, outgoing, { merge: false }).catch(setFirebaseError);
    } else if (bus) {
      bus.postMessage({ type: "state", state: state, reason: reason || "" });
    }
    render();
  }
  function startFirebaseListeners() {
    if (!firebaseReady || stateUnsubscribe) return;
    stateUnsubscribe = onSnapshot(gameRef, function (snapshot) {
      remoteStateKnown = true;
      remoteStateExists = snapshot.exists();
      if (snapshot.exists()) {
        var incoming = snapshot.data();
        if (validState(incoming)) { incoming.scores = normalizeScores(incoming.scores); incoming.cardPicks = incoming.cardPicks || {}; state = incoming; persistLocal(); render(); }
      } else if (role === "host" && !pendingRemoteCreate) {
        pendingRemoteCreate = true;
        save("Khởi tạo phiên Firebase");
        pendingRemoteCreate = false;
      }
    }, setFirebaseError);
    cardUnsubscribe = onSnapshot(collection(db, "games", GAME_ID, "cards"), function (snapshot) {
      remoteCards = {};
      snapshot.forEach(function (item) { var pick = item.data(); if (pick && pick.sessionId && pick.roundIndex != null && pick.teamId) remoteCards[String(pick.sessionId) + "-" + String(pick.roundIndex) + "-" + String(pick.teamId)] = pick; });
      if (role === "host") scanCards(); else if (role !== "home") render();
    }, setFirebaseError);
  }
  async function bootFirebase() {
    try {
      await signInAnonymously(auth);
      firebaseReady = true;
      firebaseError = "";
      startFirebaseListeners();
      render();
    } catch (error) { setFirebaseError(error); }
  }

  function mutate(fn, reason) { var next = clone(state); fn(next); state = next; save(reason); }
  function currentRound() { return rounds[state.roundIndex] || rounds[0]; }
  function team(id) { return state.scores.find(function (t) { return t.id === Number(id); }) || state.scores[0]; }
  function teamName(id) { return team(id).name; }
  function esc(text) { return String(text == null ? "" : text).replace(/[&<>"']/g, function (s) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[s]; }); }
  function phaseLabel() { return ({ cover: "OPENING", ready: "READY", bet: "PICK CODE", reveal: "REVEAL", question: "ANSWER", result: "RESULT", scoreboard: "LEADERBOARD", finish: "FINALE" })[state.phase] || "VAULT 20"; }
  function connectionBadge() {
    if (firebaseReady) return '<span class="connection-badge live" title="Devices are syncing in real time">FIREBASE LIVE</span>';
    if (firebaseError) return '<span class="connection-badge error" title="' + esc(firebaseError) + '">AUTH REQUIRED</span>';
    return '<span class="connection-badge">CONNECTING</span>';
  }
  function parseRoute() {
    var hash = location.hash || "#/";
    var clean = hash.slice(1);
    var path = clean.split("?")[0] || "/";
    role = path === "/host" ? "host" : path === "/stage" ? "stage" : path === "/team" ? "team" : "home";
    if (role === "team") {
      var query = new URLSearchParams(clean.split("?")[1] || "");
      var requested = Number(query.get("team"));
      if (Number.isInteger(requested) && requested >= 1 && requested <= 15) {
        selectedTeamId = requested;
        try { localStorage.setItem(TEAM_SELECTION_KEY, String(selectedTeamId)); } catch (e) {}
      } else {
        try { var stored = Number(localStorage.getItem(TEAM_SELECTION_KEY)); selectedTeamId = Number.isInteger(stored) && stored >= 1 && stored <= 15 ? stored : 0; } catch (e) { selectedTeamId = 0; }
      }
    }
  }
  window.addEventListener("hashchange", render);

  function sceneSvg(kind) {
    var accent = kind === "steps" ? "#69e0ad" : kind === "door" ? "#ff6b9d" : kind === "file" ? "#ffd166" : "#69e7ff";
    var second = kind === "mirror" ? "#9575ff" : "#ffffff";
    return '<svg class="scene" viewBox="0 0 800 540" role="img" aria-label="Secret vault illustration"><defs><linearGradient id="wall" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#34346d"/><stop offset=".6" stop-color="#151b3b"/><stop offset="1" stop-color="#080b18"/></linearGradient><linearGradient id="door" x1="0" x2="1"><stop stop-color="#6450a2"/><stop offset="1" stop-color="#19264e"/></linearGradient><filter id="blur"><feGaussianBlur stdDeviation="9"/></filter></defs><rect x="7" y="7" width="786" height="526" rx="28" fill="url(#wall)" stroke="#ffffff28" stroke-width="2"/><path d="M48 424 L170 177 L580 144 L748 421 Z" fill="#0c1026" stroke="#ffffff25" stroke-width="2"/><path d="M70 421 L190 224 L568 199 L721 421" fill="none" stroke="#ffffff1b" stroke-width="3"/><path d="M191 421V191h165c68 0 119 53 119 119v111" fill="url(#door)" stroke="#0a0c1b" stroke-width="15"/><path d="M230 332c70-64 133-91 208-84" fill="none" stroke="' + accent + '" stroke-opacity=".65" stroke-width="6" stroke-linecap="round"/><circle cx="338" cy="254" r="57" fill="' + accent + '" fill-opacity=".13" filter="url(#blur)"/><circle cx="338" cy="254" r="40" fill="none" stroke="' + accent + '" stroke-width="2" stroke-dasharray="8 11"/><circle cx="338" cy="254" r="9" fill="' + accent + '"/><path d="M530 185h145v108H530z" fill="#ffffff08" stroke="#ffffff3b"/><path d="M550 210h104M550 235h74M550 260h91" stroke="' + second + '" stroke-opacity=".52" stroke-width="4"/><path d="M90 425h646" stroke="#ffd16669" stroke-width="5"/><circle cx="106" cy="98" r="8" fill="' + accent + '"/><circle cx="142" cy="98" r="5" fill="#ffd166"/><circle cx="169" cy="98" r="5" fill="#ff6b9d"/><text x="80" y="143" fill="#ffffff65" font-family="DM Mono,monospace" font-size="12" letter-spacing="4">VAULT 20 / NO SUCH ROOM</text><path d="M656 357l25-26 25 26-25 26z" fill="#ffd166" fill-opacity=".6"/><path d="M116 365l19-20 19 20-19 20z" fill="' + accent + '" fill-opacity=".55"/></svg>';
  }
  function waitSvg() { return '<svg class="team-wait-art" viewBox="0 0 180 140" aria-hidden="true"><circle cx="90" cy="70" r="39" fill="none" stroke="#ffffff25" stroke-width="2"/><circle cx="90" cy="70" r="55" fill="none" stroke="#69e7ff49" stroke-width="2" stroke-dasharray="4 10"/><circle cx="90" cy="70" r="10" fill="#69e7ff" fill-opacity=".8"/><path d="M90 15v22M90 103v22M35 70H13M167 70h-22" stroke="#ffd16675" stroke-width="3" stroke-linecap="round"/></svg>'; }
  function scoreList(limit) { return state.scores.slice().sort(function (a, b) { return b.score - a.score || b.correctCount - a.correctCount || b.rightsWon - a.rightsWon || a.id - b.id; }).slice(0, limit || 5); }
  function currentTime() { return state.timerEnd ? Math.max(0, Math.ceil((state.timerEnd - Date.now()) / 1000)) : 0; }
  function cardKey(teamId) {
    return CARD_PREFIX + String(state.sessionId) + "-" + String(state.roundIndex) + "-" + String(Number(teamId));
  }
  function remoteCardFor(teamId) {
    var key = String(state.sessionId) + "-" + String(state.roundIndex) + "-" + String(Number(teamId));
    return remoteCards[key] || null;
  }
  function teamLocalCard(teamId) { try { var raw = localStorage.getItem(cardKey(teamId)); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
  function hasUsedCard(t, number) { return !!(t && Array.isArray(t.usedCards) && t.usedCards.some(function (n) { return Number(n) === Number(number); })); }
  function pickValid(pick, allowAlreadyUsed) {
    if (!pick || pick.sessionId !== state.sessionId || Number(pick.roundIndex) !== state.roundIndex) return false;
    var id = Number(pick.teamId); var card = Number(pick.card); var target = team(id);
    if (id < 1 || id > 15 || !target || !Number.isInteger(card) || card < 1 || card > 20) return false;
    return allowAlreadyUsed || !hasUsedCard(target, card);
  }
  function cardFor(teamId) {
    var own = state.cardPicks && state.cardPicks[String(teamId)];
    if (own && pickValid(own, true)) return own;
    var remote = remoteCardFor(teamId);
    if (remote && pickValid(remote, false)) return remote;
    var local = teamLocalCard(teamId);
    return local && pickValid(local, false) ? local : null;
  }
  function cardPicksAll() {
    var all = {};
    Object.keys(state.cardPicks || {}).forEach(function (id) { var pick = state.cardPicks[id]; if (pick && pickValid(pick, true)) all[String(id)] = pick; });
    Object.keys(remoteCards).forEach(function (key) { var pick = remoteCards[key]; var id = String(pick && pick.teamId); if (!all[id] && pickValid(pick, false)) all[id] = pick; });
    for (var i = 1; i <= 15; i++) { if (!all[String(i)]) { var local = teamLocalCard(i); if (local && pickValid(local, false)) all[String(i)] = local; } }
    return all;
  }
  function cardCount() { return Object.keys(cardPicksAll()).length; }
  function actionAt(pick) {
    if (pick && pick.serverAt) return Number(pick.serverAt);
    if (pick && pick.submittedAt) {
      if (typeof pick.submittedAt.toMillis === "function") return pick.submittedAt.toMillis();
      if (pick.submittedAt.seconds != null) return Number(pick.submittedAt.seconds) * 1000 + Number(pick.submittedAt.nanoseconds || 0) / 1000000;
      if (typeof pick.submittedAt === "number") return pick.submittedAt;
    }
    return Number(pick && pick.at) || Number.MAX_SAFE_INTEGER;
  }
  function cardLeaders(limit) {
    var all = cardPicksAll();
    return Object.keys(all).map(function (id) { return all[id]; }).sort(function (a, b) { return Number(b.card) - Number(a.card) || actionAt(a) - actionAt(b) || Number(a.teamId) - Number(b.teamId); }).slice(0, limit || 15);
  }

  function initAudio() { if (!audioContext) { try { audioContext = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (audioContext && audioContext.state === "suspended") audioContext.resume(); }
  function tone(freq, duration, type, volume) {
    if (!state.sound || !audioContext) return;
    var osc = audioContext.createOscillator(); var gain = audioContext.createGain(); osc.type = type || "sine"; osc.frequency.value = freq;
    gain.gain.setValueAtTime(.0001, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(volume || .07, audioContext.currentTime + .02); gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);
    osc.connect(gain).connect(audioContext.destination); osc.start(); osc.stop(audioContext.currentTime + duration + .03);
  }
  function sweep(from, to, duration, type, volume, delay) {
    if (!state.sound || !audioContext) return;
    var start = audioContext.currentTime + (delay || 0); var osc = audioContext.createOscillator(); var gain = audioContext.createGain();
    osc.type = type || "sine"; osc.frequency.setValueAtTime(Math.max(1, from), start); osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + duration * .9);
    gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(volume || .05, start + .025); gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    osc.connect(gain).connect(audioContext.destination); osc.start(start); osc.stop(start + duration + .04);
  }
  function soundFor(name) {
    if (name === "open") {
      sweep(240, 980, .34, "sawtooth", .045);
      tone(440, .11, "square", .065);
      setTimeout(function () { tone(660, .12, "triangle", .075); }, 90);
      setTimeout(function () { tone(880, .19, "triangle", .08); }, 180);
      return;
    }
    if (name === "win" || name === "correct") {
      sweep(260, 760, .42, "triangle", .05);
      [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach(function (freq, index) {
        setTimeout(function () { tone(freq, .2, index === 4 ? "sine" : "triangle", .09); }, index * 85);
      });
      setTimeout(function () { tone(1567.98, .32, "sine", .06); }, 470);
      return;
    }
    if (name === "wrong") {
      sweep(360, 88, .3, "sawtooth", .045);
      tone(180, .2, "square", .055);
      setTimeout(function () { tone(120, .32, "sawtooth", .055); }, 100);
      setTimeout(function () { tone(82.41, .42, "triangle", .06); }, 210);
      return;
    }
    if (name === "reveal") {
      tone(392, .08, "square", .06);
      setTimeout(function () { tone(587.33, .11, "triangle", .08); }, 75);
      setTimeout(function () { tone(880, .24, "triangle", .09); }, 150);
      setTimeout(function () { tone(1174.66, .28, "sine", .07); }, 245);
      return;
    }
    if (name === "card") {
      tone(720, .06, "square", .05);
      setTimeout(function () { tone(1080, .07, "triangle", .045); }, 48);
    }
  }
  function speakQuestion(q) {
    if (!q || q.media !== "audio" || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    try {
      var synth = window.speechSynthesis;
      synth.cancel();
      var utterance = new window.SpeechSynthesisUtterance(q.question);
      utterance.lang = "en-US";
      utterance.rate = .84;
      utterance.pitch = .98;
      utterance.volume = .98;
      var voices = synth.getVoices ? synth.getVoices() : [];
      var voice = voices.find(function (item) { return /^en(-|_)(US|GB)/i.test(item.lang) && /Google|Microsoft|Samantha|Natural|English/i.test(item.name); }) || voices.find(function (item) { return /^en/i.test(item.lang); });
      if (voice) utterance.voice = voice;
      synth.speak(utterance);
    } catch (e) {}
  }
  function startGame() {
    initAudio(); clearRoundKeys();
    mutate(function (s) {
      s.sessionId = makeSessionId(); s.phase = "ready"; s.roundIndex = 0; s.winnerTeam = null; s.winnerCard = null; s.cardPicks = {}; s.timerEnd = null; s.autoAt = null; s.history = []; s.lastAward = null; s.sound = true;
      s.scores.forEach(function (t) { t.score = 0; t.wins = 0; t.rightsWon = 0; t.correctCount = 0; t.usedCards = []; });
    }, "Open VAULT 20");
    soundFor("open");
  }
  function clearRoundKeys() {
    var keys = [];
    for (var i = 0; i < localStorage.length; i++) { var key = localStorage.key(i); if (key && (key.indexOf(CARD_PREFIX) === 0 || key.indexOf(LEGACY_BET_PREFIX) === 0)) keys.push(key); }
    keys.forEach(function (key) { localStorage.removeItem(key); });
  }
  function openRound() {
    if (state.phase !== "ready") return;
    clearRoundKeys();
    mutate(function (s) { s.phase = "bet"; s.winnerTeam = null; s.winnerCard = null; s.cardPicks = {}; s.timerEnd = Date.now() + 12000; s.autoAt = null; s.lastAward = null; }, "Open question " + String(state.roundIndex + 1).padStart(2, "0"));
    soundFor("open");
  }
  function scanCards() {
    if (role !== "host" || state.phase !== "bet") return;
    var prefix = CARD_PREFIX + state.sessionId + "-" + state.roundIndex + "-"; var next = clone(state); var changed = false;
    for (var i = 1; i <= 15; i++) {
      var pick = remoteCardFor(i) || null;
      if (!pick) { try { var raw = localStorage.getItem(prefix + i); if (raw) pick = JSON.parse(raw); } catch (e) {} }
      if (!pick || !pickValid(pick, false)) continue;
      var id = Number(pick.teamId); var target = next.scores[id - 1]; var card = Number(pick.card);
      if (!target || hasUsedCard(target, card)) continue;
      if (!next.cardPicks) next.cardPicks = {};
      var key = String(id); var previous = next.cardPicks[key];
      var normalized = { sessionId: state.sessionId, roundIndex: state.roundIndex, teamId: id, card: card, at: Number(pick.at) || Date.now(), serverAt: pick.submittedAt ? actionAt(pick) : null, nonce: pick.nonce || "" };
      var newPick = !previous || Number(previous.card) !== card || String(previous.nonce || "") !== String(normalized.nonce || "");
      if (newPick) {
        // The card is only consumed when the round is revealed. This lets a
        // team change its mind while the countdown is still running.
        if (previous && Number(previous.card) !== card && hasUsedCard(target, Number(previous.card))) target.usedCards = target.usedCards.filter(function (n) { return Number(n) !== Number(previous.card); });
        next.cardPicks[key] = normalized;
          changed = true;
      } else if (pick.submittedAt && !previous.serverAt) {
        previous.serverAt = actionAt(pick); changed = true;
      }
    }
    if (changed) { state = next; save("Code locked"); soundFor("card"); }
  }
  function teamCard(teamId, card) {
    if (state.phase !== "bet" || Number(teamId) !== selectedTeamId || !team(teamId)) return;
    card = Number(card); var target = team(teamId); var current = cardFor(teamId); if (!Number.isInteger(card) || card < 1 || card > 25 || hasUsedCard(target, card) || current && Number(current.card) === card) return;
    var pick = { sessionId: state.sessionId, roundIndex: state.roundIndex, teamId: Number(teamId), card: card, at: Date.now() + performance.now() / 1000, nonce: Math.random().toString(36).slice(2) };
    try { localStorage.setItem(cardKey(teamId), JSON.stringify(pick)); } catch (e) {}
    if (firebaseReady) setDoc(doc(db, "games", GAME_ID, "cards", String(state.sessionId) + "-" + String(state.roundIndex) + "-" + String(teamId)), Object.assign({}, pick, { submittedAt: serverTimestamp() }), { merge: true }).catch(setFirebaseError);
    else if (bus) bus.postMessage({ type: "card", pick: pick });
    render();
  }
  function revealCards() {
    if (state.phase !== "bet") return;
    scanCards(); if (state.phase !== "bet") return;
    var leaders = cardLeaders(15); var winner = leaders.length ? leaders[0] : null;
    mutate(function (s) {
      Object.keys(s.cardPicks || {}).forEach(function (id) {
        var pick = s.cardPicks[id]; var target = s.scores[Number(id) - 1]; var card = Number(pick && pick.card);
        if (!target || !Number.isInteger(card) || card < 1 || card > 25 || hasUsedCard(target, card)) return;
        target.usedCards = Array.isArray(target.usedCards) ? target.usedCards : [];
        target.usedCards.push(card);
      });
      s.winnerTeam = winner ? Number(winner.teamId) : null; s.winnerCard = winner ? Number(winner.card) : null; s.timerEnd = null; s.phase = winner ? "reveal" : "result"; s.autoAt = Date.now() + (winner ? 8000 : 6000);
      s.lastAward = winner ? null : { teamId: null, card: null, points: 0, delta: 0, correct: false, noWinner: true };
    }, winner ? "Reveal · highest code wins" : "No code · 0 points");
    soundFor(winner ? "reveal" : "wrong");
  }
  function enterQuestion() {
    if (state.phase !== "reveal") return;
    var q = currentRound(); var seconds = q.difficulty >= 4 ? 25 : 20;
    mutate(function (s) { s.phase = "question"; s.timerEnd = Date.now() + seconds * 1000; s.autoAt = null; }, "Open question");
    speakQuestion(q);
    soundFor("open");
  }
  function grade(correct) {
    if (state.phase !== "question" || !state.winnerTeam) return;
    var winner = state.winnerTeam; var q = currentRound();
    mutate(function (s) {
      var target = s.scores.find(function (t) { return t.id === winner; }); var card = Number(s.winnerCard) || 0; var delta = 0; var before = target ? target.score : 0;
      if (target) {
        target.rightsWon = Number(target.rightsWon) + 1;
        target.wins = target.rightsWon;
        if (correct) {
          delta = q.points;
          target.score += delta; target.correctCount = Number(target.correctCount) + 1;
        }
      }
      s.history.push({ round: q.id, teamId: winner, card: card, difficulty: q.difficulty, points: q.points, correct: !!correct, delta: delta });
      s.lastAward = { teamId: winner, card: card, points: q.points, delta: delta, correct: !!correct, noWinner: false, before: before, after: target ? target.score : before };
      s.phase = "result"; s.timerEnd = null; s.autoAt = Date.now() + 6000;
    }, correct ? "Correct · +" + q.points + " điểm" : "Wrong · 0 points");
    soundFor(correct ? "win" : "wrong");
  }
  function advanceRound() {
    if (state.phase !== "result" && state.phase !== "scoreboard") return;
    if (state.roundIndex >= rounds.length - 1) { mutate(function (s) { s.phase = "finish"; s.autoAt = null; s.timerEnd = null; }, "Finish VAULT 20"); soundFor("open"); return; }
    clearRoundKeys();
    mutate(function (s) { s.roundIndex += 1; s.phase = "ready"; s.winnerTeam = null; s.winnerCard = null; s.cardPicks = {}; s.timerEnd = null; s.autoAt = null; s.lastAward = null; }, "Next question");
  }
  function showScoreboard() { if (state.phase !== "result") return; mutate(function (s) { s.phase = "scoreboard"; s.autoAt = null; }, "Open leaderboard"); }
  function resetGame() { if (!window.confirm("Reset VAULT 20 and scores?")) return; clearRoundKeys(); state = freshState(); save("Reset session"); }

  function difficultyBadge(q) {
    var meta = difficultyMeta[q.difficulty];
    var stars = "";
    for (var i = 1; i <= 5; i++) stars += '<i class="star-pip ' + (i <= q.difficulty ? "active" : "") + '" style="--star-index:' + i + '">' + (i <= q.difficulty ? "★" : "☆") + '</i>';
    return '<div class="difficulty-badge difficulty-' + q.difficulty + '"><span class="difficulty-stars" aria-label="' + q.difficulty + ' sao">' + stars + '</span><span class="difficulty-points">+' + meta.points + '</span><span class="difficulty-mode">' + esc(meta.short) + '</span></div>';
  }
  function formatPickTime(pick) {
    var ms = actionAt(pick);
    if (!Number.isFinite(ms) || ms === Number.MAX_SAFE_INTEGER) return "—";
    var date = new Date(ms);
    if (Number.isNaN(date.getTime())) return "—";
    return String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0") + ":" + String(date.getSeconds()).padStart(2, "0") + "." + String(date.getMilliseconds()).padStart(3, "0");
  }
  function mediaChip(q) { if (!q.media || q.media === "none") return ""; var label = q.media === "audio" ? "◉ NGHE AUDIO" : q.media === "video" ? "▶ VIDEO GỢI Ý" : "▧ LẬT ẢNH"; return '<div class="media-chip">' + label + '</div>'; }
  function hostControls() {
    var p = state.phase; var q = currentRound();
    if (p === "cover") return '<button class="btn primary large" data-action="start">▶ OPEN VAULT 20</button>';
    if (p === "ready") return '<div class="remote-live"><span class="eyebrow">QUESTION ' + String(state.roundIndex + 1).padStart(2, "0") + '</span>' + difficultyBadge(q) + '</div><button class="btn gold large" data-action="open">✦ LOCK CODES</button>';
    if (p === "bet") return '<div class="remote-live"><span class="eyebrow">CODE LOCK</span><b class="remote-timer">' + currentTime() + 's</b><span class="muted">' + cardCount() + '/15 TEAMS</span></div><button class="btn danger" data-action="reveal">REVEAL CODES</button>';
    if (p === "reveal") return '<div class="remote-live"><span class="eyebrow">RIGHT TO ANSWER</span><b>TEAM ' + String(state.winnerTeam).padStart(2, "0") + ' · CODE ' + state.winnerCard + '</b></div>';
    if (p === "question") {
      var who = state.winnerTeam ? "TEAM " + String(state.winnerTeam).padStart(2, "0") + " · " + esc(teamName(state.winnerTeam)) : "TEAM NOT SET";
      return '<div class="remote-live"><span class="eyebrow">ANSWER · CODE ' + state.winnerCard + '</span><b>' + who + '</b><span class="muted">CORRECT +' + q.points + ' · WRONG 0</span></div><div class="remote-duo"><button class="btn green large" data-action="grade" data-correct="1">✓ CORRECT</button><button class="btn danger large" data-action="grade" data-correct="0">× WRONG</button></div>';
    }
    if (p === "result") {
      var a = state.lastAward; var resultText = a && a.noWinner ? "0 PTS" : ((a && a.correct ? "+" : "") + (a ? a.delta : 0) + " PTS");
      return '<div class="remote-live"><span class="eyebrow">RESULT</span><b>' + resultText + '</b></div><button class="btn primary large" data-action="next">→ NEXT QUESTION</button><button class="btn ghost" data-action="scoreboard">LEADERBOARD</button>';
    }
    if (p === "scoreboard") return '<button class="btn primary large" data-action="next">→ RETURN TO GAME</button>';
    if (p === "finish") return '<button class="btn gold large" data-action="reset">↻ PLAY AGAIN</button>';
    return "";
  }
  function miniScore() { return scoreList(3).map(function (t, i) { return '<div class="mini-score-row"><span>' + (i + 1) + ". " + esc(t.name) + '</span><b>' + t.score + "đ</b></div>"; }).join(""); }
  function hostView() {
    return '<main class="host-root"><header class="simple-header"><a href="#/" class="brand"><span class="brand-mark">◇</span><span class="brand-copy"><b>VAULT 20</b><span>PPT GAME · HOST</span></span></a><div class="header-actions">' + connectionBadge() + '<a class="btn ghost" href="#/stage">STAGE ↗</a><button class="icon-btn" title="Toggle sound" data-action="sound">' + (state.sound ? "🔊" : "🔇") + '</button><button class="icon-btn" title="Reset" data-action="reset">↻</button></div></header><div class="host-wrap"><div class="host-grid"><section class="preview-frame">' + stageView(true) + '</section><aside class="remote"><div class="panel panel-pad remote-title"><div class="eyebrow">HOST CONTROL</div><h1>GAME <span style="color:var(--cyan)">CONTROL</span></h1></div><div class="remote-status"><div class="status-tile"><small>STATUS</small><b>' + phaseLabel() + '</b></div><div class="status-tile"><small>QUESTION</small><b>' + String(Math.min(state.roundIndex + 1, rounds.length)).padStart(2, "0") + " / " + String(rounds.length).padStart(2, "0") + '</b></div></div><div class="panel panel-pad"><div class="remote-actions">' + hostControls() + '</div></div><div class="panel"><div class="panel-head"><h3>LEADERBOARD · TOP 3</h3></div><div class="panel-pad mini-score">' + miniScore() + '</div></div></aside></div></div></main>';
  }
  function stageDecor() { return '<div class="vault-backdrop" aria-hidden="true"></div><div class="stage-rays" aria-hidden="true"></div><div class="fx-grid" aria-hidden="true"></div><i class="fx-orbit fx-orbit-a" aria-hidden="true"></i><i class="fx-orbit fx-orbit-b" aria-hidden="true"></i><i class="fx-particle fp-a" aria-hidden="true"></i><i class="fx-particle fp-b" aria-hidden="true"></i><i class="fx-particle fp-c" aria-hidden="true"></i><i class="fx-particle fp-d" aria-hidden="true"></i><img class="floating-core" src="assets/vault-core.png" alt=""><i class="spark spark-a"></i><i class="spark spark-b"></i><i class="spark spark-c"></i>'; }
  function stageScoreRail() {
    var list = scoreList(5); var max = Math.max(1, list[0] ? list[0].score : 1);
    return '<aside class="stage-score-rail" aria-label="Leaderboard"><div class="rail-title">LEADERBOARD <span>TOP 5</span></div>' + list.map(function (t, i) { return '<div class="rail-row"><span class="rail-rank">0' + (i + 1) + '</span><div><div class="rail-name">' + esc(t.name) + '</div><div class="rail-bar"><i style="width:' + Math.max(5, Math.round(t.score / max * 100)) + '%"></i></div></div><span class="rail-score">' + t.score + ' pts</span></div>'; }).join("") + '</aside>';
  }
  function cardTokens() {
    return cardNumbers.map(function (n) { return '<span class="card-token">' + n + '</span>'; }).join("");
  }
  function stageCover() { return '<div class="slide"><div class="slide-kicker">VAULT · 00</div><h1 class="horror-script">VAULT<br><em>20</em></h1><div class="vault-title-mark"><img src="assets/vault-core.png" alt=""></div><p class="slide-sub">20 questions · 20 codes · one team called</p></div>'; }
  function stageReady() { var q = currentRound(); return '<div class="slide"><span class="slide-number">' + String(state.roundIndex + 1).padStart(2, "0") + '/20</span><div class="slide-kicker">QUESTION LOCK · ' + q.id + '</div><h1 class="horror-script">' + esc(q.title) + '</h1>' + difficultyBadge(q) + '<div class="vault-card-scene"><img src="assets/vault-core.png" alt=""></div><div class="loot-value">+' + q.points + ' PTS</div></div>'; }
  function stageBet() { var q = currentRound(); return '<div class="slide stage-bet"><span class="slide-number">' + String(state.roundIndex + 1).padStart(2, "0") + '/20</span><div class="slide-kicker">CODE LOCK · ' + esc(q.format) + '</div><h1 class="horror-script">Choose <em>one code</em></h1><div class="buzz-line"><div class="timer ' + (currentTime() > 4 ? "safe" : "") + '">' + currentTime() + 's</div><span>' + cardCount() + '/15 TEAMS LOCKED</span></div><div class="card-grid stage-token-grid">' + cardTokens() + '</div></div>'; }
  function formatLockDelta(pick, baseAt) {
    var ms = actionAt(pick); if (!Number.isFinite(ms) || !baseAt) return "LOCK —";
    return "LOCK +" + ((Math.max(0, ms - baseAt)) / 1000).toFixed(2) + "s";
  }
  function stageReveal() {
    var leaders = cardLeaders(15); var winner = state.winnerTeam ? team(state.winnerTeam) : null; var winnerPick = leaders.find(function (pick) { return Number(pick.teamId) === Number(state.winnerTeam); });
    var baseAt = 0; leaders.forEach(function (pick) { var at = actionAt(pick); if (Number.isFinite(at) && at < Number.MAX_SAFE_INTEGER && (!baseAt || at < baseAt)) baseAt = at; });
    var picked = {}; leaders.forEach(function (pick) { picked[String(pick.teamId)] = true; });
    var missing = []; for (var i = 1; i <= 15; i++) if (!picked[String(i)]) missing.push({ teamId: i, card: null, missing: true });
    var rows = leaders.concat(missing);
    var board = rows.map(function (pick, index) {
      var hasPick = !pick.missing; var pickedTeam = team(pick.teamId); var isWinner = hasPick && Number(pick.teamId) === Number(state.winnerTeam);
      return '<div class="bid-row ' + (isWinner ? "is-winner" : "") + '"><span class="bid-rank">' + (hasPick ? "#" + (index + 1) : "—") + '</span><span class="bid-team"><b>TEAM ' + String(pick.teamId).padStart(2, "0") + '</b><small>' + esc(pickedTeam ? pickedTeam.name.replace("Team ", "") : "") + '</small><small class="bid-time">' + (hasPick ? formatLockDelta(pick, baseAt) : "NO LOCK") + '</small></span><strong class="bid-number">' + (hasPick ? pick.card : "—") + '</strong></div>';
    }).join("");
    return '<div class="slide stage-reveal"><div class="slide-kicker">CODE RANKING · ' + leaders.length + '/15 LOCKED</div><h1 class="horror-script">CODES<br><em>REVEALED</em></h1><div class="winner-card reveal-winner"><i class="winner-dot"></i><div><span class="eyebrow">RIGHT TO ANSWER</span><b>TEAM ' + (state.winnerTeam ? String(state.winnerTeam).padStart(2, "0") : "—") + (winner ? ' · ' + esc(winner.name.replace("Team ", "")) : "") + '</b><small>CODE ' + (state.winnerCard || "—") + ' · ' + (winnerPick ? formatLockDelta(winnerPick, baseAt) : "LOCK —") + '</small></div></div><div class="bid-rail">' + board + '</div></div>';
  }
  function stageQuestion() {
    var q = currentRound();
    var who = '<div class="winner-card"><i class="winner-dot"></i><b>TEAM ' + String(state.winnerTeam).padStart(2, "0") + ' · ' + esc(teamName(state.winnerTeam).replace("Team ", "")) + '</b><span class="tag">CODE ' + state.winnerCard + '</span></div>';
    var options = q.options ? '<div class="options">' + q.options.map(function (o, i) { return '<div class="option"><b>' + String.fromCharCode(65 + i) + '</b><span>' + esc(o) + '</span></div>'; }).join("") + '</div>' : '<div class="open-answer">OPEN ANSWER</div>';
    var art = q.media === "image" ? '<div class="slide-visual has-image square-art media-placeholder"><img class="slide-art-image" src="assets/vault-shard.jpg" alt=""><span>IMAGE CLUE PENDING</span></div>' : "";
    var rapid = q.media === "video" ? '<div class="rapid-cue"><span>01</span><span>02</span><span>03</span><span>04</span><span>05</span></div>' : "";
    return '<div class="slide"><span class="slide-number">' + String(state.roundIndex + 1).padStart(2, "0") + '/20</span><div class="slide-kicker">QUESTION · +' + q.points + ' PTS</div>' + who + '<div class="question-meta">' + difficultyBadge(q) + mediaChip(q) + '<span class="round-counter">' + esc(q.format) + '</span></div>' + art + rapid + '<div class="question-box ' + (q.media === "image" ? "has-art" : "") + '"><h2>' + esc(q.question) + '</h2>' + options + '</div></div>';
  }
  function stageResult() {
    var award = state.lastAward || { delta: 0, teamId: null, noWinner: true, correct: false }; var ok = !!award.correct; var n = award.noWinner ? "0" : (award.correct ? "+" : "") + award.delta;
    var burst = ok ? '<div class="celebration-burst" aria-hidden="true"><i>✦</i><i>★</i><i>✧</i><i>✦</i><i>★</i><i>✧</i><i>✦</i><i>★</i><i>✧</i><i>✦</i><i>★</i><i>✧</i></div>' : "";
    return '<div class="slide result-slide ' + (ok ? "correct-result" : "wrong-result") + '">' + burst + '<div class="result-mark ' + (ok ? "" : "wrong") + '">' + (award.noWinner ? "·" : (ok ? "✓" : "×")) + '</div><div class="slide-kicker">' + (award.noWinner ? "NO CODE" : (ok ? "VAULT OPEN" : "WRONG · 0 PTS")) + '</div><div class="award">' + n + '</div><h1 style="font-size:clamp(28px,5vw,62px)">' + (award.noWinner ? "EVERYONE" : esc(teamName(award.teamId).replace("Team ", ""))) + '</h1></div>';
  }
  function stageScoreboard() { var list = scoreList(5); var max = Math.max(1, list[0] ? list[0].score : 1); return '<div class="slide stage-scoreboard"><div class="slide-kicker">LEADERBOARD · UPDATED</div><h1 style="font-size:clamp(34px,5.6vw,74px)">WHO IS STILL STANDING?</h1><div class="stage-score-strip">' + list.map(function (t, i) { return '<div class="score-row"><span class="score-rank">0' + (i + 1) + '</span><div><div class="score-name">' + esc(t.name) + '</div><div class="score-bar"><i style="width:' + Math.max(4, Math.round(t.score / max * 100)) + '%"></i></div></div><span class="score-points">' + t.score + ' pts</span></div>'; }).join("") + '</div></div>'; }
  function stageFinish() { var list = scoreList(3); return '<div class="slide"><div class="slide-kicker">SESSION COMPLETE · VAULT OPEN</div><h1 style="font-size:clamp(37px,6.3vw,90px)">TOP THREE<br><em>TEAMS</em></h1><div class="podium"><div class="podium-col p2"><b>' + esc(list[1] ? list[1].name : "—") + '</b><div class="podium-block">02</div></div><div class="podium-col p1"><b>' + esc(list[0] ? list[0].name : "—") + '</b><div class="podium-block">01</div></div><div class="podium-col p3"><b>' + esc(list[2] ? list[2].name : "—") + '</b><div class="podium-block">03</div></div></div><p class="slide-sub">20 codes used · 20 questions scored.</p></div>'; }
  function stageSlide() { if (state.phase === "cover") return stageCover(); if (state.phase === "ready") return stageReady(); if (state.phase === "bet") return stageBet(); if (state.phase === "reveal") return stageReveal(); if (state.phase === "question") return stageQuestion(); if (state.phase === "result") return stageResult(); if (state.phase === "scoreboard") return stageScoreboard(); return stageFinish(); }
  function stageView(compact) {
    return '<main class="stage-root ' + (compact ? "stage-compact" : "") + '"><header class="stage-header"><a href="#/" class="brand"><span class="brand-mark">◇</span><span class="brand-copy"><b>VAULT 20</b><span>STAGE · PPT MODE</span></span></a><div class="stage-tools"><div class="stage-code">' + phaseLabel() + ' · ' + String(Math.min(state.roundIndex + 1, rounds.length)).padStart(2, "0") + '/' + String(rounds.length).padStart(2, "0") + '</div>' + (compact ? "" : '<button class="stage-fullscreen" data-action="fullscreen" title="Fullscreen" aria-label="Fullscreen">⛶</button>') + '</div></header><section class="stage-main">' + stageDecor() + stageSlide() + (compact ? "" : stageScoreRail()) + '</section>' + (compact ? "" : '<footer class="stage-footer"><span>15 TEAMS · 20 QUESTIONS · 20 CODES / TEAM</span></footer>') + '</main>';
  }
  function cardGridMarkup(id) {
    var t = team(id); var chosen = cardFor(id); var used = t.usedCards || [];
    return '<div class="card-grid team-card-grid">' + cardNumbers.map(function (n) { var isUsed = used.indexOf(n) >= 0; var isSelected = chosen && Number(chosen.card) === n; var disabled = isUsed || isSelected; return '<button class="card-token ' + (isUsed ? "used" : "") + ' ' + (isSelected ? "selected" : "") + '" data-action="card" data-card="' + n + '" ' + (disabled ? "disabled" : "") + '>' + n + '</button>'; }).join("") + '</div><div class="card-grid-note"><span>' + (chosen ? "LOCKED · CHANGEABLE" : "PICK 1 / 20 CODE") + '</span><span>USED ' + used.length + '/20</span></div>';
  }
  function teamPickerView() {
    return '<main class="team-root team-picker-root"><section class="team-phone"><div class="team-picker-body"><div class="eyebrow">VAULT 20 · SHARED LINK</div><div class="team-picker-core"><img src="assets/vault-core.png" alt=""></div><h1>Choose<br><em>your team</em></h1><p>One phone per team.</p><div class="team-picker-grid">' + teamNames.map(function (name, i) { return '<button class="team-picker-card" data-action="select-team" data-team="' + (i + 1) + '"><b>' + String(i + 1).padStart(2, "0") + '</b><span>' + esc(name.replace("Team ", "")) + '</span></button>'; }).join("") + '</div></div><footer class="team-foot">TEAM SELECTED · WAIT FOR HOST</footer></section></main>';
  }
  function teamView() {
    var id = selectedTeamId; var t = team(id); var q = currentRound(); var chosen = cardFor(id); var body = "";
    if (state.phase === "cover") {
      body = waitSvg() + '<div class="team-round">VAULT 20</div><h1>Ready<br>to play?</h1><p>Wait for the host to open the game.</p>';
    } else if (state.phase === "ready") {
      body = '<div class="team-round">QUESTION ' + String(state.roundIndex + 1).padStart(2, "0") + ' / 20</div><h1>Get<br>ready.</h1><p>The host is preparing the code lock.</p>' + difficultyBadge(q) + '<div class="team-photo"><img src="assets/vault-shard.jpg" alt=""></div>';
    } else if (state.phase === "bet") {
      body = '<div class="team-round">QUESTION ' + String(state.roundIndex + 1).padStart(2, "0") + ' / 20 · CODE LOCK</div><h1>' + (chosen ? "Code<br>locked." : "Pick<br>a code.") + '</h1><p>' + (chosen ? "Choose another number before the timer ends." : "+" + q.points + " points for a correct answer.") + '</p><div class="phone-timer">' + currentTime() + 's</div>' + cardGridMarkup(id);
    } else if (state.phase === "reveal") {
      body = '<div class="team-round">QUESTION ' + String(state.roundIndex + 1).padStart(2, "0") + ' · REVEAL</div><h1>' + (state.winnerTeam === id ? "Your team<br>is called." : "Codes<br>revealed.") + '</h1><p>' + (state.winnerTeam === id ? "Get ready to answer." : "Watch the projector.") + '</p><div class="card-reveal-number">' + state.winnerCard + '</div>';
    } else if (state.phase === "question") {
      body = '<div class="team-round">QUESTION ' + String(state.roundIndex + 1).padStart(2, "0") + ' · +' + q.points + ' PTS</div><h1>' + (state.winnerTeam === id ? "Your<br>turn." : "Team<br>answering.") + '</h1><p>' + (state.winnerTeam === id ? "Answer aloud to the host." : "Wait for the result.") + '</p>' + difficultyBadge(q) + '<div class="team-message">CODE ' + state.winnerCard + ' · ' + esc(q.format) + '</div>';
    } else if (state.phase === "result") {
      var mine = state.lastAward && state.lastAward.teamId === id; var delta = mine ? state.lastAward.delta : 0; body = '<div class="team-round">RESULT · QUESTION ' + String(state.roundIndex + 1).padStart(2, "0") + '</div>' + (mine ? '<div class="team-score-flash">' + (state.lastAward.correct ? "+" : "") + delta + '</div><h1>' + (state.lastAward.correct ? "Correct." : "Wrong.") + '</h1><p>' + (state.lastAward.correct ? "Points added." : "Wrong = 0 points.") + '</p>' : '<h1>Wait for<br>the next question.</h1><p>Watch the projector.</p>') + '<div class="team-message">' + esc(q.title) + '</div>';
    } else if (state.phase === "finish") {
      body = '<div class="team-photo"><img src="assets/vault-shard.jpg" alt=""></div><div class="team-round">SESSION COMPLETE</div><div class="team-score-flash">' + t.score + '</div><p>points · see the projector leaderboard</p>';
    } else if (state.phase === "scoreboard") {
      body = waitSvg() + '<div class="team-round">LEADERBOARD</div><h1>Scores<br>updated.</h1><p>' + t.score + ' points · check the projector.</p>';
    } else {
      body = waitSvg() + '<div class="team-round">WAITING</div><h1>Watch<br>the projector.</h1><p>Wait for the next screen.</p>';
    }
    return '<main class="team-root"><section class="team-phone"><header class="team-head"><div><b>' + esc(t.name.replace("Team ", "")) + '</b><small>TEAM ' + String(id).padStart(2, "0") + '</small></div><div class="team-head-actions"><button class="team-switch" data-action="team-switch" title="Switch team">↺</button><span class="team-score">' + t.score + ' pts</span></div></header><div class="team-body">' + body + '</div><footer class="team-foot">VAULT 20 · ' + (state.phase === "bet" ? "PICK 1 CODE" : "WATCH THE PROJECTOR") + '</footer></section></main>';
  }
  function homeView() { return '<main class="home"><div class="home-grid"><section class="home-copy"><div class="eyebrow">PPT GAME · 15 TEAMS</div><h1 class="horror-script">VAULT<br><em>20</em></h1><p>Pick a code · win the answer.</p><div class="home-actions"><a class="btn primary large" href="#/host">OPEN HOST</a><a class="btn ghost large" href="#/stage">OPEN STAGE</a><a class="btn ghost large" href="#/team">SHARED TEAM LINK</a></div><div class="home-note"><div><b>20</b><span>questions</span></div><div><b>15</b><span>teams</span></div><div><b>20</b><span>codes / team</span></div></div></section><section class="museum-card" aria-label="VAULT 20 illustration"><div class="home-orbit"></div><div class="home-door"></div><i class="home-piece hp1"></i><i class="home-piece hp2"></i><i class="home-piece hp3"></i><i class="home-piece hp4"></i><div class="museum-word">20</div><div class="eyebrow" style="position:absolute;right:27px;bottom:25px;color:#ffffff66">VAULT 20</div></section></div></main>'; }

  function bind() {
    document.querySelectorAll("[data-action]").forEach(function (el) { el.addEventListener("click", handleAction); });
  }
  function handleAction(event) {
    var el = event.currentTarget; var action = el.getAttribute("data-action");
    if (action === "start") return startGame();
    if (action === "open") return openRound();
    if (action === "reveal") return revealCards();
    if (action === "grade") return grade(el.getAttribute("data-correct") === "1");
    if (action === "next") return advanceRound();
    if (action === "scoreboard") return showScoreboard();
    if (action === "reset") return resetGame();
    if (action === "fullscreen") {
      var stageTarget = document.querySelector(".stage-root:not(.stage-compact)") || document.documentElement;
      if (document.fullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen().catch(function () {});
      } else if (stageTarget.requestFullscreen) {
        stageTarget.requestFullscreen().catch(function () {});
      } else if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(function () {});
      }
      return;
    }
    if (action === "sound") {
      initAudio();
      var nextSound = !state.sound;
      mutate(function (s) { s.sound = nextSound; }, nextSound ? "Bật âm thanh" : "Tắt âm thanh");
      return;
    }
    if (action === "select-team") {
      var chosenTeam = Number(el.getAttribute("data-team"));
      if (Number.isInteger(chosenTeam) && chosenTeam >= 1 && chosenTeam <= 15) {
        selectedTeamId = chosenTeam;
        try { localStorage.setItem(TEAM_SELECTION_KEY, String(selectedTeamId)); } catch (e) {}
        render();
      }
      return;
    }
    if (action === "team-switch") {
      selectedTeamId = 0;
      try { localStorage.removeItem(TEAM_SELECTION_KEY); } catch (e) {}
      render();
      return;
    }
    if (action === "card") return teamCard(selectedTeamId, Number(el.getAttribute("data-card")));
  }
  function render() {
    parseRoute();
    if (role === "stage" && state.phase === "result" && state.lastAward && state.lastAward.correct) {
      var award = state.lastAward;
      var signature = String(state.sessionId) + ":" + String(state.roundIndex) + ":" + String(award.teamId) + ":" + String(award.after);
      if (signature !== lastStageCelebration) {
        lastStageCelebration = signature;
        initAudio();
        soundFor("win");
      }
    }
    if (role === "stage" && state.phase === "question" && currentRound().media === "audio") {
      var speechKey = String(state.sessionId) + ":" + String(state.roundIndex);
      if (speechKey !== lastSpokenQuestion) {
        lastSpokenQuestion = speechKey;
        setTimeout(function () { if (role === "stage" && state.phase === "question") speakQuestion(currentRound()); }, 100);
      }
    } else if (state.phase !== "question") {
      lastSpokenQuestion = "";
    }
    if (role === "host" && firebaseReady && remoteStateKnown && !remoteStateExists && !pendingRemoteCreate) {
      pendingRemoteCreate = true;
      save("Create VAULT 20 session");
      pendingRemoteCreate = false;
    }
    document.body.classList.toggle("stage-mode", role === "stage");
    document.getElementById("app").innerHTML = role === "host" ? hostView() : role === "stage" ? stageView(false) : role === "team" ? (selectedTeamId ? teamView() : teamPickerView()) : homeView();
    bind();
  }
  document.addEventListener("keydown", function (event) {
    if (role !== "host" || event.target && /input|textarea/i.test(event.target.tagName)) return;
    if (event.code === "Space") {
      event.preventDefault();
      if (state.phase === "cover") startGame(); else if (state.phase === "ready") openRound(); else if (state.phase === "bet") revealCards(); else if (state.phase === "question") grade(true); else if (state.phase === "result" || state.phase === "scoreboard") advanceRound(); else if (state.phase === "finish") resetGame();
    }
    if (event.key === "1" && state.phase === "question") grade(true);
    if (event.key === "0" && state.phase === "question") grade(false);
  });
  setInterval(function () {
    if (role === "host" && state.phase === "bet") { scanCards(); if (state.phase === "bet" && currentTime() <= 0) revealCards(); }
    if (role === "host" && state.phase === "reveal" && state.autoAt && Date.now() >= state.autoAt) enterQuestion();
    if (role === "host" && state.phase === "result" && state.autoAt && Date.now() >= state.autoAt) advanceRound();
    document.querySelectorAll(".remote-timer, .timer, .phone-timer").forEach(function (el) { if (state.phase === "bet") el.textContent = currentTime() + "s"; });
  }, 220);
  parseRoute();
  render();
  bootFirebase();
})();
