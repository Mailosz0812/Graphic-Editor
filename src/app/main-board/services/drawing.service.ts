import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DrawingService {

  constructor() { }

  drawPixel(x:number,y:number, canvasRender: CanvasRenderingContext2D,size: number,r: number,g: number, b: number): Uint8ClampedArray{
    const posX = Math.floor(x);
    const posY = Math.floor(y);
    const data = canvasRender.getImageData(posX - size,posY - size,size*2,size*2);
    const imageData = data.data;

    for(let i = 0; i < imageData.length; i+=4){
      imageData[i] = r;
      imageData[i + 1] = g;
      imageData[i + 2] = b;
      imageData[i + 3] = 255;
    }
    canvasRender.putImageData(data,posX,posY);
    return imageData;
  }

  drawLine(startX:number,startY:number,endY:number,endX:number,
           ctx: CanvasRenderingContext2D, size: number,
           r: number, g: number, b: number): number[]{

    let pointsArray: number[] = [];
    let dx = Math.abs(endX - startX);
    let dy = Math.abs(endY - startY);
    let sx = startX < endX ? 1 : -1;
    let sy = startY < endY ? 1 : -1;
    let err = dx - dy;
    while(true){
      pointsArray.push(... this.drawPixel(startX, startY, ctx,size,r,g,b));

      if (startX === endX && startY === endY) break;

      const e2 = 2 * err;

      if (e2 > -dy) {
        err -= dy;
        startX += sx;
      }

      if (e2 < dx) {
        err += dx;
        startY += sy;
      }
    }
    return pointsArray;
  }
  drawRectangle(startX: number,startY:number,width:number, height:number,ctx: CanvasRenderingContext2D,size: number): number[]{
    const rightTopX = startX + width;
    const leftBottomY = startY + height;
    let pointsArray:number [] = [];
    pointsArray.push(... this.drawLine(startX,startY,startY,rightTopX,ctx,size, 189, 168, 168));
    pointsArray.push(... this.drawLine(startX,startY,leftBottomY,startX,ctx,size, 189, 168, 168));
    pointsArray.push(... this.drawLine(rightTopX,startY,leftBottomY, rightTopX,ctx,size, 189, 168, 168));
    pointsArray.push(... this.drawLine(startX,leftBottomY,leftBottomY,rightTopX,ctx,size, 189, 168, 168));
    return pointsArray;
  }
  drawCircle(centerX: number,centerY:number, radius: number,ctx: CanvasRenderingContext2D,size: number): number[]{
    let posX = 0;
    let posY = radius;
    let pointsArray: number[] = [];
    pointsArray.push(... this.drawPixel(centerX + posX,centerY + posY,ctx,size,189,168,168))
    while(true){
      if(posX > posY) break;
      posX++;
      let fXYValue = Math.pow(posX,2) + Math.pow(posY,2) - Math.pow(radius,2);
      if(fXYValue > 0){
        posY--;
      }
      else if(fXYValue < 0){
        posY++;
      }
      for(const [dx,dy] of [[posX,posY],[posY,posX]]) {
        for(const sx of [1,-1]){
          for (const sy of [1,-1]){
            pointsArray.push(... this.drawPixel(centerX + dx * sx, centerY + dy * sy, ctx,size,189,168,168));
          }
        }
      }
    }
    return pointsArray;
  }
}
