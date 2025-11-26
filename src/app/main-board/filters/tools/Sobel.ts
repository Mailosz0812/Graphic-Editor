import {Filter} from './Filter';

export class SobelFilter implements Filter {
  filter(imgArray: Uint8ClampedArray, imgW: number, imgH: number, mask: number): Uint8ClampedArray {
    let newArray: Uint8ClampedArray = new Uint8ClampedArray(imgArray.length);
    let xMask = [[-1,0,1],[-2,0,2],[-1,0,1]];
    let yMask = [[-1,-2,-1],[0,0,0],[1,2,1]];

    for (let y = 0; y < imgH; y++) {
      for (let x = 0; x < imgW; x++) {

        const currIdx = (y * imgW + x) * 4;

        // Skipping a frame with wide of 1px
        if (y === 0 || y === imgH - 1 || x === 0 || x === imgW - 1) {
          newArray[currIdx] = 0;
          newArray[currIdx + 1] = 0;
          newArray[currIdx + 2] = 0;
          newArray[currIdx + 3] = 255;
          continue;
        }

        let sumX = 0;
        let sumY = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const neighborIdx = ((y + dy) * imgW + (x + dx)) * 4;
            const val = imgArray[neighborIdx];
            sumX += val * xMask[dy + 1][dx + 1];
            sumY += val * yMask[dy + 1][dx + 1];
          }
        }

        const magnitude = Math.sqrt(sumX * sumX + sumY * sumY);
        newArray[currIdx] = magnitude;
        newArray[currIdx + 1] = magnitude;
        newArray[currIdx + 2] = magnitude;
        newArray[currIdx + 3] = 255;
      }
    }
    return newArray;
  }

}
