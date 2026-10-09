/*
 * Content blocks — shared by the website (js/main.js) and the site editor (editor/).
 *
 * Each block type declares:
 *   type    unique id stored in content.js
 *   label   name shown in the editor's "Add block" menu
 *   group   menu group ("Text", "Media", "Embeds")
 *   icon    short badge text for the editor
 *   fields  editor inputs: { key, label, type, placeholder?, help?, default?, options?, accept? }
 *           field types: text, textarea, code, url, number, checkbox, select, lines, image, images, file
 *   render(block, Blocks) -> HTML string for the website
 *   parse?(block)         -> optional; returns "" when a pasted link can't be understood (editor shows a warning)
 *
 * Embeds (YouTube, blueprintUE, Sketchfab, ...) are registered the same way in js/plugins.js.
 */
(() => {
  const types = {};
  const order = [];

  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // Inline formatting for text fields: **bold**, *italic*, `code`, [text](https://link), line breaks.
  function inline(s) {
    let out = esc(s);
    out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\*)/g, "$1<em>$2</em>");
    out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, url) => {
      if (!/^(https?:|mailto:|#|assets\/)/i.test(url)) return m;
      const ext = /^https?:/i.test(url) ? ' target="_blank" rel="noopener"' : "";
      return `<a href="${url}"${ext}>${text}</a>`;
    });
    return out.replace(/\n/g, "<br>");
  }

  const clone = (v) => (v && typeof v === "object" ? JSON.parse(JSON.stringify(v)) : v);
  const emptyFor = (f) => (f.type === "lines" || f.type === "images" ? [] : f.type === "checkbox" ? false : "");

  const Blocks = {
    types,
    order,
    esc,
    inline,
    preview: false,   // true inside the editor's live preview: shows hints for unfinished blocks
    assetMap: {},     // editor-only: files added this session -> temporary URLs

    register(def) {
      if (!types[def.type]) order.push(def.type);
      types[def.type] = Object.assign({ group: "Other", icon: "•", fields: [] }, def);
    },

    create(type) {
      const block = { type };
      for (const f of types[type].fields) block[f.key] = f.default !== undefined ? clone(f.default) : emptyFor(f);
      return block;
    },

    asset(src) {
      return (src && Blocks.assetMap[src]) || src || "";
    },

    render(block) {
      const def = block && types[block.type];
      if (!def) return Blocks.placeholder(`Unknown block type "${block && block.type}"`);
      try {
        return def.render(block, Blocks) || "";
      } catch (err) {
        console.warn("[blocks]", block.type, err);
        return Blocks.placeholder(`Couldn't render ${def.label}`);
      }
    },

    renderAll(blocks) {
      return (blocks || []).map(Blocks.render).join("");
    },

    // Shown only in the editor preview, never on the live site.
    placeholder(message) {
      return Blocks.preview ? `<div class="block-missing">${esc(message)}</div>` : "";
    },

    caption(text) {
      return text ? `<figcaption>${inline(text)}</figcaption>` : "";
    },

    figure(inner, caption, cls) {
      return `<figure class="media ${cls || ""}">${inner}${Blocks.caption(caption)}</figure>`;
    },

    // Responsive iframe. Pass `height` (px) for a fixed height, otherwise `aspect` is used.
    frame(src, opts) {
      const o = opts || {};
      const style = o.height ? `height:${Math.max(150, Number(o.height) || 0)}px` : `aspect-ratio:${o.aspect || "16 / 9"}`;
      const allow = o.allow ? ` allow="${esc(o.allow)}"` : "";
      return Blocks.figure(
        `<iframe src="${esc(src)}" title="${esc(o.title || "Embedded content")}" style="${style}" loading="lazy" allowfullscreen${allow}></iframe>`,
        o.caption,
        "media--embed"
      );
    },
  };

  window.Blocks = Blocks;
  const B = Blocks;
  const captionField = { key: "caption", label: "Caption", type: "text", placeholder: "Optional" };

  // ------------------------------------------------------------------ text

  B.register({
    type: "heading",
    label: "Section heading",
    group: "Text",
    icon: "H",
    fields: [{ key: "text", label: "Heading", type: "text", placeholder: "e.g. Breakdown" }],
    render: (b) => (b.text ? `<h3>${inline(b.text)}</h3>` : B.placeholder("Empty heading")),
  });

  B.register({
    type: "text",
    label: "Paragraph",
    group: "Text",
    icon: "¶",
    fields: [
      {
        key: "text",
        label: "Text",
        type: "textarea",
        rows: 5,
        help: "**bold**, *italic*, `code`, [link text](https://…). Leave a blank line to start a new paragraph.",
      },
    ],
    render: (b) =>
      String(b.text || "")
        .split(/\n\s*\n/)
        .filter((p) => p.trim())
        .map((p) => `<p>${inline(p.trim())}</p>`)
        .join("") || B.placeholder("Empty paragraph"),
  });

  B.register({
    type: "list",
    label: "Bullet list",
    group: "Text",
    icon: "≡",
    fields: [{ key: "items", label: "Items — one per line", type: "lines", rows: 5 }],
    render: (b) => {
      const items = (b.items || []).filter((i) => String(i).trim());
      return items.length ? `<ul>${items.map((i) => `<li>${inline(i)}</li>`).join("")}</ul>` : B.placeholder("Empty list");
    },
  });

  B.register({
    type: "note",
    label: "Small note",
    group: "Text",
    icon: "i",
    fields: [{ key: "text", label: "Note", type: "textarea", rows: 2, placeholder: "e.g. Character model property of …" }],
    render: (b) => (b.text ? `<p class="note">${inline(b.text)}</p>` : B.placeholder("Empty note")),
  });

  B.register({
    type: "code",
    label: "Code snippet",
    group: "Text",
    icon: "</>",
    fields: [
      { key: "language", label: "Language", type: "text", placeholder: "HLSL, Python, C#, VEX…" },
      { key: "code", label: "Code", type: "code", rows: 10 },
      captionField,
    ],
    render: (b) =>
      b.code
        ? `<figure class="code">${b.language ? `<div class="code__bar">${esc(b.language)}</div>` : ""}<pre><code>${esc(b.code)}</code></pre>${B.caption(b.caption)}</figure>`
        : B.placeholder("Empty code block"),
  });

  // ------------------------------------------------------------------ media

  B.register({
    type: "image",
    label: "Image / GIF",
    group: "Media",
    icon: "IMG",
    fields: [
      { key: "src", label: "Image", type: "image" },
      { key: "alt", label: "Description (for screen readers)", type: "text", placeholder: "What's in the image?" },
      captionField,
    ],
    render: (b) =>
      b.src
        ? B.figure(`<img src="${esc(B.asset(b.src))}" alt="${esc(b.alt)}" loading="lazy" decoding="async">`, b.caption)
        : B.placeholder("Choose an image"),
  });

  B.register({
    type: "gallery",
    label: "Image gallery",
    group: "Media",
    icon: "▦",
    fields: [
      { key: "images", label: "Images", type: "images" },
      { key: "columns", label: "Columns", type: "select", options: ["2", "3", "4"], default: "2" },
      captionField,
    ],
    render: (b) => {
      const imgs = (b.images || []).filter(Boolean);
      if (!imgs.length) return B.placeholder("Add images to the gallery");
      const cells = imgs
        .map((src) => `<a href="${esc(B.asset(src))}" target="_blank" rel="noopener"><img src="${esc(B.asset(src))}" alt="" loading="lazy" decoding="async"></a>`)
        .join("");
      return B.figure(`<div class="gallery" style="--cols:${esc(b.columns || 2)}">${cells}</div>`, b.caption, "media--gallery");
    },
  });

  B.register({
    type: "video",
    label: "Video file (MP4)",
    group: "Media",
    icon: "MP4",
    fields: [
      { key: "src", label: "Video file", type: "file", accept: "video/mp4,video/webm", help: "Short clips work best — GitHub rejects files over 100 MB. Use YouTube/Vimeo for long videos." },
      { key: "loop", label: "Play like a GIF (muted, looping, autoplay)", type: "checkbox", default: true },
      captionField,
    ],
    render: (b) => {
      if (!b.src) return B.placeholder("Choose a video file");
      const mode = b.loop ? "autoplay muted loop playsinline" : "controls";
      return B.figure(`<video src="${esc(B.asset(b.src))}" ${mode} preload="metadata"></video>`, b.caption);
    },
  });
})();
