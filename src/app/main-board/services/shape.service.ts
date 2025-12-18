import { Injectable } from '@angular/core';
import {ShapeModel} from '../models/Shape.model';
import {DrawingService} from './drawing.service';

@Injectable({
  providedIn: 'root'
})
export class ShapeService {
  private _shapes: ShapeModel[] = [];
  private id: number = 0;
  private size: number = 2;
  catchedShape!: ShapeModel | null;

  constructor(private drawService: DrawingService) { }

  addShape(shape: ShapeModel){
    shape.id = this.id++;
    this._shapes.push(shape);
  }

  deleteShapes(){
    this._shapes = [];
    this.catchedShape = null;
  }

  set shapes(shapes: ShapeModel[]){
    this._shapes = shapes;
  }

  get shapes(){
    return this._shapes;
  }

  checkPosition(posX: number, posY: number, ctx: CanvasRenderingContext2D): number {
    if (this.catchedShape) {
      this.catchedShape.unfocusPoints(ctx, this.drawService);
      this.catchedShape = null;
    }
    let posX1 = posX;
    let posY1 = posY;

    for (let i = this._shapes.length - 1; i >= 0; i--) {
      const shape = this._shapes[i];

      if (shape.type === 'polygon') {
        if (this.isPointInPolygon(posX1, posY1, shape.vertices)) {
          this.catchedShape = shape;
          return 0;
        }
      } else {
        const index = this.checkFocusPoints(posX1, posY1, shape.controlPoints);
        if (index !== -1) {
          this.catchedShape = shape;
          return index;
        }
      }
    }
    return -1;
  }

  private isPointInPolygon(x: number, y: number, vertices: {x: number, y: number}[]): boolean {
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i].x, yi = vertices[i].y;
      const xj = vertices[j].x, yj = vertices[j].y;

      const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  async drawAll(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    for (const shape of this._shapes) {
      if (shape.type === 'line') {
        this.drawService.drawLine(shape.startX, shape.startY,
          shape.endY!, shape.endX!, ctx, this.size,
          189, 168, 168);
      } else if (shape.type === 'circle') {
        this.drawService.drawCircle(shape.startX, shape.startY, shape.radius!, ctx, this.size);
      } else if (shape.type === 'rectangle') {
        this.drawService.drawRectangle(shape.startX, shape.startY, shape.width!, shape.height!, ctx, this.size);
      } else if (shape.type === 'bezier') {
        this.drawBezier(shape, ctx);
      } else if (shape.type === 'polygon') {
        this.drawPolygon(shape, ctx);
      }
    }
  }

  private drawPolygon(shape: ShapeModel, ctx: CanvasRenderingContext2D) {
    const v = shape.vertices;
    if (v.length < 2) return;

    for(let i = 0; i < v.length; i++) {
      const next = (i + 1) % v.length;
      this.drawService.drawLine(
        Math.round(v[i].x), Math.round(v[i].y),
        Math.round(v[next].y), Math.round(v[next].x),
        ctx, this.size, 189, 168, 168
      );
    }
    if (shape.isFocused) {
      shape.focusPoints(ctx, this.drawService);
    }
  }

  private drawBezier(shape: ShapeModel, ctx: CanvasRenderingContext2D) {
    const points = shape.controlPoints;
    if (!points || points.length < 2) return;
    for (let i = 0; i < points.length - 1; i++) {
      this.drawService.drawLine(
        Math.round(points[i].posX), Math.round(points[i].posY),
        Math.round(points[i+1].posY), Math.round(points[i+1].posX),
        ctx, 1, 100, 100, 100
      );
    }
    points.forEach(p => {
      this.drawService.drawRectangle(Math.round(p.posX - 3), Math.round(p.posY - 3), 6, 6, ctx, 1);
    });
    const segments = 100;
    let prev = points[0];

    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const curr = this.getBezierPoint(t, points);

      this.drawService.drawLine(
        Math.round(prev.posX), Math.round(prev.posY),
        Math.round(curr.y), Math.round(curr.x),
        ctx, 2, 255, 255, 255
      );
      prev = { posX: curr.x, posY: curr.y };
    }
  }

  private getBezierPoint(t: number, points: { posX: number; posY: number }[]): { x: number; y: number } {
    if (points.length === 1) {
      return { x: points[0].posX, y: points[0].posY };
    }
    const nextPoints = [];
    for (let i = 0; i < points.length - 1; i++) {
      nextPoints.push({
        posX: (1 - t) * points[i].posX + t * points[i + 1].posX,
        posY: (1 - t) * points[i].posY + t * points[i + 1].posY
      });
    }
    return this.getBezierPoint(t, nextPoints);
  }

  private checkFocusPoints(x: number, y: number, pointsArray: { posX: number, posY: number }[]) {
    let pointIndex: number = -1;
    if(!pointsArray) return -1;
    pointsArray.forEach((point, index) => {
      if ((x >= point.posX - 5 && x <= point.posX + 5) && (y >= point.posY - 5 && y <= point.posY + 5)) {
        pointIndex = index;
      }
    })
    return pointIndex;
  }
}
