import {DrawingService} from '../services/drawing.service';

export class ShapeModel {
  id?: number;
  startX: number = 0;
  startY: number = 0;
  type!: 'rectangle' | 'circle' | 'line' | 'image';
  width?: number;
  height?: number;
  radius?: number;
  endX?: number;
  endY?: number;
  controlPoints: {posX: number, posY: number}[] = []
  pixelBuffer?: Uint8ClampedArray;
  private _isFocused: boolean = false;

  focusPoints(ctx: CanvasRenderingContext2D, drawingService: DrawingService){
    this._isFocused = true;
    this.controlPoints.forEach(point => {
      drawingService.drawPixel(point.posX,point.posY,ctx,2,255,255,255);
    })
  }
  unfocusPoints(ctx: CanvasRenderingContext2D, drawingService: DrawingService){
    this._isFocused = false;
    this.controlPoints.forEach(point => {
      drawingService.drawPixel(point.posX,point.posY,ctx,2,189,168,168);
    })
  }
  get isFocused(): boolean {
    return this._isFocused;
  }
}
