import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Output, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ImageStateService} from '../services/image-state.service';


@Component({
  selector: 'app-color-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './color-analysis.component.html',
  styleUrl: './color-analysis.component.css'
})
export class ColorAnalysisComponent implements AfterViewInit {
  @Output() closeEvent = new EventEmitter<boolean>();
  @ViewChild('previewCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private originalData!: Uint8ClampedArray;
  private width: number = 0;
  private height: number = 0;

  hueMin: number = 60;
  hueMax: number = 170;
  satMin: number = 20;
  valMin: number = 20;

  resultPercentage: string = '0.00';
  detectedPixelsCount: number = 0;
  totalPixelsCount: number = 0;

  constructor(
    private imageState: ImageStateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    this.imageState._imageState.subscribe(img => {
      if (img && img.array) {
        this.width = img.width;
        this.height = img.height;
        this.originalData = new Uint8ClampedArray(img.array);
        this.totalPixelsCount = this.width * this.height;
        this.analyzeAndRender();
      }
    });
  }

  onClose() {
    this.closeEvent.emit(false);
  }

  onParamChange() {
    this.analyzeAndRender();
  }

  private analyzeAndRender() {
    if (!this.originalData || !this.canvasRef) return;

    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d')!;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const outputBuffer = new Uint8ClampedArray(this.originalData.length);
    let matchCount = 0;

    const hMin = this.hueMin;
    const hMax = this.hueMax;
    const sMin = this.satMin / 100;
    const vMin = this.valMin / 100;

    for (let i = 0; i < this.originalData.length; i += 4) {
      const r = this.originalData[i];
      const g = this.originalData[i + 1];
      const b = this.originalData[i + 2];

      const hsv = this.rgbToHsv(r, g, b);

      let hueMatch = false;
      if (hMin <= hMax) {
        hueMatch = (hsv.h >= hMin && hsv.h <= hMax);
      } else {
        hueMatch = (hsv.h >= hMin || hsv.h <= hMax);
      }

      const isMatch = hueMatch && hsv.s >= sMin && hsv.v >= vMin;

      if (isMatch) {
        matchCount++;
        outputBuffer[i] = r;
        outputBuffer[i + 1] = g;
        outputBuffer[i + 2] = b;
      } else {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        outputBuffer[i] = gray * 0.5;
        outputBuffer[i + 1] = gray * 0.5;
        outputBuffer[i + 2] = gray * 0.5;
      }
      outputBuffer[i + 3] = 255;
    }

    this.detectedPixelsCount = matchCount;
    this.resultPercentage = ((matchCount / this.totalPixelsCount) * 100).toFixed(2);

    this.drawBufferToCanvas(outputBuffer, ctx, canvas.width, canvas.height);

    this.cdr.detectChanges();
  }

  private drawBufferToCanvas(buffer: Uint8ClampedArray, ctx: CanvasRenderingContext2D, targetW: number, targetH: number) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.width;
    tempCanvas.height = this.height;
    const tempCtx = tempCanvas.getContext('2d')!;
    const imageData = new ImageData(buffer, this.width, this.height);
    tempCtx.putImageData(imageData, 0, 0);

    const scale = Math.min(targetW / this.width, targetH / this.height);
    const w = this.width * scale;
    const h = this.height * scale;
    const x = (targetW - w) / 2;
    const y = (targetH - h) / 2;

    ctx.clearRect(0, 0, targetW, targetH);
    ctx.drawImage(tempCanvas, x, y, w, h);
  }

  private rgbToHsv(r: number, g: number, b: number) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, v = max;

    const d = max - min;
    s = max === 0 ? 0 : d / max;

    if (max === min) {
      h = 0;
    } else {
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s, v: v };
  }
}
