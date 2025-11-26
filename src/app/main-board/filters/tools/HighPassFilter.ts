import {Filter} from './Filter';

export class HighPassFilter implements Filter{
  private laplaceMask: number[][] = [[-1,-1,-1],[-1,8,-1],[-1,-1,-1]];

  filter(imgArray: Uint8ClampedArray, imgW: number, imgH: number, mask: number): Uint8ClampedArray {
    let newArray: Uint8ClampedArray = new Uint8ClampedArray(imgArray.length);

    for(let y = 0; y < imgH; y++){
      for(let x = 0; x < imgW; x++){
        const currIdx = (y * imgW + x) * 4;

        if (y === 0 || y === imgH - 1 || x === 0 || x === imgW - 1) {
          continue;
        }

        let sum = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const neighborIdx = ((y + dy) * imgW + (x + dx)) * 4;
            const val = imgArray[neighborIdx];
            sum += val * this.laplaceMask[dy + 1][dx + 1];
          }
        }
        newArray[currIdx] = sum;
        newArray[currIdx + 1] = sum;
        newArray[currIdx + 2] = sum;
        newArray[currIdx + 3] = 255;
      }
    }
    return newArray;
  }





}
