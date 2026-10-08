(() => {
  const { categories, projects } = window.PORTFOLIO;
  const byId = Object.fromEntries(projects.map((p) => [p.id, p]));

  const tabsEl = document.getElementById("tabs");
  const gridEl = document.getElementById("grid");
  const detailEl = document.getElementById("detail");
  const portfolioEl = document.getElementById("portfolio");

  let activeCat = categories[0].id;

  const esc = (s = "") =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const inCat = (cat) => projects.filter((p) => p.categories.includes(cat));

  // ---------------------------------------------------------------- tabs

  function renderTabs() {
    tabsEl.innerHTML = categories
      .map(
        (c) => `
        <button class="tab" role="tab" id="tab-${c.id}" data-cat="${c.id}"
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
    const ids = categories.map((c) => c.id);
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
      <a class="tile" href="#work/${p.id}" style="animation-delay:${i * 50}ms" ${p.preview ? `data-preview="${esc(p.preview)}"` : ""}>
        <div class="tile__media">
          <img src="${esc(p.thumb)}" alt="" loading="lazy" decoding="async">
          ${p.preview ? `<img class="tile__preview" alt="" decoding="async"><span class="tile__play" aria-hidden="true">▶ hover</span>` : ""}
          ${badge}
        </div>
        <div class="tile__body">
          <h3 class="tile__title">${esc(p.title)}</h3>
          <p class="tile__desc">${esc(p.summary)}</p>
          <ul class="tags">${p.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
        </div>
      </a>`;
  }

  function renderGrid() {
    gridEl.innerHTML = inCat(activeCat).map(tileHTML).join("");
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

  function blockHTML(b) {
    if (b.h) return `<h3>${esc(b.h)}</h3>`;
    if (b.p) return `<p>${esc(b.p)}</p>`;
    if (b.ul) return `<ul>${b.ul.map((li) => `<li>${esc(li)}</li>`).join("")}</ul>`;
    if (b.note) return `<p class="note">${esc(b.note)}</p>`;
    if (b.img)
      return `<figure class="media"><img src="${esc(b.img)}" alt="${esc(b.alt)}" loading="lazy" decoding="async">${
        b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ""
      }</figure>`;
    if (b.youtube)
      return `<figure class="media"><iframe src="https://www.youtube-nocookie.com/embed/${esc(b.youtube)}?rel=0"
        title="${esc(b.caption || "Project video")}" loading="lazy" allowfullscreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>${
        b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ""
      }</figure>`;
    return "";
  }

  function renderDetail(p) {
    const list = inCat(activeCat);
    const i = list.findIndex((x) => x.id === p.id);
    const prev = list[(i - 1 + list.length) % list.length];
    const next = list[(i + 1) % list.length];
    const meta = Object.entries(p.meta || {});

    detailEl.innerHTML = `
      <div class="detail__bar">
        <a class="btn" href="#portfolio" data-back>← Back</a>
      </div>

      <header class="detail__head">
        <div class="detail__term">${[p.term, p.status && `<span class="detail__status">${esc(p.status)}</span>`]
          .filter(Boolean)
          .join(" · ")}</div>
        <h2 class="detail__title">${esc(p.title)}</h2>
        <p class="detail__summary">${esc(p.summary)}</p>
        ${p.award ? `<span class="detail__award">★ ${esc(p.award)}</span>` : ""}
      </header>

      ${meta.length ? `<dl class="detail__meta">${meta.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : ""}

      ${
        p.links && p.links.length
          ? `<div class="detail__links">${p.links
              .map((l, j) => `<a class="btn ${j === 0 ? "btn--accent" : ""}" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`)
              .join("")}</div>`
          : ""
      }

      <div class="detail__body">${(p.body || []).map(blockHTML).join("")}</div>

      ${
        list.length > 1
          ? `<nav class="detail__pager" aria-label="More projects">
              <a class="pager-link" href="#work/${prev.id}"><span>← Previous</span><strong>${esc(prev.title)}</strong></a>
              <a class="pager-link pager-link--next" href="#work/${next.id}"><span>Next →</span><strong>${esc(next.title)}</strong></a>
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
    const p = byId[id];
    if (!p) return showGrid();
    if (!p.categories.includes(activeCat)) selectTab(p.categories[0]);
    renderDetail(p);
    gridEl.hidden = true;
    detailEl.hidden = false;
    document.title = `${p.title} — Joshua Moore`;
    portfolioEl.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  function route() {
    const m = location.hash.match(/^#work\/([\w-]+)/);
    if (m) return showDetail(m[1]);
    document.title = "Joshua Moore — Technical Artist";
    if (!detailEl.hidden) {
      showGrid();
      // The browser already jumped to the anchor before the detail collapsed, so re-align.
      const target = location.hash && document.getElementById(location.hash.slice(1));
      if (target) target.scrollIntoView();
    }
  }

  window.addEventListener("hashchange", route);

  // -------------------------------------------------------------- chrome

  // Topbar appears once the hero is mostly off-screen.
  const topbar = document.getElementById("topbar");
  new IntersectionObserver(([entry]) => topbar.classList.toggle("is-visible", !entry.isIntersecting), {
    rootMargin: "-40% 0px 0px 0px",
  }).observe(document.getElementById("home"));

  const copyBtn = document.getElementById("copy-discord");
  copyBtn.addEventListener("click", async () => {
    const label = copyBtn.querySelector("span");
    try {
      await navigator.clipboard.writeText(copyBtn.dataset.copy);
      label.textContent = "copied!";
    } catch {
      label.textContent = copyBtn.dataset.copy;
    }
    copyBtn.classList.add("is-copied");
    setTimeout(() => {
      label.textContent = copyBtn.dataset.copy;
      copyBtn.classList.remove("is-copied");
    }, 1600);
  });

  document.getElementById("year").textContent = new Date().getFullYear();

  renderTabs();
  selectTab(activeCat);
  route();
})();
