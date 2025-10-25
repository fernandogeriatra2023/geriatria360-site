// admin.js — Editor estático para data.json

const state = {
  data: null,
  edit: { banner: -1, news: -1, topics: -1 },
  repoUrl: "" // opcional, para o botão "Abrir repositório"
};

// ---------- Utils ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function fmtDate(d) {
  if (!d) return "";
  return d; // mantemos ISO (yyyy-mm-dd)
}
function download(filename, text) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => alert("JSON copiado!"));
}
function refreshJsonPreview() {
  $("#jsonPreview").value = JSON.stringify(state.data, null, 2);
}

// ---------- Boot ----------
async function boot() {
  try {
    const res = await fetch("data.json", { cache: "no-store" });
    state.data = await res.json();

    // Se quiser apontar o botão "Abrir repositório":
    // state.repoUrl = "https://github.com/SEU_USUARIO/SEU_REPO";
    if (state.repoUrl) {
      $("#repoLink").href = state.repoUrl;
      $("#openRepo").onclick = () => window.open(state.repoUrl, "_blank");
    } else {
      $("#repoLink").href = "#";
      $("#openRepo").onclick = () => alert("Defina state.repoUrl no admin.js");
    }

    bindLogin();
  } catch (e) {
    $("#loginMsg").textContent = "Erro ao carregar data.json";
  }
}

function bindLogin() {
  $("#btnLogin").onclick = () => {
    const pass = $("#cms-pass").value.trim();
    const ok = pass && state.data?.auth?.cms_password && pass === state.data.auth.cms_password;
    if (!ok) {
      $("#loginMsg").textContent = "Senha inválida.";
      return;
    }
    $("#login").style.display = "none";
    $("#app").style.display = "block";
    initTabs();
    renderAll();
  };
}

// ---------- Tabs ----------
function initTabs() {
  $$(".tab").forEach(t => {
    t.onclick = () => {
      $$(".tab").forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      const id = t.dataset.panel;
      ["panel-banner","panel-news","panel-topics","panel-publicar"].forEach(p => {
        $("#" + p).style.display = (p === id) ? "block" : "none";
      });
      refreshJsonPreview();
    };
  });
}

// ---------- Render ----------
function renderAll() {
  renderBanner();
  renderNews();
  renderTopics();
  refreshJsonPreview();
  // actions
  $("#downloadJson").onclick = () => download("data.json", JSON.stringify(state.data, null, 2));
  $("#copyJson").onclick = () => copyToClipboard(JSON.stringify(state.data, null, 2));
}

// BANNER
function renderBanner() {
  const list = $("#bannerList");
  const empty = $("#bannerEmpty");
  list.innerHTML = "";
  const items = state.data.banner || [];
  $("#countBanner").textContent = items.length;

  if (!items.length) empty.style.display = "block"; else empty.style.display = "none";

  items.forEach((it, idx) => {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <div>
        <div><b>${it.title || "(sem título)"}</b></div>
        <div class="muted">${fmtDate(it.date)} · <span class="pill-badge">${it.tag || "-"}</span></div>
      </div>
      <div class="seg">
        <button class="btn" data-edit="${idx}">Editar</button>
        <button class="btn danger" data-del="${idx}">Excluir</button>
      </div>`;
    list.appendChild(row);
  });

  // binds
  list.querySelectorAll("[data-edit]").forEach(btn => {
    btn.onclick = () => {
      const i = +btn.dataset.edit;
      state.edit.banner = i;
      const it = state.data.banner[i];
      $("#b_title").value = it.title || "";
      $("#b_date").value = it.date || "";
      $("#b_tag").value = it.tag || "";
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    };
  });
  list.querySelectorAll("[data-del]").forEach(btn => {
    btn.onclick = () => {
      const i = +btn.dataset.del;
      if (confirm("Excluir item do banner?")) {
        state.data.banner.splice(i, 1);
        state.edit.banner = -1;
        clearBannerForm();
        renderBanner();
        refreshJsonPreview();
      }
    };
  });

  $("#addBanner").onclick = () => {
    state.edit.banner = -1;
    clearBannerForm();
    $("#b_title").focus();
  };
  $("#saveBanner").onclick = saveBanner;
  $("#resetBanner").onclick = clearBannerForm;
}

function clearBannerForm() {
  $("#b_title").value = "";
  $("#b_date").value = "";
  $("#b_tag").value = "";
}

function saveBanner() {
  const it = {
    title: $("#b_title").value.trim(),
    date: $("#b_date").value.trim(),
    tag: $("#b_tag").value.trim()
  };
  if (!it.title) return alert("Informe o título.");
  if (!state.data.banner) state.data.banner = [];

  if (state.edit.banner >= 0) {
    state.data.banner[state.edit.banner] = it;
  } else {
    state.data.banner.push(it);
  }
  state.edit.banner = -1;
  clearBannerForm();
  renderBanner();
  refreshJsonPreview();
}

// NEWS
function renderNews() {
  const list = $("#newsList");
  const empty = $("#newsEmpty");
  list.innerHTML = "";
  const items = state.data.news || [];
  $("#countNews").textContent = items.length;

  if (!items.length) empty.style.display = "block"; else empty.style.display = "none";

  items.forEach((it, idx) => {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <div>
        <div><b>${it.title || "(sem título)"}</b></div>
        <div class="muted">${it.type || "-"} · ${fmtDate(it.date)} · <code>${it.href || "-"}</code></div>
      </div>
      <div class="seg">
        <button class="btn" data-edit="${idx}">Editar</button>
        <button class="btn danger" data-del="${idx}">Excluir</button>
      </div>`;
    list.appendChild(row);
  });

  // binds
  list.querySelectorAll("[data-edit]").forEach(btn => {
    btn.onclick = () => {
      const i = +btn.dataset.edit;
      state.edit.news = i;
      const it = state.data.news[i];
      $("#n_title").value = it.title || "";
      $("#n_type").value = it.type || "Notícia";
      $("#n_date").value = it.date || "";
      $("#n_href").value = it.href || "";
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    };
  });
  list.querySelectorAll("[data-del]").forEach(btn => {
    btn.onclick = () => {
      const i = +btn.dataset.del;
      if (confirm("Excluir notícia?")) {
        state.data.news.splice(i, 1);
        state.edit.news = -1;
        clearNewsForm();
        renderNews();
        refreshJsonPreview();
      }
    };
  });

  $("#addNews").onclick = () => {
    state.edit.news = -1;
    clearNewsForm();
    $("#n_title").focus();
  };
  $("#saveNews").onclick = saveNews;
  $("#resetNews").onclick = clearNewsForm;
}

function clearNewsForm() {
  $("#n_title").value = "";
  $("#n_type").value = "Notícia";
  $("#n_date").value = "";
  $("#n_href").value = "";
}

function saveNews() {
  const it = {
    title: $("#n_title").value.trim(),
    type: $("#n_type").value.trim(),
    date: $("#n_date").value.trim(),
    href: $("#n_href").value.trim()
  };
  if (!it.title) return alert("Informe o título.");
  if (!state.data.news) state.data.news = [];

  if (state.edit.news >= 0) {
    state.data.news[state.edit.news] = it;
  } else {
    state.data.news.push(it);
  }
  state.edit.news = -1;
  clearNewsForm();
  renderNews();
  refreshJsonPreview();
}

// TOPICS
function renderTopics() {
  const list = $("#topicsList");
  const empty = $("#topicsEmpty");
  list.innerHTML = "";
  const items = state.data.topics || [];
  $("#countTopics").textContent = items.length;

  if (!items.length) empty.style.display = "block"; else empty.style.display = "none";

  items.forEach((it, idx) => {
    const row = document.createElement("div");
    row.className = "row";
    row.innerHTML = `
      <div>
        <div><b>${it.title || "(sem título)"}</b></div>
        <div class="muted">${it.subtitle || "-"} · <code>${it.href || "-"}</code></div>
      </div>
      <div class="seg">
        <button class="btn" data-edit="${idx}">Editar</button>
        <button class="btn danger" data-del="${idx}">Excluir</button>
      </div>`;
    list.appendChild(row);
  });

  // binds
  list.querySelectorAll("[data-edit]").forEach(btn => {
    btn.onclick = () => {
      const i = +btn.dataset.edit;
      state.edit.topics = i;
      const it = state.data.topics[i];
      $("#t_title").value = it.title || "";
      $("#t_subtitle").value = it.subtitle || "";
      $("#t_href").value = it.href || "";
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    };
  });
  list.querySelectorAll("[data-del]").forEach(btn => {
    btn.onclick = () => {
      const i = +btn.dataset.del;
      if (confirm("Excluir tópico?")) {
        state.data.topics.splice(i, 1);
        state.edit.topics = -1;
        clearTopicForm();
        renderTopics();
        refreshJsonPreview();
      }
    };
  });

  $("#addTopic").onclick = () => {
    state.edit.topics = -1;
    clearTopicForm();
    $("#t_title").focus();
  };
  $("#saveTopic").onclick = saveTopic;
  $("#resetTopic").onclick = clearTopicForm;
}

function clearTopicForm() {
  $("#t_title").value = "";
  $("#t_subtitle").value = "";
  $("#t_href").value = "";
}

function saveTopic() {
  const it = {
    title: $("#t_title").value.trim(),
    subtitle: $("#t_subtitle").value.trim(),
    href: $("#t_href").value.trim()
  };
  if (!it.title) return alert("Informe o título.");
  if (!state.data.topics) state.data.topics = [];

  if (state.edit.topics >= 0) {
    state.data.topics[state.edit.topics] = it;
  } else {
    state.data.topics.push(it);
  }
  state.edit.topics = -1;
  clearTopicForm();
  renderTopics();
  refreshJsonPreview();
}

boot();
