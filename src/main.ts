import { canvas, easeOut3, rgbToABGR } from "./common.ts";
import { BLUE, MAX_ITERATIONS, svgPath, WHITE } from "./config";
import "./interaction.ts";

const ctx = canvas.getContext('2d')!;

const width = window.innerWidth;
const height = window.innerHeight;
canvas.width = width;
canvas.height = height;

const aspectRatio = (height / width);

ctx.fillStyle = 'black';
ctx.fillRect(0, 0, width, height);

export const offset = { x: width / 2, y: height / 2 };
export const zoom = {
  value: 1,
}

const data = ctx.createImageData(width, height);
const sharedArrayBuffer = new SharedArrayBuffer(data.data.length);

const SABView8 = new Uint8ClampedArray(sharedArrayBuffer);
const SABView32 = new Uint32Array(sharedArrayBuffer);

const arrayBuffer = new ArrayBuffer(data.data.length);
const arrayBuffer8 = new Uint8ClampedArray(arrayBuffer);
const imgData = new ImageData(arrayBuffer8, width, height);

const path = new Path2D(svgPath);

const workers = Array.from({ length: navigator.hardwareConcurrency * 3 / 4 }, () =>
  new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
);

const START_COLOR = rgbToABGR(WHITE);
const END_COLOR = rgbToABGR(BLUE);
const FILL_COLOR = rgbToABGR(WHITE);

const preComputeColors = () => {
  const colorsSAB = new SharedArrayBuffer(MAX_ITERATIONS * 4);
  const colors = new Uint32Array(colorsSAB);

  const START_R = (START_COLOR >> 0) & 0xFF;
  const START_G = (START_COLOR >> 8) & 0xFF;
  const START_B = (START_COLOR >> 16) & 0xFF;
  const END_R = (END_COLOR >> 0) & 0xFF;
  const END_G = (END_COLOR >> 8) & 0xFF;
  const END_B = (END_COLOR >> 16) & 0xFF;

  const DIFF_R = END_R - START_R;
  const DIFF_G = END_G - START_G;
  const DIFF_B = END_B - START_B;

  for (let i = 0; i < MAX_ITERATIONS - 1; i++) {
    const t = easeOut3(i / (MAX_ITERATIONS - 2));

    colors[i] = (
      (Math.floor(START_R + DIFF_R * t) & 0xFF) |
      ((Math.floor(START_G + DIFF_G * t) & 0xFF) << 8) |
      ((Math.floor(START_B + DIFF_B * t) & 0xFF) << 16) |
      0xFF000000 // Alpha channel set to 255 (opaque)
    );
  }

  colors[MAX_ITERATIONS - 1] = FILL_COLOR; // Last color for points outside the set
  return colors;
};

const COLORS = preComputeColors();

const render = async () => {
  let currentY = 0;
  const step = Math.ceil(height / workers.length / 8);

  await Promise.all(workers.map(async worker => {
    while (currentY < height) {
      const yStart = currentY;
      const yEnd = Math.min(currentY + step, height);
      currentY += step;

      await queWorker(worker, yStart, yEnd);
    }
  }));

  arrayBuffer8.set(SABView8);
  ctx.putImageData(imgData, 0, 0);

  ctx.save();

  const iconSize = 25;
  const iconScale = 5;
  const iconOffsetX = -25;
  ctx.translate(offset.x - (iconSize - iconOffsetX) / 2 * iconScale * zoom.value, offset.y - iconSize / 2 * iconScale * zoom.value);
  ctx.scale(zoom.value * iconScale, zoom.value * iconScale);

  ctx.fillStyle = '#4d93fe';
  ctx.fill(path);

  ctx.restore();
};

const queWorker = async (worker: Worker, yStart: number, yEnd: number): Promise<void> => new Promise((resolve) => {
  worker.addEventListener('message', () => resolve(), { once: true });

  worker.postMessage({
    yStart,
    yEnd,
    width,
    height,
    offset,
    zoom: zoom.value,
    aspectRatio,
    SABView: SABView32,
    COLORS: COLORS,
  });
});

let renderIsQueued = false;
export const queRender = () => {
  if (renderIsQueued) return;
  renderIsQueued = true;

  requestAnimationFrame(async () => {
    const startTime = performance.now();
    await render();
    const endTime = performance.now();
    console.log(`Rendering took ${endTime - startTime} milliseconds`);

    renderIsQueued = false;
  });
};

queRender();