// admin.js — Editor profissional com imagens e editor rico
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
  return d;
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

// ---------- Editor Rico ----------
function initEditorRico() {
  // Toolbar buttons
  $$(".editor-toolbar button").forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      const cmd = btn.dataset.cmd;
      if (cmd === 'createLink') {
        const url = prompt('Digite a URL:');
        if (url) document.execCommand(cmd, false, url);
      } else {
        document.execCommand(cmd, false, null);
      }
    };
  });
}

// ---------- Image Upload ----------
function initImageUpload() {
  // Banner image
  $("#bannerImageUpload").onclick = () => $("#b_imageFile").click();
  $("#b_imageFile").onchange = (e) => handleImageUpload(e, "banner");
  
  // News image
  $("#newsImageUpload").onclick = () => $("#n_imageFile").click();
  $("#n_imageFile").onchange = (e) => handleImageUpload(e, "news");
  
  // Topic image
  $("#topicImageUpload").onclick = () => $("#t_imageFile").click();
  $("#t_imageFile").onchange = (e) => handleImageUpload(e, "topic");
}

function handleImageUpload(event, type) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!file.type.startsWith('image/')) {
    alert('Por favor, selecione um arquivo de imagem.');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const imageDataUrl = e.target.result;
    
    // Mostrar preview
    const previewId = `${type}ImagePreview`;
    $(`#${previewId}`).src = imageDataUrl;
    $(`#${previewId}`).style.display = 'block';
    
    // Colocar no campo correspondente
    $(`#${type === 'topic' ? 't' : type.charAt(0)}_image`).value = imageDataUrl;
  };
  reader.readAsDataURL(file);
}

// ---------- Boot ----------
async function boot() {
  try {
    const res = await fetch("data.json", { cache: "no-store" });
    state.data = await res.json();

    if (state.repoUrl) {
      $("#repoLink").href = state.repoUrl;
      $("#openRepo").onclick = () => window.open(state.repoUrl, "_blank");
    } else {
      $("#repoLink").href = "#";
      $("#openRepo").onclick = () => alert("Defina state.repoUrl no admin.js");
    }

    // Inicializar funcionalidades
    initEditorRico();
    initImageUpload();
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
      <div style="flex: 1;">
        <div><b>${it.title || "(sem título)"}</b></div>
        <div class="muted">${fmtDate(it.date)} · <span class="pill-badge">${it.tag || "-"}</span></div>
        ${it.image ? '<div><small>📷 Com imagem</small></div>' : ''}
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
      $("#b_image").value = it.image || "";
      $("#b_content").innerHTML = it.content || "";
      
      // Preview da imagem
      if (it.image) {
        $("#bannerImagePreview").src = it.image;
        $("#bannerImagePreview").style.display = 'block';
      } else {
        $("#bannerImagePreview").style.display = 'none';
      }
      
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
  $("#b_image").value = "";
  $("#b_content").innerHTML = "";
  $("#bannerImagePreview").style.display = 'none';
  $("#b_imageFile").value = "";
}

function saveBanner() {
  const it = {
    title: $("#b_title").value.trim(),
    date: $("#b_date").value.trim(),
    tag: $("#b_tag").value.trim(),
    image: $("#b_image").value.trim(),
    content: $("#b_content").innerHTML
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
      <div style="flex: 1;">
        <div><b>${it.title || "(sem título)"}</b></div>
        <div class="muted">${it.type || "-"} · ${fmtDate(it.date)} · <code>${it.href || "-"}</code></div>
        ${it.image ? '<div><small>📷 Com imagem</small></div>' : ''}
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
      $("#n_image").value = it.image || "";
      $("#n_content").innerHTML = it.content || "";
      
      if (it.image) {
        $("#newsImagePreview").src = it.image;
        $("#newsImagePreview").style.display = 'block';
      } else {
        $("#newsImagePreview").style.display = 'none';
      }
      
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
  $("#n_image").value = "";
  $("#n_content").innerHTML = "";
  $("#newsImagePreview").style.display = 'none';
  $("#n_imageFile").value = "";
}

function saveNews() {
  const it = {
    title: $("#n_title").value.trim(),
    type: $("#n_type").value.trim(),
    date: $("#n_date").value.trim(),
    href: $("#n_href").value.trim(),
    image: $("#n_image").value.trim(),
    content: $("#n_content").innerHTML
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
      <div style="flex: 1;">
        <div><b>${it.title || "(sem título)"}</b></div>
        <div class="muted">${it.subtitle || "-"} · <code>${it.href || "-"}</code></div>
        ${it.image ? '<div><small>📷 Com imagem</small></div>' : ''}
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
      $("#t_image").value = it.image || "";
      $("#t_content").innerHTML = it.content || "";
      
      if (it.image) {
        $("#topicImagePreview").src = it.image;
        $("#topicImagePreview").style.display = 'block';
      } else {
        $("#topicImagePreview").style.display = 'none';
      }
      
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
  $("#t_image").value = "";
  $("#t_content").innerHTML = "";
  $("#topicImagePreview").style.display = 'none';
  $("#t_imageFile").value = "";
}

function saveTopic() {
  const it = {
    title: $("#t_title").value.trim(),
    subtitle: $("#t_subtitle").value.trim(),
    href: $("#t_href").value.trim(),
    image: $("#t_image").value.trim(),
    content: $("#t_content").innerHTML
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
