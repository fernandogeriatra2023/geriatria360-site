const LS='posts_pro_v1';
async function config(){try{return await (await fetch('data.json')).json()}catch(_){return {site:{},auth:{}}}}
function posts(){try{return JSON.parse(localStorage.getItem(LS)||'[]')}catch(_){return []}}
function fmt(d){if(!d)return'';const x=new Date(d);return x.toLocaleDateString('pt-BR')}
function el(t,c){const e=document.createElement(t); if(c) e.className=c; return e}
(async function init(){
  const cfg = await config();
  const wa = (cfg.site && cfg.site.whatsapp_link) || '#';
  const agenda = (cfg.site && cfg.site.agenda_link) || wa;
  document.getElementById('btnWhats').href = wa;
  document.getElementById('btnMarcar').href = agenda;
  const wt = document.getElementById('whatsTop'); if(wt) wt.href = wa;
  document.getElementById('clinicName').textContent = (cfg.site && cfg.site.name) || 'Geriatria 360';
  if(cfg.site && cfg.site.address) document.getElementById('clinicAddress').textContent = cfg.site.address;
  const root=document.getElementById('news'); if(!root) return;
  const list = posts().filter(p=>p.status==='published').sort((a,b)=>new Date(b.d)-new Date(a.d));
  if(list.length===0){root.innerHTML='<div class="card">Sem matérias publicadas ainda.</div>';return;}
  const [first,...rest]=list;
  const feature = el('div','feature');
  feature.innerHTML = `<div class="cover">${first.cover?`<img src='${first.cover}'/>`:''}</div>
    <div><div class="badge">${first.c||'Sem categoria'}</div>
      <h3 style="margin:6px 0">${first.t||''}</h3>
      <p style="color:#6b7280">${first.excerpt||''}</p>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
        <span class="small">${fmt(first.d)}</span>
        <a class="btn" href="post.html?slug=${encodeURIComponent(first.slug)}">Ler</a></div></div>`;
  const side = el('div','side');
  const slots = rest.slice(0,3);
  for (let i = 0; i < 3; i++) {
    const p = slots[i];
    const card = el('article','card');
    if (p) {
      card.innerHTML = `<div class="cover" style="aspect-ratio:16/11">${p.cover?`<img src='${p.cover}'/>`:''}</div>
        <div class="badge" style="margin-top:8px">${p.c||'Sem categoria'}</div>
        <div style="font-weight:700;margin:6px 0">${p.t||''}</div>
        <div class="small">${fmt(p.d)}</div>
        <div style="margin-top:8px"><a class="btn" href="post.html?slug=${encodeURIComponent(p.slug)}">Ler</a></div>`;
    } else {
      card.innerHTML = `<div class="cover" style="aspect-ratio:16/11"></div>
        <div class="badge" style="margin-top:8px">conteúdo</div>
        <div style="font-weight:700;margin:6px 0">Em breve</div>
        <div class="small">—</div>
        <div style="margin-top:8px"><a class="btn" href="admin.html">Publicar</a></div>`;
    }
    side.appendChild(card);
  }
  root.appendChild(feature); root.appendChild(side);
})();