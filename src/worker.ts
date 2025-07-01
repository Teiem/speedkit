import { compute } from "./compute";

type MessageData = {
  yStart: number;
  yEnd: number;
  width: number;
  height: number;
  offset: {
    x: number;
    y: number;
  };
  zoom: number;
  aspectRatio: number;
  SABView: Uint32Array<SharedArrayBuffer>;
  COLORS: Uint32Array<SharedArrayBuffer>;
};

self.addEventListener('message', ({ data }: { data: MessageData }) => {
  render(data);
  self.postMessage("done");
});

const render = ({ offset, yStart, yEnd, zoom, aspectRatio, height, width, SABView, COLORS }: MessageData) => {
  const stepSize = 1 / zoom;

  const invWidth4 = 1 / (width / 4);
  const invHeight4 = 1 / (height / 4);

  const maxX = width - offset.x;

  let index = yStart * width; // Start index for the yStart row in the flat buffer
  for (let y = yStart; y < yEnd; y++) {
    const imag = (y - offset.y) * stepSize * aspectRatio;

    for (let x = -offset.x; x < maxX; x++) {
      const real = x * stepSize;
      const res = compute(real * invWidth4, imag * invHeight4);
      const color = COLORS[res];

      // Set pixel color in the buffer
      SABView[index++] = color;
    }
  }
};