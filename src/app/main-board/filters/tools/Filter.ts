export interface Filter{
  filter(imgArray: Uint8ClampedArray, imgW: number, imgH: number, mask: number | number[][]): Uint8ClampedArray;
}
