import { AfterViewInit, Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrushColorService, RgbColor } from '../../services/brush-color.service'; // <-- IMPORT

interface CmykColor { c: number; m: number; y: number; k: number; }

@Component({
  selector: 'app-color-dialog',
  imports: [
    NgIf,
    FormsModule
  ],
  templateUrl: './color-dialog.component.html',
  styleUrl: './color-dialog.component.css'
})
export class ColorDialogComponent implements AfterViewInit {
  @Output() closeEvent = new EventEmitter<boolean>(false);
  @ViewChild('board') private board!: ElementRef<HTMLCanvasElement>;

  mode: 'rgb' | 'cmyk' = 'rgb';
  private palletData!: { data: Uint8ClampedArray, width: number, height: number };

  rgb: RgbColor = { r: 0, g: 0, b: 0 };
  cmyk: CmykColor = { c: 0, m: 0, y: 0, k: 100 };

  private isUpdating = false;

  constructor(private brushColorService: BrushColorService) {
    this.rgb = this.brushColorService.getColor();
    this.cmyk = this.rgbToCmyk(this.rgb.r, this.rgb.g, this.rgb.b);
  }

  ngAfterViewInit(): void {
    const canvas = this.board.nativeElement;
    const canvasRender = canvas.getContext('2d', { willReadFrequently: true })!;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    this.palletData = this.makePaletteLike(canvas.width, canvas.height);
    const data = new ImageData(this.palletData.data, this.palletData.width, this.palletData.height);
    canvasRender.putImageData(data, 0, 0);
  }

  onCloseEvent() {
    this.closeEvent.emit(false);
  }

  onColorChoose(mouse: MouseEvent) {
    let posY: number = mouse.offsetY;
    let posX: number = mouse.offsetX;
    let pos: number = (this.palletData.width * posY + posX) * 4;
    let r: number = this.palletData.data[pos];
    let g: number = this.palletData.data[pos + 1];
    let b: number = this.palletData.data[pos + 2];

    this.updateFromRgb(r, g, b);
  }

  onRgbChange() {
    if (this.isUpdating) return;
    this.isUpdating = true;
    this.rgb.r = Math.min(255, Math.max(0, this.rgb.r || 0));
    this.rgb.g = Math.min(255, Math.max(0, this.rgb.g || 0));
    this.rgb.b = Math.min(255, Math.max(0, this.rgb.b || 0));

    this.updateFromRgb(this.rgb.r, this.rgb.g, this.rgb.b);
    this.isUpdating = false;
  }

  onCmykChange() {
    if (this.isUpdating) return;
    this.isUpdating = true;

    this.cmyk.c = Math.min(100, Math.max(0, this.cmyk.c || 0));
    this.cmyk.m = Math.min(100, Math.max(0, this.cmyk.m || 0));
    this.cmyk.y = Math.min(100, Math.max(0, this.cmyk.y || 0));
    this.cmyk.k = Math.min(100, Math.max(0, this.cmyk.k || 0));

    this.updateFromCmyk(this.cmyk.c, this.cmyk.m, this.cmyk.y, this.cmyk.k);
    this.isUpdating = false;
  }

  private updateFromRgb(r: number, g: number, b: number) {
    this.rgb = { r, g, b };
    this.cmyk = this.rgbToCmyk(r, g, b);
    this.brushColorService.setColor(this.rgb);
  }


  private updateFromCmyk(c: number, m: number, y: number, k: number) {
    this.cmyk = { c, m, y, k };
    this.rgb = this.cmykToRgb(c, m, y, k);
    this.brushColorService.setColor(this.rgb);
  }


  private rgbToCmyk(r: number, g: number, b: number): CmykColor {
    let rPrime = r / 255;
    let gPrime = g / 255;
    let bPrime = b / 255;

    let k = 1 - Math.max(rPrime, gPrime, bPrime);

    if (k === 1) {
      return { c: 0, m: 0, y: 0, k: 100 };
    }

    let c = (1 - rPrime - k) / (1 - k);
    let m = (1 - gPrime - k) / (1 - k);
    let y = (1 - bPrime - k) / (1 - k);

    return {
      c: Math.round(c * 100),
      m: Math.round(m * 100),
      y: Math.round(y * 100),
      k: Math.round(k * 100)
    };
  }

  private cmykToRgb(c: number, m: number, y: number, k: number): RgbColor {
    const kNorm = k / 100;
    const cNorm = c / 100;
    const mNorm = m / 100;
    const yNorm = y / 100;

    const r = 255 * (1 - cNorm) * (1 - kNorm);
    const g = 255 * (1 - mNorm) * (1 - kNorm);
    const b = 255 * (1 - yNorm) * (1 - kNorm);

    return {
      r: Math.round(r),
      g: Math.round(g),
      b: Math.round(b)
    };
  }

  private hsvToRgb(h: number, s: number, v: number) {
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;
    let r = 0, g = 0, b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else[r, g, b] = [c, 0, x];
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    };
  }

  private makePaletteLike(width = 300, height = 200) {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
      const y01 = y / (height - 1);
      for (let x = 0; x < width; x++) {
        const x01 = x / (width - 1);
        const h = 360 * x01;
        const s = 1 - y01;
        const v = 1 - 0.95 * x01;
        const { r, g, b } = this.hsvToRgb(h, s, v);
        const i = (y * width + x) * 4;
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      }
    }
    return { data, width, height };
  }
}
