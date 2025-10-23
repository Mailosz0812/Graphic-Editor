import {ToolInterface} from './tool.interface';
import {DrawingService} from '../services/drawing.service';

export class BrushTool implements ToolInterface{
  private size = 2;
  private isDragging:boolean = false;
  private r = 189;
  private g = 168;
  private b = 168;

  onMouseDown(drawService: DrawingService,mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
    this.isDragging = true;
    drawService.drawPixel(mouse.offsetX,mouse.offsetY,ctx,this.size
    ,this.r,this.g,this.b);
  }
  onMouseMove(drawService: DrawingService,mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
    if(this.isDragging){
      drawService.drawPixel(mouse.offsetX,mouse.offsetY,ctx,this.size
      ,this.r,this.g,this.b);
    }
  }
  onMouseUp(drawService: DrawingService,mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
    drawService.drawPixel(mouse.offsetX,mouse.offsetY,ctx,this.size
    ,this.r,this.g,this.b);
    this.isDragging = false;
  }

  onMouseClick(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
  }



  draw(params: any, ctx: CanvasRenderingContext2D,drawService: DrawingService): void {
    return
  }
}
