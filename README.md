# Sneaker Hues — Updated (XD-parsed layout hooks, vanilla-colorful, #fillable)

- **vanilla-colorful** color UI (`<hex-color-picker>` + `<hex-input>`).
- Coloring limited to **`#fillable`** group (grouped parts fill together).
- **PNG export** uses full SVG viewBox/bbox (no cropping).
- **SVG placeholders** added for CTAs, arrows, sneaker names, and copy—replace with your exported assets for pixel-perfect typography.

## Replace assets
- Put your SVG UI assets into `assets/ui/` using the same filenames to overwrite placeholders.
- Replace `assets/sneakers/sneaker2.svg` and `sneaker3.svg` with your actual sneakers.

## Exact XD layout/colors
Update the `:root` **XD TOKENS** at the top of `styles.css` to the values from your XD. For pixel-perfect work, use the Overlay tool to align an export of your XD artboard and fine-tune tokens on the fly.
