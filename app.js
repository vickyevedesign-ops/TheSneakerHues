/* Sneaker Hues — app.js */
const DEFAULT_SWATCHES = [
  "#000000","#ffffff","#f87171","#fbbf24","#34d399","#60a5fa",
  "#a78bfa","#f472b6","#22d3ee","#f97316","#84cc16","#eab308"
];

const state = {
  activeColor: DEFAULT_SWATCHES[0],
  slideIndex: 0,
  svgs: [] // inline SVG roots, one per slide
};

const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

/* Build palette UI */
function buildSwatches(){
  const wrap = $("#swatches");
  wrap.innerHTML = "";
  for(const hex of DEFAULT_SWATCHES){
    const b = document.createElement("button");
    b.className = "swatch";
    b.style.background = hex;
    b.setAttribute("role","option");
    b.dataset.hex = hex;
    b.addEventListener("click", () => setActiveColor(hex));
    wrap.appendChild(b);
  }
  setActiveColor(state.activeColor);
}

function setActiveColor(hex){
  state.activeColor = normalizeHex(hex);
  $("#activeColor").style.background = state.activeColor;
  $("#hexInput").value = state.activeColor;
  $$("#swatches .swatch").forEach(s => {
    s.dataset.active = String(s.dataset.hex.toLowerCase() === state.activeColor.toLowerCase());
  });
}

function normalizeHex(hex){
  if(!hex) return "#000000";
  hex = hex.trim();
  if(!hex.startsWith("#")) hex = "#"+hex;
  if(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(hex)) return hex;
  return "#000000";
}

/* Load and inline SVGs so we can interact with their nodes */
async function loadSlides(){
  const slides = $$(".slide");
  for(const slide of slides){
    const src = $(".sneaker-stage", slide).dataset.src;
    const svgText = await fetch(src).then(r => r.text());
    const div = document.createElement("div");
    div.innerHTML = svgText.trim();
    const svg = div.querySelector("svg");
    svg.removeAttribute("width"); svg.removeAttribute("height");
    svg.style.maxWidth = "100%";
    // Make colorable: target any element under #colorable OR any path/shape with a fill
    const targets = svg.querySelectorAll("#colorable *,[fill]:not([fill='none'])");
    targets.forEach(el => {
      el.style.cursor = "pointer";
      // store original fill
      if(!el.dataset.origFill){
        const cs = getComputedStyle(el);
        el.dataset.origFill = el.getAttribute("fill") || cs.fill || "transparent";
      }
      el.addEventListener("click", () => {
        el.setAttribute("fill", state.activeColor);
      });
    });
    $(".sneaker-stage", slide).appendChild(svg);
    state.svgs.push(svg);
  }
  activateSlide(0);
  buildDots();
}

function buildDots(){
  const dots = $("#dots");
  dots.innerHTML = "";
  state.svgs.forEach((_, i) => {
    const d = document.createElement("button");
    d.setAttribute("role","tab");
    d.setAttribute("aria-label", `Go to sneaker ${i+1}`);
    d.addEventListener("click", () => activateSlide(i));
    dots.appendChild(d);
  });
  updateDots();
}

function updateDots(){
  $$("#dots button").forEach((b, i) => b.setAttribute("aria-selected", String(i===state.slideIndex)));
}

function activateSlide(i){
  state.slideIndex = clamp(i, 0, $$(".slide").length-1);
  $$(".slide").forEach((s, idx) => s.dataset.active = String(idx===state.slideIndex));
  updateDots();
}

function next(){ activateSlide(state.slideIndex+1); }
function prev(){ activateSlide(state.slideIndex-1); }

/* Restart: clear fills on current slide */
function resetCurrent(){
  const svg = state.svgs[state.slideIndex];
  if(!svg) return;
  const targets = svg.querySelectorAll("#colorable *,[fill]:not([fill='none'])");
  targets.forEach(el => {
    const orig = el.dataset.origFill || "transparent";
    if(orig === "transparent" || orig === "rgba(0, 0, 0, 0)") el.removeAttribute("fill");
    else el.setAttribute("fill", orig);
  });
}

/* Download: current slide as PNG or SVG */
async function downloadCurrent(){
  const svg = state.svgs[state.slideIndex];
  if(!svg) return;
  const clone = svg.cloneNode(true);
  const xml = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([xml], {type:"image/svg+xml"});
  const url = URL.createObjectURL(blob);
  // Create a canvas to export PNG
  const img = new Image();
  img.onload = () => {
    const scale = 2; // 2x for crispness
    const w = img.naturalWidth || 1600;
    const h = img.naturalHeight || 900;
    const canvas = document.createElement("canvas");
    canvas.width = w*scale; canvas.height = h*scale;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(scale,0,0,scale,0,0);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    // Build menu-ish download: prefer PNG, also offer SVG via second click (modified for single CTA: downloads PNG)
    canvas.toBlob((pngBlob) => {
      triggerDownload(pngBlob, `sneaker-${state.slideIndex+1}.png`);
    }, "image/png");
  };
  img.src = url;
}

/* Helper: trigger download */
function triggerDownload(blob, filename){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 0);
}

/* Eyedropper CTA */
async function openEyeDropper(){
  if("EyeDropper" in window){
    try{
      const result = await new EyeDropper().open();
      setActiveColor(result.sRGBHex);
    }catch(e){ /* user canceled */ }
  }else{
    alert("Your browser does not support the EyeDropper API. Try Chrome, Edge, or Opera.");
  }
}

/* XD overlay helper (for pixel-perfect alignment) */
function initOverlayTools(){
  const img = $("#xdOverlay");
  $("#overlayFile").addEventListener("change", (e)=>{
    const file = e.target.files?.[0];
    if(!file) return;
    const url = URL.createObjectURL(file);
    img.src = url; img.style.display = "block";
  });
  $("#overlayOpacity").addEventListener("input",(e)=>{
    img.style.opacity = (e.target.value/100).toString();
  });
  $("#toggleOverlay").addEventListener("click", ()=>{
    img.style.display = img.style.display === "none" ? "block" : "none";
  });
}

/* Wire up events */
function initEvents(){
  $("#colorInput").addEventListener("input", e => setActiveColor(e.target.value));
  $("#hexInput").addEventListener("change", e => setActiveColor(e.target.value));
  $("#addSwatchBtn").addEventListener("click", () => {
    const hex = normalizeHex($("#hexInput").value || $("#colorInput").value);
    const b = document.createElement("button");
    b.className = "swatch";
    b.style.background = hex;
    b.dataset.hex = hex;
    b.addEventListener("click", () => setActiveColor(hex));
    $("#swatches").appendChild(b);
    setActiveColor(hex);
  });
  $("#eyedropperBtn").addEventListener("click", openEyeDropper);
  $("#resetBtn").addEventListener("click", resetCurrent);
  $("#downloadBtn").addEventListener("click", downloadCurrent);
  $("#nextBtn").addEventListener("click", next);
  $("#prevBtn").addEventListener("click", prev);

  // keyboard
  window.addEventListener("keydown", (e)=>{
    if(e.key === "ArrowRight") next();
    if(e.key === "ArrowLeft") prev();
  });
}

/* Init */
document.addEventListener("DOMContentLoaded", async ()=>{
  buildSwatches();
  initEvents();
  initOverlayTools();
  await loadSlides();
  setActiveColor(DEFAULT_SWATCHES[0]);
});
