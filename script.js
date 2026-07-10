const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d');
const colorPalette = document.getElementById('colorPalette');
const brushSizeInput = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');
const clearButton = document.getElementById('clearButton');
const toolGroup = document.getElementById('toolGroup');
const hueInput = document.getElementById('hue');
const saturationInput = document.getElementById('saturation');
const brightnessInput = document.getElementById('brightness');
const opacityInput = document.getElementById('opacity');
const hueValue = document.getElementById('hueValue');
const saturationValue = document.getElementById('saturationValue');
const brightnessValue = document.getElementById('brightnessValue');
const opacityValue = document.getElementById('opacityValue');
const colorPreview = document.getElementById('colorPreview');
const canvasWidthInput = document.getElementById('canvasWidth');
const canvasHeightInput = document.getElementById('canvasHeight');
const resizeButton = document.getElementById('resizeButton');

let currentTool = 'brush';
let drawing = false;
let brushColor = 'rgba(30, 136, 229, 1)';
let brushSize = Number(brushSizeInput.value);
let hue = Number(hueInput.value);
let saturation = Number(saturationInput.value);
let brightness = Number(brightnessInput.value);
let alpha = Number(opacityInput.value) / 100;
let lastPoint = null;
let lineStart = null;
let lineBackup = null;

function hsbToHex(h, s, b) {
  s /= 100;
  b /= 100;
  const k = n => (n + h / 60) % 6;
  const f = n => b - b * s * Math.max(Math.min(k(n), 4 - k(n), 1), 0);
  const rgb = [f(5), f(3), f(1)].map(v => Math.round(v * 255));
  return `#${rgb.map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

function hsbToRgba(h, s, b, a) {
  const hex = hsbToHex(h, s, b);
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const blue = bigint & 255;
  return `rgba(${r}, ${g}, ${blue}, ${a})`;
}

function hexToHsb(hex) {
  const matched = hex.replace('#', '');
  const bigint = parseInt(matched, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === rf) h = ((gf - bf) / delta) % 6;
    else if (max === gf) h = (bf - rf) / delta + 2;
    else h = (rf - gf) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : Math.round((delta / max) * 100);
  const v = Math.round(max * 100);
  return { h, s, v };
}

function updateColorFromHsb() {
  brushColor = hsbToRgba(hue, saturation, brightness, alpha);
  colorPreview.style.background = brushColor;
  hueValue.textContent = hue;
  saturationValue.textContent = `${saturation}%`;
  brightnessValue.textContent = `${brightness}%`;
  opacityValue.textContent = `${Math.round(alpha * 100)}%`;
  updateSliderBackgrounds();
}

function updateSliderBackgrounds() {
  // Hue: rainbow gradient
  const hueGradient = 'linear-gradient(90deg,' +
    Array.from({length:7}).map((_,i)=> `hsl(${i*60},100%,50%)`).join(',') + ')';
  hueInput.style.background = hueGradient;

  // Saturation: from gray to full color at current hue
  saturationInput.style.background = `linear-gradient(90deg, hsl(${hue},0%,50%), hsl(${hue},100%,50%))`;

  // Brightness: from black to color at current saturation
  brightnessInput.style.background = `linear-gradient(90deg, black, hsl(${hue},${saturation}%,50%))`;

  // Opacity: from transparent to current color
  const solid = hsbToRgba(hue, saturation, brightness, 1);
  opacityInput.style.background = `linear-gradient(90deg, rgba(0,0,0,0), ${solid})`;
}

// --- Color wheel implementation ---
const colorWheel = document.getElementById('colorWheel');
const wheelPointer = document.getElementById('wheelPointer');
const wheelCtx = colorWheel ? colorWheel.getContext('2d') : null;

function hsvToRgb(h, s, v) {
  s /= 100; v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (0 <= h && h < 60) [r,g,b]=[c,x,0];
  else if (60 <= h && h < 120) [r,g,b]=[x,c,0];
  else if (120 <= h && h < 180) [r,g,b]=[0,c,x];
  else if (180 <= h && h < 240) [r,g,b]=[0,x,c];
  else if (240 <= h && h < 300) [r,g,b]=[x,0,c];
  else [r,g,b]=[c,0,x];
  return [Math.round((r+m)*255), Math.round((g+m)*255), Math.round((b+m)*255)];
}

function drawColorWheel() {
  if (!wheelCtx) return;
  const w = colorWheel.width;
  const h = colorWheel.height;
  const img = wheelCtx.createImageData(w, h);
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(cx, cy) - 1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const d = Math.sqrt(dx*dx + dy*dy);
      const idx = (y * w + x) * 4;
      if (d <= radius) {
        let angle = Math.atan2(dy, dx) * 180 / Math.PI;
        if (angle < 0) angle += 360;
        const sat = Math.round((d / radius) * 100);
        const val = 100;
        const [r,g,b] = hsvToRgb(angle, sat, val);
        img.data[idx] = r;
        img.data[idx+1] = g;
        img.data[idx+2] = b;
        img.data[idx+3] = 255;
      } else {
        img.data[idx] = 0;
        img.data[idx+1] = 0;
        img.data[idx+2] = 0;
        img.data[idx+3] = 0;
      }
    }
  }
  wheelCtx.putImageData(img, 0, 0);
}

function setWheelPointer(x, y) {
  if (!wheelPointer) return;
  // position pointer inside the wrapper (wrapper is position:relative)
  wheelPointer.style.left = `${x}px`;
  wheelPointer.style.top = `${y}px`;
  wheelPointer.style.position = 'absolute';
}

function handleWheelPointer(clientX, clientY) {
  const rect = colorWheel.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const cx = colorWheel.width / 2;
  const cy = colorWheel.height / 2;
  const dx = x - cx;
  const dy = y - cy;
  const r = Math.sqrt(dx*dx + dy*dy);
  const radius = Math.min(cx, cy) - 1;
  if (r > radius) return; // outside
  let angle = Math.atan2(dy, dx) * 180 / Math.PI;
  if (angle < 0) angle += 360;
  const sat = Math.round((r / radius) * 100);
  hue = Math.round(angle);
  saturation = sat;
  hueInput.value = hue;
  saturationInput.value = saturation;
  updateColorFromHsb();
  setWheelPointer(x, y);
}

if (colorWheel) {
  drawColorWheel();
  let dragging = false;
  colorWheel.addEventListener('pointerdown', e => { dragging = true; colorWheel.setPointerCapture(e.pointerId); handleWheelPointer(e.clientX, e.clientY); });
  window.addEventListener('pointermove', e => { if (dragging) handleWheelPointer(e.clientX, e.clientY); });
  window.addEventListener('pointerup', e => { dragging = false; if (colorWheel) colorWheel.releasePointerCapture?.(e.pointerId); });
  // position pointer initially
  const cx = colorWheel.width / 2;
  const cy = colorWheel.height / 2;
  const angleRad = (hue) * Math.PI / 180;
  const initR = (saturation / 100) * (Math.min(colorWheel.width, colorWheel.height) / 2 - 1);
  const px = cx + Math.cos(angleRad) * initR;
  const py = cy + Math.sin(angleRad) * initR;
  setWheelPointer(px, py);
}

function setTool(tool) {
  currentTool = tool;
  document.querySelectorAll('.tool-button').forEach(button => {
    button.classList.toggle('selected', button.dataset.tool === tool);
  });
  document.querySelectorAll('.side-tool').forEach(button => {
    button.classList.toggle('selected', button.dataset.tool === tool);
  });
}

function preserveCanvasContent(newWidth, newHeight) {
  const temp = document.createElement('canvas');
  temp.width = canvas.width;
  temp.height = canvas.height;
  temp.getContext('2d').drawImage(canvas, 0, 0);

  canvas.width = newWidth;
  canvas.height = newHeight;
  canvas.style.width = `${newWidth}px`;
  canvas.style.height = `${newHeight}px`;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, newWidth, newHeight);
  ctx.drawImage(temp, 0, 0, newWidth, newHeight);
}

function getPointer(event) {
  const rect = canvas.getBoundingClientRect();
  const point = event.touches ? event.touches[0] : event;
  return {
    x: point.clientX - rect.left,
    y: point.clientY - rect.top,
  };
}

function drawStroke(from, to) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = brushSize;
  if (currentTool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = brushColor;
  }
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

function startDraw(event) {
  event.preventDefault();
  drawing = true;
  lastPoint = getPointer(event);
  if (currentTool === 'line') {
    lineStart = lastPoint;
    lineBackup = ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
}

function moveDraw(event) {
  if (!drawing) return;
  event.preventDefault();
  const point = getPointer(event);
  if (currentTool === 'line') {
    ctx.putImageData(lineBackup, 0, 0);
    drawStroke(lineStart, point);
    return;
  }
  drawStroke(lastPoint, point);
  lastPoint = point;
}

function endDraw() {
  if (!drawing) return;
  if (currentTool === 'line' && lineStart) {
    const point = lastPoint;
    ctx.putImageData(lineBackup, 0, 0);
    drawStroke(lineStart, point);
  }
  drawing = false;
  lastPoint = null;
  lineStart = null;
  lineBackup = null;
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

opacityInput.addEventListener('input', event => {
  alpha = Number(event.target.value) / 100;
  updateColorFromHsb();
});

function applyCanvasSize() {
  const width = Number(canvasWidthInput.value);
  const height = Number(canvasHeightInput.value);
  if (!width || !height) return;
  preserveCanvasContent(width, height);
}

colorPalette.addEventListener('click', event => {
  const swatch = event.target.closest('.color-swatch');
  if (!swatch) return;
  const selectedColor = swatch.dataset.color;
  document.querySelectorAll('.color-swatch').forEach(button => button.classList.remove('selected'));
  swatch.classList.add('selected');
  const hsb = hexToHsb(selectedColor);
  hue = hsb.h;
  saturation = hsb.s;
  brightness = hsb.v;
  hueInput.value = hue;
  saturationInput.value = saturation;
  brightnessInput.value = brightness;
  updateColorFromHsb();
});

toolGroup.addEventListener('click', event => {
  const button = event.target.closest('.tool-button');
  if (!button) return;
  setTool(button.dataset.tool);
});

// side-toolbar (left) interaction
const sideToolbar = document.querySelector('.side-toolbar');
if (sideToolbar) {
  sideToolbar.addEventListener('click', event => {
    const btn = event.target.closest('.side-tool');
    if (!btn) return;
    setTool(btn.dataset.tool);
  });
}

brushSizeInput.addEventListener('input', event => {
  brushSize = Number(event.target.value);
  brushSizeValue.textContent = brushSize;
});

[hueInput, saturationInput, brightnessInput, opacityInput].forEach(input => {
  input.addEventListener('input', () => {
    hue = Number(hueInput.value);
    saturation = Number(saturationInput.value);
    brightness = Number(brightnessInput.value);
    alpha = Number(opacityInput.value) / 100;
    updateColorFromHsb();
    document.querySelectorAll('.color-swatch').forEach(button => button.classList.remove('selected'));
  });
});

clearButton.addEventListener('click', clearCanvas);
resizeButton.addEventListener('click', applyCanvasSize);

canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('touchstart', startDraw, { passive: false });
canvas.addEventListener('mousemove', moveDraw);
canvas.addEventListener('touchmove', moveDraw, { passive: false });
canvas.addEventListener('mouseup', endDraw);
canvas.addEventListener('mouseleave', endDraw);
canvas.addEventListener('touchend', endDraw);
canvas.addEventListener('touchcancel', endDraw);

window.addEventListener('load', () => {
  const width = Number(canvasWidthInput.value);
  const height = Number(canvasHeightInput.value);
  preserveCanvasContent(width, height);
  updateColorFromHsb();
});
