// cmspro.js — painel local de notícias/patologias
const DB_KEY = "cms_geriatria360";

function loadDB() {
  try { return JSON.parse(localStorage.getItem(DB_KEY)) || { banner: [], news: [], topics: [] }; }
  catch { return { banner: [], news: [], topics: [] }; }
}
function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function renderList() {
  const db = loadDB();
  const list = document.getElementById("lista");
  list.innerHTML = "";
  ["banner", "news", "topics"].forEach((type) => {
    if (!db[type]?.length) return;
    const h = document.createElement("h3");
    h.textContent = type.toUpperCase();
    list.appendChild(h);
    db[type].forEach((item, i) => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `<b>${item.title}</b> <span class="muted">${item.date || ""}</span><br>${item.subtitle || ""}<br>
      <small>${item.href || ""}</small>
      <button onclick="delItem('${type}',${i})" class="btn">Excluir</button>`;
      list.appendChild(div);
    });
  });
}

function delItem(type, i) {
  const db = loadDB();
  db[type].splice(i, 1);
  saveDB(db);
  renderList();
}

document.getElementById("salvar").onclick = () => {
  const tipo = document.getElementById("tipo").value;
  const item = {
    title: document.getElementById("titulo").value.trim(),
    subtitle: document.getElementById("sub").value.trim(),
    date: document.getElementById("data").value,
    href: document.getElementById("href").value.trim(),
  };
  if (!item.title) return alert("Informe o título!");
  const db = loadDB();
  db[tipo].push(item);
  saveDB(db);
  renderList();
  document.querySelectorAll("input").forEach((i) => (i.value = ""));
};

// Inicializa
renderList();
