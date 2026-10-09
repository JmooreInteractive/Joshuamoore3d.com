# Joshuamoore3d.com
Portfolio of a Tech Artist currently attending the Savannah College of Art &amp; Design.

Plain HTML/CSS/JS — no build step. Hosted on GitHub Pages.

## Structure

| File | What it is |
| --- | --- |
| `index.html` | Page layout: hero, portfolio, about, contact |
| `css/style.css` | All styling. Brand purples (`--accent`, `--accent-hover`, `--accent-deep`, `--accent-text`) are at the top |
| `js/projects.js` | **All portfolio content.** Add/edit projects and categories here |
| `js/main.js` | Renders the category tabs, project tiles, and project breakdown pages (`#work/<id>`) |

## Adding a project

Add an entry to the `projects` array in `js/projects.js`:

```js
{
  id: "my-project",                 // used in the URL: /#work/my-project
  title: "My Project",
  term: "Spring 2027",
  categories: ["featured", "shaders"],
  summary: "One sentence shown on the tile.",
  tags: ["Unreal 5", "HLSL"],
  thumb: "assets/img/my-project/thumb.jpg",     // 16:9 still
  preview: "assets/img/my-project/loop.gif",    // optional — plays on hover
  meta: { Role: "Tech Artist", Team: "1", Duration: "4 weeks" },
  links: [{ label: "ArtStation", url: "https://..." }],
  body: [
    { h: "Breakdown" },
    { p: "Paragraph..." },
    { img: "assets/img/my-project/shot.jpg", alt: "..." },
    { youtube: "VIDEO_ID" },
  ],
},
```

## Preview locally

```bash
python -m http.server 8080
```

Then open http://localhost:8080.
