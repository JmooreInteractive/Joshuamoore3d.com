# Joshuamoore3d.com
Portfolio of a Tech Artist currently attending the Savannah College of Art &amp; Design.

Plain HTML/CSS/JS — no build step. Hosted on GitHub Pages.

## Editing the site

1. Double-click **`edit-site.bat`**. It starts a small local server and opens the editor in your browser
   (use **Chrome or Edge** — they can save straight into this folder).
2. The first time, click **Connect website folder** and pick this folder (the one with `index.html`).
   The editor remembers it after that.
3. Edit on the left, watch the live preview on the right, then **Save** (or Ctrl+S).
4. Publish: commit & push this folder (e.g. GitHub Desktop → Commit → Push). GitHub Pages updates in a minute or two.

What you can do in the editor:

- **Projects** — add, reorder, duplicate, delete. Edit the tile (title, summary, tags, thumbnail, hover GIF),
  the info strip (Role / Team / Duration…), link buttons, and the page itself.
- **Page content blocks** — headings, paragraphs (`**bold**`, `*italic*`, `` `code` ``, `[links](https://…)`),
  bullet lists, notes, code snippets, images/GIFs, galleries, MP4 clips.
- **Embeds (plugins)** — YouTube, Vimeo, **blueprintUE** (Unreal Blueprint/Material graphs), Sketchfab,
  Shadertoy, or any other iframe.
- **Extra home-page sections** — e.g. Experience, Awards; optionally linked in the top bar.
- **Home, About & Contact** text, logo, resume (link or uploaded PDF), and portfolio categories.
- **Uploads** go into `assets/` inside this folder. "Copy into repo" / "Copy all remote images" pulls
  images that still live on Wix into the repo.

Keep video files small (GitHub rejects files over 100 MB) — use YouTube/Vimeo for long videos.

## Adding an embed plugin

Open `js/plugins.js`, copy one of the existing plugins, and change its `type`, `label`, the link pattern,
and the embed URL. It appears in the editor's "Add block" menu automatically. Example:

```js
B.register({
  type: "itch",
  label: "itch.io game",
  group: "Embeds",
  icon: "IO",
  fields: [{ key: "url", label: "itch.io embed link", type: "url" }, { key: "caption", label: "Caption", type: "text" }],
  parse: (b) => idFrom(b.url, [/itch\.io\/embed\/(\d+)/]),
  render(b) {
    const id = this.parse(b);
    return id ? B.frame(`https://itch.io/embed/${id}`, { height: 167, caption: b.caption }) : B.placeholder("Paste an itch.io embed link");
  },
});
```

## Files

| File | What it is |
| --- | --- |
| `index.html` | Page skeleton (hero, portfolio, about, sections, contact) |
| `js/content.js` | **All site content** — written by the editor (it's JSON, so hand edits must stay valid JSON) |
| `js/blocks.js` | Built-in content blocks (text, images, code…) — shared by the site and the editor |
| `js/plugins.js` | Embed plugins (YouTube, blueprintUE, Sketchfab…) |
| `js/main.js` | Renders the site from `content.js` |
| `css/style.css` | Styling. Brand purples (`--accent`, `--accent-hover`, `--accent-deep`, `--accent-text`) are at the top |
| `editor/` | The site editor |
| `assets/` | Images, videos and files you upload |
| `edit-site.bat` | Starts the editor |

## Preview without the editor

```bash
python -m http.server 8080
```

Then open http://localhost:8080.
