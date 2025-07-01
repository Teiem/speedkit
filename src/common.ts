export const canvas = document.getElementById('canvas') as HTMLCanvasElement;

export const rgbToABGR = (rgb: number) => {
  const r = (rgb >> 16) & 0xFF;
  const g = (rgb >> 8) & 0xFF;
  const b = (rgb >> 0) & 0xFF;
  return 0xFF000000 | (b << 16) | (g << 8) | r;
};

export const easeOut3 = (t: number): number => 1 - Math.pow(1 - t, 3);