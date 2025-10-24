/* ==========================================================
   Geriatria360 — Médicos (consolidado)
   - Triagem/Testes (IVCF, MNA-SF, GDS-15 com perguntas, Katz, Lawton, Pfeffer)
   - Uploads de desenho (relógio/quadrado/círculo)
   - CID-10: busca por código/termo + chips
   - Evolução médica: salvar/listar/imprimir (localStorage)
   - Laudo IA local (HTML imprimível)
   - Documentos: atestado, receita, pedido de exames
   ========================================================== */

// -------------------- Stores / Flags -----------------------
const EVO = 'evolutions_pro_v1';           // evoluções
const AS  = 'assessments_pro_v4';          // avaliações
let CID_LIST  = [];                         // chips de CID-10
let CID_DB    = [];                         // base CID-10
let CID_READY = false;

let AUTH=false, CUR={score:0,interp:'—',label:'—'};
const uploads = {clock:null, square:null, circle:null};

// ------------------------- Login ---------------------------
async function loginMed(){
  const pass=document.getElementById('med-pass').value.trim();
  try{
    const cfg=await fetch('data.json').then(r=>r.json());
    if(pass===(cfg.auth?.med_password||'medico123')){
      AUTH=true; document.getElementById('app').style.display='grid';
      // builders
      buildIVCF(); buildMNA(); buildGDS(); buildKatz(); buildLawton(); buildPfeffer(); bindUploads();

      // CID-10 + Evolução
      await loadCidDb();
      renderCIDChips();
      renderEvos();

      // histórico de testes + cálculo inicial
      renderList(); calc();
    }else alert('Senha inválida');
  }catch(e){ alert('Não encontrei data.json'); }
}

// --------------------- Navegação Tabs ----------------------
function tab(el){
  document.querySelectorAll('.step').forEach(s=>s.classList.remove('active'));
  el.classList.add('active');
  const id=el.dataset.tab;
  document.querySelectorAll('.sect').forEach(s=>s.style.display='none');
  document.getElementById(id).style.display='block';
  if(id==='historico') renderList();
  if(id==='evolucao')  renderEvos();
  calc();
}

// ------------------------ Builders -------------------------
function buildIVCF(){
  const box=document.getElementById('ivcf'); if(!box) return;
  box.innerHTML='';
  for(let i=1;i<=20;i++){
    const row=document.createElement('div');
    row.innerHTML = `<div class="hint" style="margin:6px 0">Item ${i}</div>`;
    [0,1,2].forEach(v=>{
      const p=document.createElement('span');
      p.className='pill'; p.textContent=v; p.dataset.key='iv'+i; p.dataset.val=v;
      p.onclick=(e)=>{selectPill(e.target)}; row.appendChild(p);
    });
    box.appendChild(row);
  }
}

// ------------------------ CID-10 ---------------------------
async function loadCidDb(){
  try{
    const res = await fetch('cid10.min.json'); // coloque o JSON na raiz
    CID_DB = await res.json();
    CID_READY = Array.isArray(CID_DB) && CID_DB.length>0;
  }catch(_){
    // fallback mínimo só pra testes
    CID_DB = [
      {code:'Z00.0', desc:'Exame geral e investigação de pessoas sem queixas ou diagnóstico relatado'},
      {code:'F03',   desc:'Demência não especificada'},
      {code:'E11',   desc:'Diabetes mellitus não-insulino-dependente'}
    ];
    CID_READY = true;
  }
  bindCidSearch();
}
function bindCidSearch(){
  const inp = document.getElementById('cidSearch');
  if(!inp) return;
  let t=null;
  inp.addEventListener('input', ()=>{
    clearTimeout(t);
    t=setTimeout(()=> showCidMatches(inp.value.trim()), 150);
  });
  inp.addEventListener('keydown',(e)=>{
    if(e.key==='Enter'){ e.preventDefault(); pickFirstCid(); }
  });
}
function normalizeCidCode(raw){
  if(!raw) return '';
  let s = raw.toUpperCase().replace(/[^A-Z0-9]/g,''); // z000 -> Z000
  if(/^[A-Z][0-9]{3,4}$/.test(s)){
    if(s.length===5) s = s.slice(0,4)+'.'+s.slice(4); // LDDD.D
  }
  return s;
}
function showCidMatches(q){
  const box = document.getElementById('cidResults'); if(!box) return;
  if(!q){ box.style.display='none'; box.innerHTML=''; return; }

  const norm = normalizeCidCode(q);
  const term = q.toLowerCase();

  let res = CID_DB.filter(x =>
    x.code.toLowerCase().startsWith(norm.toLowerCase()) ||
    x.desc.toLowerCase().includes(term)
  ).slice(0,30);

  if(res.length===0){ box.style.display='none'; box.innerHTML=''; return; }

  box.innerHTML = res.map(x=>(
    `<div class="cid-item" data-code="${x.code}" data-desc="${x.desc}">
      <b>${x.code}</b> — ${x.desc}
    </div>`
  )).join('');
  box.style.display='block';

  [...box.querySelectorAll('.cid-item')].forEach(it=>{
    it.onclick=()=>{
      addCID(`${it.dataset.code} — ${it.dataset.desc}`);
      box.style.display='none';
      const inp=document.getElementById('cidSearch'); if(inp) inp.value='';
    };
  });
}
function pickFirstCid(){
  const box=document.getElementById('cidResults');
  const first = box && box.querySelector('.cid-item');
  if(first){
    addCID(`${first.dataset.code} — ${first.dataset.desc}`);
    box.style.display='none';
    const inp=document.getElementById('cidSearch'); if(inp) inp.value='';
  }else{
    const inp=document.getElementById('cidSearch');
    const v = normalizeCidCode(inp?.value||'');
    const hit = CID_DB.find(x=>x.code.toLowerCase()===v.toLowerCase());
    if(hit){ addCID(`${hit.code} — ${hit.desc}`); if(inp) inp.value=''; }
  }
}
function addCID(txt){
  if(!txt) return;
  if(!CID_LIST.includes(txt)) CID_LIST.push(txt);
  renderCIDChips();
}
function renderCIDChips(){
  const wrap=document.getElementById('cidChips'); if(!wrap) return;
  wrap.innerHTML='';
  CID_LIST.forEach((t,idx)=>{
    const chip=document.createElement('span');
    chip.className='pill active';
    chip.style.marginRight='6px';
    chip.textContent=t;
    chip.title='Remover';
    chip.onclick=()=>{ CID_LIST.splice(idx,1); renderCIDChips(); };
    wrap.appendChild(chip);
  });
}

// ------------------------ MNA-SF --------------------------
function buildMNA(){
  const qs=[
    {k:'mnaA',t:'Ingesta alimentar (declínio?)',opts:[['grande declínio',0],['moderado',1],['sem declínio',2]]},
    {k:'mnaB',t:'Perda de peso 3 meses',opts:[['>3 kg',0],['não sabe',1],['1–3 kg',2],['sem perda',3]]},
    {k:'mnaC',t:'Mobilidade',opts:[['acamada/cadeira',0],['deambula c/ auxílio',1],['normal',2]]},
    {k:'mnaD',t:'Estresse/doença aguda',opts:[['sim',0],['não',2]]},
    {k:'mnaE',t:'Problemas neuropsicológicos',opts:[['demência/depressão grave',0],['leve',1],['nenhum',2]]},
    {k:'mnaF',t:'IMC/CC',opts:[['IMC<19 ou CC<31',0],['IMC 19–21',1],['IMC 21–23',2],['IMC>23',3]]},
  ];
  const box=document.getElementById('mna'); if(!box) return;
  box.innerHTML='';
  qs.forEach(q=>{
    const c=document.createElement('div'); c.className='card';
    const h=document.createElement('div'); h.className='hint'; h.textContent=q.t; c.appendChild(h);
    q.opts.forEach(([lab,score])=>{
      const d=document.createElement('span'); d.className='pill';
      d.textContent=`${lab} (${score})`; d.dataset.key=q.k; d.dataset.val=score;
      d.onclick=(e)=>selectPill(e.target); c.appendChild(d);
    });
    box.appendChild(c);
  });
}

// ---------------------- GDS-15 (Q&A) ----------------------
function buildGDS(){
  const positivos = [1,5,7,11,13]; // pontuam quando a resposta é NÃO
  const Q = [
    '1) Está satisfeito(a) com sua vida?',
    '2) Você abandonou muitas das suas atividades e interesses?',
    '3) Você sente que sua vida está vazia?',
    '4) Você se aborrece com frequência?',
    '5) Você se sente de bem com a vida a maior parte do tempo?',
    '6) Você tem medo que algo ruim possa lhe acontecer?',
    '7) Você se sente feliz a maior parte do tempo?',
    '8) Você se sente frequentemente desamparado(a)?',
    '9) Você prefere ficar em casa a sair e fazer coisas novas?',
    '10) Você acha que tem mais problemas de memória do que a maioria?',
    '11) Você acha maravilhoso estar vivo(a) agora?',
    '12) Você se sente sem valor (inútil)?',
    '13) Você se sente cheio(a) de energia?',
    '14) Você acha que a sua situação é sem esperança?',
    '15) Você sente que a maioria das pessoas está em melhor situação do que você?'
  ];
  const box = document.getElementById('gds'); if(!box) return;
  box.innerHTML = '';
  Q.forEach((texto, idx) => {
    const i = idx + 1;
    const card = document.createElement('div'); card.className = 'card';
    const h = document.createElement('div'); h.className = 'hint'; h.textContent = `Item ${i}`; card.appendChild(h);
    const q = document.createElement('div'); q.style.margin = '6px 0 10px'; q.style.lineHeight='1.3'; q.textContent = texto; card.appendChild(q);
    const optWrap = document.createElement('div');
    [['Não', positivos.includes(i) ? 1 : 0], ['Sim', positivos.includes(i) ? 0 : 1]]
      .forEach(([lab, val]) => {
        const d = document.createElement('span');
        d.className = 'pill'; d.textContent = `${lab} (+${val})`;
        d.dataset.key = 'gds' + i; d.dataset.val = val; d.onclick = (e) => selectPill(e.target);
        optWrap.appendChild(d);
      });
    card.appendChild(optWrap);
    box.appendChild(card);
  });
}

// ---------------------- Katz / Lawton / Pfeffer ----------
function buildKatz(){
  const acts=['Banho','Vestuário','Higiene','Transferência','Continência','Alimentação'];
  const box=document.getElementById('katz'); if(!box) return; box.innerHTML='';
  acts.forEach((t,i)=>{
    const c=document.createElement('div'); c.className='card';
    c.innerHTML=`<div class="hint">${t}</div>`;
    [['Dependente',0],['Independente',1]].forEach(([lab,v])=>{
      const d=document.createElement('span'); d.className='pill'; d.textContent=`${lab} (+${v})`; d.dataset.key='katz'+(i+1); d.dataset.val=v; d.onclick=(e)=>selectPill(e.target); c.appendChild(d);
    });
    box.appendChild(c);
  });
}
function buildLawton(){
  const acts=['Telefone','Compras','Comida','Casa','Lavanderia','Transporte','Medicação','Finanças'];
  const box=document.getElementById('lawton'); if(!box) return; box.innerHTML='';
  acts.forEach((t,i)=>{
    const c=document.createElement('div'); c.className='card';
    c.innerHTML=`<div class="hint">${t}</div>`;
    [['Dependente',0],['Independente',1]].forEach(([lab,v])=>{
      const d=document.createElement('span'); d.className='pill'; d.textContent=`${lab} (+${v})`; d.dataset.key='law'+(i+1); d.dataset.val=v; d.onclick=(e)=>selectPill(e.target); c.appendChild(d);
    });
    box.appendChild(c);
  });
}
function buildPfeffer(){
  const itens=Array.from({length:10},(_,i)=>`FAQ ${i+1}`);
  const box=document.getElementById('pfeffer'); if(!box) return; box.innerHTML='';
  itens.forEach((t,i)=>{
    const c=document.createElement('div'); c.className='card';
    c.innerHTML=`<div class="hint">${t}</div>`;
    [['Independente (0)',0],['Ajuda (1)',1],['Dependente (2)',2],['Não realiza (3)',3]].forEach(([lab,v])=>{
      const d=document.createElement('span'); d.className='pill'; d.textContent=lab; d.dataset.key='faq'+(i+1); d.dataset.val=v; d.onclick=(e)=>selectPill(e.target); c.appendChild(d);
    });
    box.appendChild(c);
  });
}

// ----------------------- Seletor / Uploads ---------------
function selectPill(p){ const key=p.dataset.key, val=p.dataset.val;
  [...document.querySelectorAll(`.pill[data-key='${key}']`)].forEach(x=>x.classList.remove('active'));
  p.classList.add('active'); p.parentElement.dataset.value=val; calc();
}
function bindUploads(){ hookUpload('upClock','imgClock','clock'); hookUpload('upSquare','imgSquare','square'); hookUpload('upCircle','imgCircle','circle'); }
function hookUpload(labelId, imgId, key){
  const box=document.getElementById(labelId), input=box?.querySelector('input'), img=document.getElementById(imgId);
  if(!box||!input||!img) return;
  box.onclick = ()=> input.click();
  input.onchange = (e)=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{uploads[key]=r.result; img.src=r.result; img.style.display='block';}; r.readAsDataURL(f); };
}

// --------------------------- Helpers ----------------------
function getPillSum(prefix,count){ let s=0; for(let i=1;i<=count;i++){const el=document.querySelector(`.pill[data-key='${prefix}${i}'].active`); s+=Number(el?.dataset?.val||0);} return s; }
function getGroupSum(keys){ return keys.reduce((a,k)=> a + Number((document.querySelector(`.pill[data-key='${k}'].active`)||{}).dataset?.val||0), 0); }
function riskChip(text){
  const el = document.getElementById('classif'); if(!el) return;
  el.textContent = text;
  el.style.padding = '4px 10px'; el.style.borderRadius = '999px'; el.style.display = 'inline-block'; el.style.color = '#fff';
  el.style.background = /alto|grave|positivo/i.test(text) ? '#dc2626' : /moderad|limítrofe|risco/i.test(text) ? '#b45309' : '#047857';
}

// ----------------------- Cálculo principal ----------------
function calc(){
  let label='—', score=0, interp='—';
  const visible = [...document.querySelectorAll('.sect')].find(s=>s.style.display!=='none');
  const id = visible ? visible.id : 'triagem';

  if(id==='triagem'){
    const sarc=['sf1','sf2','sf3','sf4','sf5'].map(k=>Number(document.getElementById(k)?.value||0)).reduce((a,b)=>a+b,0);
    const iv = getPillSum('iv',20);
    const cfs = Number(document.getElementById('cfs')?.value||0);
    const ivEl=document.getElementById('ivcfSum'); if(ivEl) ivEl.textContent = iv;
    score = sarc + iv + cfs;
    label='Triagem (CFS + SARC-F + IVCF)';
    if(cfs<=3) {interp='Robusto';} else if(cfs==4){interp='Vulnerável';} else if(cfs<=6){interp='Fragilidade leve/moderada';} else {interp='Fragilidade grave';}
  }

  if(id==='cognicao'){
    const edu=Number(document.getElementById('edu')?.value||0);
    const meem = Number(document.getElementById('meem')?.value||0);
    const moca = Number(document.getElementById('moca')?.value||0) + Number(document.getElementById('moca_adj')?.value||0);
    const minicog = Number(document.getElementById('register')?.value||0) + Number(document.getElementById('clock_ok')?.value||0) + Number(document.getElementById('recall')?.value||0);
    const cdt = Number(document.getElementById('cdt_score')?.value||0);
    score = meem + moca + minicog + cdt;
    label='Cognição (MEEM + MoCA + Mini-Cog + CDT)';
    interp = interpretCognition({meem,moca,minicog,cdt,edu});
  }

  if(id==='mobilidade'){
    const morse=['mh','md','ma','mt','mm','mc'].map(k=>Number(document.getElementById(k)?.value||0)).reduce((a,b)=>a+b,0);
    const tug = Number(document.getElementById('tug')?.value||0);
    score = morse + tug; label='Mobilidade/Quedas (TUG + Morse)';
    if(morse<25) interp='Risco baixo (Morse)'; else if(morse<45) interp='Risco moderado (Morse)'; else interp='Risco alto (Morse)';
    if(tug>=30) interp += ' · TUG: comprometido'; else if(tug>=20) interp += ' · TUG: limítrofe'; else if(tug>=10) interp += ' · TUG: ok'; else interp += ' · TUG: normal';
  }

  if(id==='nutricao'){
    const mna = getGroupSum(['mnaA','mnaB','mnaC','mnaD','mnaE','mnaF']); score = mna; label='Nutrição (MNA-SF)';
    if(mna>=12) interp='Normal'; else if(mna>=8) interp='Risco de desnutrição'; else interp='Desnutrição provável';
  }

  if(id==='depressao'){
    const gds = getPillSum('gds',15); score = gds; label='Depressão (GDS-15)'; interp = gds>=5 ? 'Sugere depressão (≥5)' : 'Sugere normalidade (<5)';
  }

  if(id==='funcional'){
    const pfe=Array.from({length:10},(_,i)=>Number((document.querySelector(`.pill[data-key='faq${i+1}'].active`)||{}).dataset?.val||0)).reduce((a,b)=>a+b,0);
    const katz = getPillSum('katz',6); const law = getPillSum('law',8);
    score = pfe + katz + law; label='Funcional (Pfeffer + Katz + Lawton)'; interp = `Pfeffer ${pfe}/30 · Katz ${katz}/6 · Lawton ${law}/8`;
  }

  CUR={score,interp,label};
  const sc = document.getElementById('score'); if(sc) sc.textContent=score;
  riskChip(interp);
  const lb = document.getElementById('label'); if(lb) lb.textContent=label;
}
function interpretCognition({meem,moca,minicog,cdt,edu}){
  const mocaCut = 26; // ajuste de escolaridade já somado
  let flags=0;
  if(minicog<3) flags++;
  if(cdt<4)    flags++;
  if(moca<mocaCut) flags++;
  const meemCut = edu<=4 ? 24 : 26;
  if(meem<meemCut) flags++;
  if(flags===0) return 'Sem evidências de comprometimento';
  if(flags===1) return 'Triagem limítrofe — monitorar';
  if(flags===2) return 'Triagem positiva para CCL';
  return 'Suspeita de transtorno neurocognitivo maior';
}

// ------------------- Coleta / Histórico (testes) ----------
function collect(){
  const d={};
  document.querySelectorAll('.pill.active').forEach(p=>{d[p.dataset.key]=p.dataset.val});
  ['sf1','sf2','sf3','sf4','sf5','cfs','register','clock_ok','recall','tug','mh','md','ma','mt','mm','mc','cdt_score','meem','moca','moca_adj']
    .forEach(id=>{const el=document.getElementById(id); if(el) d[id]=el.value;});
  if(uploads.clock)  d.imgClock=uploads.clock;
  if(uploads.square) d.imgSquare=uploads.square;
  if(uploads.circle) d.imgCircle=uploads.circle;
  d.edu=document.getElementById('edu')?.value||'';
  d.contexto=document.getElementById('contexto')?.value||'';
  d.meds=document.getElementById('meds')?.value||'';
  d.companion=document.getElementById('companion')?.value||'';
  return d;
}
function all(){ try{return JSON.parse(localStorage.getItem(AS)||'[]')}catch(_){return []} }
function saveAssessment(){
  const id=document.getElementById('pid').value.trim(); if(!id) return alert('Informe ID');
  const it={id,age:document.getElementById('age')?.value||'',notes:document.getElementById('notes')?.value||'',
            label:CUR.label,score:CUR.score,interp:CUR.interp,at:new Date().toISOString(),
            data:collect()};
  const arr=all(); arr.push(it); localStorage.setItem(AS, JSON.stringify(arr));
  renderList(); alert('Salvo localmente.');
}
function renderList(){
  const tb=document.querySelector('#list tbody'); if(!tb) return; tb.innerHTML='';
  all().sort((a,b)=>new Date(b.at)-new Date(a.at)).forEach((x,i)=>{
    const dt=new Date(x.at).toLocaleString('pt-BR');
    const thumb = x.data?.imgClock || x.data?.imgSquare || x.data?.imgCircle || '';
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${x.id}</td><td>${x.label}</td><td>${dt}</td><td>${x.score}</td>
      <td>${thumb?`<img src='${thumb}' style='width:50px;height:50px;object-fit:cover;border-radius:6px;border:1px solid #e5e7eb'/>`:''}</td>
      <td><button class='btn' onclick='view(${i})'>Ver</button> <button class='btn' onclick='delIt(${i})'>Del</button></td>`;
    tb.appendChild(tr);
  });
}
function delIt(i){ const arr=all(); arr.splice(i,1); localStorage.setItem(AS, JSON.stringify(arr)); renderList(); }
function view(i){ const it=all()[i]; const w=window.open('','_blank'); w.document.write(aiReportHTML(it)); }

// ---------------------- Impressões gerais -----------------
function printSummary(){
  const it=currentSnapshot();
  const w=window.open('','_blank'); w.document.write(aiReportHTML(it)); w.print();
}
function currentSnapshot(){
  return {
    id:document.getElementById('pid')?.value||'(sem id)',
    age:document.getElementById('age')?.value||'',
    notes:document.getElementById('notes')?.value||'',
    label:CUR.label,score:CUR.score,interp:CUR.interp,at:new Date().toISOString(),
    data:collect()
  };
}

// ------------------- Evolução Médica (local) --------------
function saveEvolution(){
  const id=(document.getElementById('pid')?.value||'').trim();
  if(!id) return alert('Informe o ID do paciente.');
  const evoText=(document.getElementById('evoText')?.value||'').trim();
  if(!evoText) return alert('Escreva a evolução.');

  const item={
    at:new Date().toISOString(),
    id,
    age:document.getElementById('age')?.value||'',
    edu:document.getElementById('edu')?.value||'',
    cids:[...CID_LIST],
    text:evoText
  };
  const arr = getEvos(); arr.push(item); setEvos(arr);
  const t=document.getElementById('evoText'); if(t) t.value='';
  CID_LIST=[]; renderCIDChips(); renderEvos();
  alert('Evolução salva localmente.');
}
function getEvos(){ try{return JSON.parse(localStorage.getItem(EVO)||'[]')}catch(_){return []} }
function setEvos(v){ localStorage.setItem(EVO, JSON.stringify(v)); }
function renderEvos(){
  const tb=document.querySelector('#evoList tbody'); if(!tb) return; tb.innerHTML='';
  getEvos().sort((a,b)=>new Date(b.at)-new Date(a.at)).forEach((x,i)=>{
    const dt=new Date(x.at).toLocaleString('pt-BR');
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${dt}</td><td>${x.id}</td><td>${(x.cids||[]).join(', ')||'-'}</td>
      <td style="max-width:420px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${x.text}</td>
      <td><button class="btn" onclick="printEvo(${i})">Imprimir</button> <button class="btn" onclick="delEvo(${i})">Del</button></td>`;
    tb.appendChild(tr);
  });
}
function delEvo(i){ const arr=getEvos(); arr.splice(i,1); setEvos(arr); renderEvos(); }
function printEvo(i){
  const x=getEvos()[i]; if(!x) return;
  const body = `
<p><b>Paciente:</b> ${x.id} &nbsp; | &nbsp; <b>Idade:</b> ${x.age||'-'} &nbsp; | &nbsp; <b>Escolaridade:</b> ${x.edu||'-'} anos</p>
<p><b>Data/hora:</b> ${(new Date(x.at)).toLocaleString('pt-BR')}</p>
<p><b>CID-10:</b> ${(x.cids||[]).join(', ')||'-'}</p>
<div class="box"><pre style="white-space:pre-wrap">${x.text}</pre></div>`;
  openDoc('Evolução Médica', body);
}
function printEvoFromCurrent(){
  const id=(document.getElementById('pid')?.value||'(sem id)');
  const age=(document.getElementById('age')?.value||'-');
  const edu=(document.getElementById('edu')?.value||'-');
  const txt=(document.getElementById('evoText')?.value||'');
  const cids = CID_LIST.join(', ')||'-';
  const body = `
<p><b>Paciente:</b> ${id} &nbsp; | &nbsp; <b>Idade:</b> ${age} &nbsp; | &nbsp; <b>Escolaridade:</b> ${edu} anos</p>
<p><b>CID-10:</b> ${cids}</p>
<div class="box"><pre style="white-space:pre-wrap">${txt}</pre></div>`;
  openDoc('Evolução Médica', body);
}

// -------------------- Documentos (básicos) ----------------
function generateAtestado(){
  const dias = document.getElementById('atest_dias')?.value||'';
  const motivo = document.getElementById('atest_motivo')?.value||'';
  const inicio = document.getElementById('atest_inicio')?.value||'';
  const rest  = document.getElementById('atest_restr')?.value||'';
  const paciente = document.getElementById('pid')?.value||'(sem id)';

  const body = `
<p>Atesto, para os devidos fins, que <b>${paciente}</b> necessita de <b>${dias||'__'}</b> dia(s) de afastamento das atividades, ${
    inicio ? 'a contar de '+ new Date(inicio).toLocaleDateString('pt-BR') : 'a partir desta data'
  }.</p>
<p><b>Motivo:</b> ${motivo||'__'}</p>
<p><b>Restrições/Atividades:</b> ${rest||'__'}</p>
<p class="muted">Documento emitido eletronicamente.</p>`;
  openDoc('Atestado Médico', body);
}
function generateReceita(){
  const paciente = document.getElementById('pid')?.value||'(sem id)';
  const linhas = (document.getElementById('rx_itens')?.value||'').split('\n').filter(Boolean);
  const body = `
<p><b>Paciente:</b> ${paciente}</p>
<ol>${linhas.map(l=>`<li>${l}</li>`).join('')}</ol>
<p class="muted">Orientações de uso conforme prescrição. Documento eletrônico.</p>`;
  openDoc('Receituário', body);
}
function generatePedidoExame(){
  const paciente = document.getElementById('pid')?.value||'(sem id)';
  const exames = (document.getElementById('ped_exames')?.value||'').split('\n').filter(Boolean);
  const just   = document.getElementById('ped_just')?.value||'';
  const clin   = document.getElementById('ped_clinica')?.value||'';
  const body = `
<p><b>Paciente:</b> ${paciente}</p>
<p><b>Exames solicitados:</b></p>
<ul>${exames.map(e=>`<li>${e}</li>`).join('')}</ul>
<p><b>Justificativa clínica:</b> ${just||'__'}</p>
<p><b>Condições/Clínica:</b> ${clin||'__'}</p>`;
  openDoc('Pedido de Exames', body);
}
function openDoc(title, inner){
  const w=window.open('','_blank');
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>
    body{font-family:Arial, sans-serif;margin:26px;line-height:1.45}
    h1{margin:0 0 10px}.box{border:1px solid #ddd;border-radius:10px;padding:14px;margin-top:8px}
    .muted{color:#64748b}@media print{.no-print{display:none}}
  </style></head><body>
  <h1>${title}</h1>
  ${inner}
  <hr><p>Assinatura/Carimbo: ____________________________ &nbsp; CRM/SC 28480</p>
  <p class="muted no-print">Documento gerado pelo sistema — revise antes de imprimir.</p>
  </body></html>`);
}

// -------------------- Laudo IA (HTML) ---------------------
function generateAIReport(){
  const it=currentSnapshot();
  const w=window.open('','_blank');
  w.document.write(aiReportHTML(it));
}
function aiReportHTML(it){
  const d=it.data||{};
  const edu = Number(d.edu||0);
  const meem = Number(d.meem||0);
  const moca = Number(d.moca||0)+Number(d.moca_adj||0);
  const minicog = Number(d.register||0)+Number(d.clock_ok||0)+Number(d.recall||0);
  const cdt = Number(d.cdt_score||0);
  let gds=0; for(let i=1;i<=15;i++) gds+=Number(d['gds'+i]||0);
  const pfe=Array.from({length:10},(_,i)=>Number(d['faq'+(i+1)]||0)).reduce((a,b)=>a+b,0);
  const katz=Array.from({length:6},(_,i)=>Number(d['katz'+(i+1)]||0)).reduce((a,b)=>a+b,0);
  const law=Array.from({length:8},(_,i)=>Number(d['law'+(i+1)]||0)).reduce((a,b)=>a+b,0);

  const cognit = interpretCognition({meem,moca,minicog,cdt,edu});
  const func = (pfe>=5? 'Disfunção em AIVDs provável (Pfeffer ≥5).' : 'AIVDs preservadas pelo Pfeffer.')
               + ` Katz ${katz}/6, Lawton ${law}/8.`;
  const mood = gds>=5 ? 'Sintomas depressivos prováveis (GDS-15 ≥5).' : 'Triagem negativa para depressão (GDS-15 <5).';

  const medsTxt = d.meds ? `Usa/Possível uso de anticolinérgicos/sedativos: ${d.meds}.` : 'Sem uso relevante de anticolinérgicos/sedativos reportado.';
  const contexto = d.contexto || '—';
  const comp = d.companion || '—';

  const pics = ['imgClock','imgSquare','imgCircle'].map(k=> d[k] ? `<div style="margin:6px 0"><b>${k.replace('img','')}</b><br><img src="${d[k]}" style="max-width:260px;border:1px solid #ddd;border-radius:10px"/></div>` : '' ).join('');

  const plano = `
• Laboratorial básico: hemograma, eletrólitos, TSH, T4 livre, B12, folato, glicemia/HbA1c, função renal/hepática; conforme caso (VDRL/HIV/Vit. D).
• Imagem (se indicado): TC ou RM de encéfalo.
• Não farmacológico: educação do cuidador, rotina estruturada, atividade física aeróbica/força, treino cognitivo, higiene do sono, controle de fatores vasculares.
• Farmacológico (se TNC maior degenerativo e sem contraindicações): considerar I-AChE ou memantina conforme fenótipo/gravidade.
• Seguimento: reavaliação em 6–12 semanas (ajustar).`.trim();

  return `<!doctype html><html><head><meta charset="utf-8"><title>Laudo — ${it.id}</title>
  <style>
    body{font-family:Arial, sans-serif;margin:26px;line-height:1.4}
    h1,h2{margin:0 0 8px}
    .muted{color:#64748b}
    .box{border:1px solid #ddd;border-radius:10px;padding:14px;margin-top:10px}
    table{width:100%;border-collapse:collapse;margin-top:8px}
    td,th{border:1px solid #ddd;padding:8px;text-align:left}
    .cols{display:grid;gap:12px;grid-template-columns:1fr 1fr}
    @media print{.no-print{display:none}}
  </style></head><body>

  <h1>Laudo de Avaliação Neurocognitiva</h1>
  <p class="muted">
    <b>Paciente:</b> ${it.id} &nbsp; | &nbsp; <b>Idade:</b> ${it.age||'-'} &nbsp; | &nbsp; <b>Escolaridade:</b> ${edu||'-'} anos &nbsp; | &nbsp; <b>Acompanhante:</b> ${comp}<br>
    <b>Data:</b> ${(new Date(it.at)).toLocaleString('pt-BR')}
  </p>

  <div class="box"><b>Contexto/Queixa principal:</b> ${contexto}</div>
  <div class="box"><b>Medicações:</b> ${medsTxt}</div>

  <h2 style="margin-top:12px">Instrumentos aplicados e resultados</h2>
  <table>
    <tr><th>MEEM (0–30)</th><td>${meem}/30</td><th>MoCA (0–30)</th><td>${moca}/30</td></tr>
    <tr><th>Mini-Cog (0–5)</th><td>${minicog}/5</td><th>TDR — Shulman (0–5)</th><td>${cdt}/5</td></tr>
    <tr><th>Pfeffer FAQ (0–30)</th><td>${pfe}/30</td><th>GDS-15 (0–15)</th><td>${gds}/15</td></tr>
  </table>

  <h2 style="margin-top:12px">Exame cognitivo/funcional — achados qualitativos</h2>
  <div class="cols">
    <div class="box"><b>Memória imediata/recente:</b><br>___________________________________________</div>
    <div class="box"><b>Atenção e funções executivas:</b><br>___________________________________________</div>
    <div class="box"><b>Linguagem (nomeação/repetição/compreensão):</b><br>____________________________</div>
    <div class="box"><b>Visuoespacial/Construção (relógio/cópia):</b><br>____________________________</div>
    <div class="box"><b>Orientação (tempo/lugar/pessoa):</b><br>____________________________</div>
    <div class="box"><b>Funcionalidade (AIVDs/ABVDs):</b><br>____________________________</div>
  </div>

  ${pics? `<h2 style="margin-top:12px">Imagens anexas</h2>${pics}`:''}

  <h2 style="margin-top:12px">Interpretação</h2>
  <div class="box">
    <p><b>Cognição:</b> ${cognit}</p>
    <p><b>Humor:</b> ${mood}</p>
    <p><b>Funcionalidade:</b> ${func}</p>
    <p><b>Resumo global:</b> ${it.interp}</p>
  </div>

  <h2 style="margin-top:12px">Plano / Condutas sugeridas</h2>
  <div class="box" style="white-space:pre-wrap">${plano}</div>

  <h2 style="margin-top:12px">Assinatura</h2>
  <div class="box">Dr. Fernando João Rocha – CRM/SC 28480<br>UBS Universitário Marcos Aurélio – Tijucas/SC</div>

  <p class="muted no-print">Obs.: laudo gerado automaticamente com apoio de regras clínicas locais (IA embarcada). Revisar/editar antes de imprimir.</p>
  </body></html>`;
}

// ----------------------------- Reset ----------------------
function resetForms(){
  document.querySelectorAll('input[type=number], input[type=range]').forEach(e=>e.value=0);
  document.querySelectorAll('select').forEach(e=>e.value=0);
  document.querySelectorAll('.pill').forEach(e=>e.classList.remove('active'));
  ['imgClock','imgSquare','imgCircle'].forEach(id=>{const el=document.getElementById(id); if(el){el.src=''; el.style.display='none';}});
  uploads.clock=uploads.square=uploads.circle=null;
  calc();
}
