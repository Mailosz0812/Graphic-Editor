import {Filter} from './Filter';

export class BoxBlur implements Filter{
  constructor() {}

  filter(imgArray: Uint8ClampedArray, imgW: number, imgH: number, mask: number): Uint8ClampedArray {
    if (mask !== 9 && mask !== 25) {
      return imgArray;
    }

    const dst = new Uint8ClampedArray(imgArray.length);
    const side = Math.sqrt(mask);
    const half = Math.floor(side / 2);

    for (let y = 0; y < imgH; y++) {
      for (let x = 0; x < imgW; x++) {
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;

        for (let ky = -half; ky <= half; ky++) {
          for (let kx = -half; kx <= half; kx++) {
            const ny = y + ky;
            const nx = x + kx;

            if (nx >= 0 && nx < imgW && ny >= 0 && ny < imgH) {
              const idx = (ny * imgW + nx) * 4;
              r += imgArray[idx];
              g += imgArray[idx + 1];
              b += imgArray[idx + 2];
              count++;
            }
          }
        }

        const i = (y * imgW + x) * 4;
        dst[i] = r / count;
        dst[i + 1] = g / count;
        dst[i + 2] = b / count;
        dst[i + 3] = imgArray[i + 3];
      }
    }

    return dst;
  }
}
