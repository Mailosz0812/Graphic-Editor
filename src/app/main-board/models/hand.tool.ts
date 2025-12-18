import {ToolInterface} from './tool.interface';
import {ShapeService} from '../services/shape.service';
import {ShapeModel} from './Shape.model';
import {DrawingService} from '../services/drawing.service';
import {MatrixUtils} from '../utils/matrix.utils';

export class HandTool implements ToolInterface{
  private catchedIndex: number = -1;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private isDragging = false;

  constructor(private shapeService: ShapeService) {
  }

  onMouseDown(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D){
    this.catchedIndex = this.shapeService.checkPosition(mouse.offsetX, mouse.offsetY, ctx);

    if(this.catchedIndex != -1 || this.shapeService.catchedShape){
      this.isDragging = true;
      this.lastMouseX = mouse.offsetX;
      this.lastMouseY = mouse.offsetY;
    }
  }

  onMouseClick(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
    if(this.shapeService.catchedShape?.isFocused){
      this.shapeService.catchedShape?.unfocusPoints(ctx,drawService);
    }
    if(this.shapeService.checkPosition(mouse.offsetX,mouse.offsetY,ctx) != -1){
      this.shapeService.catchedShape?.focusPoints(ctx,drawService);
    }
  }

  onMouseMove(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D){
    if(this.isDragging && this.shapeService.catchedShape){
      let posX: number = mouse.offsetX;
      let posY: number = mouse.offsetY;
      let shape: ShapeModel = this.shapeService.catchedShape!;
      let dx: number = posX - this.lastMouseX;
      let dy: number = posY - this.lastMouseY;

      if (shape.type === 'polygon') {
        const matrix = MatrixUtils.translation(dx, dy);
        shape.applyTransformation(matrix);
      } else {
        shape.startX += dx;
        shape.startY += dy;
        shape.controlPoints.forEach(point => {
          point.posY += dy;
          point.posX += dx;
        })
        if(shape.type === 'line'){
          shape.endX! += dx;
          shape.endY! += dy;
        }
      }
      this.lastMouseX = posX;
      this.lastMouseY = posY;

      this.shapeService.drawAll(ctx);
    }
  }

  onMouseUp(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D){
    // Kończymy przeciąganie
    this.isDragging = false;

    if(this.shapeService.catchedShape) {
      this.shapeService.drawAll(ctx);
    }
    this.catchedIndex = -1;
  }

  draw(params: any, ctx: CanvasRenderingContext2D, drawService: DrawingService): void {
    if(this.shapeService.catchedShape){
      const shape = this.shapeService.catchedShape
      const xParam = +params.dx;
      const yParam = +params.dy;

      if (shape.type === 'polygon') {
        const matrix = MatrixUtils.translation(xParam, yParam);
        shape.applyTransformation(matrix);
      } else {
        shape.startX += xParam;
        shape.startY += yParam;
        if(shape.type === 'line'){
          shape.endX! += xParam;
          shape.endY! += yParam;
        }
        shape.controlPoints.forEach(point => {
          point.posX += xParam;
          point.posY += yParam;
        })
      }
      this.shapeService.drawAll(ctx);
    }
  }
}
