import {AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild} from '@angular/core';
import {ImageStateService} from '../../services/image-state.service';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-histogram',
  imports: [
    NgIf
  ],
  templateUrl: './histogram.component.html',
  styleUrl: './histogram.component.css'
})
export class HistogramComponent implements OnInit, AfterViewInit{
  @Output() closeEvent = new EventEmitter();
  @ViewChild('histogram') histogramCanvas!: ElementRef<HTMLCanvasElement>;
  private isHistogram: boolean = true;
  mode: 'image' | 'histogram' = 'histogram';
  private histogramTable: number[] = new Array(256).fill(0);
  private lastImageState!: {width: number,height: number,array: Uint8ClampedArray};
  private originalImageState!: {width: number,height: number,array: Uint8ClampedArray};
  constructor(private imageState: ImageStateService) {
  }
  ngOnInit(): void {
    this.imageState._imageState.subscribe(image => {
      if(image?.array) {
        this.originalImageState = {
          width: image.width,
          height: image.height,
          array: new Uint8ClampedArray(image.array)
        };
        this.lastImageState = image;
        this.renderHistogram();
      }
    });
  }
  ngAfterViewInit(): void {
    this.onHistogram();
  }
  private renderHistogram(){
    this.histogramTable.fill(0);
    for (let i = 0; i < this.lastImageState.array.length; i+=4){
      this.histogramTable[this.lastImageState.array[i]]++;
    }
  }
  onHistogram(){
    this.isHistogram = true;
    this.mode = 'histogram';
    const native = this.histogramCanvas.nativeElement;
    const ctx = native.getContext('2d')!;
    native.width = native.clientWidth;
    native.height = native.clientHeight;

    ctx.clearRect(0, 0, native.width, native.height);

    const width = native.width;
    const height = native.height;
    const barWidth = width / this.histogramTable.length;
    const maxVal = Math.max(...this.histogramTable);
    const logMax = Math.log(maxVal + 1);

    const gradient = ctx.createLinearGradient(0, 0, 0, height);

    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');

    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');

    ctx.fillStyle = gradient;

    for (let i = 0; i < this.histogramTable.length; i++) {
      const val = this.histogramTable[i];
      const normalizedHeight = Math.log(val + 1) / logMax;
      const barHeight = normalizedHeight * height;
      const x = i * barWidth;
      const y = height - barHeight;

      ctx.fillRect(x, y, barWidth + 0.5, barHeight);
    }
  }
  async onImageView() {
    if (this.lastImageState) {
      this.isHistogram = false;
      this.mode = 'image';
      const native = this.histogramCanvas.nativeElement;
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
  async onStretch(){
    let min = -1;
    let max = -1;
    let i = 0;
    let j = 255;
    while(true){
      if(this.histogramTable[i] > 0){
        min = i;
      }
      if(this.histogramTable[j] > 0){
        max = j;
      }
      if(min == -1){
        i++;
      }
      if(max == -1){
        j--;
      }
      if(min != -1 && max != -1 || j < 0 || i > 255){
        break;
      }
    }
    if(min != -1 && max != -1){
      let lut = this.stretchPixels(min,max);
      this.applyNewPixels(lut);
      this.renderHistogram();
      if(this.isHistogram){
        this.onHistogram();
      }else{
        await this.onImageView();
      }
    }
  }
  private stretchPixels(min: number, max:number): Array<number>{
    const lut = new Array(256);
    const range = max - min;

    for (let i = 0; i < 256; i++) {
      if (i <= min) {
        lut[i] = 0;
      } else if (i >= max) {
        lut[i] = 255;
      } else {
        lut[i] = Math.round(((i - min) * 255) / range);
      }
    }
    return lut
  }
  private applyNewPixels(lut: Array<number>){
    const data = this.lastImageState.array;
    for (let i = 0; i < data.length; i += 4) {
      const oldVal = data[i];
      const newVal = lut[oldVal];
      data[i] = newVal;
      data[i + 1] = newVal;
      data[i + 2] = newVal;
    }
  }
  async onEqualize(){
    let cdf: Array<number> = new Array<number>(this.histogramTable.length);
    cdf[0] = this.histogramTable[0];
    for(let i = 1; i < this.histogramTable.length; i++){
      cdf[i] = cdf[i - 1] + this.histogramTable[i];
    }
    const lut = this.renderEqualizeLUT(cdf);
    this.applyNewPixels(lut);
    this.renderHistogram();
    if(this.isHistogram){
      this.onHistogram();
    }else{
      await this.onImageView();
    }
  }
  private renderEqualizeLUT(cdf: Array<number>){
    let min = 0;
    for(let i = 0; i < cdf.length; i++){
      if(cdf[i] > 0){
        min = cdf[i];
        break;
      }
    }
    let lut:Array<number> = new Array(256);
    const totalPixels = this.lastImageState.array.length / 4;
    for(let i = 0; i < cdf.length; i++){
      const denominator = totalPixels - min;
      lut[i] = denominator > 0
        ? Math.round(((cdf[i] - min) / denominator) * 255)
        : 0;
    }
    return lut;
  }
  async onCancel(){
    this.lastImageState = {
      width: this.originalImageState.width,
      height: this.originalImageState.height,
      array: new Uint8ClampedArray(this.originalImageState.array)
    };
    this.renderHistogram();
    if(this.isHistogram){
      this.onHistogram();
    }else{
      await this.onImageView();
    }
  }
  onApply(){
    this.imageState.setImageState(this.lastImageState);
  }

  onClose(){
    this.closeEvent.emit(false);
  }

}
