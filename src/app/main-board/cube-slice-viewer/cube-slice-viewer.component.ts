import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgForOf } from '@angular/common';
import { SliceStateService } from '../services/slice-state.service';

@Component({
  selector: 'app-cube-slice-viewer',
  standalone: true,
  imports: [ FormsModule, NgForOf ],
  templateUrl: './cube-slice-viewer.component.html',
  styleUrl: './cube-slice-viewer.component.css'
})
export class CubeSliceViewerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('sliceCanvas') private canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  sliceAxis: 'x' | 'y' | 'z' = 'x';
  sliceValue: number = 50;

  private canvasSize = 200;

  constructor(private sliceState: SliceStateService) {}

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    canvas.width = this.canvasSize;
    canvas.height = this.canvasSize;
    this.onSettingsChange();
  }

  onSettingsChange(): void {
    if (this.ctx) {
      this.renderSlice();
    }
    this.sliceState.setState(this.sliceAxis, this.sliceValue / 100.0);
  }

  ngOnDestroy(): void {
  }

  private renderSlice(): void {
    const imageData = this.ctx.createImageData(this.canvasSize, this.canvasSize);
    const data = imageData.data;
    const value = this.sliceValue / 100;

    for (let y = 0; y < this.canvasSize; y++) {
      for (let x = 0; x < this.canvasSize; x++) {

        const u = x / (this.canvasSize - 1);
        const v = 1.0 - (y / (this.canvasSize - 1));

        let r = 0, g = 0, b = 0;

        switch (this.sliceAxis) {
          case 'x': r = value; g = u; b = v; break;
          case 'y': r = u; g = value; b = v; break;
          case 'z': r = u; g = v; b = value; break;
        }

        const index = (y * this.canvasSize + x) * 4;
        data[index] = r * 255;
        data[index + 1] = g * 255;
        data[index + 2] = b * 255;
        data[index + 3] = 255;
      }
    }
    this.ctx.putImageData(imageData, 0, 0);
  }

  getAxisLabel(planeAxis: 'u' | 'v'): string {
    if (planeAxis === 'u') {
      switch (this.sliceAxis) {
        case 'x': return 'G';
        case 'y': return 'R';
        case 'z': return 'R';
      }
    } else {
      switch (this.sliceAxis) {
        case 'x': return 'B';
        case 'y': return 'B';
        case 'z': return 'G';
      }
    }
    return '';
  }
}
