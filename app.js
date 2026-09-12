'use strict';

const QUESTIONS = [
  {id:'01',type:'mcq',title:'Chìa khóa đúng',q:'Sau bước Ghi nhận, nhóm điều tra phải làm gì?',options:['Kết luận ngay','Đối chiếu một nguồn độc lập','Xóa hồ sơ gốc','Chọn lời kể gây chú ý nhất'],answer:1,why:'Phải đối chiếu với nguồn độc lập trước khi kết luận.'},
  {id:'02',type:'tf',title:'Hai dòng camera',q:'Đánh giá 2 nhận định: (1) “Tôi nghe ba tiếng gõ” là ghi nhận trực tiếp. (2) Khi hai nguồn mâu thuẫn nên bỏ nguồn trái dự đoán.',answer:[true,false],why:'Ghi nhận trực tiếp là hợp lệ; nguồn mâu thuẫn phải được giữ lại để kiểm chứng.'},
  {id:'03',type:'text',title:'Mã khóa bị thiếu',q:'Khi nguồn tin mâu thuẫn và chưa kiểm tra được, hồ sơ mang trạng thái ______.',answer:['chưa xác minh','chưa được xác minh'],why:'Trạng thái phù hợp là “chưa xác minh”.'},
  {id:'04',type:'mcq',title:'Ví dụ phù hợp',q:'Ví dụ nào phù hợp nhất với bước Ghi nhận?',options:['Có lẽ ai đó đi qua hành lang','Tôi nghe ba tiếng gõ lúc 23 giờ','Chắc chắn người gõ là khách 404','Nguồn kể đáng tin hơn camera'],answer:1,why:'Ghi nhận chỉ mô tả điều trực tiếp nhìn/nghe, không thêm suy đoán.'},
  {id:'05',type:'rubric',title:'Nhật ký có lỗi',q:'“Hai nhân chứng kể khác nhau nên nhóm xóa một lời kể để hồ sơ thống nhất.” Hãy sửa cách xử lý.',criteria:['Chỉ ra xóa một lời kể là sai','Giữ cả hai và tiếp tục kiểm tra'],why:'Mâu thuẫn là lý do để kiểm chứng thêm, không phải để xóa nguồn.'},
  {id:'06',type:'order',title:'Băng ghi âm',q:'Sắp xếp quy trình điều tra đúng.',items:['Kết luận','Ghi nhận','Đối chiếu'],answer:[1,2,0],why:'Ghi nhận → Đối chiếu → Kết luận.'},
  {id:'07',type:'mcq',title:'Ghép hồ sơ',q:'Hành động nào phù hợp nhất khi hai nguồn chưa thống nhất?',options:['Chọn nguồn nghe hợp lý hơn','Giữ cả hai và đánh dấu chưa xác minh','Xóa nguồn cũ','Kết luận theo số đông'],answer:1,why:'Giữ dữ liệu và đánh dấu trạng thái để tiếp tục kiểm chứng.'},
  {id:'08',type:'mcq',title:'Quan sát bằng chứng',q:'Nhật ký ghi: “23:00 tôi nghe ba tiếng gõ, chưa nhìn thấy ai.” Điều nào được xác nhận?',options:['Có người ngoài cửa','Có ba tiếng gõ được nghe thấy','Phòng 404 có khách','Người gõ đã rời đi'],answer:1,why:'Chỉ có âm thanh ba tiếng gõ được ghi nhận trực tiếp.'},
  {id:'09',type:'tf',title:'Ứng dụng nguyên tắc',q:'(1) Có thể ghi “camera cho thấy cửa đóng” nếu video thể hiện vậy. (2) Có thể đổi “tôi đoán có người” thành “có người”.',answer:[true,false],why:'Không được biến suy đoán thành sự thật.'},
  {id:'10',type:'rubric',title:'Sửa hồ sơ',q:'“Lời kể và camera mâu thuẫn nên camera chắc chắn sai.” Hãy sửa nhận định.',criteria:['Chỉ ra kết luận camera sai là vội vàng','Giữ cả hai nguồn và đối chiếu thêm'],why:'Mâu thuẫn chưa đủ để loại bỏ bất kỳ nguồn nào.'},
  {id:'11',type:'mcq',title:'Tình huống ngắn',q:'Lời kể nói cửa mở, camera cho thấy cửa đóng. Xử lý nào đúng?',options:['Xóa lời kể','Xóa video','Giữ cả hai và đánh dấu chưa xác minh','Chọn nguồn dễ tin hơn'],answer:2,why:'Cần giữ cả hai nguồn và kiểm chứng tiếp.'},
  {id:'12',type:'order',title:'Xử lý tình huống',q:'Sắp xếp hành động xử lý hai nguồn mâu thuẫn.',items:['Kết luận nguồn đúng','Giữ cả hai thông tin','Đối chiếu nguồn độc lập','Đánh dấu chưa xác minh'],answer:[1,3,2,0],why:'Giữ dữ liệu → đánh dấu → đối chiếu → kết luận.'},
  {id:'13',type:'mcq',title:'Bằng chứng camera',q:'Camera ghi 23:00 cửa đóng; 23:02 cửa vẫn đóng. Kết luận nào có căn cứ?',options:['Cửa không từng mở trước 23:00','Tại hai thời điểm camera ghi nhận, cửa đóng','Có người khóa từ bên trong','Nhân chứng nói dối'],answer:1,why:'Chỉ kết luận trong phạm vi dữ liệu camera thực sự ghi nhận.'},
  {id:'14',type:'rubric',title:'Hai lời khai',q:'Camera ghi cửa đóng lúc 23:00 nhưng nhân chứng nói cửa mở. Bạn xử lý thế nào?',criteria:['Giữ cả hai và đánh dấu chưa xác minh','Giải thích cần đối chiếu thêm trước khi kết luận'],why:'Không đủ căn cứ để loại ngay một nguồn.'},
  {id:'15',type:'rubric',title:'Mở hồ sơ 404',q:'Đề xuất cách xử lý khi nhân chứng và camera cho thông tin khác nhau.',criteria:['Nêu hành động kiểm chứng phù hợp','Giải thích vì sao chưa thể biến suy đoán thành sự thật'],why:'Câu cuối yêu cầu cả hành động và lý do.'}
];

const TEAM_NAMES = Array.from({length:15}, (_,i)=>`Đội ${String(i+1).padStart(2,'0')}`);
const STORE='room404-stable-v1';
let state = loadState();
let ticker = null;

function initialState(){return {phase:'lobby',index:0,winner:null,deadline:0,scores:Array(15).fill(0),answer:null,lastPoints:null,sound:false};}
function loadState(){try{const x=JSON.parse(localStorage.getItem(STORE));return x&&Array.isArray(x.scores)&&x.scores.length===15?x:initialState();}catch(e){return initialState();}}
function persist(){try{localStorage.setItem(STORE,JSON.stringify(state));}catch(e){} render();}
function el(id){return document.getElementById(id);}
function current(){return QUESTIONS[state.index];}
function secondsLeft(){return Math.max(0,Math.ceil((state.deadline-Date.now())/1000));}
function phaseLabel(){return ({lobby:'Sảnh khách sạn',ready:'Hồ sơ sẵn sàng',countdown:'Chuẩn bị tín hiệu',claim:'Giành quyền',question:'Đã mở câu hỏi',answering:'Đang trả lời',review:'Đang chấm',result:'Kết quả',finished:'Kết thúc'})[state.phase]||'';}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}

function render(){
  el('phase').textContent=phaseLabel();
  el('round').textContent=state.phase==='lobby'?'15 ĐỘI':`CÂU ${String(state.index+1).padStart(2,'0')} / 15`;
  renderMain(); renderScores(); renderControls();
}

function renderMain(){
  const box=el('mainContent'); const q=current();
  if(state.phase==='lobby'){
    box.innerHTML='<div class="hero"><div class="eyebrow">ĐÊM TRỰC · 23:04</div><h1>Cuộc gọi từ<br><em>phòng 404</em></h1><p>15 đội điều tra. Mỗi câu chỉ có một lượt giành quyền. MC điều khiển toàn bộ trên màn hình này.</p></div>'; return;
  }
  if(state.phase==='ready'){
    box.innerHTML=`<div class="hero"><div class="eyebrow">HỒ SƠ ${q.id}</div><h2 class="big">${esc(q.title)}</h2><p>Nhấn “Phát tín hiệu 404” để bắt đầu giành quyền.</p><div class="phone">☎</div></div>`; return;
  }
  if(state.phase==='countdown'){
    box.innerHTML=`<div class="hero center"><div class="eyebrow">TẤT CẢ ĐỘI CHUẨN BỊ</div><div class="count" id="countdownNum">${secondsLeft()}</div><p>Chỉ giành quyền khi tín hiệu xuất hiện.</p></div>`; return;
  }
  if(state.phase==='claim'){
    box.innerHTML=`<div class="hero"><div class="eyebrow">TÍN HIỆU THẬT</div><h2 class="big mint">PHÒNG 404<br>— BẮT MÁY —</h2><div class="teamGrid">${TEAM_NAMES.map((n,i)=>`<button onclick="chooseTeam(${i})">${String(i+1).padStart(2,'0')}</button>`).join('')}</div></div>`; return;
  }
  if(state.phase==='finished'){
    box.innerHTML='<div class="hero"><div class="eyebrow">HỒ SƠ HOÀN TẤT</div><h2 class="big mint">CỬA CHÍNH<br>ĐÃ MỞ</h2><p>Bảng xếp hạng chung cuộc đã khóa.</p></div>'; return;
  }
  const team=state.winner==null?'Chưa có đội':TEAM_NAMES[state.winner];
  let extra='';
  if(q.type==='mcq') extra=`<div class="options">${q.options.map((o,i)=>`<button class="option ${state.answer===i?'selected':''}" ${state.phase==='answering'||state.phase==='review'?`onclick="setAnswer(${i})"`:''}><b>${'ABCD'[i]}</b><span>${esc(o)}</span></button>`).join('')}</div>`;
  if(q.type==='tf') extra=`<div class="tf">${[0,1].map(i=>`<div><span>${i+1}</span><button class="mini ${state.answer&&state.answer[i]===true?'selected':''}" onclick="setTF(${i},true)">Đúng</button><button class="mini ${state.answer&&state.answer[i]===false?'selected':''}" onclick="setTF(${i},false)">Sai</button></div>`).join('')}</div>`;
  if(q.type==='text') extra=`<input class="textAnswer" id="textAnswer" value="${esc(typeof state.answer==='string'?state.answer:'')}" oninput="state.answer=this.value" placeholder="MC nhập câu trả lời của đội">`;
  if(q.type==='order') extra=`<div class="orderList">${q.items.map((o,i)=>`<button onclick="toggleOrder(${i})"><b>${Array.isArray(state.answer)&&state.answer.includes(i)?state.answer.indexOf(i)+1:'—'}</b>${esc(o)}</button>`).join('')}</div>`;
  if(q.type==='rubric') extra=`<div class="rubric">${q.criteria.map((c,i)=>`<label><input type="checkbox" ${Array.isArray(state.answer)&&state.answer.includes(i)?'checked':''} onchange="toggleCriterion(${i},this.checked)"><span>${esc(c)}</span></label>`).join('')}</div>`;
  box.innerHTML=`<div class="questionCard"><div class="qmeta"><span>${esc(q.title)}</span><span>${team}</span></div><h2>${esc(q.q)}</h2>${extra}${state.phase==='result'?`<div class="solution"><b>Lời giải</b><p>${esc(q.why)}</p><strong>${state.lastPoints}/10 điểm</strong></div>`:''}</div>`;
}

function renderScores(){
  const order=state.scores.map((s,i)=>({i,s})).sort((a,b)=>b.s-a.s||a.i-b.i);
  el('scoreList').innerHTML=order.map((x,r)=>`<div class="scoreRow"><span>#${r+1}</span><b>${TEAM_NAMES[x.i]}</b><strong>${x.s}</strong></div>`).join('');
  el('progressFill').style.width=`${Math.round((state.phase==='finished'?15:state.index)/15*100)}%`;
}

function renderControls(){
  let html='';
  if(state.phase==='lobby') html='<button class="primary" onclick="startGame()">Bắt đầu trò chơi →</button>';
  if(state.phase==='ready') html='<button class="primary" onclick="signal()">Phát tín hiệu 404</button>';
  if(state.phase==='countdown') html=`<div class="timer" id="dockTimer">${secondsLeft()}</div>`;
  if(state.phase==='claim') html=`<div class="timer" id="dockTimer">${secondsLeft()}</div><span>Chọn đội giành quyền phía trên</span>`;
  if(state.phase==='question') html='<button class="primary mintBtn" onclick="beginAnswer()">Bắt đầu trả lời</button>';
  if(state.phase==='answering') html=`<div class="timer" id="dockTimer">${secondsLeft()}</div><button class="primary" onclick="review()">Dừng thời gian</button>`;
  if(state.phase==='review') html='<button class="primary" onclick="grade()">Chốt điểm & hiện lời giải</button>';
  if(state.phase==='result') html=`<button class="primary mintBtn" onclick="nextQuestion()">${state.index===14?'Kết thúc trò chơi':'Câu tiếp theo →'}</button>`;
  if(state.phase==='finished') html='<button class="danger" onclick="resetGame()">Chơi lại từ đầu</button>';
  el('controls').innerHTML=html;
}

function startGame(){state=initialState();state.phase='ready';persist();}
function signal(){state.phase='countdown';state.deadline=Date.now()+3000;persist();}
function chooseTeam(i){if(state.phase!=='claim')return;state.winner=i;state.phase='question';state.deadline=0;state.answer=defaultAnswer(current());persist();}
function beginAnswer(){state.phase='answering';state.deadline=Date.now()+30000;persist();}
function review(){state.phase='review';state.deadline=0;persist();}
function defaultAnswer(q){if(q.type==='tf')return [null,null];if(q.type==='order'||q.type==='rubric')return [];if(q.type==='text')return '';return null;}
function setAnswer(i){state.answer=i;persist();}
function setTF(i,v){if(!Array.isArray(state.answer))state.answer=[null,null];state.answer[i]=v;persist();}
function toggleOrder(i){if(!Array.isArray(state.answer))state.answer=[];const p=state.answer.indexOf(i);if(p>=0)state.answer.splice(p,1);else state.answer.push(i);persist();}
function toggleCriterion(i,on){if(!Array.isArray(state.answer))state.answer=[];state.answer=state.answer.filter(x=>x!==i);if(on)state.answer.push(i);persist();}
function normalize(s){return String(s||'').trim().toLocaleLowerCase('vi-VN').replace(/\s+/g,' ');}
function grade(){
  const q=current(); let pts=0;
  if(q.type==='mcq') pts=state.answer===q.answer?10:0;
  if(q.type==='tf') pts=(state.answer&&state.answer[0]===q.answer[0]?5:0)+(state.answer&&state.answer[1]===q.answer[1]?5:0);
  if(q.type==='text') pts=q.answer.some(a=>normalize(a)===normalize(state.answer))?10:0;
  if(q.type==='order') pts=JSON.stringify(state.answer)===JSON.stringify(q.answer)?10:0;
  if(q.type==='rubric') pts=Math.min(10,(Array.isArray(state.answer)?state.answer.length:0)*5);
  state.lastPoints=pts; if(state.winner!=null)state.scores[state.winner]+=pts; state.phase='result';persist();
}
function nextQuestion(){if(state.index>=14){state.phase='finished';state.deadline=0;}else{state.index++;state.phase='ready';state.winner=null;state.answer=null;state.lastPoints=null;}persist();}
function resetGame(){if(confirm('Xóa toàn bộ điểm và bắt đầu lại?')){state=initialState();persist();}}

function tick(){
  if(!state.deadline)return;
  const left=secondsLeft();
  const a=el('countdownNum'),b=el('dockTimer'); if(a)a.textContent=left;if(b)b.textContent=left;
  if(left>0)return;
  if(state.phase==='countdown'){state.phase='claim';state.deadline=Date.now()+8000;persist();}
  else if(state.phase==='claim'){state.winner=null;state.lastPoints=0;state.phase='result';state.deadline=0;persist();}
  else if(state.phase==='answering'){review();}
}

window.chooseTeam=chooseTeam;window.startGame=startGame;window.signal=signal;window.beginAnswer=beginAnswer;window.review=review;window.grade=grade;window.nextQuestion=nextQuestion;window.resetGame=resetGame;window.setAnswer=setAnswer;window.setTF=setTF;window.toggleOrder=toggleOrder;window.toggleCriterion=toggleCriterion;window.state=state;
render(); ticker=setInterval(tick,200);
