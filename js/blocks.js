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

    // Reads any YouTube or Vimeo link — watch/share/Shorts/Studio/embed links, unlisted Vimeo links,
    // or pasted <iframe> code — and returns { provider, id, src, page } or null.
    // `bare` says how to read a bare ID: "youtube" (11 chars) or "vimeo" (digits).
    video(input, bare) {
      let v = String(input || "").trim();
      const iframe = v.match(/<iframe[^>]*\ssrc=["']?([^"'\s>]+)/i);
      if (iframe) v = iframe[1].replace(/&amp;/g, "&");

      const yt =
        v.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/|video\/)|youtu\.be\/)([\w-]{11})/i) ||
        (bare === "youtube" && v.match(/^([\w-]{11})$/));
      if (yt) {
        let start = 0;
        const t = v.match(/[?&#](?:t|start)=([\dhms]+)/i);
        if (t) for (const part of t[1].match(/\d+[hms]?/gi) || []) start += parseInt(part, 10) * ({ h: 3600, m: 60 }[part.slice(-1).toLowerCase()] || 1);
        return {
          provider: "youtube",
          id: yt[1],
          src: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0${start ? `&start=${start}` : ""}`,
          page: `https://www.youtube.com/watch?v=${yt[1]}`,
        };
      }

      let id = "";
      let hash = "";
      if (/vimeo\.com/i.test(v)) {
        try {
          const u = new URL(/^https?:/i.test(v) ? v : "https://" + v);
          const segs = u.pathname.split("/").filter(Boolean);
          const at = segs.map((s) => /^\d{6,}$/.test(s)).lastIndexOf(true);
          if (at >= 0) {
            id = segs[at];
            hash = u.searchParams.get("h") || (/^[0-9a-f]{6,}$/i.test(segs[at + 1] || "") ? segs[at + 1] : "");
          }
        } catch {}
      } else if (bare === "vimeo" && /^\d{6,}$/.test(v)) {
        id = v;
      }
      if (id) {
        return {
          provider: "vimeo",
          id,
          src: `https://player.vimeo.com/video/${id}${hash ? `?h=${hash}` : ""}`,
          page: `https://vimeo.com/${id}${hash ? "/" + hash : ""}`,
        };
      }
      return null;
    },

    videoFrame(info, caption) {
      return Blocks.frame(info.src, {
        title: caption || (info.provider === "vimeo" ? "Vimeo video" : "YouTube video"),
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture",
        caption,
      });
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
    render: (b) => {
      if (!b.src) return B.placeholder("Choose an image");
      const video = B.video(b.src); // a YouTube/Vimeo link pasted here still plays
      if (video) return B.videoFrame(video, b.caption);
      return B.figure(`<img src="${esc(B.asset(b.src))}" alt="${esc(b.alt)}" loading="lazy" decoding="async">`, b.caption);
    },
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
      { key: "src", label: "Video file", type: "file", accept: "video/mp4,video/webm", help: "Upload an MP4 — short clips work best (GitHub rejects files over 100 MB). A YouTube or Vimeo link also works here." },
      { key: "loop", label: "Play like a GIF (muted, looping, autoplay)", type: "checkbox", default: true },
      captionField,
    ],
    render: (b) => {
      if (!b.src) return B.placeholder("Choose a video file");
      const video = B.video(b.src);
      if (video) return B.videoFrame(video, b.caption);
      const mode = b.loop ? "autoplay muted loop playsinline" : "controls";
      return B.figure(`<video src="${esc(B.asset(b.src))}" ${mode} preload="metadata"></video>`, b.caption);
    },
  });
})();
