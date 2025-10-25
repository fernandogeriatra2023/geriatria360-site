/********** HOME **********/
const NEWS = [
  {title:'Campanha de Vacinação', cat:'Notícia', date:'2025-10-20', highlight:true},
  {title:'Quedas: 5 cuidados dentro de casa', cat:'Prevenção', date:'2025-10-15'},
  {title:'Sarcopenia: sinais de alerta', cat:'Artigo', date:'2025-10-10'},
  {title:'Shingrix disponível', cat:'Notícia', date:'2025-09-29'},
];
const TOPICS = [
  {title:'Doença de Alzheimer', text:'Sinais, rastreio e condutas iniciais.'},
  {title:'Sarcopenia', text:'Força, massa muscular e funcionalidade.'},
  {title:'Prevenção de quedas', text:'TUG, ambiente e treino de marcha.'},
  {title:'Higiene do sono', text:'Rotina e controle de estímulos.'},
  {title:'Polifarmácia', text:'Revisão de medicações e interações.'},
  {title:'Humor e ansiedade', text:'GDS-15 e estratégias não farmacológicas.'},
];

// Render banner + cards
(function renderHome(){
  const banner = document.getElementById('banner');
  if(banner){
    const urg = NEWS.filter(n=>n.highlight);
    banner.innerHTML = urg.length
      ? urg.map(n => `<div class="b"><b>${n.title}</b><div class="muted">${n.date}</div></div>`).join('')
      : `<div class="b muted">Sem comunicados urgentes no momento.</div>`;
  }
  const grid = document.getElementById('newsGrid');
  if(grid){
    grid.innerHTML = NEWS.map(n=>`
      <article class="card">
        <div class="title">${n.title}</div>
        <div class="muted">${n.cat} • ${n.date}</div>
      </article>`).join('');
  }
  const topics = document.getElementById('topicsGrid');
  if(topics){
    topics.innerHTML = TOPICS.map(t=>`
      <article class="card">
        <div class="title">${t.title}</div>
        <div class="muted">${t.text}</div>
      </article>`).join('');
  }
})();

/********** ÁREA MÉDICA **********/
const EVO_KEY = 'evo_store_v1';
const RX_KEY  = 'rx_store_v1';
const EXA_KEY = 'exa_store_v1';
const DOC_KEY = 'doc_store_v1';

// Login
async function loginMed(){
  const pass = document.getElementById('med-pass').value.trim();
  try{
    const cfg = await fetch('data.json').then(r=>r.json());
    if(pass === (cfg.auth?.med_password || 'medico123')){
      document.getElementById('app').style.display='block';
      loadCidDb();
      renderHistory();
    }else alert('Senha inválida');
  }catch(e){ alert('Não encontrei data.json'); }
}

// Tabs
function tab(el){
  document.querySelectorAll('.step').forEach(x=>x.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.sect').forEach(s=>s.style.display='none');
  document.getElementById(el.dataset.tab).style.display='block';
  if(el.dataset.tab==='t-hist') renderHistory();
}

// Evolução + CID-10
let CID_DB=[], CID_LIST=[];
async function loadCidDb(){
  try{
    const r=await fetch('cid10.min.json');
    CID_DB=await r.json();
  }catch(_){
    CID_DB=[
      {code:'Z00.0', desc:'Exame geral sem queixas'},
      {code:'F03', desc:'Demência não especificada'},
      {code:'E11', desc:'Diabetes mellitus'}
    ];
  }
  bindCidSearch();
}
function bindCidSearch(){
  const i=document.getElementById('cidSearch'); if(!i) return;
  let t=null;
  i.addEventListener('input',()=>{ clearTimeout(t); t=setTimeout(()=>showCidMatches(i.value),140);});
  i.addEventListener('keydown',(e)=>{ if(e.key==='Enter'){e.preventDefault(); pickFirstCid();}});
}
function normalizeCid(raw){ return (raw||'').toUpperCase().replace(/[^A-Z0-9]/g,''); }
function showCidMatches(q){
  const box=document.getElementById('cidResults'); if(!q){box.style.display='none';box.innerHTML='';return;}
  const term=q.toLowerCase(); const norm=normalizeCid(q);
  const res=CID_DB.filter(x=>x.code.toLowerCase().startsWith(norm.toLowerCase())||x.desc.toLowerCase().includes(term)).slice(0,30);
  if(!res.length){box.style.display='none';box.innerHTML='';return;}
  box.innerHTML=res.map(x=>`<div class="cid-item" data-code="${x.code}" data-desc="${x.desc}"><b>${x.code}</b> — ${x.desc}</div>`).join('');
  box.style.display='block';
  [...box.querySelectorAll('.cid-item')].forEach(it=>it.onclick=()=>{ addCID(`${it.dataset.code} — ${it.dataset.desc}`); box.style.display='none'; document.getElementById('cidSearch').value='';});
}
function pickFirstCid(){
  const b=document.getElementById('cidResults'), f=b?.querySelector('.cid-item');
  if(f){ addCID(`${f.dataset.code} — ${f.dataset.desc}`); b.style.display='none'; document.getElementById('cidSearch').value=''; }
}
function addCID(txt){
  if(!CID_LIST.includes(txt)) CID_LIST.push(txt);
  const wrap=document.getElementById('cidChips'); wrap.innerHTML='';
  CID_LIST.forEach((t,i)=>{ const s=document.createElement('span'); s.className='btn'; s.textContent=t; s.onclick=()=>{CID_LIST.splice(i,1); addCID('');}; wrap.appendChild(s);});
}
function saveEvolution(){
  const obj={
    id:document.getElementById('pid').value || '(sem id)',
    age:document.getElementById('age').value || '',
    edu:document.getElementById('edu').value || '',
    cids:[...CID_LIST],
    text:document.getElementById('evolText').value||'',
    at:new Date().toISOString()
  };
  const arr = JSON.parse(localStorage.getItem(EVO_KEY)||'[]'); arr.push(obj);
  localStorage.setItem(EVO_KEY, JSON.stringify(arr));
  CID_LIST.length=0; addCID(''); document.getElementById('evolText').value='';
  alert('Evolução salva.');
  renderHistory();
}

// Exames
function addExam(){
  const v=(document.getElementById('examInput').value||'').trim(); if(!v) return;
  const li=document.createElement('li'); li.textContent=v; const rm=document.createElement('button'); rm.className='btn'; rm.textContent='Remover'; rm.onclick=()=>li.remove(); li.appendChild(rm);
  document.getElementById('examList').appendChild(li);
  document.getElementById('examInput').value='';
}
function saveExams(){
  const items=[...document.querySelectorAll('#examList li')].map(li=>li.firstChild.textContent);
  if(!items.length) return alert('Sem itens.');
  const obj={ id:pid.value||'(sem id)', items, at:new Date().toISOString() };
  const arr=JSON.parse(localStorage.getItem(EXA_KEY)||'[]'); arr.push(obj);
  localStorage.setItem(EXA_KEY, JSON.stringify(arr));
  document.getElementById('examList').innerHTML='';
  alert('Solicitação salva.'); renderHistory();
}

// Receita
function addRx(){
  const m=rxMed.value.trim(), d=rxDose.value.trim(), u=rxDur.value.trim(); if(!m||!d) return;
  const li=document.createElement('li'); li.innerHTML=`<div><b>${m}</b><div class="muted">${d} • ${u||''}</div></div>`;
  const rm=document.createElement('button'); rm.className='btn'; rm.textContent='Remover'; rm.onclick=()=>li.remove(); li.appendChild(rm);
  rxList.appendChild(li); rxMed.value=''; rxDose.value=''; rxDur.value='';
}
function saveRx(){
  const items=[...rxList.querySelectorAll('li')].map(li=>li.querySelector('b').textContent+' | '+li.querySelector('.muted').textContent);
  if(!items.length) return alert('Sem itens.');
  const obj={ id:pid.value||'(sem id)', items, at:new Date().toISOString() };
  const arr=JSON.parse(localStorage.getItem(RX_KEY)||'[]'); arr.push(obj);
  localStorage.setItem(RX_KEY, JSON.stringify(arr));
  rxList.innerHTML=''; alert('Receita salva.'); renderHistory();
}

// Documentos
function attachDocImg(e){
  const f=e.target.files?.[0]; if(!f) return;
  const r=new FileReader(); r.onload=()=>{ const im=new Image(); im.src=r.result; im.style.maxWidth='120px'; im.style.border='1px solid #e5e7eb'; im.style.borderRadius='8px'; document.getElementById('docImgs').appendChild(im);}; r.readAsDataURL(f);
}
function saveDoc(){
  const obj = {
    id:pid.value||'(sem id)',
    days:docDays.value||'',
    reason:docReason.value||'',
    at:new Date().toISOString()
  };
  const arr=JSON.parse(localStorage.getItem(DOC_KEY)||'[]'); arr.push(obj);
  localStorage.setItem(DOC_KEY, JSON.stringify(arr));
  alert('Atestado gerado (use Imprimir para PDF).');
  renderHistory();
}

// Histórico
function renderHistory(){
  const tb=document.querySelector('#histTbl tbody'); if(!tb) return;
  const all=[
    ...JSON.parse(localStorage.getItem(EVO_KEY)||'[]').map(x=>({...x,_t:'Evolução'})),
    ...JSON.parse(localStorage.getItem(EXA_KEY)||'[]').map(x=>({...x,_t:'Exames'})),
    ...JSON.parse(localStorage.getItem(RX_KEY)||'[]').map(x=>({...x,_t:'Receita'})),
    ...JSON.parse(localStorage.getItem(DOC_KEY)||'[]').map(x=>({...x,_t:'Atestado'})),
  ].sort((a,b)=> new Date(b.at)-new Date(a.at));
  tb.innerHTML=all.map(x=>`
    <tr>
      <td>${x.id}</td><td>${x._t}</td><td>${new Date(x.at).toLocaleString('pt-BR')}</td>
      <td><button class="btn" onclick="viewItem('${x._t}', '${x.at}')">Ver</button></td>
    </tr>`).join('');
}
function viewItem(tipo, at){
  const cat = {Evolução:EVO_KEY, Exames:EXA_KEY, Receita:RX_KEY, Atestado:DOC_KEY}[tipo];
  const arr=JSON.parse(localStorage.getItem(cat)||'[]');
  const it=arr.find(x=>x.at===at);
  const w=window.open('','_blank');
  w.document.write(`<pre style="font-family:Inter,system-ui">${tipo}\n\n${JSON.stringify(it,null,2)}</pre>`);
}

// Utilidades
function printPage(){ window.print(); }
function resetForms(){
  document.querySelectorAll('input,textarea').forEach(i=>{ if(i.type==='file') i.value=''; else i.value='';});
  document.getElementById('docImgs')?.replaceChildren();
  document.getElementById('examList')?.replaceChildren();
  document.getElementById('rxList')?.replaceChildren();
}
document.getElementById('btnPrint')?.addEventListener('click', printPage);
