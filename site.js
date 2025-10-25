/* site.js — Geriatria 360 (home) */
/* Popula: #banner, #newsGrid, #patGrid
   Fonte: data.json (opcional) ou fallback local
*/

(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const state = {
    banner: [],
    news: [],
    topics: [],
    // autoplay simples para o banner
    _bIndex: 0,
    _bTimer: null,
  };

  // -------- Utils
  const fmt = (iso) => {
    if (!iso) return "";
    try { return new Date(iso).toLocaleDateString('pt-BR'); }
    catch { return iso; }
  };
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  };

  // -------- Render: Banner destaque (carrossel simples)
  function renderBanner() {
    const wrap = $("#banner");
    if (!wrap) return;

    wrap.innerHTML = "";
    wrap.classList.add("dash"); // usa seu estilo de cartão grande

    if (!state.banner.length) {
      wrap.appendChild(el("div", "muted", "Sem destaques no momento."));
      return;
    }

    // contêiner
    const track = el("div");
    track.style.display = "grid";
    track.style.gridTemplateColumns = "1fr";
    track.style.alignItems = "center";
    wrap.appendChild(track);

    // nav
    const nav = el("div", "seg");
    nav.style.marginTop = "10px";
    wrap.appendChild(nav);

    // cria slides
    state.banner.forEach((b, i) => {
      const slide = el("div", "banner__slide");
      slide.style.display = i === 0 ? "block" : "none";
      slide.innerHTML = `
        <div class="badge">${b.tag || "Comunicado"}</div>
        <h3 style="margin:6px 0 2px">${b.title}</h3>
        <div class="small muted">${fmt(b.date)}</div>
      `;
      slide.dataset.idx = i;
      track.appendChild(slide);

      const dot = el("button", "btn");
      dot.textContent = i + 1;
      dot.style.padding = "6px 10px";
      dot.setAttribute("aria-label", `Ir para destaque ${i + 1}`);
      dot.onclick = () => showBanner(i);
      nav.appendChild(dot);
    });

    // autoplay
    clearInterval(state._bTimer);
    state._bTimer = setInterval(() => {
      showBanner((state._bIndex + 1) % state.banner.length);
    }, 6000);
  }

  function showBanner(i) {
    state._bIndex = i;
    $$(".banner__slide").forEach((s, k) => {
      s.style.display = k === i ? "block" : "none";
    });
  }

  // -------- Render: Notícias
  function renderNews() {
    const grid = $("#newsGrid");
    if (!grid) return;
    grid.innerHTML = "";

    if (!state.news.length) {
      grid.appendChild(el("div", "muted", "Sem notícias publicadas ainda."));
      return;
    }

    state.news.slice(0, 6).forEach((n) => {
      const card = el("a", "card", `
        <div class="badge">${n.type || "Notícia"}</div>
        <h3 style="margin:6px 0">${n.title}</h3>
        <div class="small muted">${fmt(n.date)}</div>
      `);
      card.href = n.href || "#";
      grid.appendChild(card);
    });
  }

  // -------- Render: Patologias/Informações
  function renderTopics() {
    const grid = $("#patGrid");
    if (!grid) return;
    grid.innerHTML = "";

    if (!state.topics.length) {
      grid.appendChild(el("div", "muted", "Conteúdos em preparo."));
      return;
    }

    state.topics.slice(0, 6).forEach((t) => {
      const card = el("a", "card", `
        <h3 style="margin:0 0 6px">${t.title}</h3>
        <div class="small muted">${t.subtitle || ""}</div>
      `);
      card.href = t.href || "#";
      grid.appendChild(card);
    });
  }

  // -------- Data: tenta carregar de data.json, senão usa fallback
  async function loadData() {
    try {
      const res = await fetch("data.json", { cache: "no-store" });
      if (!res.ok) throw new Error("data.json não encontrado");
      const json = await res.json();

      state.banner = Array.isArray(json.banner) ? json.banner : [];
      state.news   = Array.isArray(json.news)   ? json.news   : [];
      state.topics = Array.isArray(json.topics) ? json.topics : [];
    } catch (_) {
      // Fallback simples
      state.banner = [
        { title: "Campanha de Vacinação", date: "2025-10-20", tag: "Importante" },
        { title: "Cuidados com quedas em casa", date: "2025-10-15", tag: "Prevenção" },
      ];
      state.news = [
        { title: "Campanha de Vacinação", type: "Notícia", date: "2025-10-20", href: "post.html?id=1" },
        { title: "Quedas: 5 cuidados dentro de casa", type: "Prevenção", date: "2025-10-15", href: "post.html?id=2" },
        { title: "Sarcopenia: sinais de alerta", type: "Artigo", date: "2025-10-10", href: "post.html?id=3" },
      ];
      state.topics = [
        { title: "Doença de Alzheimer", subtitle: "Sinais e condutas iniciais.", href: "post.html?id=alzheimer" },
        { title: "Sarcopenia", subtitle: "Força, massa muscular e funcionalidade.", href: "post.html?id=sarcopenia" },
        { title: "Prevenção de quedas", subtitle: "TUG, ambiente e treino.", href: "post.html?id=quedas" },
        { title: "Higiene do sono", subtitle: "Rotina e estímulos.", href: "post.html?id=sono" },
        { title: "Polifarmácia", subtitle: "Revisão de medicações.", href: "post.html?id=polifarmacia" },
        { title: "Humor e ansiedade", subtitle: "GDS-15 e estratégias.", href: "post.html?id=humor" },
      ];
    }
  }

  // -------- Boot
  async function init() {
    await loadData();
    renderBanner();
    renderNews();
    renderTopics();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
