import { Filter } from './Filter';

class MorphologyBase {
  protected getIdx(x: number, y: number, w: number): number {
    return (y * w + x) * 4;
  }

  protected dilate(src: Uint8ClampedArray, w: number, h: number, se: number[][]): Uint8ClampedArray {
    const dst = new Uint8ClampedArray(src.length);
    const seH = se.length;
    const seW = se[0].length;
    const cy = Math.floor(seH / 2);
    const cx = Math.floor(seW / 2);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let maxVal = 0;

        for (let sy = 0; sy < seH; sy++) {
          for (let sx = 0; sx < seW; sx++) {
            if (se[sy][sx] === 1) {
              const imgY = y + (sy - cy);
              const imgX = x + (sx - cx);

              if (imgX >= 0 && imgX < w && imgY >= 0 && imgY < h) {
                const val = src[(imgY * w + imgX) * 4];
                if (val > maxVal) maxVal = val;
              }
            }
          }
        }

        const idx = (y * w + x) * 4;
        dst[idx] = maxVal;
        dst[idx+1] = maxVal;
        dst[idx+2] = maxVal;
        dst[idx+3] = 255;
      }
    }
    return dst;
  }

  protected erode(src: Uint8ClampedArray, w: number, h: number, se: number[][]): Uint8ClampedArray {
    const dst = new Uint8ClampedArray(src.length);
    const seH = se.length;
    const seW = se[0].length;
    const cy = Math.floor(seH / 2);
    const cx = Math.floor(seW / 2);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let minVal = 255;

        for (let sy = 0; sy < seH; sy++) {
          for (let sx = 0; sx < seW; sx++) {
            if (se[sy][sx] === 1) {
              const imgY = y + (sy - cy);
              const imgX = x + (sx - cx);

              if (imgX >= 0 && imgX < w && imgY >= 0 && imgY < h) {
                const val = src[(imgY * w + imgX) * 4];
                if (val < minVal) minVal = val;
              } else {
                minVal = 0;
              }
            }
          }
        }

        const idx = (y * w + x) * 4;
        dst[idx] = minVal;
        dst[idx+1] = minVal;
        dst[idx+2] = minVal;
        dst[idx+3] = 255;
      }
    }
    return dst;
  }

  protected hitOrMiss(src: Uint8ClampedArray, w: number, h: number, se: number[][]): Uint8ClampedArray {
    const dst = new Uint8ClampedArray(src.length);
    const seH = se.length;
    const seW = se[0].length;
    const cy = Math.floor(seH / 2);
    const cx = Math.floor(seW / 2);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let match = true;

        for (let sy = 0; sy < seH; sy++) {
          for (let sx = 0; sx < seW; sx++) {
            const maskVal = se[sy][sx];
            if (maskVal === -1) continue;

            const imgY = y + (sy - cy);
            const imgX = x + (sx - cx);

            let pixelVal = 0;
            if (imgX >= 0 && imgX < w && imgY >= 0 && imgY < h) {
              pixelVal = src[(imgY * w + imgX) * 4] > 128 ? 255 : 0;
            }

            if (maskVal === 1 && pixelVal !== 255) {
              match = false;
              break;
            }
            if (maskVal === 0 && pixelVal !== 0) {
              match = false;
              break;
            }
          }
          if (!match) break;
        }

        if (match) {
          const idx = (y * w + x) * 4;
          dst[idx] = 255;
          dst[idx+1] = 255;
          dst[idx+2] = 255;
          dst[idx+3] = 255;
        }
      }
    }
    return dst;
  }
}

export class DilationFilter extends MorphologyBase implements Filter {
  filter(imgArray: Uint8ClampedArray, imgW: number, imgH: number, mask: number[][]): Uint8ClampedArray {
    return this.dilate(imgArray, imgW, imgH, mask);
  }
}

export class ErosionFilter extends MorphologyBase implements Filter {
  filter(imgArray: Uint8ClampedArray, imgW: number, imgH: number, mask: number[][]): Uint8ClampedArray {
    return this.erode(imgArray, imgW, imgH, mask);
  }
}

export class OpeningFilter extends MorphologyBase implements Filter {
  filter(imgArray: Uint8ClampedArray, imgW: number, imgH: number, mask: number[][]): Uint8ClampedArray {
    const eroded = this.erode(imgArray, imgW, imgH, mask);
    return this.dilate(eroded, imgW, imgH, mask);
  }
}

export class ClosingFilter extends MorphologyBase implements Filter {
  filter(imgArray: Uint8ClampedArray, imgW: number, imgH: number, mask: number[][]): Uint8ClampedArray {
    const dilated = this.dilate(imgArray, imgW, imgH, mask);
    return this.erode(dilated, imgW, imgH, mask);
  }
}

export class HitOrMissFilter extends MorphologyBase implements Filter {
  filter(imgArray: Uint8ClampedArray, imgW: number, imgH: number, mask: number[][]): Uint8ClampedArray {
    return this.hitOrMiss(imgArray, imgW, imgH, mask);
  }
}

export class ThinningFilter extends MorphologyBase implements Filter {
  filter(imgArray: Uint8ClampedArray, imgW: number, imgH: number, mask: number[][]): Uint8ClampedArray {
    const hitMiss = this.hitOrMiss(imgArray, imgW, imgH, mask);
    const dst = new Uint8ClampedArray(imgArray.length);

    for (let i = 0; i < imgArray.length; i += 4) {
      const original = imgArray[i] > 128 ? 255 : 0;
      const hm = hitMiss[i];
      let val = 0;
      if (original === 255 && hm === 0) val = 255;
      else if (original === 255 && hm === 255) val = 0;
      else val = 0;

      dst[i] = val;
      dst[i+1] = val;
      dst[i+2] = val;
      dst[i+3] = 255;
    }
    return dst;
  }
}

export class ThickeningFilter extends MorphologyBase implements Filter {
  filter(imgArray: Uint8ClampedArray, imgW: number, imgH: number, mask: number[][]): Uint8ClampedArray {
    const hitMiss = this.hitOrMiss(imgArray, imgW, imgH, mask);
    const dst = new Uint8ClampedArray(imgArray.length);

    for (let i = 0; i < imgArray.length; i += 4) {
      const original = imgArray[i] > 128 ? 255 : 0;
      const hm = hitMiss[i];
      const val = (original === 255 || hm === 255) ? 255 : 0;

      dst[i] = val;
      dst[i+1] = val;
      dst[i+2] = val;
      dst[i+3] = 255;
    }
    return dst;
  }
}
