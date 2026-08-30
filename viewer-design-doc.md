# Design Doc: "Blueprint" — 3D Viewer Landing Page

**Status:** Draft
**Companion file:** `viewer-design-concept.html` (working interactive prototype)
**Inspiration:** SketchUp Viewer App Store feature graphics (View 3D projects on the go / Model interaction / Communicate in 3D / Experience 3D in AR)

---

## 1. Design Brief

**Subject:** a mobile 3D model viewer for CAD/architecture files (SketchUp-style), used in the field by architects, contractors, and clients.

**Audience:** people who already have a 3D project (usually made on a desktop) and need to open, measure, present, or spatially check it away from their desk — on a job site, in a client meeting, or on location.

**Page's single job:** convince that audience the phone app is a credible stand-in for the desktop tool in four specific moments (open, measure, present, experience in AR), then get them to download it.

**Design risk taken:** instead of a generic app-store landing page (phone mockups in a row, screenshot carousel), the page treats itself as a piece of the product — the hero is a real, draggable 3D wireframe model, not a picture of one. The whole page borrows the visual language of a technical/blueprint drawing rather than generic marketing gloss.

---

## 2. Design Tokens

### Color

| Token | Hex | Role |
|---|---|---|
| `--navy-deep` | `#061626` | Page background |
| `--navy` | `#0B2545` | Card/surface background |
| `--navy-soft` | `#12335F` | Secondary surface, phone chrome |
| `--cyan` | `#6FD3F5` | Primary accent — blueprint line color, headings, active states |
| `--cyan-dim` | `#3A7FA0` | Secondary text, borders, muted UI |
| `--paper` | `#EAF2F8` | Primary text on dark background |
| `--paper-dim` | `#9FB6CC` | Secondary/body text |
| `--signal` | `#FF6A3D` | Single warm accent — CTAs, AR markers, measurement highlights |

Two color families only: cool blueprint blues/cyans for the "drafting" layer, one warm signal orange reserved exclusively for calls to action and points of real-world interaction (AR markers, measurement callouts). This keeps the warm color meaningful instead of decorative.

### Typography

| Role | Typeface | Notes |
|---|---|---|
| Display (headlines, section titles, feature titles) | **Big Shoulders Display** (600/700/800) | Condensed, industrial — reads like stenciled architectural signage. Always set in uppercase. |
| Body (paragraphs, descriptions) | **IBM Plex Sans** (400/500/600) | Technical but humane; pairs with drafting-tool brand families. |
| Utility/mono (readouts, labels, nav, coordinates, dimensions) | **IBM Plex Mono** (400/500) | Used for anything that reads like an instrument: rotation angles, measurements, nav links, eyebrows. |

### Layout Concept

- Full-bleed blueprint **grid background** (48px repeating linear-gradient lines) behind the entire page — a constant reminder this is a technical tool, not a lifestyle brand.
- Hero: two-column split — copy + live coordinate readout on the left, an interactive 3D wireframe "building" on the right.
- Feature content is a **numbered sequence** (01–04), not a generic feature grid — justified because the four features form a real, ordered workflow (open → inspect → present → experience), not an arbitrary list.
- AR section is a full-width, centered "band" with a pulsing reticle — a deliberate change of rhythm before the footer.

### Signature Element

A **draggable CSS 3D wireframe model** in the hero: an isometric prism built from six `div` faces with `transform-style: preserve-3d`, textured with a faint grid to match the blueprint background. It auto-rotates slowly at rest, responds to mouse/touch drag, and drives a live "ROT X / ROT Y" readout in monospace type — turning the hero into a tiny working demo of the product itself, rather than an illustration of it.

---

## 3. Page Structure & Copy

### Header (sticky)

- Logo mark: a rotated square outline (cyan) with a smaller offset square (orange) inside — a minimal "drafting compass" mark.
- Nav: `Workflow` · `AR` · `Download` (mono, uppercase, letter-spaced)
- CTA button: **Get the app**

### Hero

- Eyebrow: `3D Viewer — iOS & Android`
- Headline: **"Your model, on site, in your hand."** (site's cyan-highlighted word: *site*)
- Subhead: "Open a project straight from the cloud, measure what you need on the spot, walk a client through it scene by scene, then drop it into the real world at full scale — all without opening a laptop."
- CTAs: **Get the app** (primary) / **See it in AR** (secondary, links to AR band)
- Live readout: `ROT X 18.0°` · `ROT Y -32.0°` · `SCALE 1 : 140`
- Visual: draggable 3D wireframe prism, ambient scan-line sweep, animated dimension callouts (`9.4 M`, `6.2 M`) that draw in on load

### Feature sequence ("How it fits your day")

| # | Title | Copy | Visual motif |
|---|---|---|---|
| 01 | Open | "Pick up any project, instantly." Open SketchUp files straight from Trimble Connect or your phone's Files app — no syncing, no conversion, no waiting for a laptop to boot. | Phone mockup: stacked file rows |
| 02 | Inspect | "Measure without a tape." Tap any edge for its true dimension, read existing annotations, and check clearances against the model — not against a printout. | Phone mockup: wireframe triangle + dimension line |
| 03 | Present | "Walk the room, not the slides." Step through saved scenes and animations live, in front of the client, and answer "what if" questions by simply turning the model. | Phone mockup: dotted camera path + arrow |
| 04 | Experience | "Stand inside it, before it's built." Place the design at true scale in the actual space, and check how light, proportion, and clearance really feel before anything is built. | Phone mockup: floor grid + dashed AR placement box |

Each row reveals on scroll (staggered fade + slide-up), and each phone mockup gains orange corner brackets on hover, echoing a camera/AR focus reticle.

### AR band

- Pulsing 4-corner reticle (orange)
- Headline: **"Place it. Walk around it. Believe it."**
- Copy: "Point your phone at the floor, and the model settles into the room at real-world scale — the closest you'll get to standing in the finished space before ground is broken."
- CTA: **See it in AR**

### Footer

- Small print: `BLUEPRINT VIEWER — BUILT FOR THE FIELD`
- Links: App Store · Google Play · Docs

---

## 4. Animation & Interaction Spec

| Element | Trigger | Behavior |
|---|---|---|
| Hero 3D model | Page load / idle | Slow continuous auto-rotation (~0.06°/frame) |
| Hero 3D model | Mouse/touch drag | Auto-rotation pauses; model follows drag delta (clamped pitch ±70°) |
| Rotation readout | Every frame during rotation/drag | Live-updates `ROT X` / `ROT Y` values in monospace, synced to the actual transform |
| Dimension callouts | Page load | Fade in + SVG line "draws" via `stroke-dashoffset` animation, ~1s after load |
| Blueprint scan line | Continuous, ambient | A cyan line sweeps top-to-bottom every 5.5s, fading in/out at the edges |
| Feature rows | Scroll into view (IntersectionObserver, 20% threshold) | Fade + translate-up, staggered ~70ms apart, one-time (unobserves after firing) |
| Feature phone mockups | Hover | Border brightens, lifts 4px, corner brackets fade in |
| AR reticle | Continuous, ambient | Center dot pulses (scale + fade ring), corners static |
| CTA buttons | Hover | Lift 2px + soft orange glow shadow |

**Accessibility / restraint:**
- All animation respects `prefers-reduced-motion: reduce` — auto-rotation, scan line, pulsing, and scroll transitions collapse to instant/static states.
- Visible focus rings (`outline: 2px solid var(--signal)`) on all interactive elements.
- Drag interaction has a static fallback: the model is still fully legible at rest, dragging is an enhancement, not a requirement to understand the page.
- Responsive down to mobile: hero stage reorders above copy, feature rows collapse to single-column, nav collapses.

---

## 5. Technical Notes (for implementation)

- Built as a single static HTML file: inline CSS (custom properties for the token table above) and vanilla JS (no framework, no build step) — see `viewer-design-concept.html`.
- 3D model uses pure CSS 3D transforms (`perspective`, `transform-style: preserve-3d`, `translateZ`/`rotateX`/`rotateY`) — no WebGL/canvas dependency for the marketing page itself (the real app, of course, uses a proper 3D engine — see the tech stack doc).
- Fonts loaded from Google Fonts (`Big Shoulders Display`, `IBM Plex Sans`, `IBM Plex Mono`).
- No external JS libraries required; `IntersectionObserver` and pointer/touch events are native browser APIs.

---

## 6. Open Questions / Next Iterations

- Should the AR band include a live device-orientation demo (using `DeviceOrientationEvent`) instead of a static reticle, for browsers that support it?
- Consider a lighter "paper" variant of the same token system (cream background, navy ink) as an alternate theme for print/investor-deck contexts.
- Real app-store screenshots will eventually replace the abstract SVG phone-mockup illustrations once actual product UI exists.
