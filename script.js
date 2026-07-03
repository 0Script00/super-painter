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
}

function setTool(tool) {
  currentTool = tool;
  document.querySelectorAll('.tool-button').forEach(button => {
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
