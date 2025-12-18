import {ToolInterface} from './tool.interface';
import {ShapeService} from '../services/shape.service';
import {DrawingService} from '../services/drawing.service';
import {MatrixUtils} from '../utils/matrix.utils';

export class TransformationTool implements ToolInterface {
  private pivot: {x: number, y: number} | null = null;
  private isDragging = false;
  
  private lastX = 0;
  private lastY = 0;

  constructor(
    private shapeService: ShapeService,
    private mode: 'rotate' | 'scale'
  ) {}

  onMouseDown(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
    if (!this.shapeService.catchedShape) {
      this.shapeService.checkPosition(mouse.offsetX, mouse.offsetY, ctx);
    }

    if (this.shapeService.catchedShape) {
      this.isDragging = true;
      this.pivot = { x: mouse.offsetX, y: mouse.offsetY };
      this.lastX = mouse.offsetX;
      this.lastY = mouse.offsetY;

      drawService.drawPixel(this.pivot.x, this.pivot.y, ctx, 4, 0, 255, 0);
    }
  }

  onMouseMove(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
    if (!this.isDragging || !this.shapeService.catchedShape || !this.pivot) return;

    const dx = mouse.offsetX - this.lastX;
    const dy = mouse.offsetY - this.lastY;

    if (dx === 0 && dy === 0) return;

    let matrix: number[][] = MatrixUtils.identity();
    const px = this.pivot.x;
    const py = this.pivot.y;

    const toOrigin = MatrixUtils.translation(-px, -py);
    const fromOrigin = MatrixUtils.translation(px, py);

    if (this.mode === 'rotate') {
      const angle = dx * 0.5;
      const rot = MatrixUtils.rotation(angle);

      matrix = MatrixUtils.multiply(toOrigin, matrix);
      matrix = MatrixUtils.multiply(rot, matrix);
      matrix = MatrixUtils.multiply(fromOrigin, matrix);

    } else if (this.mode === 'scale') {
      const factor = 1 + (dx + dy) * 0.01;
      if (factor <= 0.1) return;

      const scale = MatrixUtils.scaling(factor, factor);

      matrix = MatrixUtils.multiply(toOrigin, matrix);
      matrix = MatrixUtils.multiply(scale, matrix);
      matrix = MatrixUtils.multiply(fromOrigin, matrix);
    }

    this.shapeService.catchedShape.applyTransformation(matrix);

    this.shapeService.drawAll(ctx);

    drawService.drawPixel(px, py, ctx, 4, 0, 255, 0);

    this.lastX = mouse.offsetX;
    this.lastY = mouse.offsetY;
  }

  onMouseUp(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
    this.isDragging = false;
    this.pivot = null;
    this.shapeService.drawAll(ctx);
  }

  onMouseClick(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {}

  draw(params: any, ctx: CanvasRenderingContext2D, drawService: DrawingService): void {}
}
