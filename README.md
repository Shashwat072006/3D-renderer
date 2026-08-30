# Blueprint 3D Suite: Ray Tracer, 3D Viewer & Phone 3D Scanner

A comprehensive, zero-dependency 3D graphics and spatial reconstruction suite built with pure JavaScript, Canvas 2D, WebGL (Three.js), and Node.js.

---

## Features & Modules

### 1. Blueprint 3D Viewer (`index.html`)
- Built to the exact design specifications of `viewer-design-doc.md`.
- Features an interactive, draggable CSS 3D isometric building wireframe hero with live `ROT X` / `ROT Y` angle telemetry.
- Dynamic blueprint grid background (48px), ambient scanline animation, SVG dimension callouts drawing in via `stroke-dashoffset`.
- Four-stage interactive architectural workflow (Open, Inspect, Present, Experience) with animated phone HUD mockups and an AR experience band with pulsing reticles.

### 2. From-Scratch 3D Ray Tracer (`raytracer.html`)
- Implements all 6 milestones defined in `raytracer-prd.md`:
  - **Milestone 1**: Bilinear interpolation and ray-direction gradient debug visualization.
  - **Milestone 2**: Quadratic ray–sphere intersection tests, closest-hit sorting, and flat color silhouettes.
  - **Milestone 3**: Full Phong reflectance model (ambient, diffuse, and specular terms per light source).
  - **Milestone 4**: Shadow ray casting ($0 < t < 1$) for hard geometric shadows.
  - **Milestone 5**: Recursive ray tracing with reflection vectors ($R = 2(N \cdot V)N - V$) and material reflectivity ($k_r$).
  - **Milestone 6**: Distributed Supersampling Anti-Aliasing (SSAA) with selectable $1\times$, $4\times$, or $9\times$ sub-pixel samples.
- Progressive row-by-row async rendering with live ray counters, progress bar, and render timing.

### 3. Phone-to-3D Real-Time Scanner (`3d-scanner.html` & `camera.html`)
- **Instant Mobile Capture**: Open `camera.html` on your smartphone via QR code or local Wi-Fi IP to capture photos using your phone's native camera hardware.
- **Monocular Depth Reconstruction**: Estimates depth maps from image luminance, gradients, and bilateral smoothing filters.
- **Interactive 3D WebGL Studio**:
  - Full $360^\circ$ orbital rotation, pan, and zoom controls.
  - 4 rendering modes: Textured 3D, Blueprint Wireframe, Phong Clay, and Surface Normals.
  - Real-time sliders for depth extrusion ($Z$), smoothing filter passes, and dynamic lighting angle ($0^\circ - 360^\circ$).
  - One-click 3D export to standard `.obj` files.

### 4. Zero-Dependency Real-Time Sync Server (`server.js`)
- Pure Node.js HTTP server with Server-Sent Events (SSE) for instant cross-device communication.
- Automatically discovers local network IPv4 addresses to generate mobile QR codes.
- Serves all static assets with optimal MIME types and zero external npm package dependencies.

---

## Getting Started / How to Run

### Prerequisites
- [Node.js](https://nodejs.org/) (version 16 or newer). No `npm install` needed—it uses built-in standard libraries.

### Step 1: Start the Local Server
Open your terminal inside this project folder and run:

```bash
node server.js
```

The server will start on port `3000` and display your local network IP:

```
====================================================
Blueprint & 3D Ray Tracer Server running on port 3000
- Desktop App:    http://localhost:3000/index.html
- 3D Scanner:     http://localhost:3000/3d-scanner.html
- 3D Ray Tracer:  http://localhost:3000/raytracer.html
Phone Camera Connection URLs:
  http://192.168.1.9:3000/camera.html
====================================================
```

### Step 2: Open in Browser
- **Blueprint 3D Viewer**: Open `http://localhost:3000/index.html`
- **3D Photo Scanner**: Open `http://localhost:3000/3d-scanner.html`
- **Ray Tracer**: Open `http://localhost:3000/raytracer.html`

### Step 3: Connect Phone Camera for 3D Scanning
1. On your desktop, navigate to `http://localhost:3000/3d-scanner.html`.
2. Click **Connect Phone** in the top navigation to view the QR code.
3. On your phone (connected to the same Wi-Fi network), scan the QR code or open:
   ```
   http://<YOUR_LOCAL_IP>:3000/camera.html
   ```
4. Tap **Take 3D Photo** or choose an image from your gallery.
5. Your desktop screen will instantly reconstruct and render the photo into an interactive 3D model!

---

## File Structure

```
.
├── 3d-scanner.html        # WebGL 3D Reconstruction Studio & Orbit Viewer
├── camera.html            # Mobile camera capture interface with native shutter
├── index.html             # Blueprint 3D Viewer landing page
├── raytracer.html         # From-scratch 6-milestone Ray Tracer
├── server.js              # Node.js static server with live SSE photo broadcast
├── raytracer-prd.md       # Product Requirements Document for Ray Tracer
├── viewer-design-doc.md   # Design Specification Document for Blueprint Viewer
├── viewer-tech-stack.md   # Architecture reference document
└── README.md              # Documentation & Run Guide
```

---

## License
MIT License
