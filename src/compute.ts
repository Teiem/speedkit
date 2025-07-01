import { MAX_ITERATIONS } from "./config";

// mandelbrot set
export const compute = (cx: number, cy: number): number => {
  let x = 0;
  let y = 0;
  let i = 0;

  while (x ** 2 + y ** 2 < 4 && i < (MAX_ITERATIONS - 1)) {
    const tmp = x ** 2 - y ** 2 + cx;
    y = 2 * x * y + cy;
    x = tmp;
    i++;
  }

  return i;
};