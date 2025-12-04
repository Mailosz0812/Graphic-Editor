import {AfterViewInit, Component, ElementRef, EventEmitter, Output, ViewChild} from '@angular/core';
import {ImageStateService} from '../../services/image-state.service';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-binarization',
  imports: [CommonModule, FormsModule],
  templateUrl: './binarization.component.html',
  styleUrl: './binarization.component.css'
})
export class BinarizationComponent implements AfterViewInit {
  @ViewChild('binarization') canvas!: ElementRef<HTMLCanvasElement>;
  @Output() closeEvent = new EventEmitter<boolean>();

  private lastImageState!: {width: number, height: number, array: Uint8ClampedArray};
  private originalImageState!: {width: number, height: number, array: Uint8ClampedArray};

  selectedMethod: 'manual' | 'iterative' | 'entropy' | null = null;
  thresholdValue: number = 128;
  calculatedThreshold: number | null = null;

  constructor(private imageState: ImageStateService) {}

  ngAfterViewInit(): void {
    this.imageState._imageState.subscribe(image => {
      if (image) {
        this.lastImageState = {
          width: image?.width!,
          height: image?.height!,
          array: new Uint8ClampedArray(image?.array!)
        };
        this.originalImageState = {
          width: image?.width!,
          height: image?.height!,
          array: new Uint8ClampedArray(image?.array!)
        };
        let promise = this.renderImage();
      }
    });
  }

  private async renderImage() {
    if (this.lastImageState) {
      const native = this.canvas.nativeElement;
      const ctx = native.getContext('2d')!;
      native.width = native.clientWidth;
      native.height = native.clientHeight;

      ctx.clearRect(0, 0, native.width, native.height);

      const imageData = new ImageData(
        this.lastImageState.array,
        this.lastImageState.width,
        this.lastImageState.height
      );

      try {
        const bitmap = await createImageBitmap(imageData);
        ctx.drawImage(bitmap, 0, 0, native.width, native.height);
        bitmap.close();
      } catch (e) {
        console.error('Image rendering error', e);
      }
    }
  }

  async onApply() {
    if (this.lastImageState) {
      this.imageState.setImageState(this.lastImageState);
      await this.renderImage();
    }
  }

  onCancel() {
    if (this.originalImageState) {
      this.lastImageState = {
        width: this.originalImageState.width!,
        height: this.originalImageState.height!,
        array: new Uint8ClampedArray(this.originalImageState.array!)
      };
      this.renderImage();
      this.selectedMethod = null;
      this.calculatedThreshold = null;
    }
  }

  onClose() {
    this.closeEvent.emit(false);
  }

  onManual() {
    this.selectedMethod = 'manual';
    this.calculatedThreshold = null;
    this.applyBinarization(this.thresholdValue);
  }

  onThresholdChange() {
    if (this.selectedMethod === 'manual') {
      this.applyBinarization(this.thresholdValue);
    }
  }

  onMeanIterative() {
    this.selectedMethod = 'iterative';
    const threshold = this.calculateMeanIterativeThreshold();
    this.calculatedThreshold = threshold;
    this.thresholdValue = threshold;
    this.applyBinarization(threshold);
  }

  onEntropy() {
    this.selectedMethod = 'entropy';
    const threshold = this.calculateEntropyThreshold();
    this.calculatedThreshold = threshold;
    this.thresholdValue = threshold;
    this.applyBinarization(threshold);
  }

  private applyBinarization(threshold: number) {
    if (!this.originalImageState) return;

    const src = this.originalImageState.array;
    const dst = new Uint8ClampedArray(src.length);

    for (let i = 0; i < src.length; i += 4) {
      const gray = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];

      const val = gray >= threshold ? 255 : 0;

      dst[i] = val;
      dst[i + 1] = val;
      dst[i + 2] = val;
      dst[i + 3] = src[i + 3];
    }

    this.lastImageState = {
      width: this.originalImageState.width,
      height: this.originalImageState.height,
      array: dst
    };

    this.renderImage();
  }

  private calculateMeanIterativeThreshold(): number {
    if (!this.originalImageState) return 128;

    let sum = 0;
    let count = 0;
    const data = this.originalImageState.array;

    const histogram = new Array(256).fill(0);

    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      histogram[gray]++;
      sum += gray;
      count++;
    }

    let currentT = Math.floor(sum / count);
    let prevT = -1;

    while (currentT !== prevT) {
      prevT = currentT;

      let sumLow = 0, countLow = 0;
      let sumHigh = 0, countHigh = 0;

      for (let i = 0; i < 256; i++) {
        if (i < currentT) {
          sumLow += i * histogram[i];
          countLow += histogram[i];
        } else {
          sumHigh += i * histogram[i];
          countHigh += histogram[i];
        }
      }

      const meanLow = countLow > 0 ? sumLow / countLow : 0;
      const meanHigh = countHigh > 0 ? sumHigh / countHigh : 0;

      currentT = Math.floor((meanLow + meanHigh) / 2);
    }

    return currentT;
  }

  private calculateEntropyThreshold(): number {
    if (!this.originalImageState) return 128;

    const histogram = new Array(256).fill(0);
    const data = this.originalImageState.array;
    let totalPixels = 0;

    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      histogram[gray]++;
      totalPixels++;
    }

    const p = histogram.map(count => count / totalPixels);

    let maxEntropy = -Infinity;
    let bestThreshold = 0;

    for (let t = 0; t < 256; t++) {
      let p_b = 0;
      let p_w = 0;

      for (let i = 0; i <= t; i++) p_b += p[i];
      for (let i = t + 1; i < 256; i++) p_w += p[i];

      if (p_b === 0 || p_w === 0) continue;

      let h_b = 0;
      let h_w = 0;

      for (let i = 0; i <= t; i++) {
        if (p[i] > 0) {
          h_b -= (p[i] / p_b) * Math.log(p[i] / p_b);
        }
      }

      for (let i = t + 1; i < 256; i++) {
        if (p[i] > 0) {
          h_w -= (p[i] / p_w) * Math.log(p[i] / p_w);
        }
      }

      const totalEntropy = h_b + h_w;

      if (totalEntropy > maxEntropy) {
        maxEntropy = totalEntropy;
        bestThreshold = t;
      }
    }

    return bestThreshold;
  }
}
