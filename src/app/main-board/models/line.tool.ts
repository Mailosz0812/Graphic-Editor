import {ToolInterface} from './tool.interface';
import {ToolStateService} from '../services/tool-state.service';
import {Inject} from '@angular/core';
import {ShapeService} from '../services/shape.service';
import {DrawingService} from '../services/drawing.service';
import {ShapeModel} from './Shape.model';


export class LineTool implements ToolInterface{
  private startX = 0;
  private startY = 0;
  private size = 2;
  constructor(private shapeService: ShapeService) {
  }
  onMouseDown(drawService: DrawingService,mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
    this.startX = mouse.offsetX;
    this.startY = mouse.offsetY;
  }
  onMouseMove(drawService: DrawingService,mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {}

  onMouseClick(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
  }

  onMouseUp(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
    const startX1 = Math.floor(this.startX);
    const startY1 = Math.floor(this.startY);
    const endX1 = Math.floor(mouse.offsetX);
    const endY1 = Math.floor(mouse.offsetY);
    const shape = new ShapeModel();
    shape.startX = startX1;
    shape.startY = startY1;
    shape.endY = endY1;
    shape.endX = endX1;
    shape.type = 'line';
    shape.controlPoints = [{
      posX: startX1,
      posY: startY1
    },
      {
        posX: endX1,
        posY: endY1
      }
    ];
    let pixels = drawService.drawLine(startX1,startY1,endY1,endX1,ctx,this.size,189, 168, 168);
    shape.pixelBuffer = new Uint8ClampedArray(pixels)
    this.shapeService.addShape(shape);
  }
  draw(params: any, ctx: CanvasRenderingContext2D, drawService: DrawingService): void {
    drawService.drawLine(+params.startX,+params.startY,+params.endY,+params.endX,ctx,this.size,
      189, 168, 168);
  }

}
