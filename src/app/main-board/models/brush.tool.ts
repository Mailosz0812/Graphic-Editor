import { ToolInterface } from './tool.interface';
import { DrawingService } from '../services/drawing.service';
import { BrushColorService, RgbColor } from '../services/brush-color.service';
import { Subscription } from 'rxjs';

export class BrushTool implements ToolInterface {
  private size = 2;
  private isDragging: boolean = false;

  private r = 189;
  private g = 168;
  private b = 168;

  private colorSubscription: Subscription;

  constructor(private brushColorService: BrushColorService) {
    const initialColor = this.brushColorService.getColor();
    this.r = initialColor.r;
    this.g = initialColor.g;
    this.b = initialColor.b;

    this.colorSubscription = this.brushColorService.color$.subscribe(
      (color: RgbColor) => {
        this.r = color.r;
        this.g = color.g;
        this.b = color.b;
      }
    );
  }

  destroy(): void {
    this.colorSubscription.unsubscribe();
  }

  onMouseDown(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
    this.isDragging = true;
    drawService.drawPixel(mouse.offsetX, mouse.offsetY, ctx, this.size,
      this.r, this.g, this.b);
  }

  onMouseMove(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
    if (this.isDragging) {
      drawService.drawPixel(mouse.offsetX, mouse.offsetY, ctx, this.size,
        this.r, this.g, this.b);
    }
  }

  onMouseUp(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
    drawService.drawPixel(mouse.offsetX, mouse.offsetY, ctx, this.size,
      this.r, this.g, this.b);
    this.isDragging = false;
  }

  onMouseClick(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
  }

  draw(params: any, ctx: CanvasRenderingContext2D, drawService: DrawingService): void {
    return;
  }
}
