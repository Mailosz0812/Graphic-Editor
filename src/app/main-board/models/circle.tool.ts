import {ToolInterface} from './tool.interface';
import {ToolStateService} from '../services/tool-state.service';
import {Inject} from '@angular/core';
import {ShapeService} from '../services/shape.service';
import {DrawingService} from '../services/drawing.service';
import {ShapeModel} from './Shape.model';

export class CircleTool implements ToolInterface{
  private size =2;
  private startX = 0;
  private startY = 0;
  constructor(private shapeService: ShapeService) {
  }

  onMouseDown(drawService: DrawingService,mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
    this.startX = Math.floor(mouse.offsetX);
    this.startY = Math.floor(mouse.offsetY);
  }

  onMouseMove(drawService: DrawingService,mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
  }

  onMouseClick(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
  }


  onMouseUp(drawService: DrawingService,mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
    let powX = Math.pow(Math.floor(mouse.offsetX) - this.startX,2);
    let powY = Math.pow(Math.floor(mouse.offsetY) - this.startY,2);
    let radius = Math.sqrt(powX + powY);
    let shape = new ShapeModel();
    shape.startX = this.startX;
    shape.startY = this.startY;
    shape.radius = radius;
    shape.type = 'circle';
    shape.controlPoints = [
      {
        posX: this.startX,
        posY: this.startY
      },
      {
        posX: this.startX,
        posY: this.startY - radius
      },
    ];
    this.shapeService.addShape(shape);
    drawService.drawCircle(this.startX,this.startY,radius,ctx,this.size);
  }
  draw(params: any, ctx: CanvasRenderingContext2D,drawService: DrawingService): void {
    drawService.drawCircle(+params.centerX,+params.centerY,+params.radius,ctx,this.size);
  }
}
