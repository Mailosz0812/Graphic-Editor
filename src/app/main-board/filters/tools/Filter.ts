export interface Filter{
  filter(imgArray: Uint8ClampedArray, imgW: number, imgH: number, mask: number): Uint8ClampedArray;
}
