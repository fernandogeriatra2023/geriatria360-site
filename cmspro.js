const LS='posts_pro_v1'; let AUTH=false, EDIT=null; let CURRENT_STATUS='draft';
async function loginAdmin(){const pass=document.getElementById('admin-pass').value.trim(); const cfg=await fetch('data.json').then(r=>r.json());
 if(pass===(cfg.auth?.admin_password||'admin123')){AUTH=true; document.getElementById('cms').style.display='grid'; renderTable(); bindCover();} else alert('Senha inválida');}
function bindCover(){const box=document.getElementById('coverBox'); const input=document.getElementById('coverInput'); box.onclick=()=>input.click(); input.onchange=(e)=>{const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{box.innerHTML=`<img src='${r.result}'/>`; box.dataset.src=r.result;}; r.readAsDataURL(f);}}
function list(){try{return JSON.parse(localStorage.getItem(LS)||'[]')}catch(_){return []}}
function saveAll(arr){localStorage.setItem(LS, JSON.stringify(arr)); renderTable();}
function val(id){return document.getElementById(id).value}
function set(id,v){document.getElementById(id).value=v||''}
function editorEl(){return document.getElementById('editor')}
function cmd(x){document.execCommand(x,false,null)}
function cmdBlock(tag){document.execCommand('formatBlock', false, tag)}
function insertLink(){const url=prompt('URL:'); if(!url) return; document.execCommand('createLink',false,url)}
function insertImage(){const url=prompt('URL da imagem (ou use capa ao lado):'); if(!url) return; document.execCommand('insertImage', false, url)}
function insertQuote(){document.execCommand('formatBlock', false, 'BLOCKQUOTE')}
function clearContent(){editorEl().innerHTML=''}
function genSlug(t){return (t||'').toLowerCase().normalize('NFD').replace(/[^\w\s-]/g,'').trim().replace(/[\s_-]+/g,'-').replace(/^-+|-+$/g,'')}
function autoExcerpt(html){const div=document.createElement('div'); div.innerHTML=html; const txt=(div.textContent||'').trim(); return txt.slice(0,180)}
function toggleStatus(){CURRENT_STATUS = CURRENT_STATUS==='draft'?'published':'draft'; document.getElementById('statusLabel').textContent = CURRENT_STATUS==='draft'?'Publicar':'Voltar p/ rascunho'}
function savePost(){if(!AUTH) return alert('Entre primeiro'); const t=val('t'); if(!t) return alert('Título obrigatório');
 let slug=val('slug')||genSlug(t); const arr=list(); if(EDIT==null && arr.find(p=>p.slug===slug)){slug=slug+'-'+(Math.random().toString(36).slice(2,6))}
 const p={t, slug, c:val('c'), tags:val('tags'), d:val('d'), author:val('author'), cover:document.getElementById('coverBox').dataset.src||'', body:editorEl().innerHTML, excerpt:autoExcerpt(editorEl().innerHTML), status:CURRENT_STATUS};
 if(EDIT==null){arr.push(p);} else {arr[EDIT]=p;} saveAll(arr); alert('Salvo!');}
function renderTable(){const q=(document.getElementById('search')||{value:''}).value.toLowerCase(); const tbody=document.querySelector('#tbl tbody'); tbody.innerHTML=''; list().forEach((p,i)=>{
 const s=[p.t,p.slug,p.c].join(' ').toLowerCase(); if(q && !s.includes(q)) return;
 const tr=document.createElement('tr'); tr.innerHTML=`<td>${i+1}</td><td>${p.t||''}</td><td>${p.slug||''}</td><td>${p.c||''}</td><td>${p.status||'draft'}</td><td>${p.d||''}</td>
 <td><button class='btn' onclick='edit(${i})'>Editar</button> <button class='btn' onclick='toggle(${i})'>${(p.status||'draft')==='published'?'Despublicar':'Publicar'}</button> <button class='btn' onclick='del(${i})'>Excluir</button></td>`; tbody.appendChild(tr);});}
function edit(i){const p=list()[i]; EDIT=i; set('t',p.t); set('slug',p.slug); set('c',p.c); set('tags',p.tags); set('d',p.d); set('author',p.author); document.getElementById('coverBox').dataset.src=p.cover||''; document.getElementById('coverBox').innerHTML=p.cover?`<img src='${p.cover}'/>`:'<span class=\"small\">Clique para enviar imagem</span>'; editorEl().innerHTML=p.body||''; CURRENT_STATUS=p.status||'draft'; document.getElementById('statusLabel').textContent = CURRENT_STATUS==='draft'?'Publicar':'Voltar p/ rascunho'; window.scrollTo({top:0,behavior:'smooth'});}
function toggle(i){const arr=list(); arr[i].status = (arr[i].status||'draft')==='published'?'draft':'published'; saveAll(arr)}
function del(i){if(!confirm('Excluir?')) return; const arr=list(); arr.splice(i,1); saveAll(arr)}
function exportJSON(){const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(list(),null,2)],{type:'application/json'})); a.download='posts.json'; a.click();}
function importJSON(ev){const f=ev.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{try{const arr=JSON.parse(r.result); if(Array.isArray(arr)) saveAll(arr)}catch(e){alert('JSON inválido')}}; r.readAsText(f);}
function previewPost(){const p={t:val('t'),slug:val('slug')||genSlug(val('t')),c:val('c'),tags:val('tags'),d:val('d'),author:val('author'),cover:document.getElementById('coverBox').dataset.src||'', body:editorEl().innerHTML, excerpt:autoExcerpt(editorEl().innerHTML), status:CURRENT_STATUS}; const w=window.open('','_blank'); w.document.write(`<html><head><meta charset='utf-8'><title>Prévia — ${p.t}</title><link rel='stylesheet' href='styles.css'></head><body><div class='container post'><div class='card'><h1>${p.t}</h1><div class='small'>${p.author||''} — ${p.d||''}</div>${p.cover?`<div class='cover'><img src='${p.cover}'/></div>`:''}<div style='margin-top:14px'>${p.body}</div></div></div></body></html>`);}