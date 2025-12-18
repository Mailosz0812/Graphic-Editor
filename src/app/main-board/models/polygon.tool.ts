import {ToolInterface} from './tool.interface';
import {ShapeService} from '../services/shape.service';
import {DrawingService} from '../services/drawing.service';
import {ShapeModel} from './Shape.model';

export class PolygonTool implements ToolInterface {
  private tempVertices: {x: number, y: number}[] = [];

  constructor(private shapeService: ShapeService) {}

  onMouseDown(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
    const x = mouse.offsetX;
    const y = mouse.offsetY;
    if (this.tempVertices.length > 2) {
      const start = this.tempVertices[0];
      const dist = Math.sqrt((x - start.x)**2 + (y - start.y)**2);
      if (dist < 10) {
        this.finishShape(ctx);
        return;
      }
    }

    this.tempVertices.push({x, y});
    this.redrawTemp(ctx, drawService);
  }

  onMouseMove(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
    if (this.tempVertices.length > 0) {
      this.shapeService.drawAll(ctx);
      this.redrawTemp(ctx, drawService);

      const last = this.tempVertices[this.tempVertices.length - 1];
      drawService.drawLine(
        Math.round(last.x), Math.round(last.y),
        Math.round(mouse.offsetY), Math.round(mouse.offsetX),
        ctx, 1, 150, 150, 150
      );
    }
  }

  onMouseUp(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {}
  onMouseClick(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {}
  draw(params: any, ctx: CanvasRenderingContext2D, drawService: DrawingService): void {}


  private finishShape(ctx: CanvasRenderingContext2D) {
    if (this.tempVertices.length < 3) return;

    const shape = new ShapeModel();
    shape.type = 'polygon';
    shape.vertices = [...this.tempVertices];

    let sumX = 0, sumY = 0;
    this.tempVertices.forEach(v => { sumX += v.x; sumY += v.y; });
    shape.controlPoints = [{
      posX: sumX / this.tempVertices.length,
      posY: sumY / this.tempVertices.length
    }];

    this.shapeService.addShape(shape);
    this.tempVertices = [];
    this.shapeService.drawAll(ctx);
  }

  private redrawTemp(ctx: CanvasRenderingContext2D, drawService: DrawingService) {
    for(let i = 0; i < this.tempVertices.length - 1; i++) {
      const p1 = this.tempVertices[i];
      const p2 = this.tempVertices[i+1];
      drawService.drawLine(
        Math.round(p1.x), Math.round(p1.y),
        Math.round(p2.y), Math.round(p2.x),
        ctx, 2, 189, 168, 168
      );
    }

    this.tempVertices.forEach(p => {
      drawService.drawPixel(p.x, p.y, ctx, 3, 255, 0, 0);
    });
  }
}
