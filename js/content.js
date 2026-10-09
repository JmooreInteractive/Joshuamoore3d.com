// Website content. Edit it with the site editor (editor/index.html, or run edit-site.bat),
// or by hand — everything after `window.PORTFOLIO =` must stay valid JSON.
window.PORTFOLIO = {
  "site": {
    "eyebrow": "Portfolio · 2026",
    "name": "Joshua Moore",
    "role": "Technical Artist",
    "tagline": "Shaders, real-time VFX & artist tools.\nGame Development at SCAD.",
    "logo": "https://static.wixstatic.com/media/34fe06_97cfa243324f4d9ba4bf62c6ed4bf573~mv2.png",
    "resumeUrl": "https://drive.google.com/drive/folders/1xvBI8tW6UAPffMSSRff45K5Zni20BYux?usp=sharing",
    "about": {
      "lead": "I'm a Technical Artist from Middle Georgia, currently pursuing a degree in Game Development at the Savannah College of Art and Design.",
      "paragraphs": [
        "Through video games, I hope to create experiences that unite communities and bring people together.",
        "I like working in the space between art and engineering — writing shaders, building real-time VFX, and making tools that help other artists iterate faster."
      ],
      "facts": [
        {
          "label": "Studying",
          "value": "Game Development, SCAD"
        },
        {
          "label": "Based in",
          "value": "Georgia, USA"
        },
        {
          "label": "Recognition",
          "value": "Best in Show, Global Game Jam 2026 (Savannah)"
        }
      ],
      "toolbox": [
        {
          "title": "Engines",
          "items": [
            "Unreal Engine 5",
            "Unity"
          ]
        },
        {
          "title": "Shaders & VFX",
          "items": [
            "Material Editor",
            "Niagara",
            "Render Targets",
            "Houdini",
            "Copernicus",
            "VEX"
          ]
        },
        {
          "title": "Texturing",
          "items": [
            "Substance Designer",
            "Substance Painter"
          ]
        },
        {
          "title": "Code & DCC",
          "items": [
            "Python",
            "C#",
            "Maya"
          ]
        }
      ]
    },
    "contact": {
      "pitch": "Open to internships and entry-level technical art roles. Let's make something together.",
      "email": "joshua.moore0523@gmail.com",
      "discord": "jmooreinteractive",
      "links": [
        {
          "label": "LinkedIn",
          "url": "http://www.linkedin.com/in/joshua-moore-0ba22627a"
        },
        {
          "label": "ArtStation",
          "url": "https://www.artstation.com/jmooreinteractive"
        },
        {
          "label": "Instagram",
          "url": "https://www.instagram.com/jmooreinteractive/"
        }
      ]
    }
  },
  "sections": [],
  "categories": [
    {
      "id": "featured",
      "title": "Featured",
      "detail": "Selected highlights from my work",
      "icon": "★"
    },
    {
      "id": "shaders",
      "title": "Shaders & VFX",
      "detail": "Materials, Niagara, Houdini, Substance",
      "icon": "FX"
    },
    {
      "id": "tools",
      "title": "Tools & Pipeline",
      "detail": "Python, Maya plugins, artist tooling",
      "icon": "PY"
    },
    {
      "id": "games",
      "title": "Games & Gameplay",
      "detail": "Unreal, Unity, game jams",
      "icon": "GD"
    }
  ],
  "projects": [
    {
      "id": "snow-globe",
      "title": "Capturing Snow Globe",
      "term": "Winter 2026",
      "status": "Work in progress",
      "award": "",
      "categories": [
        "featured",
        "shaders"
      ],
      "summary": "A God of War–inspired snow globe that captures and releases the objects it looks at.",
      "tags": [
        "Niagara",
        "Unreal 5",
        "Materials",
        "Substance Designer"
      ],
      "thumb": "https://static.wixstatic.com/media/34fe06_b3c6b775a50a462587d87edc7b117d19~mv2.jpg/v1/fill/w_720,h_405,al_c,q_85,usm_0.66_1.00_0.01/34fe06_b3c6b775a50a462587d87edc7b117d19~mv2.jpg",
      "preview": "https://static.wixstatic.com/media/34fe06_9ef416f5c9164678bba0426a0a2269ea~mv2.gif",
      "meta": [
        {
          "label": "Role",
          "value": "Tech Artist"
        },
        {
          "label": "Team",
          "value": "1"
        },
        {
          "label": "Duration",
          "value": "5 weeks"
        },
        {
          "label": "Tools",
          "value": "Unreal 5 · Niagara · Substance Designer"
        }
      ],
      "links": [],
      "body": [
        {
          "type": "image",
          "src": "https://static.wixstatic.com/media/34fe06_9ef416f5c9164678bba0426a0a2269ea~mv2.gif",
          "alt": "Snow globe capturing an object in Unreal Engine",
          "caption": ""
        },
        {
          "type": "heading",
          "text": "My Responsibilities"
        },
        {
          "type": "text",
          "text": "A capturing snow globe that encapsulates the objects viewed through it. All materials and effects were created and optimized within Unreal Engine."
        },
        {
          "type": "list",
          "items": [
            "Authored dynamic materials in Unreal Engine and custom noise maps in Substance Designer",
            "Built the snow and capture effects with Niagara particles",
            "Modeled and textured the snow globe",
            "Mixed sound effects",
            "Optimized particles and shaders"
          ]
        },
        {
          "type": "heading",
          "text": "Performance Notes"
        },
        {
          "type": "text",
          "text": "Dithering is used to achieve the ice and transparency effect while maintaining performance. Collision is enabled on the particles to keep the snow within the bounds of the globe."
        },
        {
          "type": "note",
          "text": "Kratos model and textures are property of Santa Monica Studio."
        }
      ]
    },
    {
      "id": "cat-fish",
      "title": "Cat-Fish!",
      "term": "",
      "status": "",
      "award": "",
      "categories": [
        "featured",
        "games"
      ],
      "summary": "Technical lead and gameplay programmer — shaders and gameplay systems in Unreal Engine.",
      "tags": [
        "Technical Lead",
        "Unreal Engine",
        "Shaders",
        "Gameplay"
      ],
      "thumb": "https://static.wixstatic.com/media/34fe06_e04e2d9427bf4cce8f73ba2bc26d052e~mv2.webp/v1/fill/w_720,h_405,al_c,q_85,usm_0.66_1.00_0.01/34fe06_e04e2d9427bf4cce8f73ba2bc26d052e~mv2.webp",
      "preview": "",
      "meta": [
        {
          "label": "Role",
          "value": "Technical Lead · Gameplay Programmer"
        },
        {
          "label": "Tools",
          "value": "Unreal Engine"
        }
      ],
      "links": [],
      "body": [
        {
          "type": "image",
          "src": "https://static.wixstatic.com/media/34fe06_e04e2d9427bf4cce8f73ba2bc26d052e~mv2.webp/v1/fill/w_1280,h_720,al_c,q_85,usm_0.66_1.00_0.01/34fe06_e04e2d9427bf4cce8f73ba2bc26d052e~mv2.webp",
          "alt": "Cat-Fish! key art",
          "caption": ""
        },
        {
          "type": "note",
          "text": "Full breakdown coming soon."
        }
      ]
    },
    {
      "id": "material-viewer",
      "title": "Real-Time Material Viewer",
      "term": "Winter 2026",
      "status": "Work in progress",
      "award": "",
      "categories": [
        "featured",
        "tools"
      ],
      "summary": "A Maya plugin that previews scrolling-texture VFX materials on a mesh's UVs, cutting the back-and-forth with Unreal.",
      "tags": [
        "Python",
        "Maya Plugin",
        "Shaders",
        "VFX Workflow"
      ],
      "thumb": "https://static.wixstatic.com/media/34fe06_0c4ed1ad353842748e0b3cd552fa306e~mv2.png/v1/fill/w_720,h_405,al_c,q_85,usm_0.66_1.00_0.01/34fe06_0c4ed1ad353842748e0b3cd552fa306e~mv2.png",
      "preview": "https://static.wixstatic.com/media/34fe06_efe909d146334888b8304593873fb901~mv2.gif",
      "meta": [
        {
          "label": "Role",
          "value": "Technical Artist"
        },
        {
          "label": "Team",
          "value": "1"
        },
        {
          "label": "Duration",
          "value": "5 weeks"
        },
        {
          "label": "Tools",
          "value": "Python 3 · Maya"
        }
      ],
      "links": [
        {
          "label": "Documentation (PDF)",
          "url": "https://f275549e-8536-4fe6-a52c-9d2f0ab77eaf.filesusr.com/ugd/34fe06_e42f374dfa114cac802f7283cc309667.pdf"
        }
      ],
      "body": [
        {
          "type": "image",
          "src": "https://static.wixstatic.com/media/34fe06_efe909d146334888b8304593873fb901~mv2.gif",
          "alt": "Material viewer previewing a scrolling texture in Maya",
          "caption": ""
        },
        {
          "type": "heading",
          "text": "Functionality"
        },
        {
          "type": "text",
          "text": "The Real-Time Material Viewer is a Maya tool designed to quickly set up a preview of how textures interact with a model's UVs in real-time environments such as Unreal Engine. This helps minimize the back-and-forth between programs during iteration."
        },
        {
          "type": "text",
          "text": "The tool enables artists to:"
        },
        {
          "type": "list",
          "items": [
            "Create a reusable display material",
            "Apply the display material to test geometry or selected meshes",
            "Select the texture to be displayed",
            "Choose and apply UV sets",
            "Quickly test UV tiling, translation, and rotation through a unified GUI",
            "Animate UV parameters for immediate visual feedback"
          ]
        },
        {
          "type": "image",
          "src": "https://static.wixstatic.com/media/34fe06_af99a579ac19444e87741034a3b9efe5~mv2.jpg/v1/fill/w_1182,h_588,al_c,q_85,usm_0.66_1.00_0.01/34fe06_af99a579ac19444e87741034a3b9efe5~mv2.jpg",
          "alt": "Material viewer tool interface",
          "caption": ""
        },
        {
          "type": "heading",
          "text": "Real-Time VFX"
        },
        {
          "type": "text",
          "text": "In real-time VFX, scrolling textures within materials are widely used, as they offer a cost-effective way to animate the reveal and disappearance of various effects. These textures are animated by scrolling them across UVs."
        },
        {
          "type": "heading",
          "text": "Purpose"
        },
        {
          "type": "text",
          "text": "Although artists have many in-engine tools to manipulate textures across UVs, they sometimes have to return to their modeling software and create a whole new UV set just to get their textures to appear the way they want. This tool lets artists preview how textures move across their mesh in Maya, minimizing back-and-forth between applications."
        },
        {
          "type": "image",
          "src": "https://static.wixstatic.com/media/34fe06_9a1c4bc9bf1546b3892ebd96bb990b72~mv2.gif",
          "alt": "Animating UV parameters in the material viewer",
          "caption": ""
        },
        {
          "type": "heading",
          "text": "Deployed Tool"
        },
        {
          "type": "text",
          "text": "The tool is driven by Maya's real-time playback along with the place2dTexture node for UV control. Once placed in the designated scripts folder, it can be launched from a pull-down menu."
        },
        {
          "type": "text",
          "text": "In its current iteration the plugin applies a display material to a mesh. Future development will focus on transferring material and Hypershade data between Unreal and Maya."
        }
      ]
    },
    {
      "id": "stress-relibre",
      "title": "Stress Relibre",
      "term": "Winter 2026",
      "status": "",
      "award": "Best in Show · Global Game Jam 2026 (Savannah)",
      "categories": [
        "featured",
        "games",
        "shaders"
      ],
      "summary": "A luchador-spa management game. I built the runtime mask-painting minigame using render targets.",
      "tags": [
        "Unreal 5",
        "Render Targets",
        "Gameplay",
        "Game Jam"
      ],
      "thumb": "https://static.wixstatic.com/media/34fe06_9d58a5e8d1124e81ab73224a3aedd601~mv2.jpg/v1/fill/w_720,h_405,al_c,q_85,usm_0.66_1.00_0.01/34fe06_9d58a5e8d1124e81ab73224a3aedd601~mv2.jpg",
      "preview": "https://static.wixstatic.com/media/34fe06_6f4cc893bfff4c8a99959b89620b4a36~mv2.gif",
      "meta": [
        {
          "label": "Role",
          "value": "Gameplay Programmer · Game Design · Implementation"
        },
        {
          "label": "Team",
          "value": "22"
        },
        {
          "label": "Duration",
          "value": "48 hours"
        },
        {
          "label": "Tools",
          "value": "Unreal Engine 5"
        }
      ],
      "links": [
        {
          "label": "Global Game Jam entry",
          "url": "https://globalgamejam.org/games/2026/studio-chud-8"
        }
      ],
      "body": [
        {
          "type": "image",
          "src": "https://static.wixstatic.com/media/34fe06_6f4cc893bfff4c8a99959b89620b4a36~mv2.gif",
          "alt": "Painting a spa mask onto a luchador at runtime",
          "caption": ""
        },
        {
          "type": "heading",
          "text": "My Responsibilities"
        },
        {
          "type": "text",
          "text": "Stress Relibre is a single-player management game where players must successfully treat their luchador patients to avoid getting slammed."
        },
        {
          "type": "list",
          "items": [
            "Designed and developed the core gameplay mechanics for the clay mask minigame",
            "Helped develop the post-process cel shader",
            "Iterated on the macho-aggro system that determines whether the player gets slammed",
            "Optimized the mask minigame to be more performant at runtime"
          ]
        },
        {
          "type": "heading",
          "text": "Painting at Runtime"
        },
        {
          "type": "text",
          "text": "Applying spa masks to luchadores was an essential minigame in our gameplay loop. After realizing vertex painting wouldn't work, I landed on using render targets to draw materials directly onto a model's UVs."
        },
        {
          "type": "image",
          "src": "https://static.wixstatic.com/media/34fe06_d7751f47729a4bc79183498aaec66e10~mv2.gif",
          "alt": "Mask coverage being calculated as the player paints",
          "caption": ""
        },
        {
          "type": "heading",
          "text": "Calculating Coverage"
        },
        {
          "type": "text",
          "text": "Similar to games like Splatoon or PowerWash Simulator, a coverage readout displays the percentage of the face that's been painted. A major challenge was that render targets can't store this data, so I initially used the expensive \"Read Render Target Pixel\" node to check whether pixel values fell above or below a threshold."
        },
        {
          "type": "heading",
          "text": "Optimizing Coverage"
        },
        {
          "type": "text",
          "text": "\"Read Render Target Pixel\" is very inefficient — it has to copy data from GPU memory to CPU memory, and it's a blocking, synchronous call."
        },
        {
          "type": "text",
          "text": "My solution was to eliminate the pixel read entirely and use a set of capsule collisions to determine whether the player has painted a section. This trades a little accuracy for a lot of efficiency and removes the need to copy memory across the bus."
        }
      ]
    },
    {
      "id": "ethiopian-tej",
      "title": "Ethiopian Tej",
      "term": "",
      "status": "",
      "award": "",
      "categories": [
        "featured",
        "shaders"
      ],
      "summary": "A drink still-life rendered with fully procedural materials — no external textures.",
      "tags": [
        "Houdini",
        "Copernicus",
        "VEX",
        "Procedural"
      ],
      "thumb": "https://static.wixstatic.com/media/34fe06_be0dd2176f77430fafe327814602e78a~mv2.jpg/v1/fill/w_720,h_405,al_c,q_85,usm_0.66_1.00_0.01/34fe06_be0dd2176f77430fafe327814602e78a~mv2.jpg",
      "preview": "",
      "meta": [
        {
          "label": "Role",
          "value": "Technical Artist"
        },
        {
          "label": "Tools",
          "value": "Houdini · Copernicus · VEX"
        }
      ],
      "links": [
        {
          "label": "View on ArtStation",
          "url": "https://www.artstation.com/artwork/GvlwWQ"
        }
      ],
      "body": [
        {
          "type": "youtube",
          "url": "https://www.youtube.com/watch?v=x2FtB38HtMw",
          "caption": ""
        },
        {
          "type": "heading",
          "text": "Overview"
        },
        {
          "type": "text",
          "text": "A drink still-life rendered with fully procedural materials. I leveraged Houdini's Copernicus for the texturing pipeline and wrote custom wrangle nodes to handle each shader. Everything is generated procedurally — no external textures."
        },
        {
          "type": "list",
          "items": [
            "Procedural shaders authored with VEX wrangles",
            "Copernicus-based texturing pipeline",
            "Cloth simulation"
          ]
        }
      ]
    },
    {
      "id": "saintly-meal",
      "title": "A Saintly Meal",
      "term": "",
      "status": "",
      "award": "",
      "categories": [
        "featured",
        "shaders"
      ],
      "summary": "Six organic materials authored in Substance Designer, applied in Painter, and lit in Unreal Engine 5.",
      "tags": [
        "Substance Designer",
        "Substance Painter",
        "Unreal 5",
        "Materials"
      ],
      "thumb": "https://static.wixstatic.com/media/34fe06_f78cc5fe30af48ad9433e8f39700b9d8~mv2.jpg/v1/fill/w_720,h_405,al_c,q_85,usm_0.66_1.00_0.01/34fe06_f78cc5fe30af48ad9433e8f39700b9d8~mv2.jpg",
      "preview": "",
      "meta": [
        {
          "label": "Role",
          "value": "Technical Artist"
        },
        {
          "label": "Tools",
          "value": "Substance Designer · Substance Painter · Unreal Engine 5"
        }
      ],
      "links": [
        {
          "label": "View on ArtStation",
          "url": "https://www.artstation.com/artwork/AZDXQe"
        }
      ],
      "body": [
        {
          "type": "youtube",
          "url": "https://www.youtube.com/watch?v=OQeh2zSPEDI",
          "caption": ""
        },
        {
          "type": "heading",
          "text": "Real-time Organic Materials"
        },
        {
          "type": "text",
          "text": "For this project, I created six different organic materials in Substance Designer and used them to texture my 3D models in Substance Painter. The final textured assets were set dressed and lit in Unreal Engine."
        },
        {
          "type": "text",
          "text": "All models and textures shown were developed by me."
        }
      ]
    },
    {
      "id": "gravi-dash",
      "title": "Gravi-Dash",
      "term": "Fall 2025",
      "status": "",
      "award": "",
      "categories": [
        "games"
      ],
      "summary": "A split-screen gravity platformer inspired by Super Mario Galaxy — race your opponent across tiny planets.",
      "tags": [
        "Unity",
        "C#",
        "Cinemachine",
        "Gameplay"
      ],
      "thumb": "https://static.wixstatic.com/media/34fe06_33eef026e7064669924f2442f0807b11~mv2.jpg/v1/fill/w_720,h_405,al_c,q_85,usm_0.66_1.00_0.01/34fe06_33eef026e7064669924f2442f0807b11~mv2.jpg",
      "preview": "https://static.wixstatic.com/media/34fe06_822c9c42f3d04d5abc5af66766309413~mv2.gif",
      "meta": [
        {
          "label": "Role",
          "value": "Sole Developer"
        },
        {
          "label": "Team",
          "value": "1"
        },
        {
          "label": "Duration",
          "value": "10 weeks"
        },
        {
          "label": "Tools",
          "value": "Unity · Cinemachine"
        }
      ],
      "links": [],
      "body": [
        {
          "type": "image",
          "src": "https://static.wixstatic.com/media/34fe06_822c9c42f3d04d5abc5af66766309413~mv2.gif",
          "alt": "Two players racing across planets in split-screen",
          "caption": ""
        },
        {
          "type": "heading",
          "text": "Overview"
        },
        {
          "type": "text",
          "text": "Gravi-Dash is a split-screen platformer that lets players race against each other using gravity mechanics inspired by Super Mario Galaxy."
        },
        {
          "type": "list",
          "items": [
            "Developed a custom rigidbody-based character controller that integrates the Cinemachine camera suite",
            "Used the state pattern for character controllers and animations",
            "Integrated split-screen with gravity mechanics that respect each player's camera"
          ]
        },
        {
          "type": "heading",
          "text": "Achieving Gravity"
        },
        {
          "type": "text",
          "text": "The gravity mechanic lets players traverse and leap between planets. Key pieces of the implementation:"
        },
        {
          "type": "list",
          "items": [
            "Mesh colliders to create gravitational fields",
            "Custom geometry with enough polygons and clean normals for player alignment",
            "Lerp, Slerp, and geometry caching for smooth character and camera movement across the terrain"
          ]
        },
        {
          "type": "image",
          "src": "https://static.wixstatic.com/media/34fe06_33eef026e7064669924f2442f0807b11~mv2.jpg/v1/fill/w_1268,h_624,al_c,q_85,usm_0.66_1.00_0.01/34fe06_33eef026e7064669924f2442f0807b11~mv2.jpg",
          "alt": "Gravi-Dash planets and gravity fields",
          "caption": ""
        },
        {
          "type": "heading",
          "text": "Split-screen with Gravity"
        },
        {
          "type": "text",
          "text": "Integrating split-screen multiplayer with the gravity mechanic introduced several challenges. Because movement is camera-based and gravity depends on each player's orientation, each player needed a dedicated camera to reference for movement and directional input. Since the project uses Unity's Cinemachine modules instead of the default camera system, I used channel masks rather than camera layers to separate the players."
        }
      ]
    }
  ]
};
