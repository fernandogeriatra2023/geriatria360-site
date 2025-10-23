const AS='assessments_pro_v3';
let AUTH=false, CUR={score:0,interp:'—',label:'—'};

// login
async function loginMed(){
  const pass=document.getElementById('med-pass').value.trim();
  try{
    const cfg=await fetch('data.json').then(r=>r.json());
    if(pass===(cfg.auth?.med_password||'medico123')){
      AUTH=true; document.getElementById('app').style.display='grid';
      buildIVCF(); buildMNA(); buildGDS(); buildKatz(); buildLawton(); bindUploads();
      renderList(); calc();
    }else alert('Senha inválida');
  }catch(e){ alert('Não encontrei data.json'); }
}

// navegação
function tab(el){
  document.querySelectorAll('.step').forEach(s=>s.classList.remove('active'));
  el.classList.add('active');
  const id=el.dataset.tab;
  document.querySelectorAll('.sect').forEach(s=>s.style.display='none');
  document.getElementById(id).style.display='block';
  if(id==='historico') renderList();
  calc();
}

// builders
function buildIVCF(){
  const box=document.getElementById('ivcf'); box.innerHTML='';
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
function buildMNA(){
  const qs=[
    {k:'mnaA',t:'Ingesta alimentar (declínio?)',opts:[['grande declínio',0],['moderado',1],['sem declínio',2]]},
    {k:'mnaB',t:'Perda de peso 3 meses',opts:[['>3 kg',0],['não sabe',1],['1–3 kg',2],['sem perda',3]]},
    {k:'mnaC',t:'Mobilidade',opts:[['acamada/cadeira',0],['deambula c/ auxílio',1],['normal',2]]},
    {k:'mnaD',t:'Estresse/doença aguda',opts:[['sim',0],['não',2]]},
    {k:'mnaE',t:'Problemas neuropsicológicos',opts:[['demência/depressão grave',0],['leve',1],['nenhum',2]]},
    {k:'mnaF',t:'IMC/CC',opts:[['IMC<19 ou CC<31',0],['IMC 19–21',1],['IMC 21–23',2],['IMC>23',3]]},
  ];
  const box=document.getElementById('mna'); box.innerHTML='';
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
function buildGDS(){
  const pos=[1,5,7,11,13]; const box=document.getElementById('gds'); box.innerHTML='';
  for(let i=1;i<=15;i++){
    const c=document.createElement('div'); c.className='card';
    const q=document.createElement('div'); q.className='hint'; q.textContent=`Item ${i}`; c.appendChild(q);
    ['Não','Sim'].forEach((lab,idx)=>{
      const v = (pos.includes(i) ? (idx===0?1:0) : (idx===1?1:0));
      const d=document.createElement('span'); d.className='pill'; d.textContent=`${lab} (+${v})`; d.dataset.key='gds'+i; d.dataset.val=v; d.onclick=(e)=>selectPill(e.target); c.appendChild(d);
    });
    box.appendChild(c);
  }
}
function buildKatz(){
  const acts=['Banho','Vestuário','Higiene','Transferência','Continência','Alimentação'];
  const box=document.getElementById('katz'); box.innerHTML='';
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
  const box=document.getElementById('lawton'); box.innerHTML='';
  acts.forEach((t,i)=>{
    const c=document.createElement('div'); c.className='card';
    c.innerHTML=`<div class="hint">${t}</div>`;
    [['Dependente',0],['Independente',1]].forEach(([lab,v])=>{
      const d=document.createElement('span'); d.className='pill'; d.textContent=`${lab} (+${v})`; d.dataset.key='law'+(i+1); d.dataset.val=v; d.onclick=(e)=>selectPill(e.target); c.appendChild(d);
    });
    box.appendChild(c);
  });
}

// seleção pill
function selectPill(p){ const key=p.dataset.key, val=p.dataset.val;
  [...document.querySelectorAll(`.pill[data-key='${key}']`)].forEach(x=>x.classList.remove('active'));
  p.classList.add('active'); p.parentElement.dataset.value=val; calc();
}

// uploads (cognição)
const uploads = {clock:null, square:null, circle:null};
function bindUploads(){
  hookUpload('upClock','imgClock','clock');
  hookUpload('upSquare','imgSquare','square');
  hookUpload('upCircle','imgCircle','circle');
}
function hookUpload(labelId, imgId, key){
  const box=document.getElementById(labelId);
  const input=box.querySelector('input');
  const img=document.getElementById(imgId);
  box.onclick = ()=> input.click();
  input.onchange = (e)=>{
    const f=e.target.files?.[0]; if(!f) return;
    const r=new FileReader(); r.onload=()=>{uploads[key]=r.result; img.src=r.result; img.style.display='block';}; r.readAsDataURL(f);
  };
}

// helpers
function getPillSum(prefix,count){ let s=0; for(let i=1;i<=count;i++){const el=document.querySelector(`.pill[data-key='${prefix}${i}'].active`); s+=Number(el?.dataset?.val||0);} return s; }
function getGroupSum(keys){ return keys.reduce((a,k)=> a + Number((document.querySelector(`.pill[data-key='${k}'].active`)||{}).dataset?.val||0), 0); }
function riskChip(text){
  const el = document.getElementById('classif');
  el.textContent = text;
  el.style.padding = '4px 10px'; el.style.borderRadius = '999px'; el.style.display = 'inline-block'; el.style.color = '#fff';
  el.style.background = /alto|grave|positivo/i.test(text) ? '#dc2626' : /moderad|limítrofe|risco/i.test(text) ? '#b45309' : '#047857';
}

// cálculo principal
function calc(){
  let label='—', score=0, interp='—';
  const visible = [...document.querySelectorAll('.sect')].find(s=>s.style.display!=='none');
  const id = visible ? visible.id : 'triagem';

  if(id==='triagem'){
    const sarc=['sf1','sf2','sf3','sf4','sf5'].map(k=>Number(document.getElementById(k).value||0)).reduce((a,b)=>a+b,0);
    const iv = getPillSum('iv',20);
    const cfs = Number(document.getElementById('cfs').value||0);
    const ivEl=document.getElementById('ivcfSum'); if(ivEl) ivEl.textContent = iv;
    score = sarc + iv + cfs;
    label='Triagem (CFS + SARC-F + IVCF)';
    if(cfs<=3) {interp='Robusto';} else if(cfs==4){interp='Vulnerável';} else if(cfs<=6){interp='Fragilidade leve/moderada';} else {interp='Fragilidade grave';}
  }

  if(id==='cognicao'){
    const minicog = Number(document.getElementById('register').value||0) + Number(document.getElementById('clock_ok').value||0) + Number(document.getElementById('recall').value||0);
    const cdt = Number(document.getElementById('cdt_score').value||0);
    score = minicog + cdt;
    label='Cognição (Mini-Cog + CDT)';
    interp = (minicog>=3 && cdt>=4) ? 'Sugere normalidade' : 'Sugere comprometimento';
  }

  if(id==='mobilidade'){
    const morse=['mh','md','ma','mt','mm','mc'].map(k=>Number(document.getElementById(k).value||0)).reduce((a,b)=>a+b,0);
    const tug = Number(document.getElementById('tug').value||0);
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
    const katz = getPillSum('katz',6); const law = getPillSum('law',8);
    score = katz + law; label='Funcional (Katz + Lawton)'; interp = `Katz ${katz}/6 · Lawton ${law}/8`;
  }

  CUR={score,interp,label};
  document.getElementById('score').textContent=score;
  riskChip(interp);
  document.getElementById('label').textContent=label;
}

// coleta + storage
function collect(){
  const d={};
  document.querySelectorAll('.pill.active').forEach(p=>{d[p.dataset.key]=p.dataset.val});
  ['sf1','sf2','sf3','sf4','sf5','cfs','register','clock_ok','recall','tug','mh','md','ma','mt','mm','mc','cdt_score']
    .forEach(id=>{const el=document.getElementById(id); if(el) d[id]=el.value;});
  if(uploads.clock) d.imgClock=uploads.clock;
  if(uploads.square) d.imgSquare=uploads.square;
  if(uploads.circle) d.imgCircle=uploads.circle;
  return d;
}
function all(){ try{return JSON.parse(localStorage.getItem(AS)||'[]')}catch(_){return []} }
function saveAssessment(){
  const id=document.getElementById('pid').value.trim(); if(!id) return alert('Informe ID');
  const it={id,age:document.getElementById('age').value||'',notes:document.getElementById('notes').value||'',
            label:CUR.label,score:CUR.score,interp:CUR.interp,at:new Date().toISOString(),
            data:collect()};
  const arr=all(); arr.push(it); localStorage.setItem(AS, JSON.stringify(arr));
  renderList(); alert('Salvo localmente.');
}

// histórico
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
function view(i){ const it=all()[i]; const w=window.open('','_blank'); w.document.write(summaryHTML(it)); }

// laudo (print/PDF)
function printSummary(){
  const it={id:document.getElementById('pid').value||'(sem id)',age:document.getElementById('age').value||'',
            notes:document.getElementById('notes').value||'',
            label:CUR.label,score:CUR.score,interp:CUR.interp,data:collect(),at:new Date().toISOString()};
  const w=window.open('','_blank'); w.document.write(summaryHTML(it)); w.print();
}
function blockFromData(d){
  const parts=[];
  if('cfs' in d){ parts.push(`CFS: ${d.cfs}. SARC-F: ${Number(d.sf1)+Number(d.sf2)+Number(d.sf3)+Number(d.sf4)+Number(d.sf5)}.`); }
  if('register' in d){ parts.push(`Mini-Cog: registro ${d.register}, relógio ${d.clock_ok}, recordação ${d.recall}. CDT ${d.cdt_score}.`); }
  if('mh' in d){ const morse = ['mh','md','ma','mt','mm','mc'].map(k=>Number(d[k]||0)).reduce((a,b)=>a+b,0); parts.push(`Morse: ${morse}. TUG: ${d.tug||0}s.`); }
  if('mnaA' in d){ const mna=['mnaA','mnaB','mnaC','mnaD','mnaE','mnaF'].map(k=>Number(d[k]||0)).reduce((a,b)=>a+b,0); parts.push(`MNA-SF: ${mna}.`); }
  if('gds1' in d || 'gds15' in d){ let g=0; for(let i=1;i<=15;i++){ g += Number(d['gds'+i]||0);} parts.push(`GDS-15: ${g}.`); }
  if('katz1' in d){ let k=0; for(let i=1;i<=6;i++){ k+=Number(d['katz'+i]||0);} let l=0; for(let i=1;i<=8;i++){ l+=Number(d['law'+i]||0);} parts.push(`Katz ${k}/6, Lawton ${l}/8.`); }
  return parts.join(' ');
}
function summaryHTML(it){
  const rows=Object.entries(it.data||{}).map(([k,v])=>`<tr><td>${k}</td><td>${v}</td></tr>`).join('');
  const pics = ['imgClock','imgSquare','imgCircle'].map(k=> it.data?.[k] ? `<div style="margin:6px 0"><b>${k.replace('img','')}</b><br><img src="${it.data[k]}" style="max-width:260px;border:1px solid #ddd;border-radius:10px"/></div>` : '' ).join('');
  const insights = blockFromData(it.data||{});
  return `<!doctype html><html><head><meta charset='utf-8'><title>Laudo — ${it.id}</title>
    <style>body{font-family:Arial, sans-serif;margin:24px} h1,h2{margin:0 0 8px} .muted{color:#64748b} table{width:100%;border-collapse:collapse;margin-top:12px} td,th{border:1px solid #ddd;padding:8px}</style>
    </head><body>
      <h1>Laudo — ${it.label}</h1>
      <p class="muted"><b>Paciente:</b> ${it.id} &nbsp; | &nbsp; <b>Idade:</b> ${it.age||'-'} &nbsp; | &nbsp; <b>Data:</b> ${(new Date(it.at)).toLocaleString('pt-BR')}</p>
      <p><b>Pontuação agregada:</b> ${it.score} &nbsp; — &nbsp; <b>Interpretação:</b> ${it.interp}</p>
      ${it.notes? `<p><b>Observações do médico:</b> ${it.notes}</p>`:''}
      ${pics? `<h2>Imagens anexas</h2>${pics}`:''}
      <h2>Resumo clínico</h2>
      <p>${insights || '—'}</p>
      <h2>Valores brutos</h2>
      <table><thead><tr><th>Item</th><th>Valor</th></tr></thead><tbody>${rows}</tbody></table>
    </body></html>`;
}

// reset
function resetForms(){
  document.querySelectorAll('input[type=number], input[type=range]').forEach(e=>e.value=0);
  document.querySelectorAll('select').forEach(e=>e.value=0);
  document.querySelectorAll('.pill').forEach(e=>e.classList.remove('active'));
  ['imgClock','imgSquare','imgCircle'].forEach(id=>{const el=document.getElementById(id); if(el){el.src=''; el.style.display='none';}});
  uploads.clock=uploads.square=uploads.circle=null;
  calc();
}
