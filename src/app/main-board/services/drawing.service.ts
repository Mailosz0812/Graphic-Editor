import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DrawingService {

  constructor() { }

  drawPixel(x:number,y:number, canvasRender: CanvasRenderingContext2D,size: number,r: number,g: number, b: number): {posX: number,posY: number}{
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
    return {posX,posY};
  }
  drawLine(startX:number,startY:number,endY:number,endX:number
    ,ctx: CanvasRenderingContext2D,size: number): {posX: number, posY: number}[]{

    let pointsArray: {posX: number, posY: number}[] = [];
    let dx = Math.abs(endX - startX);
    let dy = Math.abs(endY - startY);
    let sx = startX < endX ? 1 : -1;
    let sy = startY < endY ? 1 : -1;
    let err = dx - dy;
    while(true){
      pointsArray.push(this.drawPixel(startX, startY, ctx,size,189,168,168));

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
  drawRectangle(startX: number,startY:number,width:number, height:number,ctx: CanvasRenderingContext2D,size: number): {posX: number, posY: number}[]{
    const rightTopX = startX + width;
    const leftBottomY = startY + height;
    let pointsArray:{posX: number, posY: number}[] = [];
    pointsArray.push(... this.drawLine(startX,startY,startY,rightTopX,ctx,size));
    pointsArray.push(... this.drawLine(startX,startY,leftBottomY,startX,ctx,size));
    pointsArray.push(... this.drawLine(rightTopX,startY,leftBottomY, rightTopX,ctx,size));
    pointsArray.push(... this.drawLine(startX,leftBottomY,leftBottomY,rightTopX,ctx,size));
    return pointsArray;
  }
  drawCircle(centerX: number,centerY:number, radius: number,ctx: CanvasRenderingContext2D,size: number): {posX: number, posY: number}[]{
    let posX = 0;
    let posY = radius;
    let pointsArray: {posX: number, posY: number}[] = [this.drawPixel(centerX + posX,centerY + posY,ctx,size,189,168,168)];
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
            pointsArray.push(this.drawPixel(centerX + dx * sx, centerY + dy * sy, ctx,size,189,168,168));
          }
        }
      }
    }
    return pointsArray;
  }
  drawGrid(ctx: CanvasRenderingContext2D){
    const spacing: number = 8;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    ctx.save();

    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= width; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(width, y + 0.5);
      ctx.stroke();
    }


    ctx.restore();
  }
}
