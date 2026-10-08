/*
 * Portfolio content lives here — edit this file to add or change projects.
 *
 * Media helpers:
 *   wixImg(id, w, h)  cropped image from the old Wix media library
 *   wixRaw(id)        original file (use for GIFs so they keep animating)
 * For files stored in this repo, just use a path string, e.g. "assets/img/my-shot.jpg".
 *
 * Detail "body" blocks (rendered in order):
 *   { h: "Heading" }                         section heading
 *   { p: "Paragraph text" }                  paragraph
 *   { ul: ["item", "item"] }                 bullet list
 *   { img: "url", alt: "", caption: "" }     image / gif
 *   { youtube: "videoId", caption: "" }      embedded YouTube video
 *   { note: "Small print" }                  muted footnote
 */

const WIX = "https://static.wixstatic.com/media/";
const wixRaw = (id) => WIX + id;
const wixImg = (id, w, h) => `${WIX}${id}/v1/fill/w_${w},h_${h},al_c,q_85,usm_0.66_1.00_0.01/${id}`;

window.PORTFOLIO = {
  categories: [
    { id: "featured", title: "Featured",         detail: "Selected highlights from my work",         icon: "★" },
    { id: "shaders",  title: "Shaders & VFX",    detail: "Materials, Niagara, Houdini, Substance",   icon: "FX" },
    { id: "tools",    title: "Tools & Pipeline", detail: "Python, Maya plugins, artist tooling",     icon: "PY" },
    { id: "games",    title: "Games & Gameplay", detail: "Unreal, Unity, game jams",                 icon: "GD" },
  ],

  projects: [
    {
      id: "snow-globe",
      title: "Capturing Snow Globe",
      term: "Winter 2026",
      status: "Work in progress",
      categories: ["featured", "shaders"],
      summary: "A God of War–inspired snow globe that captures and releases the objects it looks at.",
      tags: ["Niagara", "Unreal 5", "Materials", "Substance Designer"],
      thumb: wixImg("34fe06_b3c6b775a50a462587d87edc7b117d19~mv2.jpg", 720, 405),
      preview: wixRaw("34fe06_9ef416f5c9164678bba0426a0a2269ea~mv2.gif"),
      meta: { Role: "Tech Artist", Team: "1", Duration: "5 weeks", Tools: "Unreal 5 · Niagara · Substance Designer" },
      body: [
        { img: wixRaw("34fe06_9ef416f5c9164678bba0426a0a2269ea~mv2.gif"), alt: "Snow globe capturing an object in Unreal Engine" },
        { h: "My Responsibilities" },
        { p: "A capturing snow globe that encapsulates the objects viewed through it. All materials and effects were created and optimized within Unreal Engine." },
        { ul: [
          "Authored dynamic materials in Unreal Engine and custom noise maps in Substance Designer",
          "Built the snow and capture effects with Niagara particles",
          "Modeled and textured the snow globe",
          "Mixed sound effects",
          "Optimized particles and shaders",
        ] },
        { h: "Performance Notes" },
        { p: "Dithering is used to achieve the ice and transparency effect while maintaining performance. Collision is enabled on the particles to keep the snow within the bounds of the globe." },
        { note: "Kratos model and textures are property of Santa Monica Studio." },
      ],
    },
    {
      id: "cat-fish",
      title: "Cat-Fish!",
      term: "",
      categories: ["featured", "games"],
      summary: "Technical lead and gameplay programmer — shaders and gameplay systems in Unreal Engine.",
      tags: ["Technical Lead", "Unreal Engine", "Shaders", "Gameplay"],
      thumb: wixImg("34fe06_e04e2d9427bf4cce8f73ba2bc26d052e~mv2.webp", 720, 405),
      meta: { Role: "Technical Lead · Gameplay Programmer", Tools: "Unreal Engine" },
      body: [
        { img: wixImg("34fe06_e04e2d9427bf4cce8f73ba2bc26d052e~mv2.webp", 1280, 720), alt: "Cat-Fish! key art" },
        { note: "Full breakdown coming soon." },
      ],
    },
    {
      id: "material-viewer",
      title: "Real-Time Material Viewer",
      term: "Winter 2026",
      status: "Work in progress",
      categories: ["featured", "tools"],
      summary: "A Maya plugin that previews scrolling-texture VFX materials on a mesh's UVs, cutting the back-and-forth with Unreal.",
      tags: ["Python", "Maya Plugin", "Shaders", "VFX Workflow"],
      thumb: wixImg("34fe06_0c4ed1ad353842748e0b3cd552fa306e~mv2.png", 720, 405),
      preview: wixRaw("34fe06_efe909d146334888b8304593873fb901~mv2.gif"),
      meta: { Role: "Technical Artist", Team: "1", Duration: "5 weeks", Tools: "Python 3 · Maya" },
      links: [
        { label: "Documentation (PDF)", url: "https://f275549e-8536-4fe6-a52c-9d2f0ab77eaf.filesusr.com/ugd/34fe06_e42f374dfa114cac802f7283cc309667.pdf" },
      ],
      body: [
        { img: wixRaw("34fe06_efe909d146334888b8304593873fb901~mv2.gif"), alt: "Material viewer previewing a scrolling texture in Maya" },
        { h: "Functionality" },
        { p: "The Real-Time Material Viewer is a Maya tool designed to quickly set up a preview of how textures interact with a model's UVs in real-time environments such as Unreal Engine. This helps minimize the back-and-forth between programs during iteration." },
        { p: "The tool enables artists to:" },
        { ul: [
          "Create a reusable display material",
          "Apply the display material to test geometry or selected meshes",
          "Select the texture to be displayed",
          "Choose and apply UV sets",
          "Quickly test UV tiling, translation, and rotation through a unified GUI",
          "Animate UV parameters for immediate visual feedback",
        ] },
        { img: wixImg("34fe06_af99a579ac19444e87741034a3b9efe5~mv2.jpg", 1182, 588), alt: "Material viewer tool interface" },
        { h: "Real-Time VFX" },
        { p: "In real-time VFX, scrolling textures within materials are widely used, as they offer a cost-effective way to animate the reveal and disappearance of various effects. These textures are animated by scrolling them across UVs." },
        { h: "Purpose" },
        { p: "Although artists have many in-engine tools to manipulate textures across UVs, they sometimes have to return to their modeling software and create a whole new UV set just to get their textures to appear the way they want. This tool lets artists preview how textures move across their mesh in Maya, minimizing back-and-forth between applications." },
        { img: wixRaw("34fe06_9a1c4bc9bf1546b3892ebd96bb990b72~mv2.gif"), alt: "Animating UV parameters in the material viewer" },
        { h: "Deployed Tool" },
        { p: "The tool is driven by Maya's real-time playback along with the place2dTexture node for UV control. Once placed in the designated scripts folder, it can be launched from a pull-down menu." },
        { p: "In its current iteration the plugin applies a display material to a mesh. Future development will focus on transferring material and Hypershade data between Unreal and Maya." },
      ],
    },
    {
      id: "stress-relibre",
      title: "Stress Relibre",
      term: "Winter 2026",
      award: "Best in Show · Global Game Jam 2026 (Savannah)",
      categories: ["featured", "games", "shaders"],
      summary: "A luchador-spa management game. I built the runtime mask-painting minigame using render targets.",
      tags: ["Unreal 5", "Render Targets", "Gameplay", "Game Jam"],
      thumb: wixImg("34fe06_9d58a5e8d1124e81ab73224a3aedd601~mv2.jpg", 720, 405),
      preview: wixRaw("34fe06_6f4cc893bfff4c8a99959b89620b4a36~mv2.gif"),
      meta: { Role: "Gameplay Programmer · Game Design · Implementation", Team: "22", Duration: "48 hours", Tools: "Unreal Engine 5" },
      links: [
        { label: "Global Game Jam entry", url: "https://globalgamejam.org/games/2026/studio-chud-8" },
      ],
      body: [
        { img: wixRaw("34fe06_6f4cc893bfff4c8a99959b89620b4a36~mv2.gif"), alt: "Painting a spa mask onto a luchador at runtime" },
        { h: "My Responsibilities" },
        { p: "Stress Relibre is a single-player management game where players must successfully treat their luchador patients to avoid getting slammed." },
        { ul: [
          "Designed and developed the core gameplay mechanics for the clay mask minigame",
          "Helped develop the post-process cel shader",
          "Iterated on the macho-aggro system that determines whether the player gets slammed",
          "Optimized the mask minigame to be more performant at runtime",
        ] },
        { h: "Painting at Runtime" },
        { p: "Applying spa masks to luchadores was an essential minigame in our gameplay loop. After realizing vertex painting wouldn't work, I landed on using render targets to draw materials directly onto a model's UVs." },
        { img: wixRaw("34fe06_d7751f47729a4bc79183498aaec66e10~mv2.gif"), alt: "Mask coverage being calculated as the player paints" },
        { h: "Calculating Coverage" },
        { p: "Similar to games like Splatoon or PowerWash Simulator, a coverage readout displays the percentage of the face that's been painted. A major challenge was that render targets can't store this data, so I initially used the expensive \"Read Render Target Pixel\" node to check whether pixel values fell above or below a threshold." },
        { h: "Optimizing Coverage" },
        { p: "\"Read Render Target Pixel\" is very inefficient — it has to copy data from GPU memory to CPU memory, and it's a blocking, synchronous call." },
        { p: "My solution was to eliminate the pixel read entirely and use a set of capsule collisions to determine whether the player has painted a section. This trades a little accuracy for a lot of efficiency and removes the need to copy memory across the bus." },
      ],
    },
    {
      id: "ethiopian-tej",
      title: "Ethiopian Tej",
      term: "",
      categories: ["featured", "shaders"],
      summary: "A drink still-life rendered with fully procedural materials — no external textures.",
      tags: ["Houdini", "Copernicus", "VEX", "Procedural"],
      thumb: wixImg("34fe06_be0dd2176f77430fafe327814602e78a~mv2.jpg", 720, 405),
      meta: { Role: "Technical Artist", Tools: "Houdini · Copernicus · VEX" },
      links: [
        { label: "View on ArtStation", url: "https://www.artstation.com/artwork/GvlwWQ" },
      ],
      body: [
        { youtube: "x2FtB38HtMw" },
        { h: "Overview" },
        { p: "A drink still-life rendered with fully procedural materials. I leveraged Houdini's Copernicus for the texturing pipeline and wrote custom wrangle nodes to handle each shader. Everything is generated procedurally — no external textures." },
        { ul: [
          "Procedural shaders authored with VEX wrangles",
          "Copernicus-based texturing pipeline",
          "Cloth simulation",
        ] },
      ],
    },
    {
      id: "saintly-meal",
      title: "A Saintly Meal",
      term: "",
      categories: ["featured", "shaders"],
      summary: "Six organic materials authored in Substance Designer, applied in Painter, and lit in Unreal Engine 5.",
      tags: ["Substance Designer", "Substance Painter", "Unreal 5", "Materials"],
      thumb: wixImg("34fe06_f78cc5fe30af48ad9433e8f39700b9d8~mv2.jpg", 720, 405),
      meta: { Role: "Technical Artist", Tools: "Substance Designer · Substance Painter · Unreal Engine 5" },
      links: [
        { label: "View on ArtStation", url: "https://www.artstation.com/artwork/AZDXQe" },
      ],
      body: [
        { youtube: "OQeh2zSPEDI" },
        { h: "Real-time Organic Materials" },
        { p: "For this project, I created six different organic materials in Substance Designer and used them to texture my 3D models in Substance Painter. The final textured assets were set dressed and lit in Unreal Engine." },
        { p: "All models and textures shown were developed by me." },
      ],
    },
    {
      id: "gravi-dash",
      title: "Gravi-Dash",
      term: "Fall 2025",
      categories: ["games"],
      summary: "A split-screen gravity platformer inspired by Super Mario Galaxy — race your opponent across tiny planets.",
      tags: ["Unity", "C#", "Cinemachine", "Gameplay"],
      thumb: wixImg("34fe06_33eef026e7064669924f2442f0807b11~mv2.jpg", 720, 405),
      preview: wixRaw("34fe06_822c9c42f3d04d5abc5af66766309413~mv2.gif"),
      meta: { Role: "Sole Developer", Team: "1", Duration: "10 weeks", Tools: "Unity · Cinemachine" },
      body: [
        { img: wixRaw("34fe06_822c9c42f3d04d5abc5af66766309413~mv2.gif"), alt: "Two players racing across planets in split-screen" },
        { h: "Overview" },
        { p: "Gravi-Dash is a split-screen platformer that lets players race against each other using gravity mechanics inspired by Super Mario Galaxy." },
        { ul: [
          "Developed a custom rigidbody-based character controller that integrates the Cinemachine camera suite",
          "Used the state pattern for character controllers and animations",
          "Integrated split-screen with gravity mechanics that respect each player's camera",
        ] },
        { h: "Achieving Gravity" },
        { p: "The gravity mechanic lets players traverse and leap between planets. Key pieces of the implementation:" },
        { ul: [
          "Mesh colliders to create gravitational fields",
          "Custom geometry with enough polygons and clean normals for player alignment",
          "Lerp, Slerp, and geometry caching for smooth character and camera movement across the terrain",
        ] },
        { img: wixImg("34fe06_33eef026e7064669924f2442f0807b11~mv2.jpg", 1268, 624), alt: "Gravi-Dash planets and gravity fields" },
        { h: "Split-screen with Gravity" },
        { p: "Integrating split-screen multiplayer with the gravity mechanic introduced several challenges. Because movement is camera-based and gravity depends on each player's orientation, each player needed a dedicated camera to reference for movement and directional input. Since the project uses Unity's Cinemachine modules instead of the default camera system, I used channel masks rather than camera layers to separate the players." },
      ],
    },
  ],
};
