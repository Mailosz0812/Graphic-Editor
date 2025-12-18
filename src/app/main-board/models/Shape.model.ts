import {DrawingService} from '../services/drawing.service';
import {MatrixUtils} from '../utils/matrix.utils';

export class ShapeModel {
  id?: number;
  startX: number = 0;
  startY: number = 0;
  type!: 'rectangle' | 'circle' | 'line' | 'image' | 'bezier' | 'polygon';
  width?: number;
  height?: number;
  radius?: number;
  endX?: number;
  endY?: number;
  controlPoints: {posX: number, posY: number}[] = []
  vertices: {x: number, y: number}[] = [];

  pixelBuffer?: Uint8ClampedArray;
  private _isFocused: boolean = false;

  focusPoints(ctx: CanvasRenderingContext2D, drawingService: DrawingService){
    this._isFocused = true;
    this.controlPoints.forEach(point => {
      drawingService.drawPixel(point.posX,point.posY,ctx,2,255,255,255);
    });
    if(this.type === 'polygon') {
      this.vertices.forEach(v => {
        drawingService.drawPixel(v.x, v.y, ctx, 3, 255, 255, 0);
      });
    }
  }

  unfocusPoints(ctx: CanvasRenderingContext2D, drawingService: DrawingService){
    this._isFocused = false;
    this.controlPoints.forEach(point => {
      drawingService.drawPixel(point.posX,point.posY,ctx,2,189,168,168);
    });
    if(this.type === 'polygon') {
    }
  }

  get isFocused(): boolean {
    return this._isFocused;
  }

  applyTransformation(matrix: number[][]) {
    if (this.type === 'polygon') {
      this.vertices = this.vertices.map(v => MatrixUtils.transformPoint(v.x, v.y, matrix));
      this.updateControlPointsFromVertices();
    } else {
      const pStart = MatrixUtils.transformPoint(this.startX, this.startY, matrix);
      this.startX = Math.round(pStart.x);
      this.startY = Math.round(pStart.y);

      if (this.endX !== undefined && this.endY !== undefined) {
        const pEnd = MatrixUtils.transformPoint(this.endX, this.endY, matrix);
        this.endX = Math.round(pEnd.x);
        this.endY = Math.round(pEnd.y);
      }

      this.controlPoints.forEach(cp => {
        const tcp = MatrixUtils.transformPoint(cp.posX, cp.posY, matrix);
        cp.posX = tcp.x;
        cp.posY = tcp.y;
      });
    }
  }

  private updateControlPointsFromVertices() {
    if (this.vertices.length === 0) return;
    let sumX = 0, sumY = 0;
    this.vertices.forEach(v => { sumX += v.x; sumY += v.y; });
    this.controlPoints = [{
      posX: sumX / this.vertices.length,
      posY: sumY / this.vertices.length
    }];
  }
}
