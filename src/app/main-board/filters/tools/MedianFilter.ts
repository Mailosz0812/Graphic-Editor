import {Filter} from './Filter';

export class MedianFilter implements Filter {
  filter(imgArray: Uint8ClampedArray, imgW: number, imgH: number, mask: number): Uint8ClampedArray {
    let newArray = new Uint8ClampedArray(imgArray.length);

    for (let y = 0; y < imgH; y++) {
      for (let x = 0; x < imgW; x++) {

        const idx = (y * imgW + x) * 4;

        // Skipping a frame with wide of 1px
        if (y === 0 || y === imgH - 1 || x === 0 || x === imgW - 1) {
          newArray[idx] = imgArray[idx];
          newArray[idx + 1] = imgArray[idx + 1];
          newArray[idx + 2] = imgArray[idx + 2];
          newArray[idx + 3] = imgArray[idx + 3];
          continue;
        }

        const rTable: number[] = [];
        const gTable: number[] = [];
        const bTable: number[] = [];

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const neighborIdx = ((y + dy) * imgW + (x + dx)) * 4;
            rTable.push(imgArray[neighborIdx]);
            gTable.push(imgArray[neighborIdx + 1]);
            bTable.push(imgArray[neighborIdx + 2]);
          }
        }
        rTable.sort((a, b) => a - b);
        gTable.sort((a, b) => a - b);
        bTable.sort((a, b) => a - b);
        newArray[idx] = rTable[4];
        newArray[idx + 1] = gTable[4];
        newArray[idx + 2] = bTable[4];
        newArray[idx + 3] = imgArray[idx + 3];
      }
    }

    return newArray;
  }

}
