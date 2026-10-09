(() => {
  // ?preview = loaded inside the site editor; content arrives over postMessage.
  const PREVIEW = new URLSearchParams(location.search).has("preview");
  let data = window.PORTFOLIO;

  const { esc, inline } = Blocks;
  const asset = Blocks.asset;
  Blocks.preview = PREVIEW;

  const $ = (id) => document.getElementById(id);
  const tabsEl = $("tabs");
  const gridEl = $("grid");
  const detailEl = $("detail");
  const portfolioEl = $("portfolio");

  let activeCat = null;

  const byId = (id) => data.projects.find((p) => p.id === id);
  const inCat = (cat) => data.projects.filter((p) => (p.categories || []).includes(cat));
  const external = (url) => (/^https?:/i.test(url) ? ' target="_blank" rel="noopener"' : "");

  // ---------------------------------------------------------------- site text

  function renderSite() {
    const s = data.site;
    const about = s.about || {};
    const contact = s.contact || {};
    const resume = asset(s.resumeUrl);

    document.querySelectorAll("[data-logo]").forEach((img) => (img.src = asset(s.logo)));
    document.querySelectorAll("[data-resume]").forEach((a) => {
      a.href = resume || "#";
      a.hidden = !resume;
    });

    $("hero-eyebrow").textContent = s.eyebrow || "";
    $("hero-name").textContent = s.name || "";
    $("hero-role").textContent = s.role || "";
    $("hero-tagline").innerHTML = inline(s.tagline);

    const nav = [["#portfolio", "Portfolio"], ["#about", "About"]]
      .concat(data.sections.filter((x) => x.nav).map((x) => ["#" + x.id, x.title]))
      .concat([["#contact", "Contact"]]);
    $("topbar-links").innerHTML =
      nav.map(([href, label]) => `<a href="${esc(href)}">${esc(label)}</a>`).join("") +
      (resume ? `<a href="${esc(resume)}" target="_blank" rel="noopener">Resume&nbsp;↗</a>` : "");

    $("about-lead").innerHTML = inline(about.lead);
    $("about-paras").innerHTML = (about.paragraphs || []).filter(Boolean).map((p) => `<p>${inline(p)}</p>`).join("");
    const facts = (about.facts || []).filter((f) => f.label || f.value);
    $("about-facts").hidden = !facts.length;
    $("about-facts").innerHTML = facts
      .map((f) => `<li><span class="facts__k">${esc(f.label)}</span><span class="facts__v">${inline(f.value)}</span></li>`)
      .join("");
    const groups = (about.toolbox || []).filter((g) => g.title || (g.items || []).length);
    $("about-toolbox").hidden = !groups.length;
    $("about-toolbox").innerHTML = groups
      .map(
        (g) => `<div class="toolbox__group"><h3>${esc(g.title)}</h3>
          <ul class="chips">${(g.items || []).filter(Boolean).map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>`
      )
      .join("");

    $("custom-sections").innerHTML = data.sections
      .map(
        (sec) => `
        <section class="custom-section" id="${esc(sec.id)}">
          <div class="section-head">
            ${sec.eyebrow ? `<p class="eyebrow">${esc(sec.eyebrow)}</p>` : ""}
            <h2 class="section-title">${esc(sec.title)}</h2>
          </div>
          <div class="prose">${Blocks.renderAll(sec.blocks)}</div>
        </section>`
      )
      .join("");

    $("contact-pitch").innerHTML = inline(contact.pitch);
    const email = $("contact-email");
    email.textContent = contact.email || "";
    email.href = "mailto:" + (contact.email || "");
    email.hidden = !contact.email;
    $("contact-links").innerHTML =
      (contact.links || [])
        .filter((l) => l.url)
        .map((l) => `<a class="link-pill" href="${esc(l.url)}"${external(l.url)}>${esc(l.label || l.url)} ↗</a>`)
        .join("") +
      (contact.discord
        ? `<button class="link-pill" type="button" data-copy="${esc(contact.discord)}">Discord: <span>${esc(contact.discord)}</span></button>`
        : "") +
      (resume ? `<a class="link-pill" href="${esc(resume)}" target="_blank" rel="noopener">Resume ↗</a>` : "");

    $("footer-name").textContent = s.name || "";
  }

  // ---------------------------------------------------------------- tabs

  function renderTabs() {
    tabsEl.innerHTML = data.categories
      .map(
        (c) => `
        <button class="tab" role="tab" id="tab-${esc(c.id)}" data-cat="${esc(c.id)}"
                aria-selected="${c.id === activeCat}" aria-controls="grid" tabindex="${c.id === activeCat ? 0 : -1}">
          <span class="tab__title">${esc(c.title)}<span class="tab__count">${inCat(c.id).length}</span></span>
          <span class="tab__detail">${esc(c.detail)}</span>
          <span class="tab__icon" aria-hidden="true">${esc(c.icon)}</span>
        </button>`
      )
      .join("");
  }

  function selectTab(cat, { focus = false } = {}) {
    activeCat = cat;
    tabsEl.querySelectorAll(".tab").forEach((t) => {
      const on = t.dataset.cat === cat;
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    gridEl.setAttribute("aria-labelledby", `tab-${cat}`);
    renderGrid();
  }

  tabsEl.addEventListener("click", (e) => {
    const tab = e.target.closest(".tab");
    if (!tab) return;
    selectTab(tab.dataset.cat);
    if (!detailEl.hidden) {
      history.pushState(null, "", "#portfolio");
      route();
    }
  });

  tabsEl.addEventListener("keydown", (e) => {
    const ids = data.categories.map((c) => c.id);
    let i = ids.indexOf(activeCat);
    if (e.key === "ArrowRight") i = (i + 1) % ids.length;
    else if (e.key === "ArrowLeft") i = (i - 1 + ids.length) % ids.length;
    else if (e.key === "Home") i = 0;
    else if (e.key === "End") i = ids.length - 1;
    else return;
    e.preventDefault();
    selectTab(ids[i], { focus: true });
  });

  // ---------------------------------------------------------------- grid

  function tileHTML(p, i) {
    const badge = p.award
      ? `<span class="tile__badge tile__badge--award">Award winner</span>`
      : p.status
      ? `<span class="tile__badge">${esc(p.status)}</span>`
      : "";
    return `
      <a class="tile" href="#work/${esc(p.id)}" style="animation-delay:${i * 50}ms" ${p.preview ? `data-preview="${esc(asset(p.preview))}"` : ""}>
        <div class="tile__media">
          ${p.thumb ? `<img src="${esc(asset(p.thumb))}" alt="" loading="lazy" decoding="async">` : ""}
          ${p.preview ? `<img class="tile__preview" alt="" decoding="async"><span class="tile__play" aria-hidden="true">▶ hover</span>` : ""}
          ${badge}
        </div>
        <div class="tile__body">
          <h3 class="tile__title">${esc(p.title)}</h3>
          <p class="tile__desc">${inline(p.summary)}</p>
          <ul class="tags">${(p.tags || []).map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
        </div>
      </a>`;
  }

  function renderGrid() {
    const list = inCat(activeCat);
    gridEl.innerHTML = list.length ? list.map(tileHTML).join("") : `<p class="grid__empty">No projects in this category yet.</p>`;
  }

  // Animated GIF previews: only fetched the first time a tile is hovered/focused.
  function startPreview(tile) {
    if (!tile || !tile.dataset.preview) return;
    const img = tile.querySelector(".tile__preview");
    if (!img.src) {
      img.addEventListener("load", () => img.classList.add("is-loaded"), { once: true });
      img.src = tile.dataset.preview;
    }
    tile.classList.add("is-previewing");
  }
  const stopPreview = (tile) => tile && tile.classList.remove("is-previewing");

  gridEl.addEventListener("pointerover", (e) => e.pointerType === "mouse" && startPreview(e.target.closest(".tile")));
  gridEl.addEventListener("pointerout", (e) => {
    const tile = e.target.closest(".tile");
    if (tile && !tile.contains(e.relatedTarget)) stopPreview(tile);
  });
  gridEl.addEventListener("focusin", (e) => startPreview(e.target.closest(".tile")));
  gridEl.addEventListener("focusout", (e) => stopPreview(e.target.closest(".tile")));

  // -------------------------------------------------------------- detail

  function renderDetail(p) {
    const list = inCat(activeCat);
    const i = list.findIndex((x) => x.id === p.id);
    const prev = list[(i - 1 + list.length) % list.length];
    const next = list[(i + 1) % list.length];
    const meta = (p.meta || []).filter((m) => m.label || m.value);
    const links = (p.links || []).filter((l) => l.url);

    detailEl.innerHTML = `
      <div class="detail__bar">
        <a class="btn" href="#portfolio">← Back</a>
      </div>

      <header class="detail__head">
        <div class="detail__term">${[esc(p.term), p.status && `<span class="detail__status">${esc(p.status)}</span>`]
          .filter(Boolean)
          .join(" · ")}</div>
        <h2 class="detail__title">${esc(p.title)}</h2>
        <p class="detail__summary">${inline(p.summary)}</p>
        ${p.award ? `<span class="detail__award">★ ${esc(p.award)}</span>` : ""}
      </header>

      ${meta.length ? `<dl class="detail__meta">${meta.map((m) => `<div><dt>${esc(m.label)}</dt><dd>${inline(m.value)}</dd></div>`).join("")}</dl>` : ""}

      ${
        links.length
          ? `<div class="detail__links">${links
              .map((l, j) => `<a class="btn ${j === 0 ? "btn--accent" : ""}" href="${esc(asset(l.url))}" target="_blank" rel="noopener">${esc(l.label || l.url)} ↗</a>`)
              .join("")}</div>`
          : ""
      }

      <div class="detail__body prose">${Blocks.renderAll(p.body)}</div>

      ${
        list.length > 1 && i !== -1
          ? `<nav class="detail__pager" aria-label="More projects">
              <a class="pager-link" href="#work/${esc(prev.id)}"><span>← Previous</span><strong>${esc(prev.title)}</strong></a>
              <a class="pager-link pager-link--next" href="#work/${esc(next.id)}"><span>Next →</span><strong>${esc(next.title)}</strong></a>
            </nav>`
          : ""
      }`;
  }

  function showGrid() {
    detailEl.hidden = true;
    detailEl.innerHTML = ""; // stops any playing video
    gridEl.hidden = false;
  }

  function showDetail(id) {
    const p = byId(id);
    if (!p) return showGrid();
    if (!(p.categories || []).includes(activeCat) && p.categories && p.categories[0]) selectTab(p.categories[0]);
    renderDetail(p);
    gridEl.hidden = true;
    detailEl.hidden = false;
    document.title = `${p.title} — ${data.site.name}`;
    portfolioEl.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  function route() {
    const m = location.hash.match(/^#work\/([\w-]+)/);
    if (m) return showDetail(m[1]);
    document.title = `${data.site.name} — ${data.site.role}`;
    if (!detailEl.hidden) {
      showGrid();
      // The browser already jumped to the anchor before the detail collapsed, so re-align.
      const target = location.hash && document.getElementById(location.hash.slice(1));
      if (target) target.scrollIntoView();
    }
  }

  window.addEventListener("hashchange", route);

  // Re-render everything in place (used on load and for live editor updates).
  function refresh() {
    renderSite();
    if (!data.categories.some((c) => c.id === activeCat)) activeCat = data.categories[0] && data.categories[0].id;
    renderTabs();
    renderGrid();
    const m = location.hash.match(/^#work\/([\w-]+)/);
    if (m && !detailEl.hidden && byId(m[1])) renderDetail(byId(m[1]));
  }

  // -------------------------------------------------------------- chrome

  // Topbar appears once the hero is mostly off-screen.
  const topbar = $("topbar");
  new IntersectionObserver(([entry]) => topbar.classList.toggle("is-visible", !entry.isIntersecting), {
    rootMargin: "-40% 0px 0px 0px",
  }).observe($("home"));

  $("contact-links").addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;
    const label = btn.querySelector("span");
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      label.textContent = "copied!";
    } catch {
      label.textContent = btn.dataset.copy;
    }
    btn.classList.add("is-copied");
    setTimeout(() => {
      label.textContent = btn.dataset.copy;
      btn.classList.remove("is-copied");
    }, 1600);
  });

  $("year").textContent = new Date().getFullYear();

  // -------------------------------------------------------------- editor preview

  if (PREVIEW) {
    window.addEventListener("message", (e) => {
      if (e.origin !== location.origin || !e.data || e.data.type !== "portfolio:update") return;
      data = e.data.data;
      Blocks.assetMap = e.data.assets || {};
      refresh(); // re-renders in place, so typing in the editor doesn't jump the preview around
      if (e.data.hash && e.data.hash !== location.hash) location.hash = e.data.hash;
    });
    parent.postMessage({ type: "portfolio:ready" }, location.origin);
  }

  refresh();
  route();
})();
