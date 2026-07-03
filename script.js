const canvas = document.getElementById('paintCanvas');
const ctx = canvas.getContext('2d');
const colorPalette = document.getElementById('colorPalette');
const brushSizeInput = document.getElementById('brushSize');
const brushSizeValue = document.getElementById('brushSizeValue');
const clearButton = document.getElementById('clearButton');

let drawing = false;
let brushColor = '#1e88e5';
let brushSize = Number(brushSizeInput.value);
let lastPoint = null;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const temp = document.createElement('canvas');
  temp.width = canvas.width;
  temp.height = canvas.height;
  temp.getContext('2d').drawImage(canvas, 0, 0);

  canvas.width = Math.floor(rect.width * window.devicePixelRatio);
  canvas.height = Math.floor(rect.height * window.devicePixelRatio);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = brushSize;
  ctx.strokeStyle = brushColor;
  ctx.drawImage(temp, 0, 0, rect.width, rect.height);
}

function startPaint(event) {
  drawing = true;
  lastPoint = getPointer(event);
}

function stopPaint() {
  drawing = false;
  lastPoint = null;
}

function getPointer(event) {
  const rect = canvas.getBoundingClientRect();
  const pointer = event.touches ? event.touches[0] : event;
  return {
    x: pointer.clientX - rect.left,
    y: pointer.clientY - rect.top,
  };
}

function paint(event) {
  if (!drawing) return;
  event.preventDefault();
  const point = getPointer(event);
  if (!lastPoint) {
    lastPoint = point;
    return;
  }

  ctx.strokeStyle = brushColor;
  ctx.lineWidth = brushSize;
  ctx.beginPath();
  ctx.moveTo(lastPoint.x, lastPoint.y);
  ctx.lineTo(point.x, point.y);
  ctx.stroke();
  lastPoint = point;
}

colorPalette.addEventListener('click', event => {
  const button = event.target.closest('.color-swatch');
  if (!button) return;

  brushColor = button.dataset.color;
  document.querySelectorAll('.color-swatch').forEach(swatch => swatch.classList.remove('selected'));
  button.classList.add('selected');
});

brushSizeInput.addEventListener('input', event => {
  brushSize = Number(event.target.value);
  brushSizeValue.textContent = brushSize;
});

clearButton.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

canvas.addEventListener('mousedown', startPaint);
canvas.addEventListener('touchstart', startPaint, { passive: true });
canvas.addEventListener('mousemove', paint);
canvas.addEventListener('touchmove', paint, { passive: false });
canvas.addEventListener('mouseup', stopPaint);
canvas.addEventListener('mouseleave', stopPaint);
canvas.addEventListener('touchend', stopPaint);
canvas.addEventListener('touchcancel', stopPaint);

window.addEventListener('resize', () => {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = brushSize;
  ctx.strokeStyle = brushColor;
});

window.addEventListener('load', () => {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = brushSize;
  ctx.strokeStyle = brushColor;
});
