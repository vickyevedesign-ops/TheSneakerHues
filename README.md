# Sneaker Hues — GitHub Pages Site

A pixel-precise sneaker coloring experience with three SVG sneakers you can switch between. Includes a palette UI, browser eyedropper support, restart, and download.

## Features

- **Inline SVG coloring** — click any panel to fill with the active color (targets `#colorable` group or any element with a fill).
- **Palette UI** — swatches, hex input, and a custom-color adder.
- **EyeDropper CTA** — uses the [EyeDropper API](https://developer.mozilla.org/en-US/docs/Web/API/EyeDropper) when supported.
- **Restart CTA** — clears fills on the current sneaker.
- **Download CTA** — exports the current sneaker as a high-res PNG (2× scale).
- **Carousel** — three sneakers, navigable with arrows or dots.
- **XD Overlay (dev-only)** — drop an exported PNG/JPG overlay of your XD artboard and adjust opacity to line up elements for pixel perfection.
- **No build tools** — plain HTML/CSS/JS so it runs on GitHub Pages without bundling.

## Match the XD EXACTLY

Open `styles.css` and set the **XD TOKENS** at the top to match your XD file:
- `--maxw`, `--gutter`, `--col-gap`, `--row-gap`
- `--header-h`, `--sidebar-w`, `--stage-h`
- `--radius`, colors `--bg`, `--panel`, `--text`, `--muted`, `--primary`, `--accent`

These tokens drive layout and colors. Use the **XD Overlay** to align your export on top of the live UI while you tweak values.

## Replace the placeholder sneakers

- We already placed your provided SVG as `assets/sneakers/sneaker1.svg`.
- Replace `assets/sneakers/sneaker2.svg` and `sneaker3.svg` with your other two actual sneaker SVGs.
- Optional: to define exactly which parts are fillable, wrap them inside a `<g id="colorable"> ... </g>` in your SVGs.

## Local preview

Just open `index.html` in a browser. For Firefox, you may need to run a local server for file:`fetch()`:
```bash
# Python 3
python -m http.server 5173

# or Node
npx http-server -p 5173
```

Then visit http://localhost:5173

## Deploy on GitHub Pages

1. Create a new repo on GitHub, e.g. `sneaker-hues`.
2. Add these files and push:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Sneaker Hues"
   git branch -M main
   git remote add origin https://github.com/<your-username>/sneaker-hues.git
   git push -u origin main
   ```
3. In the repo, go to **Settings → Pages**:
   - Source: **Deploy from a branch**
   - Branch: **main** / root
4. Your site will be live at `https://<your-username>.github.io/sneaker-hues`.

## Notes

- **Eyedropper** requires Chromium-based browsers for now. We show a friendly alert if unavailable.
- **Download** uses a 2× canvas render for crisper PNGs. Change `scale` in `app.js` if needed.
- If your SVG paths use strokes only (no fills), consider adding `fill="white"` or move them into `#colorable` and set initial fills so clicks change visible color.

---

© You. Do rad colorways. 🟢
