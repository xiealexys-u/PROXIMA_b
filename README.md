# PROXIMA b — Read the Invisible

Group 08's interactive presentation site. This export is the complete static website from the published Site's **version 37** (source commit `6d3797abe944eb3db947017287cce75c587d52e3`). It includes the HTML, CSS, JavaScript, bundled Three.js modules, 3D models, textures, images, and journey prompt record. No build step or package installation is needed.

## Publish on GitHub Pages

1. Extract this ZIP and upload **all of its contents** to the root of a GitHub repository. Keep `index.html` at the repository root and preserve the `assets/` and `vendor/` folders.
2. In the repository, open **Settings → Pages**. Under **Build and deployment**, select **Deploy from a branch**, choose `main` and `/ (root)`, then save.
3. Open the GitHub Pages URL shown in the Pages settings after deployment. The first load may take longer because the 3D models and textures are large.

You may instead place these files in a `docs/` folder and choose `/docs` in Pages settings, but keep the paths relative to `index.html`.

## Test locally

Run an HTTP server from the extracted folder and open the printed localhost address:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000/`. Opening `index.html` directly with a `file://` URL may block module and model loading.

## Demo recording

The presentation currently offers a **Load Local Demo Video** button. To make the video available automatically to everyone on GitHub Pages, add the recording as `assets/prototype-demo.mp4`, then commit it with the site. The site detects that filename. Keep the video reasonably small; GitHub has file and repository limits. The ZIP does **not** contain a recorded prototype video.

## What the site demonstrates

The 3D animation and on-page demo buttons explain the design concept. They do not connect to the physical microphone, camera, glove FSR, gesture controller, or rover hardware. Present the separately recorded prototype footage as evidence of those physical functions.

Journey images are AI-generated colored-pencil concepts. Their prompt record is in `assets/journey-prompts.txt`. The website's **Sources & credits** panel lists the research and image/model attribution notes; review it against the final group submission.

## File structure

- `index.html`, `style.css`, `app.js`, `viewer.js`, `inspection.js`, `model.js`: website source.
- `assets/`: Marvin, Junior and fungus models; textures, illustrations, and visual assets.
- `vendor/`: bundled Three.js modules and license.
- `.nojekyll`: tells GitHub Pages to serve files as provided.

Source: PROXIMA b — Read the Invisible, published Site version 37, 20 October 2026.
