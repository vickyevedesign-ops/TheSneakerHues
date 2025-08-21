/* Sneaker Hues â€” app.js (vanilla-colorful + #fillable + full PNG export) */
const state = {
  activeColor: "#000000",
  slideIndex: 0,
  svgs: [] // inline SVG roots, one per slide
};

const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

/* Initialize color picker (vanilla-colorful) */
function initPicker(){
  const picker = $("#picker");
  const hexInput = $("#hexInput");
  const setColor = (hex) => {
    state.activeColor = normalizeHex(hex);
    picker.color = state.activeColor;
    hexInput.value = state.activeColor;
  };
  picker.addEventListener("color-changed", (e) => setColor(e.detail.value));
  hexInput.addEventListener("color-changed", (e) => setColor(e.detail.value));
  hexInput.addEventListener("change", (e) => setColor(e.target.value || hexInput.value));
  setColor("#000000");
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
    // target fillable nodes ONLY
    const fillableRoot = svg.querySelector("#fillable");
    const targets = fillableRoot ? fillableRoot.querySelectorAll("*") : [];
    targets.forEach(el => {
      el.style.cursor = "pointer";
      if(!el.dataset.origFill){
        const val = el.getAttribute("fill");
        el.dataset.origFill = (val && val !== "none") ? val : "transparent";
      }
      el.addEventListener("click", (ev) => {
        const group = ev.target.closest("#fillable g") || ev.target;
        const toFill = group.querySelectorAll("*");
        toFill.forEach(node => node.setAttribute("fill", state.activeColor));
      });
    });
    $(".sneaker-stage", slide).appendChild(svg);
    state.svgs.push(svg);
  }
  activateSlide(0);
  buildDots();
  updateSneakerName();
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

function updateSneakerName(){
  $("#sneakerName1").style.display = state.slideIndex===0 ? "block" : "none";
  $("#sneakerName2").style.display = state.slideIndex===1 ? "block" : "none";
  $("#sneakerName3").style.display = state.slideIndex===2 ? "block" : "none";
}

function activateSlide(i){
  state.slideIndex = clamp(i, 0, $$(".slide").length-1);
  $$(".slide").forEach((s, idx) => s.dataset.active = String(idx===state.slideIndex));
  updateDots();
  updateSneakerName();
}

function next(){ activateSlide(state.slideIndex+1); }
function prev(){ activateSlide(state.slideIndex-1); }

/* Restart: clear fills on current slide, within #fillable only */
function resetCurrent(){
  const svg = state.svgs[state.slideIndex];
  if(!svg) return;
  const fillableRoot = svg.querySelector("#fillable");
  if(!fillableRoot) return;
  const targets = fillableRoot.querySelectorAll("*");
  targets.forEach(el => {
    const orig = el.dataset.origFill || "transparent";
    if(orig === "transparent") el.removeAttribute("fill");
    else el.setAttribute("fill", orig);
  });
}

/* Compute intrinsic size from viewBox or bbox */
function getSvgSize(svg){
  const vb = svg.viewBox && svg.viewBox.baseVal;
  if(vb && (vb.width > 0 && vb.height > 0)){
    return { width: vb.width, height: vb.height, x: vb.x, y: vb.y };
  }
  const bbox = svg.getBBox();
  return { width: bbox.width, height: bbox.height, x: bbox.x, y: bbox.y };
}

/* Download: export full SVG to PNG using intrinsic viewBox/bbox */
async function downloadCurrent(){
  const svg = state.svgs[state.slideIndex];
  if(!svg) return;
  const { width, height, x, y } = getSvgSize(svg);
  const clone = svg.cloneNode(true);
  if(!(clone.getAttribute("viewBox"))){
    clone.setAttribute("viewBox", `${x} ${y} ${width} ${height}`);
  }
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  const xml = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([xml], {type:"image/svg+xml"});
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(width*scale));
    canvas.height = Math.max(1, Math.floor(height*scale));
    const ctx = canvas.getContext("2d");
    ctx.setTransform(scale,0,0,scale,0,0);
    ctx.clearRect(0,0,width,height);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    canvas.toBlob((pngBlob) => {
      triggerDownload(pngBlob, `sneaker-${state.slideIndex+1}.png`);
    }, "image/png");
  };
  img.onerror = () => alert("Export failed. Check the SVG viewBox or try again.");
  img.src = url;
}

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

async function openEyeDropper(){
  if("EyeDropper" in window){
    try{
      const result = await new EyeDropper().open();
      const picker = $("#picker");
      picker.color = result.sRGBHex;
    }catch(e){}
  }else{
    alert("Your browser does not support the EyeDropper API. Try Chrome, Edge, or Opera.");
  }
}

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

function initEvents(){
  $("#eyedropperBtn").addEventListener("click", openEyeDropper);
  $("#resetBtn").addEventListener("click", resetCurrent);
  $("#downloadBtn").addEventListener("click", downloadCurrent);
  $("#nextBtn").addEventListener("click", next);
  $("#prevBtn").addEventListener("click", prev);
  window.addEventListener("keydown", (e)=>{
    if(e.key === "ArrowRight") next();
    if(e.key === "ArrowLeft") prev();
  });
}

document.addEventListener("DOMContentLoaded", async ()=>{
  initPicker();
  initEvents();
  initOverlayTools();
  await loadSlides();
});
