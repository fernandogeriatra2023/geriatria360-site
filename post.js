const LS='posts_pro_v1';
function q(name){return new URLSearchParams(location.search).get(name)}
function get(){try{return JSON.parse(localStorage.getItem(LS)||'[]')}catch(_){return []}}
(function(){
  const slug = q('slug'); const p = get().find(x=>x.slug===slug && x.status==='published');
  if(!p){document.getElementById('post').innerHTML='<div class="card">Matéria não encontrada ou não publicada.</div>'; return;}
  document.getElementById('seo-title').textContent = p.t + ' — Geriatria 360';
  document.getElementById('seo-desc').content = p.excerpt || '';
  document.getElementById('p-title').textContent = p.t;
  document.getElementById('p-meta').textContent = (p.author||'') + (p.d? ' — ' + p.d : '');
  if(p.cover){const box=document.getElementById('p-cover'); box.style.display='block'; box.innerHTML = `<img src='${p.cover}'/>`;}
  document.getElementById('p-body').innerHTML = p.body || '';
})();