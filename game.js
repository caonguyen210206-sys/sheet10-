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

  var GAME_ID = "paradox-v3";
  var CHANNEL = "paradox-ppt-live-v3";
  var STATE_KEY = "paradox-ppt-state-v3";
  var MASCOT_PREFIX = "paradox-ppt-mascot-v3-";
  var CARD_PREFIX = "paradox-ppt-card-v3-";
  var LEGACY_BET_PREFIX = "paradox-ppt-bet-v2-";
  var TEAM_SELECTION_KEY = "paradox-ppt-team-choice-v3";
  var selectedTeamId = 0;
  var audioContext = null;
  var lastStageCelebration = "";
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
  var remoteMascots = {};
  var remoteCards = {};
  var stateUnsubscribe = null;
  var mascotUnsubscribe = null;
  var cardUnsubscribe = null;
  var pendingRemoteCreate = false;
  var cardNumbers = Array.from({ length: 25 }, function (_, i) { return i + 1; });

  var teamNames = [
    "Đội Sao Bắc Đẩu", "Đội Mắt Mèo", "Đội Mật Mã", "Đội Quạ Đêm", "Đội Tia Chớp",
    "Đội Hộp Nhạc", "Đội Kính Vạn Hoa", "Đội Bóng Trăng", "Đội Cú Đêm", "Đội La Bàn",
    "Đội Mê Cung", "Đội Mảnh Ghép", "Đội Đồng Hồ", "Đội Vệt Sáng", "Đội Cánh Cửa"
  ];

  var difficultyMeta = {
    1: { stars: "★", points: 10, format: "A / B / C / D", media: "none", short: "CHỌN ĐÁP ÁN" },
    2: { stars: "★★", points: 15, format: "ENGLISH AUDIO · A / B / C / D", media: "audio", short: "NGHE · CHỌN" },
    3: { stars: "★★★", points: 25, format: "ENGLISH AUDIO · OPEN", media: "audio", short: "NGHE · TỰ TRẢ LỜI" },
    4: { stars: "★★★★", points: 40, format: "NỬA ẢNH · A / B / C / D", media: "image", short: "LẬT ẢNH · CHỌN" },
    5: { stars: "★★★★★", points: 60, format: "VIDEO GỢI Ý · OPEN", media: "video", short: "VIDEO · TỰ TRẢ LỜI" }
  };

  var rounds = [
    { title: "Chiếc bóng không có chủ", visual: "orb", difficulty: 1, question: "Chi tiết nào phá vỡ quy luật của căn phòng?", options: ["Bóng đi ngược hướng", "Cửa mở vào tường", "Đèn tắt", "Gương phản chiếu"], answer: "A", hint: "Quan sát hướng sáng và hướng bóng." },
    { title: "Dấu chân trên trần", visual: "steps", difficulty: 1, question: "Bằng chứng nào đáng tin nhất để kết luận có người đi qua?", options: ["Một tiếng động", "Dấu chân có hướng", "Cánh cửa rung", "Lời kể lại"], answer: "B", hint: "Ưu tiên bằng chứng có thể kiểm chứng." },
    { title: "Bức tranh đổi chỗ", visual: "frame", difficulty: 1, question: "Điều gì cần kiểm tra trước khi tin vào lời giải?", options: ["Nguồn dữ kiện", "Màu sắc", "Tốc độ trả lời", "Cảm giác"], answer: "A", hint: "Một kết luận tốt phải có dữ kiện rõ." },
    { title: "Cánh cửa thứ năm", visual: "door", difficulty: 1, question: "Khi hai dấu hiệu mâu thuẫn, cách xử lý hợp lý là gì?", options: ["Chọn dấu hiệu nổi bật", "Bỏ qua cả hai", "Kiểm tra lại giả định", "Đoán theo số đông"], answer: "C", hint: "Đừng vội chốt khi tiền đề chưa chắc." },
    { title: "Mảnh ghép cuối", visual: "mirror", difficulty: 1, question: "Thứ tự suy luận nào an toàn nhất?", options: ["Kết luận → dữ kiện", "Dữ kiện → kiểm tra → kết luận", "Đoán → bảo vệ đáp án", "Hỏi số đông → kết luận"], answer: "B", hint: "Luôn đi từ bằng chứng đến kết luận." },

    { title: "The locked archive", visual: "file", difficulty: 2, question: "Which clue should you trust first?", options: ["A loud rumor", "A timestamped record", "A guess", "A dramatic photo"], answer: "B", hint: "Look for a source that can be checked." },
    { title: "The silent alarm", visual: "door", difficulty: 2, question: "What does reliable mean in this case?", options: ["It can be checked", "It sounds scary", "It is very long", "It is popular"], answer: "A", hint: "Reliability is about verification." },
    { title: "The missing label", visual: "frame", difficulty: 2, question: "Which question clarifies the problem fastest?", options: ["Who benefits?", "Can we verify the source?", "Who is loudest?", "What feels right?"], answer: "B", hint: "Start with the evidence behind the claim." },
    { title: "The false map", visual: "mirror", difficulty: 2, question: "What is the best way to test a claim?", options: ["Repeat it", "Compare evidence", "Hide it", "Vote"], answer: "B", hint: "A claim is stronger when independent evidence agrees." },
    { title: "The echo room", visual: "orb", difficulty: 2, question: "Which response shows critical thinking?", options: ["I agree because everyone does", "I need evidence before deciding", "It looks true", "No one knows"], answer: "B", hint: "Pause before accepting an attractive answer." },

    { title: "The borrowed shadow", visual: "steps", difficulty: 3, question: "Name one reason a source can be misleading.", options: null, answer: "", hint: "Think about selection, timing, or bias." },
    { title: "The paper witness", visual: "file", difficulty: 3, question: "Why should a claim be separated from an opinion?", options: null, answer: "", hint: "One can be tested; the other expresses a view." },
    { title: "The glass equation", visual: "orb", difficulty: 3, question: "What is one test for a strong explanation?", options: null, answer: "", hint: "Ask whether it predicts or explains the evidence." },
    { title: "The repeating hallway", visual: "door", difficulty: 3, question: "How can you reduce confirmation bias?", options: null, answer: "", hint: "Deliberately look for evidence that could disprove you." },
    { title: "The split testimony", visual: "mirror", difficulty: 3, question: "What should you do when two sources disagree?", options: null, answer: "", hint: "Compare their methods, dates, and evidence." },

    { title: "Nửa chiếc đồng hồ", visual: "clock", difficulty: 4, question: "Which inference is safest from the revealed half-image?", options: ["The object is definitely new", "The room is empty", "The image is incomplete, so check more", "The clue is fake"], answer: "C", hint: "Do not overclaim from partial evidence." },
    { title: "Mắt kính nứt", visual: "lens", difficulty: 4, question: "What should be checked before identifying an object?", options: ["Its context and scale", "The loudest guess", "The color only", "A random label"], answer: "A", hint: "Context changes what a visual clue means." },
    { title: "Bóng sau rèm", visual: "curtain", difficulty: 4, question: "Which detail would confirm the direction of movement?", options: ["The wall color", "The frame size", "The soundtrack", "A second aligned frame"], answer: "D", hint: "A sequence gives direction better than one still." },
    { title: "Bản đồ gấp", visual: "map", difficulty: 4, question: "What makes a visual clue useful?", options: ["It is mysterious", "It connects to a testable claim", "It is colorful", "It is hard to see"], answer: "B", hint: "The clue must help answer a specific question." },
    { title: "Con dấu mờ", visual: "seal", difficulty: 4, question: "Which missing detail matters most?", options: ["The decoration", "The background music", "The date or source", "The frame border"], answer: "C", hint: "Provenance anchors a visual record." },

    { title: "Ba khung hình", visual: "frames", difficulty: 5, question: "What pattern did you notice first?", options: null, answer: "", hint: "State the pattern, then point to one frame that supports it." },
    { title: "Vệt sáng", visual: "streak", difficulty: 5, question: "What is the most likely sequence?", options: null, answer: "", hint: "Rebuild the order from the fastest visual changes." },
    { title: "Mật mã chớp", visual: "code", difficulty: 5, question: "State the rule behind the symbols.", options: null, answer: "", hint: "Look for what changes and what stays constant." },
    { title: "Căn phòng đảo", visual: "room", difficulty: 5, question: "Which object changed position?", options: null, answer: "", hint: "Compare the first and last frames, not the flash in between." },
    { title: "Khung hình cuối", visual: "final", difficulty: 5, question: "Give the strongest conclusion and one reason.", options: null, answer: "", hint: "A strong conclusion is precise and evidence-based." }
  ].map(function (round, index) {
    var meta = difficultyMeta[round.difficulty];
    return { id: "V" + String(index + 1).padStart(2, "0"), title: round.title, visual: round.visual, difficulty: round.difficulty, points: meta.points, format: meta.format, media: meta.media, question: round.question, options: round.options, answer: round.answer, hint: round.hint };
  });

  var mascots = [
    { id: "raven", name: "Quạ Tiên Tri", skill: "GỢI Ý", desc: "Mở gợi ý riêng trước khi chốt mã.", color: "#69e7ff" },
    { id: "cat", name: "Mèo Chín Mạng", skill: "+5 ★ / ★★", desc: "Đúng câu 1–2 sao: thêm 5 điểm.", color: "#9575ff" },
    { id: "fox", name: "Cáo Giao Kèo", skill: "+5 ★★★+", desc: "Đúng câu 3 sao trở lên: thêm 5 điểm.", color: "#ff6b9d" },
    { id: "dragon", name: "Rồng Tro Tàn", skill: "+8", desc: "Đúng: thêm 8 điểm.", color: "#ffd166" },
    { id: "spider", name: "Nhện Đồng Hồ", skill: "+15 GIÂY", desc: "Thêm 15 giây khi trả lời.", color: "#69e0ad" },
    { id: "deer", name: "Hươu Hộ Mệnh", skill: "+8 ★★★★+", desc: "Đúng câu 4–5 sao: thêm 8 điểm.", color: "#b7a5ff" }
  ];

  function makeSessionId() { return String(Date.now()) + "-" + Math.random().toString(36).slice(2, 7); }
  function freshState() {
    return {
      version: 3,
      sessionId: makeSessionId(),
      phase: "cover",
      roundIndex: 0,
      winnerTeam: null,
      winnerCard: null,
      winnerSkill: null,
      cardPicks: {},
      timerEnd: null,
      autoAt: null,
      scores: teamNames.map(function (name, i) { return { id: i + 1, name: name, score: 0, wins: 0, rightsWon: 0, correctCount: 0, mascotId: null, skillUsed: false, usedCards: [] }; }),
      history: [],
      lastAward: null,
      sound: true
    };
  }

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function normalizeScores(scores) {
    return scores.map(function (t, i) {
      t.id = Number(t.id) || i + 1;
      t.name = t.name || teamNames[i] || ("Đội " + String(i + 1).padStart(2, "0"));
      t.score = Number(t.score) || 0;
      t.wins = Number(t.wins) || 0;
      t.rightsWon = Number(t.rightsWon) || Number(t.wins) || 0;
      t.correctCount = Number(t.correctCount) || 0;
      t.usedCards = Array.isArray(t.usedCards) ? t.usedCards.map(Number).filter(function (n) { return n >= 1 && n <= 25; }) : [];
      t.skillUsed = !!t.skillUsed;
      return t;
    });
  }
  function loadState() {
    try {
      var raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        var loaded = JSON.parse(raw);
        if (loaded && Number(loaded.version) === 3 && Array.isArray(loaded.scores) && loaded.scores.length === 15 && loaded.phase) {
          loaded.scores = normalizeScores(loaded.scores);
          loaded.cardPicks = loaded.cardPicks || {};
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
      if (!firebaseReady && data.type === "mascot" && data.choice && role === "host") scanMascots();
      if (!firebaseReady && data.type === "card" && data.pick && role === "host") scanCards();
    };
  }
  window.addEventListener("storage", function (event) {
    if (!firebaseReady && event.key === STATE_KEY && event.newValue) { try { var incoming = JSON.parse(event.newValue); if (validState(incoming)) { state = incoming; render(); } } catch (e) {} }
    if (!firebaseReady && role === "host" && event.key && event.key.indexOf(MASCOT_PREFIX + state.sessionId + "-") === 0) scanMascots();
    if (!firebaseReady && role === "host" && event.key && event.key.indexOf(CARD_PREFIX + state.sessionId + "-" + state.roundIndex + "-") === 0) scanCards();
  });

  function validState(value) { return !!(value && Number(value.version) === 3 && Array.isArray(value.scores) && value.scores.length === 15 && value.phase); }
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
    mascotUnsubscribe = onSnapshot(collection(db, "games", GAME_ID, "mascots"), function (snapshot) {
      remoteMascots = {};
      snapshot.forEach(function (item) { var choice = item.data(); if (choice && choice.sessionId && choice.teamId) remoteMascots[String(choice.sessionId) + "-" + String(choice.teamId)] = choice; });
      if (role === "host") scanMascots(); else if (role !== "home") render();
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
  function phaseLabel() { return ({ cover: "MỞ MÀN", mascot: "LINH VẬT", ready: "KHOÁ CÂU", bet: "CHỌN MÃ", reveal: "LỘ MÃ", question: "TRẢ LỜI", result: "KẾT QUẢ", scoreboard: "BXH", finish: "CHUNG KẾT" })[state.phase] || "VAULT 25"; }
  function connectionBadge() {
    if (firebaseReady) return '<span class="connection-badge live" title="Các thiết bị đang đồng bộ realtime">FIREBASE LIVE</span>';
    if (firebaseError) return '<span class="connection-badge error" title="' + esc(firebaseError) + '">CẦN BẬT AUTH</span>';
    return '<span class="connection-badge">ĐANG KẾT NỐI</span>';
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
    return '<svg class="scene" viewBox="0 0 800 540" role="img" aria-label="Minh họa két bí mật"><defs><linearGradient id="wall" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#34346d"/><stop offset=".6" stop-color="#151b3b"/><stop offset="1" stop-color="#080b18"/></linearGradient><linearGradient id="door" x1="0" x2="1"><stop stop-color="#6450a2"/><stop offset="1" stop-color="#19264e"/></linearGradient><filter id="blur"><feGaussianBlur stdDeviation="9"/></filter></defs><rect x="7" y="7" width="786" height="526" rx="28" fill="url(#wall)" stroke="#ffffff28" stroke-width="2"/><path d="M48 424 L170 177 L580 144 L748 421 Z" fill="#0c1026" stroke="#ffffff25" stroke-width="2"/><path d="M70 421 L190 224 L568 199 L721 421" fill="none" stroke="#ffffff1b" stroke-width="3"/><path d="M191 421V191h165c68 0 119 53 119 119v111" fill="url(#door)" stroke="#0a0c1b" stroke-width="15"/><path d="M230 332c70-64 133-91 208-84" fill="none" stroke="' + accent + '" stroke-opacity=".65" stroke-width="6" stroke-linecap="round"/><circle cx="338" cy="254" r="57" fill="' + accent + '" fill-opacity=".13" filter="url(#blur)"/><circle cx="338" cy="254" r="40" fill="none" stroke="' + accent + '" stroke-width="2" stroke-dasharray="8 11"/><circle cx="338" cy="254" r="9" fill="' + accent + '"/><path d="M530 185h145v108H530z" fill="#ffffff08" stroke="#ffffff3b"/><path d="M550 210h104M550 235h74M550 260h91" stroke="' + second + '" stroke-opacity=".52" stroke-width="4"/><path d="M90 425h646" stroke="#ffd16669" stroke-width="5"/><circle cx="106" cy="98" r="8" fill="' + accent + '"/><circle cx="142" cy="98" r="5" fill="#ffd166"/><circle cx="169" cy="98" r="5" fill="#ff6b9d"/><text x="80" y="143" fill="#ffffff65" font-family="DM Mono,monospace" font-size="12" letter-spacing="4">VAULT 25 / NO SUCH ROOM</text><path d="M656 357l25-26 25 26-25 26z" fill="#ffd166" fill-opacity=".6"/><path d="M116 365l19-20 19 20-19 20z" fill="' + accent + '" fill-opacity=".55"/></svg>';
  }
  function waitSvg() { return '<svg class="team-wait-art" viewBox="0 0 180 140" aria-hidden="true"><circle cx="90" cy="70" r="39" fill="none" stroke="#ffffff25" stroke-width="2"/><circle cx="90" cy="70" r="55" fill="none" stroke="#69e7ff49" stroke-width="2" stroke-dasharray="4 10"/><circle cx="90" cy="70" r="10" fill="#69e7ff" fill-opacity=".8"/><path d="M90 15v22M90 103v22M35 70H13M167 70h-22" stroke="#ffd16675" stroke-width="3" stroke-linecap="round"/></svg>'; }
  function scoreList(limit) { return state.scores.slice().sort(function (a, b) { return b.score - a.score || b.correctCount - a.correctCount || b.rightsWon - a.rightsWon || a.id - b.id; }).slice(0, limit || 5); }
  function currentTime() { return state.timerEnd ? Math.max(0, Math.ceil((state.timerEnd - Date.now()) / 1000)) : 0; }
  function mascotById(id) { return mascots.find(function (m) { return m.id === id; }) || mascots[0]; }
  function mascotImage(id) { return "assets/mascots/" + mascotById(id).id + ".jpg"; }
  function mascotArt(id, cls) { var m = mascotById(id); return '<span class="mascot-art ' + (cls || "") + '"><img src="' + mascotImage(m.id) + '" alt="' + esc(m.name) + '"></span>'; }
  function mascotKey(teamId) { return MASCOT_PREFIX + state.sessionId + "-" + teamId; }
  function cardKey(teamId) { return CARD_PREFIX + state.sessionId + "-" + state.roundIndex + "-" + teamId; }
  function teamLocalMascot(teamId) { try { var raw = localStorage.getItem(mascotKey(teamId)); if (raw) { var obj = JSON.parse(raw); return obj.id || null; } } catch (e) {} return null; }
  function teamLocalCard(teamId) { try { var raw = localStorage.getItem(cardKey(teamId)); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
  function teamSkillArmed(teamId) { try { return sessionStorage.getItem("paradox-ppt-skill-v3-" + state.sessionId + "-" + teamId) === "1"; } catch (e) { return false; } }
  function setTeamSkillArmed(teamId, armed) { try { sessionStorage.setItem("paradox-ppt-skill-v3-" + state.sessionId + "-" + teamId, armed ? "1" : "0"); } catch (e) {} }
  function remoteMascotFor(teamId) { return remoteMascots[String(state.sessionId) + "-" + String(teamId)] || null; }
  function remoteCardFor(teamId) { return remoteCards[String(state.sessionId) + "-" + String(state.roundIndex) + "-" + String(teamId)] || null; }
  function mascotCount() {
    var claimed = {};
    state.scores.forEach(function (t) { if (t.mascotId) claimed[t.id] = true; });
    Object.keys(remoteMascots).forEach(function (key) { var choice = remoteMascots[key]; if (choice && choice.sessionId === state.sessionId && Number(choice.teamId) >= 1 && Number(choice.teamId) <= 15) claimed[Number(choice.teamId)] = true; });
    return Object.keys(claimed).length;
  }
  function mascotClaimed(mascotId) { return state.scores.some(function (t) { return t.mascotId === mascotId; }) || Object.keys(remoteMascots).some(function (key) { var choice = remoteMascots[key]; return choice && choice.sessionId === state.sessionId && choice.id === mascotId; }); }
  function hasUsedCard(t, number) { return !!(t && Array.isArray(t.usedCards) && t.usedCards.some(function (n) { return Number(n) === Number(number); })); }
  function pickValid(pick, allowAlreadyUsed) {
    if (!pick || pick.sessionId !== state.sessionId || Number(pick.roundIndex) !== state.roundIndex) return false;
    var id = Number(pick.teamId); var card = Number(pick.card); var target = team(id);
    if (id < 1 || id > 15 || !target || !Number.isInteger(card) || card < 1 || card > 25) return false;
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
      tone(440, .12, "sine", .08);
      setTimeout(function () { tone(660, .18, "sine", .07); }, 100);
      return;
    }
    if (name === "win" || name === "correct") {
      // “Két mở”: bass sweep + major arpeggio + glassy final chime.
      sweep(150, 360, .62, "sine", .045);
      tone(196, .48, "triangle", .05);
      setTimeout(function () { tone(392, .24, "triangle", .08); }, 90);
      setTimeout(function () { tone(493.88, .24, "triangle", .085); }, 185);
      setTimeout(function () { tone(587.33, .27, "triangle", .09); }, 280);
      setTimeout(function () { tone(783.99, .34, "sine", .085); }, 390);
      setTimeout(function () { tone(1174.66, .38, "sine", .055); }, 510);
      setTimeout(function () { tone(1567.98, .24, "sine", .035); }, 635);
      return;
    }
    if (name === "wrong") {
      // “Két đóng”: descending alarm, short enough to feel firm without hurting.
      sweep(420, 105, .5, "sawtooth", .035);
      tone(220, .28, "square", .045);
      setTimeout(function () { tone(174.61, .34, "sawtooth", .045); }, 125);
      setTimeout(function () { tone(110, .48, "triangle", .05); }, 270);
      return;
    }
    if (name === "reveal") {
      tone(330, .1, "square", .05);
      setTimeout(function () { tone(495, .2, "triangle", .08); }, 110);
      return;
    }
    if (name === "card") tone(800, .06, "square", .035);
  }
  function speakQuestion(q) {
    if (!q || q.media !== "audio" || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    try { window.speechSynthesis.cancel(); var utterance = new window.SpeechSynthesisUtterance(q.question); utterance.lang = "en-US"; utterance.rate = .82; utterance.pitch = .94; window.speechSynthesis.speak(utterance); } catch (e) {}
  }

  function startGame() {
    initAudio(); clearRoundKeys();
    mutate(function (s) {
      s.sessionId = makeSessionId(); s.phase = "mascot"; s.roundIndex = 0; s.winnerTeam = null; s.winnerCard = null; s.winnerSkill = null; s.cardPicks = {}; s.timerEnd = Date.now() + 12000; s.autoAt = null; s.history = []; s.lastAward = null; s.sound = true;
      s.scores.forEach(function (t) { t.score = 0; t.wins = 0; t.rightsWon = 0; t.correctCount = 0; t.mascotId = null; t.skillUsed = false; t.usedCards = []; });
    }, "Mở VAULT 25 · chọn linh vật");
    soundFor("open");
  }
  function clearRoundKeys() {
    var keys = [];
    for (var i = 0; i < localStorage.length; i++) { var key = localStorage.key(i); if (key && (key.indexOf(CARD_PREFIX) === 0 || key.indexOf(LEGACY_BET_PREFIX) === 0)) keys.push(key); }
    keys.forEach(function (key) { localStorage.removeItem(key); });
  }
  function chooseMascot(teamId, mascotId) {
    if (state.phase !== "mascot" || Number(teamId) !== selectedTeamId || !mascotById(mascotId)) return;
    var choice = { sessionId: state.sessionId, teamId: Number(teamId), id: mascotById(mascotId).id, at: Date.now() };
    try { localStorage.setItem(mascotKey(teamId), JSON.stringify(choice)); } catch (e) {}
    if (firebaseReady) setDoc(doc(db, "games", GAME_ID, "mascots", String(state.sessionId) + "-" + String(teamId)), choice, { merge: true }).catch(setFirebaseError);
    else if (bus) bus.postMessage({ type: "mascot", choice: choice });
    render();
  }
  function scanMascots() {
    if (role !== "host" || state.phase !== "mascot") return;
    var prefix = MASCOT_PREFIX + state.sessionId + "-"; var next = clone(state); var changed = false;
    for (var i = 1; i <= 15; i++) {
      var choice = remoteMascots[String(state.sessionId) + "-" + String(i)] || null;
      if (!choice) { try { var raw = localStorage.getItem(prefix + i); if (raw) choice = JSON.parse(raw); } catch (e) {} }
      var id = choice ? Number(choice.teamId) : 0;
      if (id >= 1 && id <= 15 && mascotById(choice.id) && next.scores[id - 1].mascotId !== choice.id) { next.scores[id - 1].mascotId = choice.id; changed = true; }
    }
    if (changed) { state = next; save("Linh vật đã khóa"); }
  }
  function beginRound() {
    if (state.phase !== "mascot") return;
    scanMascots();
    mutate(function (s) { s.scores.forEach(function (t, i) { if (!t.mascotId) t.mascotId = mascots[i % mascots.length].id; }); s.phase = "ready"; s.timerEnd = null; s.autoAt = null; }, "Linh vật đã sẵn sàng");
    soundFor("open");
  }
  function openRound() {
    if (state.phase !== "ready") return;
    clearRoundKeys();
    mutate(function (s) { s.phase = "bet"; s.winnerTeam = null; s.winnerCard = null; s.winnerSkill = null; s.cardPicks = {}; s.timerEnd = Date.now() + 12000; s.autoAt = null; s.lastAward = null; }, "Mở khoá câu " + String(state.roundIndex + 1).padStart(2, "0"));
    soundFor("open");
  }
  function scanCards() {
    if (role !== "host" || state.phase !== "bet") return;
    var prefix = CARD_PREFIX + state.sessionId + "-" + state.roundIndex + "-"; var next = clone(state); var changed = false;
    for (var i = 1; i <= 15; i++) {
      var pick = remoteCardFor(i) || null;
      if (!pick) { try { var raw = localStorage.getItem(prefix + i); if (raw) pick = JSON.parse(raw); } catch (e) {} }
      if (next.cardPicks && next.cardPicks[String(i)]) {
        if (pick && pick.submittedAt && !next.cardPicks[String(i)].serverAt) { next.cardPicks[String(i)].serverAt = actionAt(pick); changed = true; }
        continue;
      }
      if (!pick || !pickValid(pick, false)) continue;
      var id = Number(pick.teamId); var target = next.scores[id - 1]; var card = Number(pick.card);
      if (!target || hasUsedCard(target, card)) continue;
      if (!next.cardPicks) next.cardPicks = {};
      next.cardPicks[String(id)] = { sessionId: state.sessionId, roundIndex: state.roundIndex, teamId: id, card: card, mascotId: target.mascotId, useSkill: !!pick.useSkill, at: Number(pick.at) || Date.now(), serverAt: pick.submittedAt ? actionAt(pick) : null, nonce: pick.nonce || "" };
      target.usedCards = Array.isArray(target.usedCards) ? target.usedCards : [];
      target.usedCards.push(card);
      if (pick.useSkill && !target.skillUsed) target.skillUsed = true;
      changed = true;
    }
    if (changed) { state = next; save("Mã đã khóa"); soundFor("card"); }
  }
  function teamCard(teamId, card) {
    if (state.phase !== "bet" || Number(teamId) !== selectedTeamId || !team(teamId) || cardFor(teamId)) return;
    card = Number(card); var target = team(teamId); if (!Number.isInteger(card) || card < 1 || card > 25 || hasUsedCard(target, card)) return;
    var pick = { sessionId: state.sessionId, roundIndex: state.roundIndex, teamId: Number(teamId), card: card, useSkill: teamSkillArmed(teamId) && !target.skillUsed, at: Date.now() + performance.now() / 1000, nonce: Math.random().toString(36).slice(2) };
    try { localStorage.setItem(cardKey(teamId), JSON.stringify(pick)); } catch (e) {}
    setTeamSkillArmed(teamId, false);
    if (firebaseReady) setDoc(doc(db, "games", GAME_ID, "cards", String(state.sessionId) + "-" + String(state.roundIndex) + "-" + String(teamId)), Object.assign({}, pick, { submittedAt: serverTimestamp() }), { merge: true }).catch(setFirebaseError);
    else if (bus) bus.postMessage({ type: "card", pick: pick });
    render();
  }
  function revealCards() {
    if (state.phase !== "bet") return;
    scanCards(); if (state.phase !== "bet") return;
    var leaders = cardLeaders(15); var winner = leaders.length ? leaders[0] : null;
    mutate(function (s) {
      s.winnerTeam = winner ? Number(winner.teamId) : null; s.winnerCard = winner ? Number(winner.card) : null; s.winnerSkill = winner && winner.useSkill ? winner.mascotId : null; s.timerEnd = null; s.phase = winner ? "reveal" : "result"; s.autoAt = Date.now() + (winner ? 8000 : 6000);
      s.lastAward = winner ? null : { teamId: null, card: null, points: 0, delta: 0, correct: false, noWinner: true };
    }, winner ? "Lộ mã · cao nhất giành quyền" : "Không có mã · 0 điểm");
    soundFor(winner ? "reveal" : "wrong");
  }
  function enterQuestion() {
    if (state.phase !== "reveal") return;
    var q = currentRound(); var seconds = q.difficulty >= 4 ? 25 : 20; if (state.winnerSkill === "spider") seconds += 15;
    mutate(function (s) { s.phase = "question"; s.timerEnd = Date.now() + seconds * 1000; s.autoAt = null; }, "Mở câu hỏi");
    speakQuestion(q);
    soundFor("open");
  }
  function grade(correct) {
    if (state.phase !== "question" || !state.winnerTeam) return;
    var winner = state.winnerTeam; var q = currentRound();
    mutate(function (s) {
      var target = s.scores.find(function (t) { return t.id === winner; }); var card = Number(s.winnerCard) || 0; var skill = s.winnerSkill; var delta = 0; var applied = ""; var before = target ? target.score : 0;
      if (target) {
        target.rightsWon = Number(target.rightsWon) + 1;
        target.wins = target.rightsWon;
        if (correct) {
          delta = q.points;
          if (skill === "cat" && q.difficulty <= 2) { delta += 5; applied = "+5"; }
          if (skill === "fox" && q.difficulty >= 3) { delta += 5; applied = "+5"; }
          if (skill === "dragon") { delta += 8; applied = "+8"; }
          if (skill === "deer" && q.difficulty >= 4) { delta += 8; applied = "+8"; }
          target.score += delta; target.correctCount = Number(target.correctCount) + 1;
        }
      }
      s.history.push({ round: q.id, teamId: winner, card: card, difficulty: q.difficulty, points: q.points, correct: !!correct, delta: delta, skill: skill || null });
      s.lastAward = { teamId: winner, card: card, points: q.points, delta: delta, correct: !!correct, noWinner: false, skill: skill || null, applied: applied, before: before, after: target ? target.score : before };
      s.phase = "result"; s.timerEnd = null; s.autoAt = Date.now() + 6000;
    }, correct ? "Đúng · nhận " + q.points + " điểm" : "Sai · 0 điểm");
    soundFor(correct ? "win" : "wrong");
  }
  function advanceRound() {
    if (state.phase !== "result" && state.phase !== "scoreboard") return;
    if (state.roundIndex >= rounds.length - 1) { mutate(function (s) { s.phase = "finish"; s.autoAt = null; s.timerEnd = null; }, "Kết thúc VAULT 25"); soundFor("open"); return; }
    clearRoundKeys();
    mutate(function (s) { s.roundIndex += 1; s.phase = "ready"; s.winnerTeam = null; s.winnerCard = null; s.winnerSkill = null; s.cardPicks = {}; s.timerEnd = null; s.autoAt = null; s.lastAward = null; }, "Sang câu tiếp theo");
  }
  function showScoreboard() { if (state.phase !== "result") return; mutate(function (s) { s.phase = "scoreboard"; s.autoAt = null; }, "Mở bảng xếp hạng"); }
  function resetGame() { if (!window.confirm("Đặt lại phiên VAULT 25 và điểm số?")) return; clearRoundKeys(); state = freshState(); save("Đặt lại phiên"); }

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
    if (p === "cover") return '<button class="btn primary large" data-action="start">▶ Mở VAULT 25</button><div class="auto-note">25 câu · 25 thẻ mỗi đội · sai = 0.</div>';
    if (p === "mascot") return '<div class="remote-live"><span class="eyebrow">Linh vật</span><b class="remote-timer">' + currentTime() + 's</b><span class="muted">Đã chọn ' + mascotCount() + '/15</span></div><button class="btn gold large" data-action="begin">→ Khoá linh vật</button>';
    if (p === "ready") return '<div class="remote-live"><span class="eyebrow">Câu ' + String(state.roundIndex + 1).padStart(2, "0") + '</span>' + difficultyBadge(q) + '<span class="muted">' + esc(q.format) + '</span></div><button class="btn gold large" data-action="open">✦ Mở chọn mã</button>';
    if (p === "bet") return '<div class="remote-live"><span class="eyebrow">Chọn mã bí mật</span><b class="remote-timer">' + currentTime() + 's</b><span class="muted">Đã khóa ' + cardCount() + '/15 đội</span></div><button class="btn danger" data-action="reveal">Lộ mã</button>';
    if (p === "reveal") return '<div class="remote-live"><span class="eyebrow">Mã cao nhất</span><b>Đội ' + String(state.winnerTeam).padStart(2, "0") + ' · mã ' + state.winnerCard + '</b><span class="muted">Hòa mã → timestamp nhanh nhất.</span></div>';
    if (p === "question") { var who = state.winnerTeam ? "Đội " + String(state.winnerTeam).padStart(2, "0") + " · " + esc(teamName(state.winnerTeam)) : "Đội chưa được xác định"; return '<div class="remote-live"><span class="eyebrow">Trả lời · mã ' + state.winnerCard + '</span><b>' + who + '</b><span class="muted">Đúng: +' + q.points + ' · Sai: 0</span></div><div class="remote-duo"><button class="btn green large" data-action="grade" data-correct="1">✓ ĐÚNG</button><button class="btn danger large" data-action="grade" data-correct="0">× SAI · 0</button></div>'; }
    if (p === "result") { var a = state.lastAward; var resultText = a && a.noWinner ? "0 điểm" : ((a && a.correct ? "+" : "") + (a ? a.delta : 0) + " điểm"); return '<div class="remote-live"><span class="eyebrow">Kết quả</span><b>' + resultText + '</b><span class="muted">' + (a && a.applied ? esc(a.applied) : (a && !a.correct ? "Sai = 0" : "")) + '</span></div><button class="btn primary large" data-action="next">→ Câu tiếp</button><button class="btn ghost" data-action="scoreboard">Mở BXH</button>'; }
    if (p === "scoreboard") return '<button class="btn primary large" data-action="next">→ Quay lại game</button>';
    if (p === "finish") return '<button class="btn gold large" data-action="reset">↻ Chơi lại</button>';
    return "";
  }
  function miniScore() { return scoreList(3).map(function (t, i) { return '<div class="mini-score-row"><span>' + (i + 1) + ". " + esc(t.name) + '</span><b>' + t.score + "đ</b></div>"; }).join(""); }
  function hostView() {
    return '<main class="host-root"><header class="simple-header"><a href="#/" class="brand"><span class="brand-mark">◇</span><span class="brand-copy"><b>VAULT 25</b><span>PPT GAME · MC</span></span></a><div class="header-actions">' + connectionBadge() + '<a class="btn ghost" href="#/stage">Sân khấu ↗</a><button class="icon-btn" title="Bật/tắt âm thanh" data-action="sound">' + (state.sound ? "🔊" : "🔇") + '</button><button class="icon-btn" title="Đặt lại" data-action="reset">↻</button></div></header><div class="host-wrap"><div class="host-grid"><section class="preview-frame">' + stageView(true) + '</section><aside class="remote"><div class="panel panel-pad"><div class="eyebrow">MC REMOTE</div><h1 style="font:800 clamp(28px,4vw,44px)/.95 var(--display);letter-spacing:-.05em;margin:10px 0 7px">Chỉ cần<br><span style="color:var(--cyan)">bấm tiếp.</span></h1><p class="muted" style="font-size:12px;line-height:1.55;margin:0">Mở mã → nghe/trình chiếu → Đúng hoặc Sai.</p></div><div class="remote-status"><div class="status-tile"><small>TRẠNG THÁI</small><b>' + phaseLabel() + '</b></div><div class="status-tile"><small>CÂU</small><b>' + String(Math.min(state.roundIndex + 1, rounds.length)).padStart(2, "0") + " / " + String(rounds.length).padStart(2, "0") + '</b></div></div><div class="panel panel-pad"><div class="remote-actions">' + hostControls() + '</div><div class="keyboard-note" style="margin-top:13px">SPACE · chuyển · 1 đúng · 0 sai</div></div><div class="panel"><div class="panel-head"><h3>Bảng điểm · top 3</h3></div><div class="panel-pad mini-score">' + miniScore() + '</div></div></aside></div></div></main>';
  }

  function mascotCards(stage) { return mascots.map(function (m) { return '<div class="mascot-card ' + (mascotClaimed(m.id) ? "claimed" : "") + '">' + mascotArt(m.id) + '<div class="mascot-name">' + esc(m.name) + '</div><div class="mascot-skill">' + esc(m.skill) + '</div>' + (stage ? "" : '<div class="mascot-desc">' + esc(m.desc) + '</div>') + '</div>'; }).join(""); }
  function stageDecor() { return '<div class="vault-backdrop" aria-hidden="true"></div><img class="floating-core" src="assets/vault-core.png" alt=""><i class="spark spark-a"></i><i class="spark spark-b"></i><i class="spark spark-c"></i>'; }
  function stageScoreRail() {
    var list = scoreList(5); var max = Math.max(1, list[0] ? list[0].score : 1);
    return '<aside class="stage-score-rail" aria-label="Bảng xếp hạng"><div class="rail-title">BXH <span>TOP 5</span></div>' + list.map(function (t, i) { return '<div class="rail-row"><span class="rail-rank">0' + (i + 1) + '</span><div><div class="rail-name">' + esc(t.name) + '</div><div class="rail-bar"><i style="width:' + Math.max(5, Math.round(t.score / max * 100)) + '%"></i></div></div><span class="rail-score">' + t.score + 'đ</span></div>'; }).join("") + '</aside>';
  }
  function cardTokens() {
    // Keep every card visually identical while teams are choosing; the chosen
    // numbers only appear on the reveal ranking after the MC locks the round.
    return cardNumbers.map(function (n) { return '<span class="card-token">' + n + '</span>'; }).join("");
  }
  function stageCover() { return '<div class="slide"><div class="slide-kicker">MẬT KHO · 00</div><h1 class="horror-script">VAULT<br><em>25</em></h1><div class="vault-title-mark"><img src="assets/vault-core.png" alt=""></div><p class="slide-sub">25 câu · 25 mã · một đội được gọi</p></div>'; }
  function stageMascot() { return '<div class="slide stage-mascot"><div class="slide-kicker">CHỌN VỆ BINH</div><h1 class="horror-script">Linh vật<br><em>thức giấc</em></h1><div class="mascot-grid">' + mascotCards(true) + '</div></div>'; }
  function stageReady() { var q = currentRound(); return '<div class="slide"><span class="slide-number">' + String(state.roundIndex + 1).padStart(2, "0") + '/25</span><div class="slide-kicker">KHOÁ CÂU · ' + q.id + '</div><h1 class="horror-script">' + esc(q.title) + '</h1>' + difficultyBadge(q) + '<div class="vault-card-scene"><img src="assets/vault-core.png" alt=""></div><div class="loot-value">+' + q.points + ' ĐIỂM</div></div>'; }
  function stageBet() { var q = currentRound(); return '<div class="slide stage-bet"><span class="slide-number">' + String(state.roundIndex + 1).padStart(2, "0") + '/25</span><div class="slide-kicker">MÃ KHÓA · ' + esc(q.format) + '</div><h1 class="horror-script">Chọn <em>một mã</em></h1><div class="buzz-line"><div class="timer ' + (currentTime() > 4 ? "safe" : "") + '">' + currentTime() + 's</div><span>' + cardCount() + '/15 đã khóa</span></div><div class="card-grid stage-token-grid">' + cardTokens() + '</div><p class="slide-sub">Mã cao nhất giành quyền · hòa theo timestamp nhanh nhất</p></div>'; }
  function stageReveal() {
    var leaders = cardLeaders(15); var winner = state.winnerTeam ? team(state.winnerTeam) : null; var winnerPick = leaders.find(function (pick) { return Number(pick.teamId) === Number(state.winnerTeam); });
    var picked = {};
    leaders.forEach(function (pick) { picked[String(pick.teamId)] = true; });
    var missing = [];
    for (var i = 1; i <= 15; i++) if (!picked[String(i)]) missing.push({ teamId: i, card: null, missing: true });
    var rows = leaders.concat(missing);
    var board = rows.map(function (pick, index) {
      var hasPick = !pick.missing; var pickedTeam = team(pick.teamId); var isWinner = hasPick && Number(pick.teamId) === Number(state.winnerTeam);
      return '<div class="bid-row ' + (isWinner ? "is-winner" : "") + '"><span class="bid-rank">' + (hasPick ? "#" + (index + 1) : "—") + '</span><span class="bid-team"><b>Đội ' + String(pick.teamId).padStart(2, "0") + '</b><small>' + esc(pickedTeam ? pickedTeam.name : "") + '</small><small class="bid-time">' + (hasPick ? "⏱ " + formatPickTime(pick) : "CHƯA CHỐT") + '</small><i class="bid-meter"><i style="width:' + (hasPick ? Math.max(8, Number(pick.card) / 25 * 100) : 0) + '%"></i></i></span><strong class="bid-number">' + (hasPick ? pick.card : "—") + '</strong></div>';
    }).join("");
    var winnerLabel = winner ? ' · ' + esc(winner.name) : '';
    return '<div class="slide stage-reveal"><div class="slide-kicker">LỘ MÃ · ' + leaders.length + '/15 ĐÃ CHỐT</div><h1 class="horror-script">Bảng mã<br><em>đã khóa</em></h1><div class="stage-reveal-art"><img src="assets/vault-core.png" alt=""></div><div class="card-reveal-number">' + (state.winnerCard || "—") + '</div><div class="winner-card"><i class="winner-dot"></i><b>ĐỘI ' + (state.winnerTeam ? String(state.winnerTeam).padStart(2, "0") : "—") + winnerLabel + '</b><span class="reveal-winner-time">⏱ ' + (winnerPick ? formatPickTime(winnerPick) : "—") + '</span></div><div class="reveal-summary"><span>THỨ TỰ: SỐ CAO → THỜI GIAN</span><span>ĐẦU BẢNG = GIÀNH QUYỀN</span></div><div class="bid-rail">' + board + '</div></div>';
  }
  function stageQuestion() {
    var q = currentRound(); var winner = team(state.winnerTeam); var m = mascotById(winner.mascotId); var skill = state.winnerSkill ? '<span class="tag" style="color:' + m.color + ';border-color:' + m.color + '66">' + esc(m.skill) + '</span>' : '';
    var who = '<div class="winner-card">' + mascotArt(winner.mascotId, "") + '<i class="winner-dot"></i><b>Đội ' + String(state.winnerTeam).padStart(2, "0") + ' · ' + esc(winner.name) + '</b><span class="tag">MÃ ' + state.winnerCard + '</span>' + skill + '</div>';
    var options = q.options ? '<div class="options">' + q.options.map(function (o, i) { return '<div class="option"><b>' + String.fromCharCode(65 + i) + '</b><span>' + esc(o) + '</span></div>'; }).join("") + '</div>' : '<div class="open-answer">TRẢ LỜI MIỆNG</div>';
    var art = q.media === "image" ? '<div class="slide-visual has-image square-art"><img class="slide-art-image" src="assets/vault-shard.jpg" alt=""></div>' : '';
    var rapid = q.media === "video" ? '<div class="rapid-cue"><span>01</span><span>02</span><span>03</span><span>04</span><span>05</span></div>' : '';
    return '<div class="slide"><span class="slide-number">' + String(state.roundIndex + 1).padStart(2, "0") + '/25</span><div class="slide-kicker">CÂU HỎI · +' + q.points + '</div>' + who + '<div class="question-meta">' + difficultyBadge(q) + mediaChip(q) + '<span class="round-counter">' + esc(q.format) + '</span></div>' + art + rapid + '<div class="question-box ' + (q.media === "image" ? "has-art" : "") + '"><h2>' + esc(q.question) + '</h2>' + options + '</div></div>';
  }
  function stageResult() {
    var award = state.lastAward || { delta: 0, teamId: null, noWinner: true, correct: false }; var ok = !!award.correct; var n = award.noWinner ? "0" : (award.correct ? "+" : "") + award.delta;
    var burst = ok ? '<div class="celebration-burst" aria-hidden="true"><i>✦</i><i>★</i><i>✧</i><i>✦</i><i>★</i><i>✧</i><i>✦</i><i>★</i><i>✧</i><i>✦</i><i>★</i><i>✧</i></div>' : '';
    return '<div class="slide result-slide ' + (ok ? "correct-result" : "wrong-result") + '">' + burst + '<div class="result-mark ' + (ok ? "" : "wrong") + '">' + (award.noWinner ? "·" : (ok ? "✓" : "×")) + '</div><div class="slide-kicker">' + (award.noWinner ? "KHÔNG CÓ MÃ" : (ok ? "MỞ KÉT" : "SAI · 0 ĐIỂM")) + '</div><div class="award">' + n + '</div><h1 style="font-size:clamp(28px,5vw,62px)">' + (award.noWinner ? "Cả lớp" : esc(teamName(award.teamId))) + '</h1>' + (award.correct && award.applied ? '<div class="tag">KỸ NĂNG ' + esc(award.applied) + '</div>' : '') + '</div>';
  }
  function stageScoreboard() { var list = scoreList(5); var max = Math.max(1, list[0] ? list[0].score : 1); return '<div class="slide stage-scoreboard"><div class="slide-kicker">BXH · CẬP NHẬT</div><h1 style="font-size:clamp(34px,5.6vw,74px)">Ai còn đứng?</h1><div class="stage-score-strip">' + list.map(function (t, i) { return '<div class="score-row"><span class="score-rank">0' + (i + 1) + '</span><div><div class="score-name">' + esc(t.name) + '</div><div class="score-bar"><i style="width:' + Math.max(4, Math.round(t.score / max * 100)) + '%"></i></div></div><span class="score-points">' + t.score + 'đ</span></div>'; }).join("") + '</div></div>'; }
  function stageFinish() { var list = scoreList(3); return '<div class="slide"><div class="slide-kicker">KẾT THÚC · HỒ SƠ ĐÃ MỞ</div><h1 style="font-size:clamp(37px,6.3vw,90px)">Ba đội<br><em>đi xa nhất</em></h1><div class="podium"><div class="podium-col p2"><b>' + esc(list[1] ? list[1].name : "—") + '</b><div class="podium-block">02</div></div><div class="podium-col p1"><b>' + esc(list[0] ? list[0].name : "—") + '</b><div class="podium-block">01</div></div><div class="podium-col p3"><b>' + esc(list[2] ? list[2].name : "—") + '</b><div class="podium-block">03</div></div></div><p class="slide-sub">Mỗi thẻ đã dùng · mỗi câu đã tính.</p></div>'; }
  function stageSlide() { if (state.phase === "cover") return stageCover(); if (state.phase === "mascot") return stageMascot(); if (state.phase === "ready") return stageReady(); if (state.phase === "bet") return stageBet(); if (state.phase === "reveal") return stageReveal(); if (state.phase === "question") return stageQuestion(); if (state.phase === "result") return stageResult(); if (state.phase === "scoreboard") return stageScoreboard(); return stageFinish(); }
  function stageView(compact) { return '<main class="stage-root ' + (compact ? "stage-compact" : "") + '"><header class="stage-header"><a href="#/" class="brand"><span class="brand-mark">◇</span><span class="brand-copy"><b>VAULT 25</b><span>TRÌNH CHIẾU · PPT MODE</span></span></a><div class="stage-code">' + phaseLabel() + ' · ' + String(Math.min(state.roundIndex + 1, rounds.length)).padStart(2, "0") + '/' + String(rounds.length).padStart(2, "0") + '</div></header><section class="stage-main">' + stageDecor() + stageSlide() + (compact ? "" : stageScoreRail()) + '</section>' + (compact ? '<footer class="stage-footer"><span>15 ĐỘI · 25 CÂU · 25 THẺ / ĐỘI</span><span>F11 = TOÀN MÀN HÌNH</span></footer>' : '') + '</main>'; }

  function cardGridMarkup(id) {
    var t = team(id); var chosen = cardFor(id); var used = t.usedCards || [];
    return '<div class="card-grid team-card-grid">' + cardNumbers.map(function (n) { var isUsed = used.indexOf(n) >= 0; var isSelected = chosen && Number(chosen.card) === n; var disabled = !!chosen || isUsed; return '<button class="card-token ' + (isUsed ? "used" : "") + ' ' + (isSelected ? "selected" : "") + '" data-action="card" data-card="' + n + '" ' + (disabled ? "disabled" : "") + '>' + n + '</button>'; }).join("") + '</div><div class="card-grid-note"><span>' + (chosen ? "MÃ ĐÃ KHÓA" : "CHỌN 1 / 25 MÃ") + '</span><span>ĐÃ DÙNG ' + used.length + '/25</span></div>';
  }
  function teamPickerView() {
    return '<main class="team-root team-picker-root"><section class="team-phone"><div class="team-picker-body"><div class="eyebrow">VAULT 25 · LINK CHUNG</div><div class="team-picker-core"><img src="assets/vault-core.png" alt=""></div><h1>Chọn<br><em>đội của bạn</em></h1><p>Mỗi điện thoại chọn một đội.</p><div class="team-picker-grid">' + teamNames.map(function (name, i) { return '<button class="team-picker-card" data-action="select-team" data-team="' + (i + 1) + '"><b>' + String(i + 1).padStart(2, "0") + '</b><span>' + esc(name.replace(/^Đội\s*/, "")) + '</span></button>'; }).join("") + '</div></div><footer class="team-foot">CHỌN XONG · CHỜ MC MỞ KÉT</footer></section></main>';
  }
  function teamView() {
    var id = selectedTeamId; var t = team(id); var q = currentRound(); var localMascot = teamLocalMascot(id); var mascotId = localMascot || t.mascotId || mascots[(id - 1) % mascots.length].id; var m = mascotById(mascotId); var chosen = cardFor(id); var body = "";
    if (state.phase === "mascot" || state.phase === "cover") {
      body = '<div class="team-round">ĐỘI ' + String(id).padStart(2, "0") + ' · LINH VẬT</div><h1>Chọn<br>vệ binh.</h1><p>' + (state.phase === "cover" ? "Chờ MC mở két." : "Một kỹ năng · dùng một lần.") + '</p><div class="mascot-grid">' + mascots.map(function (x) { return '<button class="mascot-card ' + (mascotId === x.id ? "chosen" : "") + '" data-action="mascot" data-mascot="' + x.id + '" ' + (state.phase === "cover" ? "disabled" : "") + '>' + mascotArt(x.id) + '<div class="mascot-name">' + esc(x.name) + '</div><div class="mascot-skill">' + esc(x.skill) + '</div></button>'; }).join("") + '</div>' + (localMascot ? '<div class="team-message">Đã khóa: ' + esc(m.name) + '</div>' : "");
    } else if (state.phase === "ready") {
      body = '<div class="team-round">CÂU ' + String(state.roundIndex + 1).padStart(2, "0") + ' / 25</div><h1>Sẵn<br>sàng.</h1><p>MC sắp mở mã khóa.</p>' + difficultyBadge(q) + '<div class="team-photo"><img src="assets/vault-shard.jpg" alt=""></div>';
    } else if (state.phase === "bet") {
      var canUseSkill = !t.skillUsed; var armed = teamSkillArmed(id); var skillButton = canUseSkill ? '<button class="skill-toggle ' + (armed ? "armed" : "") + '" data-action="skill-toggle">' + mascotArt(mascotId) + '<span><b>' + esc(m.name) + ' · ' + esc(m.skill) + '</b><small>' + (armed ? "ĐÃ KÍCH HOẠT" : esc(m.desc)) + '</small></span></button>' : '<div class="skill-toggle" style="opacity:.45">' + mascotArt(mascotId) + '<span><b>' + esc(m.name) + ' · ĐÃ DÙNG</b><small>Kỹ năng đã hết</small></span></div>';
      var hint = armed && mascotId === "raven" ? '<div class="team-message" style="border-color:#69e7ff66;color:var(--cyan)">' + esc(q.hint) + '</div>' : '';
      body = '<div class="team-round">CÂU ' + String(state.roundIndex + 1).padStart(2, "0") + ' / 25 · CHỌN MÃ</div><h1>' + (chosen ? "Mã đã<br>khóa." : "Chọn<br>một mã.") + '</h1><p>' + (chosen ? "Nhìn màn chiếu." : "+' + q.points + ' điểm nếu đúng.") + '</p><div class="phone-timer">' + currentTime() + 's</div>' + skillButton + hint + cardGridMarkup(id);
    } else if (state.phase === "reveal") {
      body = '<div class="team-round">CÂU ' + String(state.roundIndex + 1).padStart(2, "0") + ' · LỘ MÃ</div><h1>' + (state.winnerTeam === id ? "Đội bạn<br>được gọi." : "Mã đã<br>chọn đội.") + '</h1><p>' + (state.winnerTeam === id ? "Chuẩn bị trả lời trực tiếp." : "Theo dõi màn chiếu.") + '</p><div class="card-reveal-number">' + state.winnerCard + '</div><div class="mascot-strip">' + mascotArt(mascotId) + '<span class="mascot-name">' + esc(m.name) + '</span></div>';
    } else if (state.phase === "question") {
      body = '<div class="team-round">CÂU ' + String(state.roundIndex + 1).padStart(2, "0") + ' · +' + q.points + '</div><h1>' + (state.winnerTeam === id ? "Đến<br>lượt." : "Đang<br>trả lời.") + '</h1><p>' + (state.winnerTeam === id ? "Nói đáp án với MC." : "Chờ kết quả trên màn chiếu.") + '</p>' + difficultyBadge(q) + '<div class="team-message">MÃ ' + state.winnerCard + ' · ' + esc(q.format) + '</div>';
    } else if (state.phase === "result") {
      var mine = state.lastAward && state.lastAward.teamId === id; var delta = mine ? state.lastAward.delta : 0; body = '<div class="team-round">KẾT QUẢ CÂU ' + String(state.roundIndex + 1).padStart(2, "0") + '</div>' + (mine ? '<div class="team-score-flash">' + (state.lastAward.correct ? "+" : "") + delta + '</div><h1>' + (state.lastAward.correct ? "Đúng." : "Sai.") + '</h1><p>' + (state.lastAward.correct ? "Điểm đã cộng." : "Sai = 0 điểm.") + '</p>' : '<h1>Chờ<br>câu tiếp.</h1><p>Theo dõi màn chiếu.</p>') + '<div class="team-message">' + esc(q.title) + '</div>';
    } else if (state.phase === "finish") {
      body = '<div class="team-photo"><img src="' + mascotImage(mascotId) + '" alt=""></div><div class="team-round">PHIÊN ĐÃ KẾT THÚC</div><div class="team-score-flash">' + t.score + '</div><p>điểm · xem BXH trên màn chiếu</p>';
    } else if (state.phase === "scoreboard") {
      body = waitSvg() + '<div class="team-round">BXH</div><h1>Điểm<br>đã cập nhật.</h1><p>' + t.score + ' điểm · hạng đang thay đổi.</p>';
    } else {
      body = waitSvg() + '<div class="team-round">ĐANG CHỜ</div><h1>Nhìn<br>màn chiếu.</h1><p>Chờ cửa sổ mở.</p>';
    }
    return '<main class="team-root"><section class="team-phone"><header class="team-head"><div><b>' + esc(t.name) + '</b><small>ĐỘI ' + String(id).padStart(2, "0") + ' · ' + esc(m.name) + '</small></div><div class="team-head-actions"><button class="team-switch" data-action="team-switch" title="Đổi đội">↺</button><span class="team-score">' + t.score + 'đ</span></div></header><div class="team-body">' + body + '</div><footer class="team-foot">VAULT 25 · ' + (state.phase === "bet" ? "CHỌN 1 MÃ" : "NHÌN MÀN CHIẾU") + '</footer></section></main>';
  }
  function homeView() { return '<main class="home"><div class="home-grid"><section class="home-copy"><div class="eyebrow">PPT GAME · 15 ĐỘI</div><h1 class="horror-script">VAULT<br><em>25</em></h1><p>Chọn linh vật · chọn mã · giành quyền.</p><div class="home-actions"><a class="btn primary large" href="#/host">Mở MC</a><a class="btn ghost large" href="#/stage">Mở sân khấu</a><a class="btn ghost large" href="#/team">Link chung cho đội</a></div><div class="home-note"><div><b>25</b><span>câu</span></div><div><b>15</b><span>đội</span></div><div><b>25</b><span>thẻ / đội</span></div></div></section><section class="museum-card" aria-label="Minh họa két VAULT 25"><div class="home-orbit"></div><div class="home-door"></div><i class="home-piece hp1"></i><i class="home-piece hp2"></i><i class="home-piece hp3"></i><i class="home-piece hp4"></i><div class="museum-word">25</div><div class="eyebrow" style="position:absolute;right:27px;bottom:25px;color:#ffffff66">VAULT 25</div></section></div></main>'; }

  function bind() { document.querySelectorAll("[data-action]").forEach(function (el) { el.addEventListener("click", handleAction); }); }
  function handleAction(event) {
    var el = event.currentTarget; var action = el.getAttribute("data-action");
    if (action === "start") return startGame();
    if (action === "begin") return beginRound();
    if (action === "open") return openRound();
    if (action === "reveal") return revealCards();
    if (action === "grade") return grade(el.getAttribute("data-correct") === "1");
    if (action === "next") return advanceRound();
    if (action === "scoreboard") return showScoreboard();
    if (action === "reset") return resetGame();
    if (action === "sound") { initAudio(); var nextSound = !state.sound; mutate(function (s) { s.sound = nextSound; }, nextSound ? "Bật âm thanh" : "Tắt âm thanh"); return; }
    if (action === "select-team") { var chosenTeam = Number(el.getAttribute("data-team")); if (Number.isInteger(chosenTeam) && chosenTeam >= 1 && chosenTeam <= 15) { selectedTeamId = chosenTeam; try { localStorage.setItem(TEAM_SELECTION_KEY, String(selectedTeamId)); } catch (e) {} render(); } return; }
    if (action === "team-switch") { selectedTeamId = 0; try { localStorage.removeItem(TEAM_SELECTION_KEY); } catch (e) {} render(); return; }
    if (action === "mascot") return chooseMascot(selectedTeamId, el.getAttribute("data-mascot"));
    if (action === "skill-toggle") { var skill = team(selectedTeamId); if (!skill.skillUsed) { setTeamSkillArmed(selectedTeamId, !teamSkillArmed(selectedTeamId)); render(); } return; }
    if (action === "card") return teamCard(selectedTeamId, Number(el.getAttribute("data-card")));
  }
  function render() {
    parseRoute();
    if (role === "stage" && state.phase === "result" && state.lastAward && state.lastAward.correct) {
      var award = state.lastAward;
      var signature = String(state.sessionId) + ":" + String(state.roundIndex) + ":" + String(award.teamId) + ":" + String(award.after);
      if (signature !== lastStageCelebration) { lastStageCelebration = signature; initAudio(); soundFor("win"); }
    }
    if (role === "host" && firebaseReady && remoteStateKnown && !remoteStateExists && !pendingRemoteCreate) { pendingRemoteCreate = true; save("Khởi tạo phiên Firebase"); pendingRemoteCreate = false; }
    document.getElementById("app").innerHTML = role === "host" ? hostView() : role === "stage" ? stageView(false) : role === "team" ? (selectedTeamId ? teamView() : teamPickerView()) : homeView();
    bind();
  }
  document.addEventListener("keydown", function (event) {
    if (role !== "host" || event.target && /input|textarea/i.test(event.target.tagName)) return;
    if (event.code === "Space") {
      event.preventDefault();
      if (state.phase === "cover") startGame(); else if (state.phase === "mascot") beginRound(); else if (state.phase === "ready") openRound(); else if (state.phase === "bet") revealCards(); else if (state.phase === "question") grade(true); else if (state.phase === "result" || state.phase === "scoreboard") advanceRound(); else if (state.phase === "finish") resetGame();
    }
    if (event.key === "1" && state.phase === "question") grade(true);
    if (event.key === "0" && state.phase === "question") grade(false);
  });
  setInterval(function () {
    if (role === "host" && state.phase === "mascot") { scanMascots(); if (state.phase === "mascot" && currentTime() <= 0) beginRound(); }
    if (role === "host" && state.phase === "bet") { scanCards(); if (state.phase === "bet" && currentTime() <= 0) revealCards(); }
    if (role === "host" && state.phase === "reveal" && state.autoAt && Date.now() >= state.autoAt) enterQuestion();
    if (role === "host" && state.phase === "result" && state.autoAt && Date.now() >= state.autoAt) advanceRound();
    document.querySelectorAll(".remote-timer, .timer, .phone-timer").forEach(function (el) { if (state.phase === "mascot" || state.phase === "bet") el.textContent = currentTime() + "s"; });
  }, 220);
  parseRoute();
  render();
  bootFirebase();
})();
