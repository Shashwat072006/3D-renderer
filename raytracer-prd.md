# Product Requirements Document: "Build Your Own 3D Renderer" (Ray Tracer)

**Document owner:** [Fill in]
**Status:** Draft
**Source material:** [Build Your Own 3D Renderer](https://avikdas.com/build-your-own-raytracer/) by Avik Das (Bradfield School of Computer Science workshop)
**Reference implementations:** [JavaScript + Canvas 2D](https://github.com/avik-das/build-your-own-raytracer-js), [Java](https://github.com/avik-das/build-your-own-raytracer-java)

---

## 1. Overview

This PRD defines the requirements for building an educational, from-scratch **ray-traced 3D renderer**. The project is structured as six incremental milestones, each adding one rendering capability on top of the last, so that at every stage there is a working, visually verifiable program. This mirrors a two-day workshop format but is written generically enough to be executed by an individual learner, a bootcamp, or an internal engineering-onboarding exercise.

The end deliverable is a command-line (or minimal browser-based) program that:
- Reads a scene description (camera, spheres, lights, materials) defined in code or config,
- Casts rays through an image plane,
- Resolves visibility, shading, shadows, reflections, and anti-aliasing,
- Outputs a rendered raster image (PNG/PPM/Canvas bitmap).

## 2. Background & Motivation

Rendering 3D graphics answers two questions:
1. How do we represent a 3D world (geometry, lights, materials)?
2. How do we convert that representation into a 2D image?

There are two classic families of solutions:
- **Ray tracing**: simulate light transport by casting rays backward from the camera through the image plane and into the scene, testing intersections with geometry. This closely matches physical intuition, and cleanly produces *global illumination* effects (shadows, reflections, refraction) without special-casing each effect separately. It is comparatively slow, which is why it's traditionally used for offline/film rendering.
- **Rasterization**: project geometry onto the image plane directly and fill in covered pixels. It's fast (basis of GPUs/real-time games) but requires bespoke techniques and multiple passes to approximate global illumination.

This project deliberately chooses **ray tracing** as the pedagogical vehicle because:
- The math needed at each stage is introduced incrementally (vectors → dot products → trigonometric shading → recursion → stochastic sampling), so learners are never blocked by an unintroduced concept.
- The concepts (rays, intersection, shading models, recursion, sampling) generalize to rasterization and real-time graphics, just realized differently.
- Small, self-contained increments make it a good introductory systems/math project even for developers without prior graphics or heavy linear-algebra background.

## 3. Goals

- **G1.** Provide a working ray tracer that renders a scene of colored, lit, shadowed, reflective spheres with anti-aliased edges.
- **G2.** Structure the build as ordered, independently-shippable milestones, each with explicit acceptance criteria and a reference output image, so progress is externally verifiable at every step.
- **G3.** Teach/encode the underlying math (vectors, norms, dot products, quadratic-equation intersection tests, Phong illumination, recursive reflection, stochastic sampling) as part of the deliverable, not just the code.
- **G4.** Keep the implementation language-agnostic in spec, while supporting at least one concrete reference implementation (JS+Canvas2D and/or Java) that learners can check out commit-by-commit.
- **G5.** Make each milestone resumable/independent: a learner stuck on milestone *N* can check out a pre-built "before-project-N" state and continue with later milestones without being blocked.

### Non-goals

- Triangle-mesh / arbitrary polygon geometry (only spheres are in scope; triangle intersection is explicitly called out as future/out-of-scope math).
- Refraction / transparency rendering (the course explicitly stops short of implementing refraction rays, though it shares the same recursive mechanism as reflection).
- Real-time performance, GPU acceleration, or rasterization-based rendering.
- Physically-based rendering (PBR) material models, importance sampling, or bidirectional path tracing — this is a **Phong (local illumination) shading model**, not a physically accurate light-transport simulator.
- Production asset pipelines, scene file formats, or a GUI scene editor.

## 4. Target users / personas

- **Primary:** Intermediate programmers with basic programming fluency (loops, functions, classes) but limited or no background in linear algebra or computer graphics, learning graphics fundamentals hands-on (e.g., workshop attendees, self-learners, bootcamp curricula).
- **Secondary:** Instructors/workshop facilitators who need a two-day lesson plan with checkpointed projects and reference solutions.
- **Secondary:** Engineers who want a minimal, well-scoped side project to learn a new language (the reference implementations exist in JS and Java specifically so the *renderer logic* is the learning target, not a new language's ecosystem).

## 5. Success Metrics

- A learner can go from zero to a reflective, shadowed, anti-aliased sphere-scene renderer within a 2-day (~12-16 hour) workshop.
- Each milestone's output image visually matches (or plausibly resembles) the reference image for that milestone.
- Code from milestone *N* extends, without rewriting, into milestone *N+1* (i.e., the architecture doesn't require throwing away earlier work).
- A learner who gets stuck on any single milestone can still attempt subsequent milestones using a provided checkpoint/tag.

## 6. System Overview / Core Data Structures

These data structures are introduced progressively but are listed here as the target end-state schema:

| Structure | Fields | Introduced |
|---|---|---|
| `Vector3` | `x, y, z` (floats) | Milestone 1 |
| `Ray` | `origin: Vector3`, `direction: Vector3` | Milestone 1 |
| `Color` | `r, g, b` (floats in `[0,1]`) | Milestone 2 |
| `Sphere` | `center: Vector3`, `radius: float`, `color: Color` (superseded by `material` in M3) | Milestone 2 |
| `Light` | `position: Vector3`, `diffuseIntensity: Color (i_d)`, `specularIntensity: Color (i_s)` | Milestone 3 |
| `Material` | `ambient: Color (k_a)`, `diffuse: Color (k_d)`, `specular: Color (k_s)`, `shininess: float (α)`, `reflectivity: Color (k_r)` (added M5) | Milestone 3, extended M5 |
| `Scene` | list of `Sphere`, list of `Light`, ambient intensity `i_a`, camera, image plane | Milestone 3 |
| `Camera` | single `Vector3` position | Milestone 1 |
| `ImagePlane` | four corner `Vector3`s: top-left `x1`, top-right `x2`, bottom-left `x3`, bottom-right `x4` | Milestone 1 |

Required vector operations by the end of the project: addition, subtraction, scalar multiplication, dot product, magnitude/length (norm), normalization, negation.

## 7. Functional Requirements by Milestone

Each milestone below states: **concept taught**, **functional requirements**, **formulas/algorithms**, **acceptance criteria (reference output)**, and **prerequisite math**.

---

### Milestone 0 — Background & Conceptual Framing (no code deliverable)

**Purpose:** Ensure the learner understands, before writing code, the two questions any renderer answers (how to represent a 3D world; how to project it to 2D), the ray-tracing vs. rasterization tradeoff, and the concept of the rendering equation / light bounces / global illumination vs. local illumination.

**Deliverable:** None (conceptual only) — but this content should be the introductory section of any curriculum or README built on this PRD.

---

### Milestone 1 — Casting Rays from the Camera to the Image Plane

**Concept:** Backward (eye) ray tracing; bilinear interpolation to map pixel coordinates to world-space points on an image plane.

**Prerequisite math:** vector representation, addition, subtraction, scalar multiplication (see supplemental "refresher on vectors").

**Functional requirements:**
1. Implement a `Vector3` type supporting non-integer coordinates, addition, subtraction, and scalar scaling.
2. Represent an image plane using four corner vectors (`x1`=top-left, `x2`=top-right, `x3`=bottom-left, `x4`=bottom-right). Default suggested placement: `x1=(1, 0.75, 0)`, `x2=(-1, 0.75, 0)`, `x3=(1, -0.75, 0)`, `x4=(-1, -0.75, 0)`, matching a 4:3 output image aspect ratio (e.g., 256×192 px).
3. Represent a camera as a single `Vector3` position, e.g. `c = (0, 0, -1)`.
4. For every pixel `(i, j)` in the output image, compute horizontal/vertical interpolation fractions `α, β ∈ [0,1]`.
5. Compute the image-plane point `p` via bilinear interpolation:
   - `t = (1-α)·x1 + α·x2`
   - `b = (1-α)·x3 + α·x4`
   - `p = (1-β)·t + β·b`
6. Construct a `Ray` per pixel with `origin = p`, `direction = (p - c)`.
7. Produce a debug visualization image: map the ray direction's x-component to the red channel and y-component to the green channel (scaled into `[0,255]`), add a constant blue channel, and plot the resulting color per pixel.

**Acceptance criteria:**
- Output is a smooth 2D color gradient (blue-green top-left, yellow top-right, blue bottom-left, pink bottom-right, for the suggested camera/plane placement).
- Exercise checks (should be answerable, not necessarily coded): all ray directions share the same `z` coordinate when the image plane is flat and axis-aligned; identify where red/green channel values are minimized/maximized.

**Suggested exploration/exercises:** effect of a non-flat image plane or mismatched aspect ratio; effect of moving the camera closer/farther or off-center relative to the image plane.

---

### Milestone 2 — Solving the Visibility Problem via Ray–Sphere Intersection

**Concept:** Determine which piece of geometry (if any) a given ray "sees" first.

**Prerequisite math:** vector norm/magnitude, dot product (see supplemental "vector norms and dot products").

**Functional requirements:**
1. Implement vector magnitude (`‖v‖ = √(x²+y²+z²)`), normalization (`v̂ = v / ‖v‖`), and dot product (`a·b = a.x*b.x + a.y*b.y + a.z*b.z`).
2. Represent a `Sphere` with a center point (`Vector3`) and a radius (scalar), plus a flat color for this milestone.
3. Add one or more spheres to a scene.
4. Represent a flat `Color` with `r, g, b` components in `[0, 1]` (convert to `[0,255]` only at final pixel-write time).
5. For each camera ray (origin `o`, direction `d`) and each sphere (center `c`, radius `r`), solve for ray parameter `t` using:
   - Let `c' = o - c`.
   - Quadratic coefficients: `a = ‖d‖²`, `b = 2(c'·d)`, `cc = ‖c'‖² - r²`.
   - Discriminant `= b² - 4·a·cc`.
     - If discriminant `< 0`: no intersection.
     - Else: two roots `t = (-b ± √discriminant) / (2a)`; keep only `t > 0` (the smaller positive root is the visible hit); if both are ≤ 0, no visible intersection. Only intersections with `t ≥ 1` are past the image plane and thus valid/visible.
6. For each ray, iterate over all spheres, keep the closest valid intersection (smallest positive `t`), and color the pixel with that sphere's color. If no sphere is hit, use a default background color (e.g., black).

**Acceptance criteria:**
- Rendering three spheres of distinct colors and positions produces three flat-colored, unshaded circular silhouettes with correct occlusion (nearer sphere obscures farther one where they overlap).

---

### Milestone 3 — Simulating Illumination with Phong Shading

**Concept:** Local illumination via the Phong reflectance model (ambient + diffuse + specular).

**Prerequisite math:** dot product (reused), reflectance-vector construction.

**Functional requirements:**
1. Represent a `Light` with: world-space position (`Vector3`), diffuse intensity `i_d` (a `Color`), specular intensity `i_s` (a `Color`). Add one scene-wide ambient intensity `i_a` (a `Color`).
2. Represent a `Material` with four properties: ambient coefficient `k_a` (Color), diffuse coefficient `k_d` (Color), specular coefficient `k_s` (Color), shininess exponent `α` (scalar). Attach a material to each sphere (replacing the flat color from Milestone 2).
3. On the closest valid intersection for a ray, compute:
   - Intersection point: `p = o + t·d`.
   - Surface normal on a sphere: `N̂ = normalize(p - center)`.
4. Compute the **ambient term**: `k_a · i_a`.
5. For each light in the scene, compute the **diffuse term**:
   - Light vector `L̂ = normalize(lightPos - p)`.
   - If `N̂ · L̂ < 0`, the light is behind the surface at this point — skip diffuse/specular contribution from this light.
   - Otherwise add `k_d · i_d · (N̂ · L̂)`.
6. For each (non-skipped) light, compute the **specular term**:
   - View vector `V̂ = normalize(cameraPos - p)`.
   - Reflectance vector `R̂ = 2(N̂ · L̂)·N̂ - L̂`.
   - Add `k_s · i_s · (V̂ · R̂)^α`.
7. Sum ambient + all diffuse + all specular contributions into a single output `Color`.
8. **Clamp** each color channel of the final result to `[0, 1]` before writing the pixel.

**Acceptance criteria:**
- Three spheres, with at least two lights positioned on opposite sides of the scene, render with visible directional shading (bright highlights facing the lights, dimmer/ambient-only regions facing away) and no color channel overflow artifacts.

---

### Milestone 4 — Casting Shadow Rays

**Concept:** One object occluding light from reaching another (hard shadows).

**Functional requirements:**
1. At each surface intersection point `p` being shaded, for each light in the scene, construct a **shadow ray**: `origin = p`, `direction = (lightPos - p)`.
2. Test the shadow ray against every *other* object in the scene (excluding the object owning `p`) for intersection with `0 < t < 1` (i.e., strictly between the surface point and the light — `t=1` corresponds to the light's position itself).
3. If any such intersection exists, treat `p` as **in shadow** from that specific light: exclude that light's diffuse and specular contributions from the Phong sum for this pixel.
4. Continue including contributions from any lights **not** blocked, and always continue including the ambient term regardless of shadowing (it approximates indirect light, keeping shadows non-black).

**Acceptance criteria:**
- Rendering three spheres arranged so one casts a shadow onto another (e.g., a light positioned such that the rightmost sphere blocks light reaching the middle sphere) produces a visibly darker area on the shadowed sphere restricted to the ambient contribution, with a hard (non-blurred) shadow edge.

---

### Milestone 5 — Recursive Ray Tracing and Reflections

**Concept:** Simulating mirror-like reflectivity via recursively re-invoking the ray-tracing algorithm.

**Functional requirements:**
1. Add a `reflectivity` coefficient `k_r` (a `Color`, like the other material constants) to each material. If a material has a high `k_r` in a channel, correspondingly reduce its `k_d` in that channel (more reflective ⇒ less diffusely scattering).
2. Refactor the core trace function into a recursive shape: `trace(ray, scene, depth) -> Color`.
3. Add a maximum recursion depth parameter (suggested default: 3 bounces); once reached, stop recursing (return the locally-shaded color with no further reflected contribution, or treat the reflected term as zero).
4. At each intersection (while `depth` has not been exhausted):
   - Compute `V̂ = normalize(-incomingRayDirection)`.
   - Compute reflectance vector `R̂ = 2(N̂ · V̂)·N̂ - V̂`.
   - Construct a new ray: `origin = p`, `direction = R̂`.
   - Recursively call `trace(reflectedRay, scene, depth - 1)`.
5. Multiply the recursively-returned color by `k_r` and **add** it to the Phong-computed color for this point (ambient + diffuse + specular from Milestone 3/4), regardless of whether the point itself was in shadow.

**Acceptance criteria:**
- Three spheres, at least one with non-trivial `k_r`, render with visible mirror-like reflections of the other spheres, tinted by the reflecting sphere's own color, without infinite recursion / runaway performance.

**Explicitly out of scope:** refraction (transmission through translucent materials). The same recursive machinery would support it, but implementing a refraction ray is not required by this PRD.

---

### Milestone 6 — Distributed Ray Tracing / Anti-Aliasing

**Concept:** Reducing aliasing (jagged edges) from single-sample-per-pixel rendering via multi-sample supersampling (SSAA).

**Functional requirements:**
1. For each pixel, instead of casting exactly one ray through its center, compute `N` sample points distributed within the pixel's boundary (e.g., a 2×2 or 3×3 regular sub-grid using half/thirds of the per-pixel `Δα`/`Δβ` step; stochastic/jittered sampling is an acceptable alternative to a regular grid).
2. Run the full ray-tracing algorithm (Milestones 1–5) independently for each of the `N` samples.
3. Average the `N` resulting colors (per channel) to produce the final pixel color.
4. Make `N` (samples per pixel) a configurable parameter.

**Acceptance criteria:**
- Rendering the Milestone 5 scene with `N=9` samples/pixel produces visibly smoother, non-jagged silhouette edges compared to the `N=1` baseline, at the cost of roughly `N×` the ray-tracing work.

**Documented / discussed but out of scope for implementation:**
- Multisampling (MSAA) — only supersampling edges rather than every pixel, as a performance optimization.
- Extending distributed ray tracing along other dimensions: **motion blur** (distribute over time), **depth of field** (distribute camera ray origin over a 2D aperture interval), **soft shadows** (model each light as a 2D area and distribute shadow ray targets over it, producing penumbra/umbra).

---

## 8. Technical Architecture & Implementation Notes

- **Language-agnostic core spec.** The math and data-structure requirements above are independent of implementation language. Two known-good reference implementations exist and may be used as ground truth or starter scaffolding:
  - **JavaScript + Canvas 2D** (`build-your-own-raytracer-js`): browser-based, no build step, relies on modern (ES2016+) JS features (`let`, arrow functions, classes) directly via `<script>` tags and an HTML canvas for pixel output. Suitable for learners who want zero environment setup beyond a modern browser.
  - **Java** (`build-your-own-raytracer-java`): suitable for learners preferring a statically-typed, compiled environment.
- **Milestone checkpointing convention.** Each reference repo tags the commit immediately *before* each milestone's implementation as `before-project-N`. This lets a learner:
  - Clone the repo and `git checkout before-project-N` to get a clean starting point for milestone `N` with all prior milestones already implemented.
  - Skip a milestone they're stuck on and still attempt the next one.
  - Diff their own solution against the "next" tagged commit to see a reference implementation.
- **Output format.** Any raster image sink is acceptable (in-browser `<canvas>`, PPM/PNG file writer, etc.) as long as it can render arbitrary per-pixel RGB values clamped to `[0,255]`.
- **Suggested reference resolution:** 256×192 px (4:3), matching the sample image plane in Milestone 1, though this is not a hard constraint — any resolution matching the image plane's aspect ratio works.

## 9. Non-Functional Requirements

- **Incrementality:** Each milestone must build directly on the previous milestone's data structures without requiring a rewrite (e.g., `Sphere.color` from Milestone 2 is *generalized into* `Material` in Milestone 3, not replaced by an incompatible structure).
- **Verifiability:** Each milestone must have a clearly described, visually-checkable reference output so correctness can be assessed without a formal test suite (this is a learning project, not a production renderer).
- **Approachable math:** No milestone should require math beyond what's covered in that milestone's paired supplemental primer (vectors → vector norms/dot products → trigonometric shading terms → recursion → sampling/averaging). Calculus, matrix transforms, and physically-based BRDFs are intentionally excluded.
- **Performance:** No hard real-time constraint. It is acceptable (and expected, per Milestone 6's own callout) that anti-aliasing multiplies render time by the sample count. A reasonable target is that the reference-resolution scene renders in at most a few seconds to a couple of minutes on commodity hardware, even at 9x supersampling.

## 10. Suggested Timeline (2-day workshop framing)

| Day | Milestones | Notes |
|---|---|---|
| Day 1, AM | M0 (background), M1 (ray casting) | Includes vector refresher as needed |
| Day 1, PM | M2 (sphere intersection), M3 (Phong shading) | Includes vector norm/dot product refresher |
| Day 2, AM | M4 (shadows), M5 (reflections) | |
| Day 2, PM | M6 (anti-aliasing) + stretch exercises (soft shadows, depth of field, motion blur discussion) | Stretch goals are discussion/exploration, not required deliverables |

## 11. Risks & Open Questions

- **Risk:** Learners without any vector/trig background may still find Milestones 3 and 5 (Phong specular term, reflectance vector derivation) conceptually dense despite the supplemental primers. *Mitigation:* the source material explicitly notes learners "don't need to understand all the math," only the highlighted terms and final formulas — this PRD should preserve that framing in any derived curriculum/README.
- **Open question:** Should this PRD's implementation target a single reference language, or remain multi-language (as the source material does with JS and Java)? Recommendation: pick one for a first internal build to reduce scope, using the other as an optional stretch/parallel-track implementation.
- **Open question:** Should triangle/mesh geometry and refraction be added as a documented "Milestone 7+" stretch phase? Out of scope per this PRD's non-goals, but the source material's Milestone 5 write-up explicitly notes refraction "shares almost the same recursive principle" as reflection, so it's a natural extension if scope grows.
- **Open question:** What image I/O library/approach will the target implementation use (canvas, a PNG-writing library, raw PPM)? Not specified by the source material — implementation detail to be decided per chosen language.

## 12. Appendix A — Glossary

- **Ray tracing:** rendering technique that simulates light transport by casting rays and tracing their paths.
- **Backward/eye tracing:** casting rays from the camera outward, rather than simulating rays leaving light sources.
- **Image plane:** the 2D virtual "canvas" the scene is projected onto, subdivided into per-pixel regions.
- **Bilinear interpolation:** interpolating a value across two dimensions by lerping along one axis, then the other.
- **Global illumination:** lighting effects arising from light interacting with multiple objects (shadows, reflections, refraction, indirect bounce light).
- **Local illumination:** an approximation that only considers a surface point and the lights directly, ignoring inter-object light bounces (except via a flat ambient term) — this is what the Phong model implements.
- **Phong reflectance model:** local illumination model combining ambient, diffuse, and specular terms.
- **Surface normal:** unit vector perpendicular to a surface at a given point.
- **Diffuse reflection:** light scattered roughly equally in all directions off a matte surface.
- **Specular reflection / highlight:** light concentrated in a particular reflected direction off a shiny surface, producing a viewing-angle-dependent highlight.
- **Shadow ray:** a secondary ray cast from a surface point toward a light, used to test occlusion.
- **Recursive ray tracing:** re-invoking the ray-tracing algorithm from a new ray generated at an intersection point (used for reflections/refraction).
- **Aliasing:** visual artifacts (e.g., jagged edges) from under-sampling a signal — here, from casting only one ray per pixel.
- **Supersampling antialiasing (SSAA):** casting and averaging multiple ray samples per pixel to reduce aliasing.
- **Multisampling antialiasing (MSAA):** a cheaper variant of SSAA that only supersamples near geometry edges.
- **Distributed ray tracing:** the general technique of distributing multiple ray samples over some parameter (pixel area, time, lens aperture, light-source area) to simulate effects like anti-aliasing, motion blur, depth of field, and soft shadows.
- **Stochastic ray tracing:** distributed ray tracing where sample locations are randomized rather than on a regular grid.

## 13. Appendix B — Key Formula Reference

- Bilinear interpolation of image-plane point: `p = (1-β)[(1-α)x1 + αx2] + β[(1-α)x3 + αx4]`
- Ray: `R(t) = o + t·d`
- Ray–sphere intersection quadratic: `‖d‖²t² + 2(c'·d)t + (‖c'‖² - r²) = 0`, where `c' = o - c`
- Sphere surface normal: `N̂ = normalize(p - center)`
- Phong ambient term: `k_a · i_a`
- Phong diffuse term (per light): `k_d · i_d · (N̂ · L̂)`, skipped if `N̂ · L̂ < 0`
- Reflectance vector (shared by specular highlight and mirror reflection): `R̂ = 2(N̂ · X̂)·N̂ - X̂`, where `X̂` is `L̂` (specular) or `V̂` (reflection)
- Phong specular term (per light): `k_s · i_s · (V̂ · R̂)^α`
- Recursive reflection contribution: `k_r · trace(reflectedRay, scene, depth - 1)`

## 14. Appendix C — Source Links

- Course home: https://avikdas.com/build-your-own-raytracer/
- 0. Background: https://avikdas.com/build-your-own-raytracer/00-background
- 1. Casting rays: https://avikdas.com/build-your-own-raytracer/01-casting-rays
  - Vectors refresher: https://avikdas.com/build-your-own-raytracer/01-casting-rays/refresher-on-vectors.html
  - Project 1: https://avikdas.com/build-your-own-raytracer/01-casting-rays/project.html
- 2. Intersection tests: https://avikdas.com/build-your-own-raytracer/02-intersection-tests
  - Vector norms & dot products: https://avikdas.com/build-your-own-raytracer/02-intersection-tests/vector-norms-and-dot-products.html
  - Project 2: https://avikdas.com/build-your-own-raytracer/02-intersection-tests/project.html
- 3. Phong shading: https://avikdas.com/build-your-own-raytracer/03-phong-shading
  - Project 3: https://avikdas.com/build-your-own-raytracer/03-phong-shading/project.html
- 4. Shadow rays: https://avikdas.com/build-your-own-raytracer/04-shadow-rays
  - Project 4: https://avikdas.com/build-your-own-raytracer/04-shadow-rays/project.html
- 5. Reflections: https://avikdas.com/build-your-own-raytracer/05-reflections
  - Project 5: https://avikdas.com/build-your-own-raytracer/05-reflections/project.html
- 6. Distributed ray tracing / anti-aliasing: https://avikdas.com/build-your-own-raytracer/06-distributed-ray-tracing
  - Project 6: https://avikdas.com/build-your-own-raytracer/06-distributed-ray-tracing/project.html
- Reference implementation (JS): https://github.com/avik-das/build-your-own-raytracer-js
- Reference implementation (Java): https://github.com/avik-das/build-your-own-raytracer-java
