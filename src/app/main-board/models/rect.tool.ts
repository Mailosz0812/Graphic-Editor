import {ToolInterface} from './tool.interface';
import {Inject} from '@angular/core';
import {ToolStateService} from '../services/tool-state.service';
import {ShapeService} from '../services/shape.service';
import {DrawingService} from '../services/drawing.service';
import {ShapeModel} from './Shape.model';

export class RectTool implements ToolInterface{
  private startX = 0;
  private startY = 0;
  private size: number = 2;
  constructor(private shapeService: ShapeService) {
  }

  onMouseDown(drawService: DrawingService,mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
    this.startX = mouse.offsetX;
    this.startY = mouse.offsetY;
  }
  onMouseMove(drawService: DrawingService,mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {}

  onMouseUp(drawService: DrawingService,mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
    const startX1 = Math.floor(this.startX);
    const startY1 = Math.floor(this.startY);
    let width = Math.floor(mouse.offsetX) - startX1;
    let height = Math.floor(mouse.offsetY) - startY1;
    let shape = new ShapeModel();
    shape.startY = this.startY;
    shape.startX = this.startX;
    shape.width = width;
    shape.height = height;
    shape.type = 'rectangle';
    shape.controlPoints = [
      {
        posX: startX1,
        posY: startY1,
      },
      {
        posX: startX1 + width,
        posY: startY1
      },
      {
        posX: startX1,
        posY: startY1 + height
      },
      {
        posX: startX1 + width,
        posY: startY1 + height
      }
    ]
    this.shapeService.addShape(shape);
    drawService.drawRectangle(startX1,startY1,width,height,ctx,this.size);
  }

  onMouseClick(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
  }


  draw(params: any, ctx: CanvasRenderingContext2D,drawService: DrawingService): void {
    drawService.drawRectangle(+params.startX,+params.startY,+params.Width,+params.Height,ctx,this.size);
  }
}
