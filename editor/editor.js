/*
 * Site editor — edits js/content.js and adds media under assets/.
 *
 * How it saves: the browser's File System Access API (Chrome / Edge). You connect your website
 * folder once; the editor remembers it. Other browsers can still edit and download content.js.
 * Block types and embed plugins come from js/blocks.js and js/plugins.js — add a plugin there
 * and it shows up in the "Add block" menu automatically.
 */
(() => {
  "use strict";

  const B = window.Blocks;
  const FS_OK = typeof window.showDirectoryPicker === "function";
  const RESERVED_IDS = ["home", "portfolio", "about", "contact", "work", "tabs", "grid", "detail", "topbar", "custom-sections"];
  const CONTENT_FILE = "js/content.js";
  const CONTENT_HEADER =
    "// Website content. Edit it with the site editor (editor/index.html, or run edit-site.bat),\n" +
    "// or by hand — everything after `window.PORTFOLIO =` must stay valid JSON.\n";

  let data = null;          // working copy of window.PORTFOLIO
  let dir = null;           // connected website folder (FileSystemDirectoryHandle)
  let savedHandle = null;   // remembered folder that still needs permission
  let dirty = false;
  let view = { kind: "site" };
  const assetMap = {};      // files added this session: repo path -> blob: URL (for previews)
  const collapsed = new WeakSet();

  // ================================================================ helpers

  const $ = (sel) => document.querySelector(sel);

  // Tiny DOM builder: h("button", { class: "btn", onclick }, "Label")
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    const late = {};
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "style") el.style.cssText = v;
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
      else if (k === "value" || k === "checked" || k === "muted" || k === "multiple") late[k] = v;
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const c of kids.flat(Infinity)) if (c != null && c !== false) el.append(c.nodeType ? c : String(c));
    Object.assign(el, late);
    return el;
  }

  // Replace an element's children; accepts nested arrays and skips null/false.
  const fill = (el, ...kids) => el.replaceChildren(...kids.flat(Infinity).filter((k) => k != null && k !== false));

  const slug = (s) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const isRemote = (s) => /^https?:\/\//i.test(s || "");
  // Paths in content.js are relative to the site root; the editor lives one folder down.
  const srcFor = (p) => (!p ? "" : assetMap[p] || (/^(https?:|data:|blob:)/i.test(p) ? p : "../" + p));

  function toast(msg, kind = "info", ms = 4000) {
    const el = h("div", { class: `toast toast--${kind}` }, msg);
    $("#toasts").append(el);
    setTimeout(() => el.classList.add("is-out"), ms);
    setTimeout(() => el.remove(), ms + 400);
  }

  function move(arr, i, d) {
    const j = i + d;
    if (j < 0 || j >= arr.length) return false;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    changed({ nav: true });
    return true;
  }

  // ================================================================ content file

  function normalize(d) {
    d.site = d.site || {};
    const s = d.site;
    s.about = s.about || {};
    s.about.paragraphs = s.about.paragraphs || [];
    s.about.facts = s.about.facts || [];
    s.about.toolbox = s.about.toolbox || [];
    s.contact = s.contact || {};
    s.contact.links = s.contact.links || [];
    d.sections = d.sections || [];
    d.categories = d.categories || [];
    d.projects = d.projects || [];
    for (const p of d.projects) {
      for (const k of ["categories", "tags", "meta", "links", "body"]) p[k] = p[k] || [];
    }
    for (const sec of d.sections) sec.blocks = sec.blocks || [];
    return d;
  }

  function parseContent(text) {
    const at = text.indexOf("window.PORTFOLIO");
    const start = text.indexOf("{", at);
    const end = text.lastIndexOf("}");
    if (at < 0 || start < 0 || end < start) throw new Error("js/content.js doesn't contain `window.PORTFOLIO = {…}`");
    return normalize(JSON.parse(text.slice(start, end + 1)));
  }

  // Keys starting with "_" are editor-only state and never saved.
  const serialize = (d) =>
    CONTENT_HEADER + "window.PORTFOLIO = " + JSON.stringify(d, (k, v) => (k.startsWith("_") ? undefined : v), 2) + ";\n";

  function validate() {
    const out = [];
    const seen = (label, list, extra) => {
      const ids = new Set();
      for (const item of list) {
        const name = item.title || "untitled";
        if (!item.id) out.push(`${label} “${name}” needs an id.`);
        else if (ids.has(item.id)) out.push(`Two ${label.toLowerCase()}s use the id “${item.id}”.`);
        else if (extra) extra(item);
        ids.add(item.id);
      }
    };
    seen("Project", data.projects);
    seen("Category", data.categories);
    seen("Section", data.sections, (s) => RESERVED_IDS.includes(s.id) && out.push(`Section id “${s.id}” is used by the site — pick another.`));
    return out;
  }

  // ================================================================ folder access

  const idb = (mode, fn) =>
    new Promise((resolve, reject) => {
      const open = indexedDB.open("site-editor", 1);
      open.onupgradeneeded = () => open.result.createObjectStore("kv");
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const tx = open.result.transaction("kv", mode);
        const req = fn(tx.objectStore("kv"));
        tx.oncomplete = () => resolve(req && req.result);
        tx.onerror = () => reject(tx.error);
      };
    });
  const remember = (handle) => idb("readwrite", (s) => s.put(handle, "dir")).catch(() => {});
  const recall = () => idb("readonly", (s) => s.get("dir")).catch(() => null);

  async function subdir(parts, create) {
    let d = dir;
    for (const part of parts) d = await d.getDirectoryHandle(part, { create });
    return d;
  }
  function splitPath(path) {
    const parts = path.split("/").filter(Boolean);
    return [parts, parts.pop()];
  }
  async function readText(path) {
    const [parts, name] = splitPath(path);
    const fh = await (await subdir(parts, false)).getFileHandle(name);
    return (await fh.getFile()).text();
  }
  async function writeFile(path, contents) {
    const [parts, name] = splitPath(path);
    const fh = await (await subdir(parts, true)).getFileHandle(name, { create: true });
    const w = await fh.createWritable();
    await w.write(contents);
    await w.close();
  }
  async function exists(path) {
    try {
      const [parts, name] = splitPath(path);
      await (await subdir(parts, false)).getFileHandle(name);
      return true;
    } catch {
      return false;
    }
  }

  const EXT = {
    "image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif", "image/webp": ".webp", "image/avif": ".avif",
    "image/svg+xml": ".svg", "video/mp4": ".mp4", "video/webm": ".webm", "application/pdf": ".pdf",
  };

  function cleanName(name, type) {
    const m = String(name).match(/^(.*?)(\.[a-z0-9]{2,5})?$/i);
    return (slug(m[1]) || "file") + ((m[2] || EXT[type] || "").toLowerCase());
  }

  // Writes a file into assets/<folder>/ (never overwrites) and returns its site-relative path.
  async function storeFile(blob, name, folder) {
    const file = cleanName(name, blob.type);
    const dot = file.lastIndexOf(".");
    const base = dot > 0 ? file.slice(0, dot) : file;
    const ext = dot > 0 ? file.slice(dot) : "";
    let path = `assets/${folder}/${file}`;
    for (let n = 2; await exists(path); n++) path = `assets/${folder}/${base}-${n}${ext}`;
    await writeFile(path, blob);
    assetMap[path] = URL.createObjectURL(blob);
    return path;
  }

  async function importRemote(url, folder) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const name = decodeURIComponent(new URL(url).pathname.split("/").filter(Boolean).pop() || "file");
    return storeFile(blob, name, folder);
  }

  function needFolder() {
    if (dir) return true;
    toast(
      FS_OK ? "Connect your website folder first (top left) so files can be saved into it." : "Uploading files needs Chrome or Edge.",
      "warn",
      5000
    );
    return false;
  }

  async function chooseFolder() {
    if (!FS_OK) return toast("Saving straight to your folder needs Chrome or Edge.", "warn", 6000);
    let handle;
    try {
      handle = await window.showDirectoryPicker({ id: "website", mode: "readwrite" });
    } catch {
      return; // picker cancelled
    }
    try {
      await (await handle.getDirectoryHandle("js")).getFileHandle("content.js");
    } catch {
      return toast("That folder doesn't have js/content.js in it — pick the folder that contains index.html.", "error", 7000);
    }
    await useFolder(handle);
  }

  async function useFolder(handle) {
    dir = handle;
    savedHandle = handle;
    await remember(handle);
    if (!dirty) {
      try {
        data = parseContent(await readText(CONTENT_FILE));
        view = { kind: "site" };
      } catch (e) {
        toast("Couldn't read js/content.js: " + e.message, "error", 7000);
      }
    }
    renderAll();
    pendingHash = true;
    sendPreview();
    toast(`Connected to “${handle.name}”. Changes will save there.`, "ok");
  }

  async function reconnect() {
    try {
      if ((await savedHandle.requestPermission({ mode: "readwrite" })) === "granted") await useFolder(savedHandle);
    } catch {
      chooseFolder();
    }
  }

  // ================================================================ saving

  async function save() {
    if (!data) return;
    const problems = validate();
    if (problems.length) return alert("Can't save yet:\n\n• " + problems.join("\n• "));
    const text = serialize(data);
    if (!dir) return download(text);
    try {
      await writeFile(CONTENT_FILE, text);
      dirty = false;
      renderSaveState();
      toast("Saved! Commit & push your website folder to publish it.", "ok", 5000);
    } catch (e) {
      console.error(e);
      toast("Couldn't save: " + e.message, "error", 7000);
    }
  }

  function download(text) {
    const a = h("a", { href: URL.createObjectURL(new Blob([text], { type: "text/javascript" })), download: "content.js" });
    a.click();
    dirty = false;
    renderSaveState();
    toast("Downloaded content.js — put it in your website's js/ folder, replacing the old one.", "info", 8000);
  }

  function changed(opts) {
    dirty = true;
    renderSaveState();
    if (opts && opts.nav) renderNav();
    schedulePreview();
  }

  function renderSaveState() {
    const btn = $("#save");
    btn.disabled = !dirty;
    btn.textContent = !dirty ? "All changes saved" : dir ? "Save changes" : "Download changes";
    btn.title = dirty ? "Ctrl+S" : "";
    document.title = (dirty ? "● " : "") + "Site Editor";
  }

  // ================================================================ live preview

  const frame = $("#preview-frame");
  let previewReady = false;
  let previewTimer = 0;
  let pendingHash = true;

  function hashFor(v) {
    if (v.kind === "project") return "#work/" + v.ref.id;
    if (v.kind === "section") return "#" + v.ref.id;
    if (v.kind === "categories") return "#portfolio";
    return "#home";
  }

  function sendPreview() {
    if (!previewReady || !data || !frame.contentWindow) return;
    frame.contentWindow.postMessage(
      { type: "portfolio:update", data, assets: assetMap, hash: pendingHash ? hashFor(view) : "" },
      location.origin
    );
    pendingHash = false;
  }
  function schedulePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(sendPreview, 150);
  }

  window.addEventListener("message", (e) => {
    if (e.origin !== location.origin || e.source !== frame.contentWindow) return;
    if (e.data && e.data.type === "portfolio:ready") {
      previewReady = true;
      pendingHash = true;
      sendPreview();
    }
  });

  // ================================================================ form controls

  const SIMPLE = ["INPUT", "TEXTAREA", "SELECT"];
  function field(label, control, help, extra) {
    const wrap = h(SIMPLE.includes(control.tagName) ? "label" : "div", { class: "field" });
    wrap.append(h("span", { class: "field__label" }, label), control);
    if (help) wrap.append(h("small", { class: "field__help" }, help));
    if (extra) wrap.append(extra);
    return wrap;
  }

  const row = (n, ...kids) => h("div", { class: `row row--${n}` }, ...kids);

  function card(title, desc, ...kids) {
    return h("section", { class: "card" }, h("h2", { class: "card__title" }, title), desc ? h("p", { class: "card__desc" }, desc) : h("div", { style: "height:14px" }), ...kids);
  }

  function input(obj, key, opts = {}) {
    const el = h("input", {
      type: opts.type || "text",
      placeholder: opts.placeholder || "",
      value: obj[key] == null ? "" : String(obj[key]),
      class: opts.small ? "input--small" : null,
    });
    el.addEventListener("input", () => {
      const prev = obj[key];
      let v = el.value;
      if (opts.slugify) {
        const s = v.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
        if (s !== v) el.value = v = s;
      }
      obj[key] = opts.type === "number" ? (v === "" ? "" : Number(v)) : v;
      if (opts.onInput) opts.onInput(prev);
      changed({ nav: !!opts.nav });
    });
    return el;
  }

  function textarea(obj, key, opts = {}) {
    const el = h("textarea", { rows: opts.rows || 3, placeholder: opts.placeholder || "", class: opts.mono ? "is-mono" : null, value: obj[key] || "", spellcheck: opts.mono ? "false" : null });
    el.addEventListener("input", () => {
      obj[key] = el.value;
      if (opts.onInput) opts.onInput();
      changed();
    });
    if (opts.mono) {
      el.addEventListener("keydown", (e) => {
        if (e.key !== "Tab" || e.shiftKey) return;
        e.preventDefault();
        el.setRangeText("\t", el.selectionStart, el.selectionEnd, "end");
        el.dispatchEvent(new Event("input"));
      });
    }
    return el;
  }

  // Array <-> text helpers (one item per line / comma separated / blank-line paragraphs)
  function arrayText(obj, key, { join, split, rows, placeholder, onInput, asInput }) {
    const value = (obj[key] || []).join(join);
    const el = asInput ? h("input", { type: "text", value, placeholder }) : h("textarea", { rows: rows || 4, value, placeholder });
    el.addEventListener("input", () => {
      obj[key] = split(el.value);
      if (onInput) onInput();
      changed();
    });
    return el;
  }
  const linesInput = (obj, key, o = {}) => arrayText(obj, key, { ...o, join: "\n", split: (v) => v.split("\n") });
  const tagsInput = (obj, key, o = {}) =>
    arrayText(obj, key, { ...o, asInput: true, join: ", ", split: (v) => v.split(",").map((s) => s.trim()).filter(Boolean) });
  const paragraphsInput = (obj, key, o = {}) =>
    arrayText(obj, key, { ...o, join: "\n\n", split: (v) => v.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean) });

  function checkbox(obj, key, label, onInput) {
    return h(
      "label",
      { class: "check" },
      h("input", {
        type: "checkbox",
        checked: !!obj[key],
        onchange: (e) => {
          obj[key] = e.target.checked;
          if (onInput) onInput();
          changed({ nav: true });
        },
      }),
      h("span", {}, label)
    );
  }

  function select(obj, key, options, onInput) {
    if (obj[key] == null || obj[key] === "") obj[key] = options[0];
    return h(
      "select",
      {
        value: String(obj[key]),
        onchange: (e) => {
          obj[key] = e.target.value;
          if (onInput) onInput();
          changed();
        },
      },
      options.map((o) => h("option", { value: o }, o))
    );
  }

  const tool = (label, title, disabled, onclick, danger) =>
    h("button", { type: "button", class: "tool" + (danger ? " tool--danger" : ""), title, "aria-label": title, disabled, onclick }, label);

  function pickFiles(accept, multiple, handler) {
    if (!needFolder()) return;
    const inp = h("input", { type: "file", accept: accept || "", multiple });
    inp.addEventListener("change", async () => {
      if (!inp.files.length) return;
      try {
        await handler([...inp.files]);
      } catch (e) {
        console.error(e);
        toast("Couldn't save that file: " + e.message, "error", 6000);
      }
    });
    inp.click();
  }

  // Single image / file: thumbnail + path/URL box + Upload / Copy into repo. Accepts drag & drop.
  function media(obj, key, opts) {
    const isImage = opts.kind === "image";
    const thumb = h("div", { class: "media-field__thumb" });
    const text = h("input", { type: "text", value: obj[key] || "", placeholder: isImage ? "Upload, drop, or paste an image link" : "Upload, drop, or paste a link" });
    const copyBtn = h("button", { type: "button", class: "btn btn--small", title: "Download this file into your website folder so it doesn't depend on another site" }, "Copy into repo");
    const clearBtn = h("button", { type: "button", class: "btn btn--small" }, "Clear");
    const accept = opts.accept || (isImage ? "image/*" : "");

    function set(v) {
      obj[key] = v;
      text.value = v;
      refresh();
      if (opts.onInput) opts.onInput();
      changed({ nav: true });
    }
    function refresh() {
      const v = obj[key];
      copyBtn.hidden = !isRemote(v);
      clearBtn.hidden = !v;
      fill(thumb);
      if (!v) thumb.append(h("span", {}, isImage ? "No image" : "No file"));
      else if (isImage) thumb.append(h("img", { src: srcFor(v), alt: "" }));
      else if (/\.(mp4|webm)$/i.test(v)) thumb.append(h("video", { src: srcFor(v), muted: true, loop: true, autoplay: true, playsinline: true }));
      else thumb.append(h("span", {}, (/\.pdf$/i.test(v) ? "PDF · " : "") + v.split("/").pop()));
    }
    const upload = (files) => storeFile(files[0], files[0].name, opts.folder()).then(set);

    text.addEventListener("input", () => {
      obj[key] = text.value.trim();
      refresh();
      if (opts.onInput) opts.onInput();
      changed({ nav: true });
    });
    copyBtn.addEventListener("click", async () => {
      if (!needFolder()) return;
      copyBtn.disabled = true;
      copyBtn.textContent = "Copying…";
      try {
        set(await importRemote(obj[key], opts.folder()));
        toast("Copied into your website folder.", "ok");
      } catch (e) {
        toast("That site won't let the file be downloaded (" + e.message + "). Save it manually, then use Upload.", "error", 7000);
      }
      copyBtn.disabled = false;
      copyBtn.textContent = "Copy into repo";
    });
    clearBtn.addEventListener("click", () => set(""));

    const wrap = h(
      "div",
      { class: "media-field" },
      thumb,
      h(
        "div",
        { class: "media-field__side" },
        text,
        h("div", { class: "media-field__buttons" }, h("button", { type: "button", class: "btn btn--small", onclick: () => pickFiles(accept, false, upload) }, "Upload…"), copyBtn, clearBtn)
      )
    );
    wrap.addEventListener("dragover", (e) => {
      e.preventDefault();
      wrap.classList.add("is-drop");
    });
    wrap.addEventListener("dragleave", () => wrap.classList.remove("is-drop"));
    wrap.addEventListener("drop", (e) => {
      e.preventDefault();
      wrap.classList.remove("is-drop");
      const files = [...e.dataTransfer.files];
      if (files.length && needFolder()) upload(files).catch((err) => toast("Couldn't save that file: " + err.message, "error"));
    });
    refresh();
    return wrap;
  }

  // Several images (gallery)
  function imagesInput(obj, key, opts) {
    const list = (obj[key] = obj[key] || []);
    const root = h("div", { class: "images-field" });
    const urlBox = h("input", { type: "text", placeholder: "…or paste an image link" });
    const done = () => {
      render();
      if (opts.onInput) opts.onInput();
      changed();
    };
    function render() {
      fill(root, 
        list.length
          ? h(
              "div",
              { class: "images-field__grid" },
              list.map((src, i) =>
                h(
                  "div",
                  { class: "images-field__item", title: src },
                  h("img", { src: srcFor(src), alt: "" }),
                  h(
                    "div",
                    { class: "images-field__tools" },
                    tool("←", "Move left", i === 0, () => move(list, i, -1) && done()),
                    tool("→", "Move right", i === list.length - 1, () => move(list, i, 1) && done()),
                    tool("✕", "Remove", false, () => (list.splice(i, 1), done()), true)
                  )
                )
              )
            )
          : null,
        h(
          "div",
          { class: "images-field__add" },
          h(
            "button",
            {
              type: "button",
              class: "btn btn--small",
              onclick: () =>
                pickFiles("image/*", true, async (files) => {
                  for (const f of files) list.push(await storeFile(f, f.name, opts.folder()));
                  done();
                }),
            },
            "Upload images…"
          ),
          urlBox,
          h(
            "button",
            {
              type: "button",
              class: "btn btn--small",
              onclick: () => {
                const v = urlBox.value.trim();
                if (!v) return;
                list.push(v);
                urlBox.value = "";
                done();
              },
            },
            "Add link"
          )
        )
      );
    }
    render();
    return root;
  }

  // Repeating rows of inputs (facts, links, toolbox groups, categories…)
  function pairs(arr, cols, addLabel, makeNew, opts = {}) {
    const root = h("div", { class: "pairs", style: `--cols:${cols.map((c) => c.width || "minmax(0,1fr)").join(" ")}` });
    function render() {
      fill(root, 
        opts.headers && arr.length ? h("div", { class: "pairs__head" }, cols.map((c) => h("span", {}, c.header || "")), h("span")) : null,
        arr.map((item, i) =>
          h(
            "div",
            { class: "pairs__row" },
            cols.map((c) => {
              const ctrl =
                c.kind === "tags"
                  ? tagsInput(item, c.key, { placeholder: c.placeholder })
                  : input(item, c.key, { placeholder: c.placeholder, slugify: c.slugify, onInput: c.onInput && ((prev) => c.onInput(item, prev)) });
              if (!c.upload) return ctrl;
              return h(
                "div",
                { class: "pairs__cell" },
                ctrl,
                h(
                  "button",
                  {
                    type: "button",
                    class: "btn btn--small",
                    title: "Upload a file (e.g. a PDF) into your website folder and link to it",
                    onclick: () =>
                      pickFiles(c.upload.accept, false, async ([f]) => {
                        item[c.key] = await storeFile(f, f.name, c.upload.folder);
                        render();
                        changed();
                      }),
                  },
                  "Upload…"
                )
              );
            }),
            h(
              "div",
              { class: "pairs__tools" },
              tool("↑", "Move up", i === 0, () => move(arr, i, -1) && render()),
              tool("↓", "Move down", i === arr.length - 1, () => move(arr, i, 1) && render()),
              tool(
                "✕",
                "Remove",
                false,
                () => {
                  if (opts.confirmRemove && !confirm(opts.confirmRemove(item))) return;
                  arr.splice(i, 1);
                  if (opts.onRemove) opts.onRemove(item);
                  render();
                  changed({ nav: true });
                },
                true
              )
            )
          )
        ),
        h(
          "button",
          {
            type: "button",
            class: "btn btn--small",
            onclick: () => {
              arr.push(makeNew ? makeNew() : Object.fromEntries(cols.map((c) => [c.key, c.kind === "tags" ? [] : ""])));
              render();
              changed({ nav: true });
              const rows = root.querySelectorAll(".pairs__row");
              const first = rows[rows.length - 1] && rows[rows.length - 1].querySelector("input");
              if (first) first.focus();
            },
          },
          "+ " + addLabel
        )
      );
    }
    render();
    return root;
  }

  // ================================================================ block editor

  let picker = null;
  function closePicker() {
    if (picker) picker.remove();
    picker = null;
    document.removeEventListener("pointerdown", onOutside, true);
  }
  function onOutside(e) {
    if (picker && !picker.contains(e.target)) closePicker();
  }
  function openPicker(anchor, onPick) {
    closePicker();
    const groups = {};
    for (const type of B.order) (groups[B.types[type].group] = groups[B.types[type].group] || []).push(B.types[type]);
    picker = h(
      "div",
      { class: "picker", role: "menu" },
      Object.entries(groups).map(([name, defs]) =>
        h(
          "div",
          { class: "picker__group" },
          h("p", { class: "picker__title" }, name),
          defs.map((d) =>
            h(
              "button",
              {
                type: "button",
                class: "picker__item",
                role: "menuitem",
                onclick: () => {
                  closePicker();
                  onPick(d.type);
                },
              },
              h("span", { class: "picker__icon" }, d.icon),
              d.label
            )
          )
        )
      )
    );
    document.body.append(picker);
    const r = anchor.getBoundingClientRect();
    const pw = picker.offsetWidth;
    const ph = picker.offsetHeight;
    const left = Math.max(12, Math.min(r.left + r.width / 2 - pw / 2, innerWidth - pw - 12));
    let top = r.bottom + 6;
    if (top + ph > innerHeight - 12) top = Math.max(12, r.top - ph - 6);
    picker.style.left = left + "px";
    picker.style.top = top + "px";
    picker.querySelector("button").focus();
    document.addEventListener("pointerdown", onOutside, true);
  }

  function summarize(b, def) {
    if (!def) return "";
    for (const f of def.fields) {
      const v = b[f.key];
      if (f.type === "images") {
        if (v && v.length) return `${v.length} image${v.length > 1 ? "s" : ""}`;
      } else if (f.type === "lines") {
        const items = (v || []).filter((x) => String(x).trim());
        if (items.length) return items.join(" · ");
      } else if (typeof v === "string" && v.trim() && f.type !== "select") {
        return f.type === "image" || f.type === "file" ? v.split("/").pop() : v.replace(/\s+/g, " ");
      }
    }
    return "";
  }

  function blocksEditor(blocks, folder) {
    const root = h("div", { class: "blocks" });
    let justAdded = null;

    const rerender = () => fill(root, ...build());
    const insertAt = (i, type) => {
      const b = B.create(type);
      blocks.splice(i, 0, b);
      justAdded = b;
      rerender();
      changed();
    };
    const inserter = (i) =>
      h("div", { class: "inserter" }, h("button", { type: "button", title: "Insert a block here", onclick: (e) => openPicker(e.currentTarget, (t) => insertAt(i, t)) }, "+"));

    function build() {
      const out = [];
      blocks.forEach((b, i) => {
        if (i > 0) out.push(inserter(i));
        out.push(blockCard(b, i));
      });
      out.push(h("button", { type: "button", class: "add-block", onclick: (e) => openPicker(e.currentTarget, (t) => insertAt(blocks.length, t)) }, "+ Add block"));
      return out;
    }

    function blockCard(b, i) {
      const def = B.types[b.type];
      const isCollapsed = collapsed.has(b);
      const summary = h("span", { class: "block__summary" }, summarize(b, def));
      const head = h(
        "div",
        {
          class: "block__head",
          title: isCollapsed ? "Click to expand" : "Click to collapse",
          onclick: (e) => {
            if (e.target.closest("button")) return;
            if (collapsed.has(b)) collapsed.delete(b);
            else collapsed.add(b);
            rerender();
          },
        },
        h("span", { class: "block__icon" }, def ? def.icon : "?"),
        h("span", { class: "block__label" }, def ? def.label : `Unknown block “${b.type}”`),
        summary,
        h(
          "span",
          { class: "block__tools" },
          tool("↑", "Move up", i === 0, () => move(blocks, i, -1) && rerender()),
          tool("↓", "Move down", i === blocks.length - 1, () => move(blocks, i, 1) && rerender()),
          tool("⧉", "Duplicate", false, () => {
            blocks.splice(i + 1, 0, clone(b));
            rerender();
            changed();
          }),
          tool(
            "✕",
            "Delete block",
            false,
            () => {
              if (summarize(b, def) && !confirm("Delete this block?")) return;
              blocks.splice(i, 1);
              rerender();
              changed();
            },
            true
          )
        )
      );
      const cardEl = h("div", { class: "block" + (isCollapsed ? " is-collapsed" : "") + (b === justAdded ? " is-new" : "") }, head);
      if (def && !isCollapsed) {
        const onAny = () => (summary.textContent = summarize(b, def));
        cardEl.append(h("div", { class: "block__body" }, def.fields.map((f) => blockField(b, f, def, folder, onAny))));
      }
      if (b === justAdded) {
        justAdded = null;
        requestAnimationFrame(() => {
          cardEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
          const first = cardEl.querySelector(".block__body input, .block__body textarea, .block__body select");
          if (first) first.focus({ preventScroll: true });
          setTimeout(() => cardEl.classList.remove("is-new"), 1200);
        });
      }
      return cardEl;
    }

    rerender();
    return root;
  }

  function blockField(b, f, def, folder, onAny) {
    const warn = h("small", { class: "field__warn" });
    const check = () => {
      if (def.parse && f.key === "url") warn.textContent = b.url && !def.parse(b) ? "Couldn't recognize this link — make sure you copied the full address." : "";
    };
    const onInput = () => {
      onAny();
      check();
    };
    const videoFolder = () => folder().replace(/^img\//, "video/");
    let control;
    switch (f.type) {
      case "textarea":
        control = textarea(b, f.key, { rows: f.rows, placeholder: f.placeholder, onInput });
        break;
      case "code":
        control = textarea(b, f.key, { rows: f.rows || 8, mono: true, onInput });
        break;
      case "lines":
        control = linesInput(b, f.key, { rows: f.rows, onInput });
        break;
      case "number":
        control = input(b, f.key, { type: "number", onInput });
        break;
      case "checkbox":
        return h("div", { class: "field" }, checkbox(b, f.key, f.label, onInput), f.help ? h("small", { class: "field__help" }, f.help) : null);
      case "select":
        control = select(b, f.key, f.options, onInput);
        break;
      case "image":
        control = media(b, f.key, { kind: "image", folder, onInput });
        break;
      case "file":
        control = media(b, f.key, { kind: "file", accept: f.accept, folder: /^video/.test(f.accept || "") ? videoFolder : () => "files", onInput });
        break;
      case "images":
        control = imagesInput(b, f.key, { folder, onInput });
        break;
      default:
        control = input(b, f.key, { type: f.type === "url" ? "url" : "text", placeholder: f.placeholder, onInput });
    }
    check();
    return field(f.label, control, f.help, warn);
  }

  // ================================================================ views

  function viewHead(kicker, title, ...actions) {
    const titleEl = h("h1", { class: "view__title" }, title);
    return { titleEl, el: h("header", { class: "view__head" }, h("div", {}, h("p", { class: "view__kicker" }, kicker), titleEl), h("div", { class: "view__actions" }, actions)) };
  }

  const uniqueId = (list, base, self) => {
    const root = base || "item";
    let id = root;
    for (let n = 2; list.some((x) => x !== self && x.id === id); n++) id = `${root}-${n}`;
    return id;
  };

  // ---------- site: hero, logo, about, contact

  function siteView() {
    const s = data.site;
    const a = s.about;
    const c = s.contact;
    return [
      viewHead("Website", "Home, About & Contact").el,
      card(
        "Hero",
        "The first screen visitors see.",
        row(2, field("Small label above your name", input(s, "eyebrow", { placeholder: "Portfolio · 2026" })), field("Name", input(s, "name"))),
        row(2, field("Role", input(s, "role", { placeholder: "Technical Artist" })), field("Tagline", textarea(s, "tagline", { rows: 2 }), "Line breaks are kept."))
      ),
      card(
        "Logo & resume",
        null,
        row(
          2,
          field("Logo", media(s, "logo", { kind: "image", folder: () => "img/site" })),
          field("Resume", media(s, "resumeUrl", { kind: "file", accept: "application/pdf", folder: () => "files" }), "Upload a PDF, or paste a link (e.g. Google Drive).")
        )
      ),
      card(
        "About me",
        null,
        field("Intro (large text)", textarea(a, "lead", { rows: 3 })),
        field("More paragraphs", paragraphsInput(a, "paragraphs", { rows: 5 }), "Leave a blank line between paragraphs. **bold**, *italic* and [links](https://…) work."),
        field("Quick facts", pairs(a.facts, [{ key: "label", placeholder: "Label (e.g. Studying)", width: "minmax(0,.6fr)" }, { key: "value", placeholder: "Value" }], "Add fact")),
        field(
          "Toolbox",
          pairs(a.toolbox, [{ key: "title", placeholder: "Group (e.g. Engines)", width: "minmax(0,.6fr)" }, { key: "items", kind: "tags", placeholder: "Items, comma separated" }], "Add group", () => ({ title: "", items: [] }))
        )
      ),
      card(
        "Contact",
        null,
        field("Pitch", textarea(c, "pitch", { rows: 2 })),
        row(2, field("Email", input(c, "email", { type: "email" })), field("Discord username", input(c, "discord"), "Shown as a copy-to-clipboard button.")),
        field("Links", pairs(c.links, [{ key: "label", placeholder: "Label (e.g. LinkedIn)", width: "minmax(0,.6fr)" }, { key: "url", placeholder: "https://…" }], "Add link"))
      ),
      card(
        "Move images off Wix",
        null,
        h("p", { class: "muted" }, "Some images still load from your old Wix site. This downloads every remote image (and linked PDF) into your website folder and points the site at the local copies, so nothing breaks if Wix goes away."),
        h("button", { type: "button", class: "btn", onclick: importAllRemote }, "Copy all remote images into my repo")
      ),
    ];
  }

  // ---------- categories

  function renameCategory(prev, next) {
    for (const p of data.projects) p.categories = p.categories.map((c) => (c === prev ? next : c));
  }

  function categoriesView() {
    return [
      viewHead("Portfolio", "Categories").el,
      card(
        "Tabs",
        "The tabs above your project grid. The first one is open when the page loads. Each project picks its categories on its own page.",
        pairs(
          data.categories,
          [
            { key: "icon", header: "Icon", placeholder: "★", width: "64px" },
            { key: "title", header: "Title", placeholder: "Title", width: "minmax(0,.8fr)" },
            { key: "detail", header: "Description", placeholder: "Short description" },
            { key: "id", header: "id", placeholder: "id", slugify: true, width: "minmax(0,.5fr)", onInput: (item, prev) => renameCategory(prev, item.id) },
          ],
          "Add category",
          () => ({ id: uniqueId(data.categories, "new-category"), title: "New category", detail: "", icon: "•" }),
          {
            headers: true,
            confirmRemove: (item) => `Remove the “${item.title}” tab? Projects stay — they just leave this tab.`,
            onRemove: (item) => {
              for (const p of data.projects) p.categories = p.categories.filter((c) => c !== item.id);
            },
          }
        )
      ),
    ];
  }

  // ---------- custom home sections

  function addSection() {
    const sec = { id: uniqueId(data.sections, "new-section"), eyebrow: "", title: "New section", nav: true, blocks: [B.create("text")], _new: true };
    data.sections.push(sec);
    changed();
    go({ kind: "section", ref: sec });
  }

  function sectionView(sec) {
    const folder = () => `img/sections/${sec.id || "section"}`;
    let idInput;
    const head = viewHead(
      "Home page section",
      sec.title || "Untitled section",
      h("button", { type: "button", class: "btn", onclick: () => ((pendingHash = true), sendPreview()) }, "Show in preview"),
      h(
        "button",
        {
          type: "button",
          class: "btn btn--danger",
          onclick: () => {
            if (!confirm(`Delete the “${sec.title}” section?`)) return;
            data.sections.splice(data.sections.indexOf(sec), 1);
            changed();
            go({ kind: "site" });
          },
        },
        "Delete"
      )
    );
    return [
      head.el,
      card(
        "Section",
        "Extra sections appear on the home page between About and Contact — e.g. Experience, Awards, Talks.",
        row(
          2,
          field(
            "Title",
            input(sec, "title", {
              nav: true,
              onInput: () => {
                head.titleEl.textContent = sec.title || "Untitled section";
                if (sec._new) {
                  sec.id = uniqueId(data.sections, slug(sec.title) || "section", sec);
                  idInput.value = sec.id;
                  pendingHash = true;
                }
              },
            })
          ),
          field("Small label above the title", input(sec, "eyebrow", { placeholder: "Optional" }))
        ),
        row(
          2,
          field(
            "Link id",
            (idInput = input(sec, "id", {
              slugify: true,
              onInput: () => {
                delete sec._new;
                pendingHash = true;
              },
            })),
            "Used in links like yoursite.com/#experience"
          ),
          h("div", { class: "field" }, h("span", { class: "field__label" }, "Navigation"), checkbox(sec, "nav", "Show in the top bar"))
        )
      ),
      card("Content", "Hover between blocks to insert one. Click a block's title bar to collapse it.", blocksEditor(sec.blocks, folder)),
    ];
  }

  // ---------- projects

  function newProject() {
    const p = {
      id: uniqueId(data.projects, "new-project"),
      title: "New project",
      term: "",
      status: "",
      award: "",
      categories: data.categories.length ? [data.categories[0].id] : [],
      summary: "",
      tags: [],
      thumb: "",
      preview: "",
      meta: ["Role", "Team", "Duration", "Tools"].map((label) => ({ label, value: "" })),
      links: [],
      body: [{ type: "heading", text: "Overview" }, B.create("text")],
      _new: true,
    };
    data.projects.unshift(p);
    changed();
    go({ kind: "project", ref: p });
  }

  function projectView(p) {
    const folder = () => `img/${p.id || "project"}`;
    let idInput;
    const linkHelp = h("small", { class: "field__help" }, `Page link: yoursite.com/#work/${p.id}`);
    const head = viewHead(
      "Project",
      p.title || "Untitled project",
      h("button", { type: "button", class: "btn", onclick: () => ((pendingHash = true), sendPreview()) }, "Show in preview"),
      h(
        "button",
        {
          type: "button",
          class: "btn",
          onclick: () => {
            const copy = clone(p);
            copy.id = uniqueId(data.projects, p.id + "-copy");
            copy.title = p.title + " (copy)";
            data.projects.splice(data.projects.indexOf(p) + 1, 0, copy);
            changed();
            go({ kind: "project", ref: copy });
          },
        },
        "Duplicate"
      ),
      h(
        "button",
        {
          type: "button",
          class: "btn btn--danger",
          onclick: () => {
            if (!confirm(`Delete “${p.title}”?`)) return;
            const i = data.projects.indexOf(p);
            data.projects.splice(i, 1);
            changed();
            const next = data.projects[Math.min(i, data.projects.length - 1)];
            go(next ? { kind: "project", ref: next } : { kind: "site" });
          },
        },
        "Delete"
      )
    );

    const catChecks = h(
      "div",
      { class: "checks" },
      data.categories.map((c) =>
        h(
          "label",
          { class: "check" },
          h("input", {
            type: "checkbox",
            checked: p.categories.includes(c.id),
            onchange: (e) => {
              p.categories = e.target.checked ? [...p.categories, c.id] : p.categories.filter((x) => x !== c.id);
              changed();
            },
          }),
          h("span", {}, c.title)
        )
      )
    );

    return [
      head.el,
      card(
        "Tile & basics",
        "What shows on the portfolio grid and at the top of the project page.",
        row(
          2,
          field(
            "Title",
            input(p, "title", {
              nav: true,
              onInput: () => {
                head.titleEl.textContent = p.title || "Untitled project";
                if (p._new) {
                  p.id = uniqueId(data.projects, slug(p.title) || "project", p);
                  idInput.value = p.id;
                  linkHelp.textContent = `Page link: yoursite.com/#work/${p.id}`;
                  pendingHash = true;
                }
              },
            })
          ),
          field(
            "Link id",
            (idInput = input(p, "id", {
              slugify: true,
              onInput: () => {
                delete p._new;
                linkHelp.textContent = `Page link: yoursite.com/#work/${p.id}`;
                pendingHash = true;
              },
            })),
            null,
            linkHelp
          )
        ),
        row(
          3,
          field("Term", input(p, "term", { placeholder: "Winter 2026" })),
          field("Status badge", input(p, "status", { placeholder: "Work in progress" })),
          field("Award", input(p, "award", { placeholder: "Best in Show · …" }))
        ),
        field("Summary", textarea(p, "summary", { rows: 2 }), "One or two sentences — shown on the tile and under the title."),
        field("Tags", tagsInput(p, "tags", { placeholder: "Unreal 5, Niagara, HLSL" }), "Comma separated."),
        field("Categories", catChecks, p.categories.length ? null : "Pick at least one so the project shows up in the grid."),
        row(
          2,
          field("Thumbnail (16:9)", media(p, "thumb", { kind: "image", folder })),
          field("Hover preview (GIF, optional)", media(p, "preview", { kind: "image", folder }), "Plays when someone hovers the tile.")
        )
      ),
      card(
        "Info strip",
        "The Role / Team / Duration / Tools row under the title. Empty rows are hidden.",
        pairs(p.meta, [{ key: "label", placeholder: "Label (e.g. Role)", width: "minmax(0,.5fr)" }, { key: "value", placeholder: "Value" }], "Add item")
      ),
      card(
        "Buttons",
        "Link buttons under the info strip — ArtStation, itch.io, GitHub, a documentation PDF…",
        pairs(
          p.links,
          [
            { key: "label", placeholder: "Label (e.g. Play on itch.io)", width: "minmax(0,.6fr)" },
            { key: "url", placeholder: "https://…", upload: { accept: "application/pdf,image/*", folder: "files" } },
          ],
          "Add button"
        )
      ),
      card("Page content", "Build the project page from blocks. Hover between blocks to insert one; click a block's title bar to collapse it.", blocksEditor(p.body, folder)),
    ];
  }

  // ---------- "Move images off Wix"

  async function importAllRemote() {
    if (!needFolder()) return;
    const jobs = [];
    const add = (obj, key, folder) => isRemote(obj[key]) && jobs.push({ obj, key, folder });
    const walk = (blocks, folder) => {
      for (const b of blocks) {
        if (b.type === "image") add(b, "src", folder);
        if (b.type === "video") add(b, "src", folder.replace(/^img\//, "video/"));
        if (b.type === "gallery") (b.images || []).forEach((_, i) => add(b.images, i, folder));
      }
    };
    add(data.site, "logo", "img/site");
    if (/\.pdf($|\?)/i.test(data.site.resumeUrl || "")) add(data.site, "resumeUrl", "files");
    for (const p of data.projects) {
      const folder = `img/${p.id}`;
      add(p, "thumb", folder);
      add(p, "preview", folder);
      p.links.forEach((l) => /\.pdf($|\?)/i.test(l.url || "") && add(l, "url", "files"));
      walk(p.body, folder);
    }
    for (const s of data.sections) walk(s.blocks, `img/sections/${s.id}`);

    if (!jobs.length) return toast("Nothing to copy — everything already lives in your repo.", "ok");
    if (!confirm(`Download ${jobs.length} remote file${jobs.length > 1 ? "s" : ""} into your website folder?`)) return;

    const done = new Map();
    const failed = [];
    for (const [n, job] of jobs.entries()) {
      const url = job.obj[job.key];
      toast(`Copying ${n + 1} of ${jobs.length}…`, "info", 1200);
      try {
        if (!done.has(url)) done.set(url, await importRemote(url, job.folder));
        job.obj[job.key] = done.get(url);
      } catch (e) {
        failed.push(url);
      }
    }
    changed({ nav: true });
    renderMain();
    toast(
      `Copied ${jobs.length - failed.length} file(s).` +
        (failed.length ? ` ${failed.length} couldn't be downloaded and still point to the web.` : "") +
        " Click Save to keep the new paths.",
      failed.length ? "warn" : "ok",
      9000
    );
  }

  // ================================================================ sidebar

  function renderFolder() {
    const box = $("#folder");
    if (!FS_OK) {
      fill(box, 
        h("p", { class: "folder__msg is-warn" }, "This browser can't save into your folder. Open the editor in Chrome or Edge — or edit here and download the file."),
        h("button", { type: "button", class: "btn btn--small", onclick: () => data && download(serialize(data)) }, "Download content.js")
      );
    } else if (dir) {
      fill(box, h("p", { class: "folder__msg is-ok" }, "Saving to ", h("strong", {}, dir.name)), h("button", { type: "button", class: "linkish", onclick: chooseFolder }, "Use a different folder"));
    } else if (savedHandle) {
      fill(box, 
        h("p", { class: "folder__msg is-warn" }, "Website folder: ", h("strong", {}, savedHandle.name)),
        h("button", { type: "button", class: "btn btn--small btn--primary", onclick: reconnect }, "Reconnect to save")
      );
    } else {
      fill(box, 
        h("p", { class: "folder__msg is-warn" }, "Connect your website folder to save changes and upload images."),
        h("button", { type: "button", class: "btn btn--small btn--primary", onclick: chooseFolder }, "Connect website folder")
      );
    }
  }

  function renderNav() {
    if (!data) return;
    const item = (label, active, onclick, opts = {}) =>
      h(
        "button",
        { type: "button", class: "nav-item" + (active ? " is-active" : ""), onclick },
        opts.thumb !== undefined
          ? opts.thumb
            ? h("img", { class: "nav-item__thumb", src: srcFor(opts.thumb), alt: "" })
            : h("span", { class: "nav-item__thumb nav-item__thumb--empty" })
          : null,
        h("span", { class: "nav-item__label" }, label),
        opts.move
          ? h(
              "span",
              { class: "nav-item__move" },
              h("span", { title: "Move up", onclick: (e) => (e.stopPropagation(), opts.move(-1)) }, "↑"),
              h("span", { title: "Move down", onclick: (e) => (e.stopPropagation(), opts.move(1)) }, "↓")
            )
          : null
      );
    const group = (label, onAdd, addTitle) =>
      h("div", { class: "nav-group" }, h("span", {}, label), onAdd ? h("button", { type: "button", title: addTitle, onclick: onAdd }, "+ New") : null);

    fill($("#nav"), 
      group("Website"),
      item("Home, About & Contact", view.kind === "site", () => go({ kind: "site" })),
      item("Portfolio categories", view.kind === "categories", () => go({ kind: "categories" })),
      group("Extra sections", addSection, "Add a section to the home page"),
      data.sections.length
        ? data.sections.map((s, i) => item(s.title || "Untitled section", view.ref === s, () => go({ kind: "section", ref: s }), { move: (d) => move(data.sections, i, d) }))
        : h("p", { class: "nav-empty" }, "e.g. Experience, Awards, Talks"),
      group("Projects", newProject, "Add a project"),
      data.projects.map((p, i) =>
        item(p.title || "Untitled project", view.ref === p, () => go({ kind: "project", ref: p }), { thumb: p.thumb || "", move: (d) => move(data.projects, i, d) })
      )
    );
  }

  // ================================================================ main

  function go(next) {
    closePicker();
    view = next;
    pendingHash = true;
    renderNav();
    renderMain();
    $("#main").scrollTop = 0;
    sendPreview();
  }

  function renderMain() {
    if (!data) return;
    const main = $("#main");
    if (view.kind === "project" && data.projects.includes(view.ref)) fill(main, ...projectView(view.ref));
    else if (view.kind === "section" && data.sections.includes(view.ref)) fill(main, ...sectionView(view.ref));
    else if (view.kind === "categories") fill(main, ...categoriesView());
    else {
      view = { kind: "site" };
      fill(main, ...siteView());
    }
  }

  function renderAll() {
    renderFolder();
    renderNav();
    renderMain();
    renderSaveState();
  }

  // ================================================================ wiring

  $("#save").addEventListener("click", save);

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      if (dirty) save();
    }
    if (e.key === "Escape") closePicker();
  });

  window.addEventListener("beforeunload", (e) => {
    if (!dirty) return;
    e.preventDefault();
    e.returnValue = "";
  });

  // Preview controls
  const previewPane = $("#preview");
  document.querySelectorAll("[data-device]").forEach((btn) =>
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-device]").forEach((b) => b.classList.toggle("is-on", b === btn));
      previewPane.classList.toggle("is-phone", btn.dataset.device === "phone");
    })
  );
  $("#preview-reload").addEventListener("click", () => {
    previewReady = false;
    frame.contentWindow.location.reload();
  });
  $("#preview-hide").addEventListener("click", () => {
    $("#app").classList.add("no-preview");
    $("#preview-show").hidden = false;
  });
  $("#preview-show").addEventListener("click", () => {
    $("#app").classList.remove("no-preview");
    $("#preview-show").hidden = true;
  });

  async function init() {
    try {
      const res = await fetch("../" + CONTENT_FILE, { cache: "no-store" });
      data = parseContent(await res.text());
    } catch (e) {
      fill($("#main"), h("div", { class: "card" }, h("h2", { class: "card__title" }, "Couldn't load js/content.js"), h("p", { class: "muted" }, e.message)));
      return;
    }
    if (FS_OK) {
      savedHandle = await recall();
      try {
        if (savedHandle && (await savedHandle.queryPermission({ mode: "readwrite" })) === "granted") {
          dir = savedHandle;
          data = parseContent(await readText(CONTENT_FILE));
        }
      } catch {
        dir = null;
      }
    }
    renderAll();
    frame.src = "../index.html?preview";
  }

  // Exposed for debugging from the browser console.
  window.SiteEditor = { useFolder, get data() { return data; } };

  init();
})();
