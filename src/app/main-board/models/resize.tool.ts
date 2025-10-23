import {ToolInterface} from './tool.interface';
import {DrawingService} from '../services/drawing.service';
import {ShapeService} from '../services/shape.service';
import {ShapeModel} from './Shape.model';

export class ResizeTool implements ToolInterface {
  private lastX: number = 0;
  private lastY: number = 0;
  private pointIndex: number = -1;
  constructor(private shapeService: ShapeService) {
  }

  draw(params: any, ctx: CanvasRenderingContext2D): void {
    if (this.shapeService.catchedShape) {
      const shape = this.shapeService.catchedShape;
      const percent: number = +params.percent / 100;
      if (shape.type === 'line') {
        let dx: number = shape.endX! - shape.startX;
        let dy: number = shape.endY! - shape.startY;
        shape.endX! += Math.floor(dx * percent);
        shape.endY! += Math.floor(dy * percent);
        shape.controlPoints[0].posX = shape.startX
        shape.controlPoints[0].posY = shape.startY
        shape.controlPoints[1].posX = shape.endX!
        shape.controlPoints[1].posY = shape.endY!
      }
      else if(shape.type === 'rectangle'){
        this.pointIndex = 3;
        shape.controlPoints[this.pointIndex].posX+=Math.floor(shape.width! * percent);
        shape.controlPoints[this.pointIndex].posY+=Math.floor(shape.height! *  percent);
        this.updateRectangleFromControlPoints(shape);
      }
      else if(shape.type === 'circle'){
         this.pointIndex = 1;
        shape.controlPoints[this.pointIndex].posY-=Math.floor(shape.radius! *  percent);
        this.updateCircleFromControlPoints(shape)
      }
      this.shapeService.drawAll(ctx);
    }
  }

  onMouseDown(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
    this.pointIndex = this.shapeService.checkPosition(mouse.offsetX,mouse.offsetY,ctx);
    if(this.pointIndex !== -1){
      this.lastX = mouse.offsetX;
      this.lastY = mouse.offsetY;
    }
  }

  onMouseMove(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
    const shape = this.shapeService.catchedShape;
    if (!shape || this.pointIndex === -1) return;

    const dx = mouse.offsetX - this.lastX;
    const dy = mouse.offsetY - this.lastY;

    const point = shape.controlPoints[this.pointIndex];
    point.posX += dx;
    point.posY += dy;

    this.lastX = mouse.offsetX;
    this.lastY = mouse.offsetY;
  }

  onMouseUp(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
    const shape = this.shapeService.catchedShape;
    if (!shape || this.pointIndex === -1) return;

    switch (shape.type) {
      case 'line':
        this.updateLineFromControlPoints(shape);
        break;
      case 'rectangle':
        this.updateRectangleFromControlPoints(shape);
        break;
      case 'circle':
        this.updateCircleFromControlPoints(shape);
        break;
    }

    this.shapeService.drawAll(ctx);
    this.pointIndex = -1;
  }

  onMouseClick(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
    if(this.shapeService.catchedShape?.isFocused){
      this.shapeService.catchedShape?.unfocusPoints(ctx,drawService);
    }
    if(this.shapeService.checkPosition(mouse.offsetX,mouse.offsetY,ctx) != -1){
      this.shapeService.catchedShape?.focusPoints(ctx,drawService);
    }
  }
  private updateLineFromControlPoints(shape: ShapeModel) {
    shape.startX = shape.controlPoints[0].posX;
    shape.startY = shape.controlPoints[0].posY;
    shape.endX   = shape.controlPoints[1].posX;
    shape.endY   = shape.controlPoints[1].posY;
  }
  private updateRectangleFromControlPoints(shape: ShapeModel) {
    shape.controlPoints[(this.pointIndex+2)%4].posX = shape.controlPoints[this.pointIndex].posX;
    const oppositeOX = this.pointIndex ^ 1;
    shape.controlPoints[oppositeOX].posY = shape.controlPoints[this.pointIndex].posY;
    shape.width = shape.controlPoints[1].posX - shape.controlPoints[0].posX;
    shape.height = shape.controlPoints[2].posY - shape.controlPoints[0].posY;
    shape.startX = shape.controlPoints[0].posX;
    shape.startY = shape.controlPoints[0].posY;
  }
  updateCircleFromControlPoints(shape: ShapeModel) {
    const center = shape.controlPoints[0];
    const edge   = shape.controlPoints[1];

    shape.startX = center.posX;
    shape.startY = center.posY;

    const dx = edge.posX - center.posX;
    const dy = edge.posY - center.posY;
    shape.radius = Math.floor(Math.sqrt(dx * dx + dy * dy));
  }


}
