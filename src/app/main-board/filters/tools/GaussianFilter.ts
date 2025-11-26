import {Filter} from './Filter';

export class GaussianFilter implements Filter {
  private mask = [[1,2,1],[2,4,2],[1,2,1]];
  filter(imgArray: Uint8ClampedArray, imgW: number, imgH: number, mask: number): Uint8ClampedArray {
    let newArray: Uint8ClampedArray = new Uint8ClampedArray(imgArray.length);

    for(let y = 0; y < imgH; y++){
      for(let x = 0; x < imgW; x++){
        let currIdx:number = (y * imgW + x) *4;
        if (y === 0 || y === imgH - 1 || x === 0 || x === imgW - 1) {
          continue;
        }

        let sum = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const neighborIdx = ((y + dy) * imgW + (x + dx)) * 4;
            const val = imgArray[neighborIdx];
            sum += val * this.mask[dy + 1][dx + 1];
          }
        }
        sum = sum / 16;
        newArray[currIdx] = sum;
        newArray[currIdx + 1] = sum;
        newArray[currIdx + 2] = sum;
        newArray[currIdx + 3] = 255;
      }
    }
    return newArray;
  }

}
