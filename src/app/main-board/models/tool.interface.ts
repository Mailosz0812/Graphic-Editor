import {DrawingService} from '../services/drawing.service';

export interface ToolInterface {
  onMouseDown(drawService: DrawingService,mouse: MouseEvent,ctx: CanvasRenderingContext2D):void;
  onMouseMove(drawService: DrawingService,mouse: MouseEvent,ctx: CanvasRenderingContext2D):void;
  onMouseUp(drawService: DrawingService,mouse: MouseEvent,ctx: CanvasRenderingContext2D):void;
  draw(params: any,ctx: CanvasRenderingContext2D,drawService: DrawingService):void;
  onMouseClick(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void;
}
