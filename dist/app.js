const $ = s => document.querySelector(s);
const storageKey = 'logicquest-story-v2';
const userIdKey = 'logicquest-user-id';
const userId = localStorage.getItem(userIdKey) || (() => {
 const id = crypto.randomUUID();
 localStorage.setItem(userIdKey,id);
 return id;
})();
let state; try { state = JSON.parse(localStorage.getItem(storageKey)); } catch {}
const hasLocalState = Boolean(state && Array.isArray(state.attempts) && Array.isArray(state.completed));
if (!hasLocalState) state = {attempts:[],completed:[],age:'6'};
let syncTimer;
let syncing = false;
let syncPending = false;
let cloudConfigured = false;
const setSyncStatus = message => { const status=$('#sync-status');if(status)status.textContent=message; };
const persist = () => {
 try { localStorage.setItem(storageKey,JSON.stringify(state)); }
 catch (error) { console.error('Không thể lưu tiến độ trên thiết bị:',error);setSyncStatus('Không lưu được trên thiết bị'); }
 clearTimeout(syncTimer);
 syncTimer=setTimeout(syncProgress,500);
};
async function syncProgress(){
 if(!cloudConfigured){setSyncStatus('Chưa cấu hình Supabase — chỉ lưu trên thiết bị');return;}
 if(syncing){syncPending=true;return;}
 syncing=true;
 setSyncStatus('Đang đồng bộ...');
 try{
  const response=await fetch('/api/progress',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:userId,completed:state.completed,attempts:state.attempts,stars:stars(),age:Number(state.age)})});
  const result=await response.json();
  if(!response.ok)throw new Error(result.error||`HTTP ${response.status}`);
  setSyncStatus('Đã đồng bộ');
 }catch(error){
  console.error('Không thể đồng bộ tiến độ:',error);
  setSyncStatus('Chưa đồng bộ — dữ liệu vẫn lưu trên thiết bị');
 }finally{
  syncing=false;
  if(syncPending){syncPending=false;syncTimer=setTimeout(syncProgress,100);}
 }
}
async function loadCloudProgress(){
 setSyncStatus('Đang kiểm tra kết nối...');
 try{
  const healthResponse=await fetch('/api/health');
  const health=await healthResponse.json();
  if(!healthResponse.ok)throw new Error(health.error||`HTTP ${healthResponse.status}`);
  if(!health.envConfigured){setSyncStatus('Chưa cấu hình Supabase — chỉ lưu trên thiết bị');return;}
  cloudConfigured=true;
  setSyncStatus('Đang tải tiến độ...');
  const response=await fetch(`/api/progress/${encodeURIComponent(userId)}`);
  const result=await response.json();
  if(!response.ok)throw new Error(result.error||`HTTP ${response.status}`);
  const cloud=result.data;
  if(cloud){
   state.completed=[...new Set([...state.completed,...(Array.isArray(cloud.completed)?cloud.completed:[])])];
   const attempts=new Map();
   [...state.attempts,...(Array.isArray(cloud.attempts)?cloud.attempts:[])].forEach((attempt,index)=>{
    const key=attempt.attempt_id||JSON.stringify(attempt);
    attempts.set(key,{...attempt,attempt_id:attempt.attempt_id||`legacy-${index}-${key}`});
   });
   state.attempts=[...attempts.values()];
   if(!hasLocalState&&Number.isInteger(cloud.age))state.age=String(cloud.age);
   $('#grade').value=state.age;
  }
  render();
  persist();
 }catch(error){
  console.error('Không thể tải tiến độ từ máy chủ:',error);
  setSyncStatus('Ngoại tuyến — chỉ lưu trên thiết bị');
 }
}
const escapeHTML = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const skills = ['Tìm manh mối','Khám phá quy luật','Nghĩ cách mới','Lập kế hoạch','Thử cách khác'];
const skillNotes = ['Logic và phân tích','Nhận biết chuỗi và dự đoán','Sáng tạo nhiều cách giải','Sắp xếp bước để đạt mục tiêu','Đổi cách làm và nhìn lại'];
const worlds = [['Rừng Quy Luật','Tìm những viên sáng giữa khu rừng','🌲',''],['Lâu Đài Suy Luận','Giúp Cáo tìm chiếc chìa khóa','🏰','castle'],['Nhà Máy Robot','Nghĩ cách mới và chuẩn bị chuyến đi','🤖','robot'],['Thành Phố Thám Tử','Đổi kế hoạch để thắp hải đăng','🕵️','city']];
const questions = [
{id:0,w:0,s:1,story:'Cáo tìm thấy cánh cổng phát sáng. Các viên ngọc trên cổng đang lặp lại một điệu nhảy.',q:'🔴 🔵 🔵 · 🔴 🔵 🔵 · ?\nViên ngọc tiếp theo có màu gì?',o:['🔴 Đỏ','🔵 Xanh','🟡 Vàng'],a:0,h:'Thử đọc từng nhóm: đỏ – xanh – xanh.',why:'Mỗi nhóm bắt đầu bằng một viên đỏ. Cánh cổng đã mở!'},
{id:1,w:0,s:1,story:'Một hàng cây chỉ đường tới viên năng lượng đầu tiên.',q:'🌱 🌳 🌱 🌳 🌱 …\nCây nào xuất hiện tiếp theo?',o:['🌱 Cây nhỏ','🌳 Cây lớn','🌼 Bông hoa'],a:1,h:'Cây nhỏ và cây lớn đứng xen kẽ nhau.',why:'Sau cây nhỏ là cây lớn. Cáo đã tìm được viên sáng trong rừng!'},
{id:2,w:1,s:0,story:'Trước cửa lâu đài có ba túi đồ. Cú Mèo nhớ túi của mình có ngôi sao và không có màu đỏ.',q:'Túi nào là của Cú Mèo?',o:['🔴 ⭐ Túi đỏ có sao','🔵 ⭐ Túi xanh có sao','🔵 🌙 Túi xanh có trăng'],a:1,h:'Tìm túi có ngôi sao trước, rồi loại túi màu đỏ.',why:'Túi xanh có sao phù hợp với cả hai manh mối.'},
{id:3,w:1,s:0,story:'Ba người bạn lần lượt bước vào lâu đài. Thỏ vào trước Cáo. Rùa vào sau Cáo.',q:'Bạn nào bước vào cuối cùng?',o:['🐰 Thỏ','🦊 Cáo','🐢 Rùa'],a:2,h:'Xếp các bạn theo thứ tự: Thỏ → Cáo → …',why:'Thỏ, Cáo, rồi đến Rùa. Rùa mang theo chiếc chìa khóa!'},
{id:4,w:2,s:2,open:true,story:'Cáo tới một con suối nhỏ. Trong xưởng có que gỗ, dây và một chiếc hộp.',q:'Em nghĩ ra cách nào giúp Cáo đưa đồ sang bờ bên kia?',h:'Có thể đưa đồ qua bằng cầu, bè hoặc kéo bằng dây. Em còn cách nào khác?',why:'Em đã ghi lại một ý tưởng! Cùng người lớn xem cách đó cần gì để thực hiện và thử nghĩ thêm một cách khác.'},
{id:5,w:2,s:2,open:true,story:'Robot muốn gửi một lời nhắn vui cho bạn ở trên đồi nhưng không có giấy.',q:'Em có thể dùng gì để tạo lời nhắn? Hãy nghĩ một hoặc nhiều cách.',h:'Nhìn quanh xem: lá cây, viên sỏi, âm thanh hoặc động tác có thể giúp gì?',why:'Một lời nhắn có thể được tạo bằng nhiều chất liệu. Hãy kể cho người lớn hiểu lời nhắn của em nhé!'},
{id:6,w:2,s:3,story:'Chiếc thuyền cần được sửa trước khi chở viên sáng ra hải đăng.',q:'Thứ tự nào giúp Cáo chuẩn bị thuyền?',o:['Chèo đi → lấy gỗ → sửa thuyền','Lấy gỗ → sửa thuyền → chèo đi','Sửa thuyền → chèo đi → lấy gỗ'],a:1,h:'Cần có vật liệu trước khi sửa, và sửa xong mới chèo đi.',why:'Lấy gỗ, sửa thuyền, rồi chèo đi. Mỗi bước chuẩn bị cho bước tiếp theo.'},
{id:7,w:2,s:3,story:'Cáo có một chiếc đèn cần hai viên pin. Trong ba lô có hai viên pin và một quả bóng.',q:'Trước khi vào đường hầm tối, Cáo nên làm gì?',o:['Đá bóng rồi đi vào','Lắp pin và thử bật đèn','Đi vào rồi mới tìm đèn'],a:1,h:'Làm sao biết đèn đã sẵn sàng trước khi vào nơi tối?',why:'Lắp pin và thử đèn giúp Cáo chuẩn bị trước chuyến đi.'},
{id:8,w:3,s:4,story:'Cáo định qua cầu, nhưng cầu đang sửa. Gần đó có một đường vòng với biển chỉ tới hải đăng.',q:'Cáo nên làm gì để tiếp tục?',o:['Cứ bước lên cầu đang sửa','Xem biển và đi theo đường vòng','Đứng mãi trước cầu'],a:1,h:'Kế hoạch cũ không dùng được. Có con đường nào khác được chỉ dẫn không?',why:'Cáo đổi sang đường vòng theo biển chỉ dẫn. Khi điều kiện đổi, mình có thể đổi kế hoạch.'},
{id:9,w:3,s:4,open:true,story:'Gió thổi tắt đèn giấy của Cáo. Bạn còn một chiếc hộp và vài tấm bìa để thử lại.',q:'Em sẽ đổi cách làm thế nào để che gió cho đèn? Vì sao?',h:'Nghĩ xem gió tới từ đâu, rồi tìm cách chắn gió mà vẫn nhìn thấy ánh đèn.',why:'Em đã đề xuất một cách làm mới. Cùng người lớn thử bằng đèn pin, xem kết quả rồi điều chỉnh nhé!'}
];
let view='map',current=null,choice=null,hints=0,tries=0,done=false;
const count = w => questions.filter(q=>q.w===w&&state.completed.includes(q.id)).length;
const stars = () => state.completed.length;
function navigateTo(next){ view=next; render(); }
function skillProgress(s){ const list=questions.filter(q=>q.s===s);return `${list.filter(q=>state.completed.includes(q.id)).length}/${list.length}`; }
function render(){
 $('#stars').textContent=stars();document.querySelectorAll('aside nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));$('#crumb').textContent={map:'Thế giới của em',progress:'Hành trình tiến bộ',badges:'Bộ sưu tập',parent:'Góc phụ huynh'}[view];
 if(view==='map'){ $('#content').innerHTML='<h1>Quần đảo tư duy</h1>';return; }
 if(view==='badges'){ $('#content').innerHTML=`<div class="eyebrow">GHI NHẬN SỰ KHÁM PHÁ</div><h1>Bộ sưu tập của em</h1><p>Mỗi nhiệm vụ hoàn thành được một ngôi sao, kể cả khi em cần gợi ý.</p><div class="badges">${worlds.map((w,i)=>`<div class="badge"><span>${count(i)===questions.filter(q=>q.w===i).length?w[2]:'🌱'}</span><b>${w[0]}</b><p>${count(i)}/${questions.filter(q=>q.w===i).length} nhiệm vụ đã khám phá</p></div>`).join('')}</div>`;return; }
 const closed=state.attempts.filter(a=>a.kind==='closed'), independent=questions.filter(q=>!q.open&&state.attempts.some(a=>a.q===q.id&&a.correct&&a.tries===1&&a.hints===0)).length;
 $('#content').innerHTML=`<div class="eyebrow">${view==='parent'?'CÙNG CON KHÁM PHÁ':'MỖI LẦN THỬ, MỘT ĐIỀU MỚI'}</div><h1>${view==='parent'?'Góc phụ huynh':'Hành trình tiến bộ'}</h1><p>Giải cứu Đảo Ánh Sáng · Dành cho trẻ 6–8 tuổi</p><div class="stats"><div class="stat"><strong>${state.completed.length}/10</strong>Nhiệm vụ đã khám phá</div><div class="stat"><strong>${independent}/7</strong>Bài có đáp án được giải ngay, chưa cần gợi ý</div><div class="stat"><strong>${state.attempts.filter(a=>a.kind==='open').length}</strong>Ý tưởng đã ghi lại</div></div><section class="panel"><h2>Năm cách nghĩ đang luyện</h2>${skills.map((s,i)=>`<div class="skill"><b>${s}</b> <span style="float:right">${skillProgress(i)}</span><p>${skillNotes[i]}</p><div class="track"><i style="width:${Number(skillProgress(i).split('/')[0])/2*100}%"></i></div></div>`).join('')}<p>Thanh tiến độ thể hiện nhiệm vụ đã hoàn thành, không phải điểm năng lực, IQ hay kết luận chẩn đoán. Bản mẫu chưa được chuẩn hóa để đánh giá trẻ.</p></section><div class="note warm" style="margin:20px 0"><span class="icon">🌻</span><div><h3>Cùng con nghĩ thêm</h3><p>Chọn ba đồ vật trong nhà và hỏi: “Con có thể dùng chúng để làm gì? Nếu thiếu một món thì con đổi cách nào?”</p></div></div><section class="panel"><h2>Quan sát từ lượt chơi</h2>${state.attempts.slice(-10).reverse().map(a=>{const q=questions.find(q=>q.id===a.q);return `<article class="observation"><b>${skills[q.s]} · ${a.kind==='open'?'Đã ghi ý tưởng':a.correct?'Đã tìm được lời giải':'Đang thử cách giải'}</b><p>${a.kind==='closed'?`${a.tries} lần thử · ${a.hints} gợi ý. `:''}${a.reason?`Lời của trẻ: “${escapeHTML(a.reason)}”`:'Trẻ chưa ghi lời giải thích.'}</p>${a.kind==='open'?'<small>Ý tưởng được lưu để cùng trao đổi; chưa chấm tính phù hợp hay mức sáng tạo.</small>':''}</article>`}).join('')||'<p>Chưa có lượt chơi. Bắt đầu từ bất kỳ hòn đảo nào nhé!</p>'}<p><small>Dữ liệu chỉ lưu trên trình duyệt này, chưa có tài khoản hay đồng bộ. Lời kể không được AI phân tích. ${closed.length?'Các lần thử sai được giữ để nhìn lại quá trình.':''}</small></p><button class="text-button" onclick="resetProgress()">Xóa tiến độ trên thiết bị này</button></section>`;
}
function play(w){const list=questions.filter(q=>q.w===w);current=list.find(q=>!state.completed.includes(q.id))||list[0];openQuestion();}
function openQuestion(){choice=null;hints=0;tries=0;done=false;const list=questions.filter(q=>q.w===current.w);$('#gamebody').innerHTML=`<div class="eyebrow">${worlds[current.w][0]} · ${list.indexOf(current)+1}/${list.length}</div><h2>${skills[current.s]} ✦</h2><div class="story"><span>🦊</span><p>${current.story}</p></div><button class="text-button" onclick="readStory()">🔊 Nghe câu chuyện và câu hỏi</button><div class="question">${current.q.replace(/\n/g,'<br>')}</div>${current.open?'<p>Có nhiều cách nghĩ. Em có thể nhờ người lớn ghi lại lời kể của mình.</p>':`<div class="options">${current.o.map((o,i)=>`<button onclick="choose(${i})">${o}</button>`).join('')}</div>`}<label for="reason">${current.open?'Ý tưởng của em':'Em nghĩ như thế nào? (không bắt buộc)'}</label><textarea id="reason" maxlength="500" rows="3" placeholder="Ghi lại cách nghĩ của em ở đây..."></textarea><div class="tutor">🦉 <b>Cú Mèo đồng hành</b><p id="hinttext">Không cần vội. Em có thể thử lại hoặc nhờ mình gợi ý.</p><button id="hintbtn" onclick="hint()">Cho em một gợi ý</button></div><div class="feedback" id="feedback" aria-live="polite"></div><button class="btn" id="check" onclick="check()">${current.open?'Lưu ý tưởng của em':'Thử lời giải này'}</button>`;if(!$('#game').open)$('#game').showModal();}
function choose(i){if(done)return;choice=i;document.querySelectorAll('.options button').forEach((b,n)=>b.classList.toggle('selected',n===i));}
function hint(){if(hints||done)return;hints=1;$('#hinttext').textContent=current.h;$('#hintbtn').disabled=true;}
function check(){
 if(done){const next=questions.find(q=>q.w===current.w&&!state.completed.includes(q.id));if(next){current=next;openQuestion();}else{stopReading();$('#game').close();render();}return;}
 const reason=$('#reason').value.trim();if(current.open&&!reason){$('#feedback').textContent='Em hãy ghi lại một ý tưởng, hoặc nhờ người lớn ghi giúp nhé.';return;}
 if(!current.open&&choice===null){$('#feedback').textContent='Em chọn một cách giải trước nhé.';return;}
 tries++;const correct=current.open?null:choice===current.a;
 state.attempts.push({attempt_id:crypto.randomUUID(),q:current.id,w:current.w,kind:current.open?'open':'closed',correct,hints,tries,reason});
 if(correct||current.open){const fresh=!state.completed.includes(current.id);if(fresh)state.completed.push(current.id);done=true;$('#feedback').textContent=`${current.why}${fresh?' +1 ⭐ cho lần khám phá đầu tiên!':''}`;$('#check').textContent='Tiếp tục hành trình →';$('#hintbtn').disabled=true;$('#reason').disabled=true;document.querySelectorAll('.options button').forEach(b=>b.disabled=true);}
 else{$('#feedback').textContent='Cách này chưa khớp với các manh mối. Em xem lại hoặc nhờ Cú Mèo gợi ý nhé.';}
 persist();$('#stars').textContent=stars();
}
function stopReading(){if('speechSynthesis' in window)window.speechSynthesis.cancel();}
function readStory(){if(!('speechSynthesis' in window)){$('#feedback').textContent='Thiết bị chưa hỗ trợ đọc tự động. Em nhờ người lớn đọc cùng nhé.';return;}stopReading();const utterance=new SpeechSynthesisUtterance(`${current.story} ${current.q} ${current.o?.join('. ')||''}`);utterance.lang='vi-VN';utterance.rate=.85;utterance.onerror=()=>{if($('#feedback'))$('#feedback').textContent='Chưa đọc được trên thiết bị này. Em nhờ người lớn đọc cùng nhé.';};window.speechSynthesis.speak(utterance);}
function resetProgress(){if(!confirm('Xóa toàn bộ lượt chơi và ý tưởng trên trình duyệt này?'))return;state={attempts:[],completed:[],age:state.age};persist();render();}
document.querySelectorAll('aside nav button').forEach(b=>b.onclick=()=>navigateTo(b.dataset.view));$('.close').onclick=()=>{stopReading();$('#game').close();};$('#game').addEventListener('close',stopReading);$('#grade').value=state.age;$('#grade').onchange=e=>{state.age=e.target.value;persist();};render();loadCloudProgress();
