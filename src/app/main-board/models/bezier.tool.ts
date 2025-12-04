// main-board/models/bezier.tool.ts
import { ToolInterface } from './tool.interface';
import { DrawingService } from '../services/drawing.service';
import { ShapeService } from '../services/shape.service';
import { BezierStateService } from '../services/bezier-state.service';
import { ShapeModel } from './Shape.model';

export class BezierTool implements ToolInterface {
  private points: { posX: number; posY: number }[] = [];
  private isDragging = false;
  private draggedPointIndex = -1;
  private creationMode = true;

  constructor(
    private shapeService: ShapeService,
    private bezierState: BezierStateService
  ) {
    this.bezierState.updatePoints([]);
  }

  // --- NOWA METODA: Obsługa zmian z formularza ---
  updatePointsFromUI(newPoints: {x: number, y: number}[], ctx: CanvasRenderingContext2D, drawService: DrawingService) {
    // 1. Aktualizacja lokalnych punktów na podstawie danych z UI
    if (this.points.length !== newPoints.length) {
      // Jeśli zmieniła się liczba punktów (np. zmiana stopnia), resetujemy tablicę
      this.points = newPoints.map(p => ({ posX: p.x, posY: p.y }));

      // Jeśli edytujemy zapisany kształt, musimy podmienić mu tablicę
      if (this.shapeService.catchedShape && this.shapeService.catchedShape.type === 'bezier' as any) {
        this.shapeService.catchedShape.controlPoints = this.points;
      }
    } else {
      // Aktualizacja wartości (zachowując referencje obiektów, co jest bezpieczniejsze)
      for(let i=0; i<this.points.length; i++) {
        this.points[i].posX = newPoints[i].x;
        this.points[i].posY = newPoints[i].y;
      }
    }

    // 2. Wymuszenie przerysowania
    // Używamy shapeService.drawAll, aby odświeżyć wszystko (tło, inne kształty i naszą krzywą)
    this.shapeService.drawAll(ctx);

    // Jeśli jesteśmy w trakcie tworzenia (kształt nie jest jeszcze w shapeService), musimy go dorysować ręcznie
    if (!this.shapeService.catchedShape) {
      this.drawBezierCurve(ctx, drawService, this.points);
    }
  }

  // --- Reszta metod (z poprawką Math.round z poprzedniego kroku) ---

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

  draw(params: any, ctx: CanvasRenderingContext2D, drawService: DrawingService): void {}

  private drawBezierCurve(ctx: CanvasRenderingContext2D, drawService: DrawingService, points: { posX: number; posY: number }[]) {
    // Punkty kontrolne
    points.forEach(p => {
      drawService.drawRectangle(Math.round(p.posX - 3), Math.round(p.posY - 3), 6, 6, ctx, 1);
    });

    if (points.length < 2) return;

    // Linie pomocnicze
    for (let i = 0; i < points.length - 1; i++) {
      drawService.drawLine(
        Math.round(points[i].posX), Math.round(points[i].posY),
        Math.round(points[i+1].posY), Math.round(points[i+1].posX),
        ctx, 1, 100, 100, 100
      );
    }

    // Krzywa właściwa
    const segments = 100;
    let prev = points[0];
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const curr = this.getBezierPoint(t, points);
      drawService.drawLine(
        Math.round(prev.posX), Math.round(prev.posY),
        Math.round(curr.y), Math.round(curr.x),
        ctx, 2, 255, 255, 255
      );
      prev = { posX: curr.x, posY: curr.y };
    }
  }

  onMouseDown(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
    const x = Math.round(mouse.offsetX);
    const y = Math.round(mouse.offsetY);

    const existingIdx = this.checkPointCollision(x, y);

    if (existingIdx !== -1) {
      this.isDragging = true;
      this.draggedPointIndex = existingIdx;
      return;
    }

    const degree = this.bezierState.getCurrentDegree();
    const maxPoints = degree + 1;

    if (this.creationMode) {
      if (this.points.length < maxPoints) {
        this.points.push({ posX: x, posY: y });
        this.updateServiceState();

        this.shapeService.drawAll(ctx);
        this.drawBezierCurve(ctx, drawService, this.points);

        if (this.points.length === maxPoints) {
          this.finalizeShape(drawService, ctx);
          this.creationMode = false;
        }
      } else {
        this.creationMode = true;
        this.points = [];
        this.updateServiceState();
        this.shapeService.drawAll(ctx);
      }
    }
  }

  onMouseMove(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
    if (this.isDragging && this.draggedPointIndex !== -1) {
      this.points[this.draggedPointIndex].posX = Math.round(mouse.offsetX);
      this.points[this.draggedPointIndex].posY = Math.round(mouse.offsetY);

      if (this.shapeService.catchedShape && this.shapeService.catchedShape.type === 'bezier' as any) {
        this.shapeService.catchedShape.controlPoints = this.points;
      }

      this.updateServiceState();
      this.shapeService.drawAll(ctx);

      if(!this.shapeService.catchedShape){
        this.drawBezierCurve(ctx, drawService, this.points);
      }
    }
  }

  onMouseUp(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
    this.isDragging = false;
    this.draggedPointIndex = -1;
  }

  onMouseClick(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {}

  private finalizeShape(drawService: DrawingService, ctx: CanvasRenderingContext2D) {
    const shape = new ShapeModel();
    shape.type = 'bezier' as any;
    shape.startX = this.points[0].posX;
    shape.startY = this.points[0].posY;
    shape.controlPoints = this.points.map(p => ({...p}));

    this.shapeService.addShape(shape);
    this.shapeService.catchedShape = shape;
    this.points = shape.controlPoints;
  }

  private updateServiceState() {
    this.bezierState.updatePoints(this.points.map(p => ({ x: p.posX, y: p.posY })));
  }

  private checkPointCollision(x: number, y: number): number {
    const radius = 10;
    return this.points.findIndex(p =>
      Math.abs(p.posX - x) < radius && Math.abs(p.posY - y) < radius
    );
  }
}
