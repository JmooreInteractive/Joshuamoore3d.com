/*
 * Embed plugins — paste a link, get an embedded viewer.
 *
 * To add a new one, copy a block below and change:
 *   type      unique id (letters/dashes)
 *   label     name in the editor's "Add block" menu
 *   patterns  regexes that pull the ID out of a pasted link (first capture group)
 *   render    the embed URL built from that ID
 * It appears in the editor automatically.
 */
(() => {
  const B = window.Blocks;

  // Returns the first capture group of the first matching pattern, or "".
  const idFrom = (value, patterns) => {
    const v = String(value || "").trim();
    for (const re of patterns) {
      const m = v.match(re);
      if (m) return m[1];
    }
    return "";
  };

  const linkField = (label, placeholder, help) => ({ key: "url", label, type: "url", placeholder, help });
  const captionField = { key: "caption", label: "Caption", type: "text", placeholder: "Optional" };

  // ------------------------------------------------------------ YouTube
  B.register({
    type: "youtube",
    label: "YouTube video",
    group: "Embeds",
    icon: "YT",
    fields: [linkField("YouTube link", "https://www.youtube.com/watch?v=…"), captionField],
    parse: (b) =>
      idFrom(b.url, [/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/, /^([\w-]{11})$/]),
    render(b) {
      const id = this.parse(b);
      if (!id) return B.placeholder("Paste a YouTube link");
      return B.frame(`https://www.youtube-nocookie.com/embed/${id}?rel=0`, {
        title: b.caption || "YouTube video",
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
        caption: b.caption,
      });
    },
  });

  // ------------------------------------------------------------ Vimeo
  B.register({
    type: "vimeo",
    label: "Vimeo video",
    group: "Embeds",
    icon: "VM",
    fields: [linkField("Vimeo link", "https://vimeo.com/123456789"), captionField],
    parse: (b) => idFrom(b.url, [/vimeo\.com\/(?:.*\/)?(\d{6,}(?:\/[0-9a-f]+)?)/, /^(\d{6,})$/]),
    render(b) {
      const id = this.parse(b);
      if (!id) return B.placeholder("Paste a Vimeo link");
      const [video, hash] = id.split("/"); // unlisted videos carry a privacy hash
      return B.frame(`https://player.vimeo.com/video/${video}${hash ? `?h=${hash}` : ""}`, {
        title: b.caption || "Vimeo video",
        allow: "autoplay; fullscreen; picture-in-picture",
        caption: b.caption,
      });
    },
  });

  // ------------------------------------------------------------ blueprintUE
  B.register({
    type: "blueprintue",
    label: "Unreal Blueprint (blueprintUE)",
    group: "Embeds",
    icon: "BP",
    fields: [
      linkField(
        "blueprintUE link",
        "https://blueprintue.com/blueprint/xxxxxxxx/",
        "Paste your graph at blueprintue.com, then copy the page link here. Works for Blueprints and Materials."
      ),
      { key: "height", label: "Height (px)", type: "number", default: 520 },
      captionField,
    ],
    parse: (b) => idFrom(b.url, [/blueprintue\.com\/(?:blueprint|render)\/([\w-]+)/i, /^([\w-]{6,})$/]),
    render(b) {
      const id = this.parse(b);
      if (!id) return B.placeholder("Paste a blueprintUE link");
      return B.frame(`https://blueprintue.com/render/${id}/`, {
        title: b.caption || "Unreal Engine Blueprint graph",
        height: b.height || 520,
        caption: b.caption,
      });
    },
  });

  // ------------------------------------------------------------ Sketchfab
  B.register({
    type: "sketchfab",
    label: "3D model (Sketchfab)",
    group: "Embeds",
    icon: "3D",
    fields: [linkField("Sketchfab model link", "https://sketchfab.com/3d-models/name-0123456789abcdef…"), captionField],
    parse: (b) => idFrom(b.url, [/sketchfab\.com\/(?:3d-models\/(?:[^/?#]*-)?|models\/)([0-9a-f]{32})/i, /^([0-9a-f]{32})$/i]),
    render(b) {
      const id = this.parse(b);
      if (!id) return B.placeholder("Paste a Sketchfab model link");
      return B.frame(`https://sketchfab.com/models/${id}/embed?ui_theme=dark&dnt=1`, {
        title: b.caption || "3D model",
        allow: "autoplay; fullscreen; xr-spatial-tracking",
        caption: b.caption,
      });
    },
  });

  // ------------------------------------------------------------ Shadertoy
  B.register({
    type: "shadertoy",
    label: "Shader (Shadertoy)",
    group: "Embeds",
    icon: "ST",
    fields: [linkField("Shadertoy link", "https://www.shadertoy.com/view/XXXXXX"), captionField],
    parse: (b) => idFrom(b.url, [/shadertoy\.com\/(?:view|embed)\/(\w{6})/i, /^(\w{6})$/]),
    render(b) {
      const id = this.parse(b);
      if (!id) return B.placeholder("Paste a Shadertoy link");
      return B.frame(`https://www.shadertoy.com/embed/${id}?gui=true&paused=true&muted=true`, {
        title: b.caption || "Shadertoy shader",
        caption: b.caption,
      });
    },
  });

  // ------------------------------------------------------------ Anything else
  B.register({
    type: "embed",
    label: "Other embed (iframe)",
    group: "Embeds",
    icon: "</>",
    fields: [
      linkField("Embed link or <iframe> code", "https://… or <iframe src=…>", "Most sites have a Share → Embed option. Paste the iframe code or just its link."),
      { key: "size", label: "Shape", type: "select", options: ["16 / 9", "4 / 3", "1 / 1", "21 / 9", "Fixed height"], default: "16 / 9" },
      { key: "height", label: "Height (px, for fixed height)", type: "number", default: 500 },
      captionField,
    ],
    parse: (b) => idFrom(b.url, [/<iframe[^>]*\ssrc=["']?(https:\/\/[^"'\s>]+)/i, /^(https:\/\/\S+)$/i]),
    render(b) {
      const src = this.parse(b);
      if (!src) return B.placeholder("Paste an https:// embed link or iframe code");
      const fixed = b.size === "Fixed height";
      return B.frame(src.replace(/&amp;/g, "&"), {
        aspect: fixed ? null : b.size,
        height: fixed ? b.height : null,
        allow: "autoplay; fullscreen; clipboard-write; encrypted-media; picture-in-picture",
        caption: b.caption,
      });
    },
  });
})();
