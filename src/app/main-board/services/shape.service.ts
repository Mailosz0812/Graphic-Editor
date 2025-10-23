import { Injectable } from '@angular/core';
import {ShapeModel} from '../models/Shape.model';
import {DrawingService} from './drawing.service';

@Injectable({
  providedIn: 'root'
})
export class ShapeService {
  private _shapes: ShapeModel[] = [];
  private id: number = 0;
  private size: number = 2;
  catchedShape!: ShapeModel | null;

  constructor(private drawService: DrawingService) { }

  addShape(shape: ShapeModel){
    shape.id = this.id++;
    this._shapes.push(shape);
  }
  deleteShapes(){
    this._shapes = [];
    this.catchedShape = null;
  }
  set shapes(shapes: ShapeModel[]){
    this._shapes = shapes;
  }
  get shapes(){
    return this._shapes;
  }
  checkPosition(posX: number,posY:number,ctx: CanvasRenderingContext2D):number{
    if(this.catchedShape){
      this.catchedShape.unfocusPoints(ctx,this.drawService)
      this.catchedShape = null;
    }
    let posX1 = Math.floor(posX);
    let posY1 = Math.floor(posY);
    for (const shape of this._shapes) {
      const index = this.checkFocusPoints(posX1, posY1, shape.controlPoints);
      if (index !== -1) {
        this.catchedShape = shape;
        return index;
      }
    }
    return -1;
  }
  drawAll(ctx: CanvasRenderingContext2D){
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height)
    this._shapes.forEach(shape => {
      if(shape.type === 'line'){
        this.drawService.drawLine(shape.startX,shape.startY
        ,shape.endY!,shape.endX!,ctx,this.size)
      }
      else if(shape.type === 'circle'){
        this.drawService.drawCircle(shape.startX,shape.startY,shape.radius!,ctx,this.size)
      }
      else if(shape.type === 'rectangle'){
        this.drawService.drawRectangle(shape.startX,shape.startY,shape.width!,shape.height!,ctx,this.size)
      }
    })
  }

  private checkFocusPoints(x: number, y:number, pointsArray: {posX: number, posY: number}[]){
    let pointIndex: number = -1;
    pointsArray.forEach((point,index) => {
      if((x >= point.posX - 5 && x <= point.posX + 5) && (y >= point.posY - 5 && y <= point.posY + 5)){
        pointIndex = index;
      }
    })
    return pointIndex;
  }


}
