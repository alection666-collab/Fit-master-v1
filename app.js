const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const CHECKINS_KEY = 'fitmaster_checkins_v1';
const FAVORITES_KEY = 'fitmaster_favorites_v1';
const EXERCISES = window.FIT_MASTER_EXERCISES;
const TITLES = {catalog:'Упражнения',favorites:'Избранное',journal:'Самочувствие'};
let currentView = 'catalog';
let activePlace = 'all';
let deferredInstallPrompt = null;
let lastFocusedElement = null;

function safeRead(key, fallback) {
  try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return value ?? fallback; }
  catch { return fallback; }
}
function safeWrite(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}
function getCheckins(){ const value=safeRead(CHECKINS_KEY,[]); return Array.isArray(value)?value:[]; }
function getFavorites(){ const value=safeRead(FAVORITES_KEY,[]); return Array.isArray(value)?value:[]; }
function setFavorites(ids){ safeWrite(FAVORITES_KEY,ids); updateFavoriteCounters(); }
function updateFavoriteCounters(){ const count=getFavorites().length; $('#favCount').textContent=count; $('#mobileFavCount').textContent=count; }
function formatDate(date, options={day:'numeric',month:'short'}){ return new Date(date).toLocaleDateString('ru-RU',options); }
function showView(name){
  if(!TITLES[name]) return;
  currentView=name;
  $$('.view').forEach(view=>view.classList.toggle('active',view.id===`view-${name}`));
  $$('[data-view]').forEach(button=>button.classList.toggle('active',button.dataset.view===name));
  $('#pageTitle').textContent=TITLES[name];
  if(name==='favorites') renderFavorites();
  if(name==='journal') renderHistory();
  window.scrollTo({top:0,behavior:'smooth'});
  history.replaceState(null,'',`#${name}`);
}
$$('[data-view]').forEach(button=>button.addEventListener('click',()=>showView(button.dataset.view)));
$$('[data-go]').forEach(button=>button.addEventListener('click',()=>showView(button.dataset.go)));

function cardMarkup(item){
  const favorite=getFavorites().includes(item.id);
  const placeLabel=item.place==='gym'?'ТРЕНАЖЁРНЫЙ ЗАЛ':item.place==='pool'?'БАССЕЙН':'ВОССТАНОВЛЕНИЕ';
  const priorityClass=item.priority==='Основной фокус'?'priority-main':item.priority==='Дополнительно'?'priority-extra':'priority-soft';
  return `<article class="exercise-card" data-id="${item.id}">
    <button class="favorite-toggle ${favorite?'is-favorite':''}" data-favorite="${item.id}" aria-label="${favorite?'Убрать из избранного':'Добавить в избранное'}" aria-pressed="${favorite}">${favorite?'♥':'♡'}</button>
    <a class="card-open" href="#exercise-${item.id}" data-open="${item.id}" aria-label="Открыть упражнение: ${item.name}">
      <div class="card-art"><img src="./${item.image}" alt="Схема: ${item.name}" loading="lazy"><span class="place-label">${placeLabel}</span></div>
      <div class="card-body"><div class="card-kicker"><span>${item.groupLabel}</span><span class="priority-label ${priorityClass}">${item.priority}</span></div><h3>${item.name}</h3><p>${item.summary}</p>
      <div class="card-muscles"><span>Основные мышцы</span><b>${item.primary}</b></div>
      <div class="card-footer"><span>Подробнее о технике</span><span class="arrow">↗</span></div></div>
    </a></article>`;
}
function matches(item, query, place, muscle){
  const text=[item.name,item.groupLabel,item.primary,item.secondary,item.equipment,item.summary,item.keywords,item.priority].join(' ').toLocaleLowerCase('ru');
  return (!query||text.includes(query))&&(place==='all'||item.place===place)&&(muscle==='all'||item.group===muscle);
}
function renderCatalog(){
  const query=$('#searchExercises').value.trim().toLocaleLowerCase('ru');
  const muscle=$('#muscleFilter').value;
  const list=EXERCISES.filter(item=>matches(item,query,activePlace,muscle));
  $('#libraryGrid').innerHTML=list.map(cardMarkup).join('');
  $('#resultCount').textContent=list.length;
  $('#emptyState').hidden=list.length!==0;
  $('#clearSearch').hidden=!query;
  bindCardActions($('#libraryGrid'));
}
function renderFavorites(){
  const ids=getFavorites();
  const list=ids.map(id=>EXERCISES.find(item=>item.id===id)).filter(Boolean);
  $('#favoritesGrid').innerHTML=list.map(cardMarkup).join('');
  $('#favoritesEmpty').hidden=list.length!==0;
  bindCardActions($('#favoritesGrid'));
}
function bindCardActions(root){
  $$('[data-open]',root).forEach(button=>button.addEventListener('click',event=>{event.preventDefault();openExercise(button.dataset.open);}));
  $$('[data-favorite]',root).forEach(button=>button.addEventListener('click',event=>{
    event.stopPropagation();
    const id=button.dataset.favorite; const ids=getFavorites();
    const next=ids.includes(id)?ids.filter(x=>x!==id):[...ids,id];
    setFavorites(next); renderCatalog(); if(currentView==='favorites')renderFavorites();
  }));
}
$('#searchExercises').addEventListener('input',renderCatalog);
$('#muscleFilter').addEventListener('change',renderCatalog);
$$('[data-place]').forEach(button=>button.addEventListener('click',()=>{
  activePlace=button.dataset.place;
  $$('[data-place]').forEach(x=>x.classList.toggle('active',x===button)); renderCatalog();
}));
$('#clearSearch').addEventListener('click',()=>{$('#searchExercises').value='';renderCatalog();$('#searchExercises').focus();});
$('#resetFilters').addEventListener('click',()=>{
  $('#searchExercises').value='';$('#muscleFilter').value='all';activePlace='all';
  $$('[data-place]').forEach(x=>x.classList.toggle('active',x.dataset.place==='all'));renderCatalog();
});

function openExercise(id){
  const item=EXERCISES.find(x=>x.id===id); if(!item)return;
  lastFocusedElement=document.activeElement;
  const fav=getFavorites().includes(id);
  const placeLabel=item.place==='gym'?'Тренажёрный зал':item.place==='pool'?'Бассейн':'Восстановление';
  $('#detailContent').innerHTML=`<div class="detail-hero"><img src="./${item.image}" alt="Схема упражнения ${item.name}"><div class="detail-overline">${placeLabel} · ${item.groupLabel}</div><h2 id="detailTitle">${item.name}</h2><p>${item.summary}</p></div>
  <div class="detail-grid"><div class="detail-main">
    <section class="detail-block"><div class="detail-heading"><span>01</span><h3>Задействованные мышцы</h3></div><div class="muscle-map"><img src="./${item.anatomy}" alt="Условная схема группы мышц"><div><b>Основные</b><p>${item.primary}</p><b>Дополнительные</b><p>${item.secondary}</p></div></div></section>
    <section class="detail-block"><div class="detail-heading"><span>02</span><h3>Оборудование и настройка</h3></div><div class="equipment-copy"><b>${item.equipment}</b><p>${item.setup}</p></div></section>
    <section class="detail-block"><div class="detail-heading"><span>03</span><h3>Пошаговая техника</h3></div><ol class="step-list">${item.steps.map((step,i)=>`<li><span>${i+1}</span><p>${step}</p></li>`).join('')}</ol></section>
  </div><aside class="detail-side"><div class="restriction-card"><div class="restriction-title"><span>!</span><b>Ограничения и контроль</b></div><p>${item.limits}</p><div class="restriction-divider"></div><small>Индивидуальная переносимость</small><p>${item.individual}</p></div><div class="detail-reminder"><b>Остановись при симптомах</b><p>При усилении боли, распространении боли дальше по ноге, онемении или слабости прекрати движение. Не пытайся продолжать через симптомы.</p></div><button class="primary-btn full" id="detailFavorite">${fav?'♥ В избранном':'♡ Добавить в избранное'}</button></aside></div>`;
  $('#detailFavorite').addEventListener('click',()=>{
    const ids=getFavorites();setFavorites(ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]);
    const now=getFavorites().includes(id);$('#detailFavorite').textContent=now?'♥ В избранном':'♡ Добавить в избранное';
    renderCatalog();if(currentView==='favorites')renderFavorites();
  });
  $('#exerciseModal').hidden=false;document.body.classList.add('modal-open');$('#closeExercise').focus();
}
function closeExercise(){ $('#exerciseModal').hidden=true;document.body.classList.remove('modal-open');if(lastFocusedElement?.focus)lastFocusedElement.focus(); }
$('#closeExercise').addEventListener('click',closeExercise);
$('#exerciseModal').addEventListener('click',event=>{if(event.target===$('#exerciseModal'))closeExercise();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('#exerciseModal').hidden)closeExercise();});

const date=new Date();
$('#todayLabel').textContent=date.toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'}).toLocaleUpperCase('ru');
$('#checkDate').textContent=date.toLocaleDateString('ru-RU',{day:'numeric',month:'short'}).toLocaleUpperCase('ru');
$('#painRange').addEventListener('input',event=>$('#painValue').textContent=`${event.target.value} / 10`);
$('#saveCheck').addEventListener('click',()=>{
  const list=getCheckins();
  const symptoms=$$('input[name="symptom"]:checked').map(x=>x.value);
  const record={date:new Date().toISOString(),pain:Number($('#painRange').value),feeling:$('#feeling').value,symptoms,note:$('#noteText').value.trim()};
  list.unshift(record);
  const ok=safeWrite(CHECKINS_KEY,list.slice(0,150));
  $('#saveNote').textContent=ok?'Запись сохранена на этом устройстве. Это не медицинская оценка.':'Не удалось сохранить запись: проверь свободное место и настройки браузера.';
  if(ok){$('#noteText').value='';$$('input[name="symptom"]').forEach(x=>x.checked=false);renderHistory();}
});
function renderHistory(){
  const list=getCheckins();
  $('#logCount').textContent=list.length;
  $('#avgPain').textContent=list.length?(list.reduce((sum,x)=>sum+(Number(x.pain)||0),0)/list.length).toFixed(1)+'/10':'—';
  $('#historyList').innerHTML=list.length?list.slice(0,25).map(item=>{
    const symptoms=Array.isArray(item.symptoms)&&item.symptoms.length?`<div class="history-symptoms">${item.symptoms.map(s=>`<span>${escapeHtml(s)}</span>`).join('')}</div>`:'';
    const note=item.note?`<p class="history-note">${escapeHtml(item.note)}</p>`:'';
    return `<article class="history-row"><div class="history-date"><b>${formatDate(item.date,{day:'numeric',month:'long',year:'numeric'})}</b><small>${escapeHtml(item.feeling||'')}</small>${symptoms}${note}</div><span class="pain-badge">${Number(item.pain)||0}/10</span></article>`;
  }).join(''):'<div class="empty-state small-empty"><b>Пока нет записей</b><span>Первая отметка появится здесь.</span></div>';
}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
$('#clearHistory').addEventListener('click',()=>{
  if(confirm('Удалить все записи самочувствия с этого устройства?')){localStorage.removeItem(CHECKINS_KEY);renderHistory();$('#saveNote').textContent='История очищена.';}
});

window.addEventListener('online',()=>$('#connectionLabel').textContent='ПОДКЛЮЧЕНИЕ ЕСТЬ');
window.addEventListener('offline',()=>$('#connectionLabel').textContent=navigator.serviceWorker?.controller?'ОФЛАЙН · КЕШ ГОТОВ':'НЕТ СЕТИ');
$('#connectionLabel').textContent=navigator.onLine?'ЛОКАЛЬНЫЕ ДАННЫЕ':(navigator.serviceWorker?.controller?'ОФЛАЙН · КЕШ ГОТОВ':'НЕТ СЕТИ');
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstallPrompt=event;$('#installBtn').hidden=false;});
$('#installBtn').addEventListener('click',async()=>{if(!deferredInstallPrompt)return;deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;$('#installBtn').hidden=true;});
if('serviceWorker' in navigator && location.protocol!=='file:'){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(()=>navigator.serviceWorker.ready).then(()=>{$('#connectionLabel').textContent=navigator.onLine?'КЕШ ГОТОВ':'ОФЛАЙН · КЕШ ГОТОВ';}).catch(()=>$('#connectionLabel').textContent='ОФЛАЙН-КЕШ НЕ УСТАНОВЛЕН'));
}

updateFavoriteCounters();renderCatalog();renderHistory();
const initial=location.hash.replace('#','');if(TITLES[initial])showView(initial);
