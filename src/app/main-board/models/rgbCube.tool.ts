import { ToolInterface } from './tool.interface';
import { DrawingService } from '../services/drawing.service';
import { ShapeService } from '../services/shape.service';
import { SliceState, SliceStateService } from '../services/slice-state.service';
import { Subscription } from 'rxjs';

interface Vec3 { x: number; y: number; z: number; }
interface Vec2 { x: number; y: number; }

export class RgbCubeTool implements ToolInterface {

  private isDragging = false;
  private lastX = 0;
  private lastY = 0;
  private angleX = 0.5;
  private angleY = 0.5;


  private vertices: Vec3[] = [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 1, y: 1, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 1, y: 0, z: 1 },
    { x: 1, y: 1, z: 1 },
    { x: 0, y: 1, z: 1 }
  ];


  private normalizedVertices: Vec3[] = [];


  private faces: number[][] = [
    [0, 1, 2], [0, 2, 3],
    [4, 5, 6], [4, 6, 7],
    [0, 1, 5], [0, 5, 4],
    [3, 2, 6], [3, 6, 7],
    [0, 3, 7], [0, 7, 4],
    [1, 2, 6], [1, 6, 5]
  ];


  private sliceStateSubscription: Subscription;
  private currentSliceState: SliceState;

  private lastKnownCtx: CanvasRenderingContext2D | null = null;
  private lastKnownDrawService: DrawingService | null = null;


  constructor(
    private shapeService: ShapeService,
    private sliceState: SliceStateService
  ) {

    this.normalizedVertices = this.vertices.map(v => ({
      x: v.x - 0.5,
      y: v.y - 0.5,
      z: v.z - 0.5
    }));


    this.currentSliceState = this.sliceState.getCurrentState();

    this.sliceStateSubscription = this.sliceState.state$.subscribe(state => {
      this.currentSliceState = state;

      if (this.lastKnownCtx && this.lastKnownDrawService && this.currentSliceState.enabled) {
        this.render(this.lastKnownCtx, this.lastKnownDrawService);
      }

    });
  }

  private updateKnownContext(ctx: CanvasRenderingContext2D, drawService: DrawingService) {
    this.lastKnownCtx = ctx;
    this.lastKnownDrawService = drawService;
  }

  onMouseDown(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
    this.updateKnownContext(ctx, drawService);
    this.isDragging = true;
    this.lastX = mouse.offsetX;
    this.lastY = mouse.offsetY;

    this.render(ctx, drawService);
  }

  onMouseMove(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
    this.updateKnownContext(ctx, drawService);

    if (!this.isDragging) return;

    const dx = mouse.offsetX - this.lastX;
    const dy = mouse.offsetY - this.lastY;

    this.angleY += dx * 0.01;
    this.angleX += dy * 0.01;

    this.lastX = mouse.offsetX;
    this.lastY = mouse.offsetY;

    this.render(ctx, drawService);
  }

  onMouseUp(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
    this.updateKnownContext(ctx, drawService);
    this.isDragging = false;
  }

  onMouseClick(drawService: DrawingService, mouse: MouseEvent, ctx: CanvasRenderingContext2D): void {
    this.updateKnownContext(ctx, drawService);
  }

  draw(params: any, ctx: CanvasRenderingContext2D, drawService: DrawingService): void {
    this.updateKnownContext(ctx, drawService);
  }

  private render(ctx: CanvasRenderingContext2D, drawService: DrawingService): void {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const data = imageData.data;
    const width = imageData.width;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;      // R
      data[i + 1] = 255;  // G
      data[i + 2] = 255;  // B
      data[i + 3] = 255;  // A
    }

    const zBuffer = new Float32Array(width * imageData.height).fill(Number.NEGATIVE_INFINITY);

    const scale = 200;
    const center = { x: ctx.canvas.width / 2, y: ctx.canvas.height / 2 };
    const sX = Math.sin(this.angleX);
    const cX = Math.cos(this.angleX);
    const sY = Math.sin(this.angleY);
    const cY = Math.cos(this.angleY);

    const projectedPoints: Vec2[] = [];
    const transformedZ: number[] = [];

    for (const v of this.normalizedVertices) {
      let rotY_x = v.x * cY - v.z * sY;
      let rotY_z = v.x * sY + v.z * cY;
      let rotX_y = v.y * cX - rotY_z * sX;
      let rotX_z = v.y * sX + rotY_z * cX;

      projectedPoints.push({
        x: rotY_x * scale + center.x,
        y: rotX_y * scale + center.y
      });
     transformedZ.push(rotX_z);
    }


    for (const face of this.faces) {
      const v0_idx = face[0];
      const v1_idx = face[1];
      const v2_idx = face[2];

      const p0 = projectedPoints[v0_idx];
      const p1 = projectedPoints[v1_idx];
      const p2 = projectedPoints[v2_idx];

      const c0 = this.vertices[v0_idx];
      const c1 = this.vertices[v1_idx];
      const c2 = this.vertices[v2_idx];

      const z0 = transformedZ[v0_idx];
      const z1 = transformedZ[v1_idx];
      const z2 = transformedZ[v2_idx];

      this.rasterizeTriangle(
        imageData, zBuffer,
        p0, p1, p2,
        c0, c1, c2,
        z0, z1, z2
      );
    }
    ctx.putImageData(imageData, 0, 0);

    if (this.currentSliceState.enabled) {
      const slicePos_Norm = this.currentSliceState.value - 0.5; // (-0.5 do 0.5)
      const axis = this.currentSliceState.axis;

      let sliceNormVerts: Vec3[] = [];
      if (axis === 'x') {
        sliceNormVerts = [
          { x: slicePos_Norm, y: -0.5, z: -0.5 }, { x: slicePos_Norm, y: 0.5, z: -0.5 },
          { x: slicePos_Norm, y: 0.5, z: 0.5 }, { x: slicePos_Norm, y: -0.5, z: 0.5 }
        ];
      } else if (axis === 'y') {
        sliceNormVerts = [
          { x: -0.5, y: slicePos_Norm, z: -0.5 }, { x: 0.5, y: slicePos_Norm, z: -0.5 },
          { x: 0.5, y: slicePos_Norm, z: 0.5 }, { x: -0.5, y: slicePos_Norm, z: 0.5 }
        ];
      } else {
        sliceNormVerts = [
          { x: -0.5, y: -0.5, z: slicePos_Norm }, { x: 0.5, y: -0.5, z: slicePos_Norm },
          { x: 0.5, y: 0.5, z: slicePos_Norm }, { x: -0.5, y: 0.5, z: slicePos_Norm }
        ];
      }

      const projectedSlicePoints: Vec2[] = [];
      for (const v of sliceNormVerts) {
        let rotY_x = v.x * cY - v.z * sY;
        let rotY_z = v.x * sY + v.z * cY;
        let rotX_y = v.y * cX - rotY_z * sX;
        projectedSlicePoints.push({ x: rotY_x * scale + center.x, y: rotX_y * scale + center.y });
      }

      const p = projectedSlicePoints.map(v => ({ x: Math.floor(v.x), y: Math.floor(v.y) }));
      const color = { r: 0, g: 0, b: 0 };
      const size = 1;
      drawService.drawLine(p[0].x, p[0].y, p[1].y, p[1].x, ctx, size, color.r, color.g, color.b);
      drawService.drawLine(p[1].x, p[1].y, p[2].y, p[2].x, ctx, size, color.r, color.g, color.b);
      drawService.drawLine(p[2].x, p[2].y, p[3].y, p[3].x, ctx, size, color.r, color.g, color.b);
      drawService.drawLine(p[3].x, p[3].y, p[0].y, p[0].x, ctx, size, color.r, color.g, color.b);
    }
  }

  private setPixel(data: Uint8ClampedArray, width: number, x: number, y: number, r: number, g: number, b: number) {
    const ix = Math.round(x);
    const iy = Math.round(y);

    if (ix < 0 || ix >= width || iy < 0 || iy >= data.length / (width * 4)) {
      return;
    }

    const index = (iy * width + ix) * 4;
    data[index] = r;
    data[index + 1] = g;
    data[index + 2] = b;
    data[index + 3] = 255;
  }

  private edgeFunction(a: Vec2, b: Vec2, c: Vec2): number {
    return (c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x);
  }

  private rasterizeTriangle(
    imageData: ImageData, zBuffer: Float32Array,
    p0: Vec2, p1: Vec2, p2: Vec2,
    c0: Vec3, c1: Vec3, c2: Vec3,
    z0: number, z1: number, z2: number
  ) {
    const data = imageData.data;
    const width = imageData.width;

    const minX = Math.floor(Math.min(p0.x, p1.x, p2.x));
    const maxX = Math.ceil(Math.max(p0.x, p1.x, p2.x));
    const minY = Math.floor(Math.min(p0.y, p1.y, p2.y));
    const maxY = Math.ceil(Math.max(p0.y, p1.y, p2.y));

    const totalArea = this.edgeFunction(p0, p1, p2);
    if (totalArea == 0) return;

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {

        const p = { x: x, y: y };

        let w0 = this.edgeFunction(p1, p2, p);
        let w1 = this.edgeFunction(p2, p0, p);
        let w2 = this.edgeFunction(p0, p1, p);

        const isCounterClockwise = w0 >= 0 && w1 >= 0 && w2 >= 0;
        const isClockwise = w0 <= 0 && w1 <= 0 && w2 <= 0;

        if (isCounterClockwise || isClockwise) {


          w0 /= totalArea;
          w1 /= totalArea;
          w2 /= totalArea;


          const interpolatedZ = z0 * w0 + z1 * w1 + z2 * w2;
          const zBufferIndex = y * width + x;

          if (interpolatedZ > zBuffer[zBufferIndex]) {

            zBuffer[zBufferIndex] = interpolatedZ;

            const r = (c0.x * w0 + c1.x * w1 + c2.x * w2) * 255;
            const g = (c0.y * w0 + c1.y * w1 + c2.y * w2) * 255;
            const b = (c0.z * w0 + c1.z * w1 + c2.z * w2) * 255;

            this.setPixel(data, width, x, y, r, g, b);
          }
        }
      }
    }
  }
}
