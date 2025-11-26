import {AfterViewInit, Component, OnDestroy} from '@angular/core';
import {Subscription} from 'rxjs';
import {FormsModule} from '@angular/forms';
import {NgIf} from '@angular/common';
import {ImageStateService} from '../../services/image-state.service';

@Component({
  selector: 'app-point-transformation',
  imports: [ FormsModule, NgIf ],
  templateUrl: './point-transformation.component.html',
  styleUrl: './point-transformation.component.css'
})
export class PointTransformationComponent implements AfterViewInit, OnDestroy {

  protected rChannel: number = 0;
  protected gChannel: number = 0;
  protected bChannel: number = 0;

  private originalData: Uint8ClampedArray | null = null;
  private width: number = 0;
  private height: number = 0;

  private subscription!: Subscription;

  sliderMin: number = 0;
  sliderMax: number = 255;
  sliderStep: number = 1;
  currentOperation: string = 'add';
  private opConfig: any = {
    'add':        { min: 0, max: 255, step: 1,   default: 0 },
    'subtract':   { min: 0, max: 255, step: 1,   default: 0 },
    'brightness': { min: -255, max: 255, step: 1, default: 0 },
    'multiply':   { min: 0, max: 5,   step: 0.1, default: 1 },
    'divide':     { min: 1, max: 10,  step: 0.1, default: 1 }
  };

  constructor(private imageState: ImageStateService) {}

  ngAfterViewInit(): void {
    this.subscription = this.imageState._imageState.subscribe(imageInfo => {
      if(imageInfo && (!this.originalData || imageInfo.array.length !== this.originalData.length)){
        this.width = imageInfo.width;
        this.height = imageInfo.height;
        this.originalData = new Uint8ClampedArray(imageInfo.array);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
  }

  onOperationChange(operation: string) {
    this.currentOperation = operation;
    const config = this.opConfig[operation];
    this.sliderMin = config.min;
    this.sliderMax = config.max;
    this.sliderStep = config.step;
    this.resetValues(config.default);

    if (this.originalData) {
      this.imageState.setImageState({
        width: this.width,
        height: this.height,
        array: this.originalData
      });
    }
  }

  resetValues(val: number) {
    this.rChannel = val;
    this.gChannel = val;
    this.bChannel = val;
  }

  applyTransformation() {
    if (!this.originalData) return;

    const src = this.originalData;
    const output = new Uint8ClampedArray(src.length);

    for (let i = 0; i < src.length; i += 4) {
      const oldR = src[i];
      const oldG = src[i + 1];
      const oldB = src[i + 2];
      const alpha = src[i + 3];

      let newR = oldR;
      let newG = oldG;
      let newB = oldB;

      switch (this.currentOperation) {
        case 'add':
          newR = oldR + this.rChannel;
          newG = oldG + this.gChannel;
          newB = oldB + this.bChannel;
          break;
        case 'brightness':
          newR = oldR + this.rChannel;
          newG = oldG + this.rChannel;
          newB = oldB + this.rChannel;
          break;
        case 'subtract':
          newR = oldR - this.rChannel;
          newG = oldG - this.gChannel;
          newB = oldB - this.bChannel;
          break;
        case 'multiply':
          newR = oldR * this.rChannel;
          newG = oldG * this.gChannel;
          newB = oldB * this.bChannel;
          break;
        case 'divide':
          newR = this.rChannel !== 0 ? oldR / this.rChannel : oldR;
          newG = this.gChannel !== 0 ? oldG / this.gChannel : oldG;
          newB = this.bChannel !== 0 ? oldB / this.bChannel : oldB;
          break;
      }

      output[i] = newR;
      output[i+1] = newG;
      output[i+2] = newB;
      output[i+3] = alpha;
    }
    this.imageState.setImageState({
      width: this.width,
      height: this.height,
      array: output
    });
  }
  applyGrayscale(type: 'avg' | 'luma') {
    if (!this.originalData) return;

    const src = this.originalData;
    const output = new Uint8ClampedArray(src.length);

    for (let i = 0; i < src.length; i += 4) {
      const r = src[i];
      const g = src[i + 1];
      const b = src[i + 2];
      let gray = 0;
      if (type === 'avg') gray = (r + g + b) / 3;
      else gray = 0.299 * r + 0.587 * g + 0.114 * b;

      output[i] = gray;
      output[i + 1] = gray;
      output[i + 2] = gray;
      output[i + 3] = src[i + 3];
    }

    this.imageState.setImageState({
      width: this.width,
      height: this.height,
      array: output
    });
  }
}
