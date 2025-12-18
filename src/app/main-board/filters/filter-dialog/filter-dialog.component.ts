import {AfterViewInit, Component, ElementRef, EventEmitter, Output, ViewChild} from '@angular/core';
import {ImageStateService} from '../../services/image-state.service';
import {Filter} from '../tools/Filter';
import {BoxBlur} from '../tools/BoxBlur';
import {MedianFilter} from '../tools/MedianFilter';
import {SobelFilter} from '../tools/Sobel';
import {HighPassFilter} from '../tools/HighPassFilter';
import {GaussianFilter} from '../tools/GaussianFilter';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {
  ClosingFilter, DilationFilter, ErosionFilter, HitOrMissFilter,
  OpeningFilter, ThickeningFilter, ThinningFilter
} from '../tools/MorphologyFilters';

@Component({
  selector: 'app-filter-dialog',
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-dialog.component.html',
  styleUrl: './filter-dialog.component.css'
})
export class FilterDialogComponent implements AfterViewInit{
  @Output() closeEvent = new EventEmitter<boolean>()
  @ViewChild('playground') canvasView!: ElementRef<HTMLCanvasElement>;

  private filter?: Filter;
  private currentMask: number | number[][] = 0;

  private initialArray!: {width: number, height: number, array: Uint8ClampedArray}

  isStandardOpen = false;
  isMorphOpen = false;

  seWidth: number = 3;
  seHeight: number = 3;
  structuringElement: number[][] = [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1]
  ];

  constructor(private imageState: ImageStateService) {}

  onClose(){
    this.closeEvent.emit(false);
  }

  ngAfterViewInit(): void {
    this.imageState._imageState.subscribe(imgInfo => {
      if(imgInfo){
        this.initialArray = {
          width: imgInfo.width,
          height: imgInfo.height,
          array: new Uint8ClampedArray(imgInfo.array)
        };
        this.renderImage(this.initialArray);
      }
    })
  }

  renderImage(imgInfo: {width: number, height: number, array: Uint8ClampedArray}) {
    if (!imgInfo.array || !imgInfo.width || !imgInfo.height) return;

    const canvas = this.canvasView.nativeElement;
    const ctx = canvas.getContext('2d',{ willReadFrequently: true})!;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const originalImageData = new ImageData(
      imgInfo.array,
      imgInfo.width,
      imgInfo.height
    );

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = imgInfo.width;
    tempCanvas.height = imgInfo.height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.putImageData(originalImageData, 0, 0);


    const scale = Math.min(
      canvas.width / imgInfo.width,
      canvas.height / imgInfo.height
    );
    const drawWidth = imgInfo.width * scale;
    const drawHeight = imgInfo.height * scale;
    const x = (canvas.width - drawWidth) / 2;
    const y = (canvas.height - drawHeight) / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, x, y, drawWidth, drawHeight);
  }


  toggleStandard() { this.isStandardOpen = !this.isStandardOpen; }
  toggleMorph() { this.isMorphOpen = !this.isMorphOpen; }


  updateSESize() {
    const newSE = [];
    for(let i=0; i<this.seHeight; i++){
      const row = [];
      for(let j=0; j<this.seWidth; j++){
        row.push(1);
      }
      newSE.push(row);
    }
    this.structuringElement = newSE;
  }

  toggleCell(r: number, c: number) {
    // Cykl: 1 (FG) -> 0 (BG) -> -1 (Don't Care) -> 1
    const val = this.structuringElement[r][c];
    if (val === 1) this.structuringElement[r][c] = 0;
    else if (val === 0) this.structuringElement[r][c] = -1;
    else this.structuringElement[r][c] = 1;
  }

  getCellColor(val: number): string {
    if (val === 1) return '#4caf50';
    if (val === 0) return '#f44336';
    return '#757575';
  }


  onBoxBlur(){
    this.filter = new BoxBlur();
    this.currentMask = 9;
    this.applyPreview();
  }
  onMedian(){
    this.filter = new MedianFilter();
    this.currentMask = 0;
    this.applyPreview();
  }
  onSobel(){
    this.filter = new SobelFilter();
    this.currentMask = 0;
    this.applyPreview();
  }
  onHigh(){
    this.filter = new HighPassFilter();
    this.currentMask = 0;
    this.applyPreview();
  }
  onGaussian(){
    this.filter = new GaussianFilter();
    this.currentMask = 0;
    this.applyPreview();
  }

  onDilation() {
    this.filter = new DilationFilter();
    this.currentMask = this.structuringElement;
    this.applyPreview();
  }
  onErosion() {
    this.filter = new ErosionFilter();
    this.currentMask = this.structuringElement;
    this.applyPreview();
  }
  onOpening() {
    this.filter = new OpeningFilter();
    this.currentMask = this.structuringElement;
    this.applyPreview();
  }
  onClosing() {
    this.filter = new ClosingFilter();
    this.currentMask = this.structuringElement;
    this.applyPreview();
  }
  onHitOrMiss() {
    this.filter = new HitOrMissFilter();
    this.currentMask = this.structuringElement;
    this.applyPreview();
  }
  onThinning() {
    this.filter = new ThinningFilter();
    this.currentMask = this.structuringElement;
    this.applyPreview();
  }
  onThickening() {
    this.filter = new ThickeningFilter();
    this.currentMask = this.structuringElement;
    this.applyPreview();
  }

  applyPreview(){
    if (!this.filter) return;

    const canvas = this.canvasView.nativeElement;
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0,0,canvas.width,canvas.height);

    const newArray = this.filter.filter(imageData.data, imageData.width, imageData.height, this.currentMask);

    const newImageData = new ImageData(newArray, imageData.width, imageData.height);
    ctx.putImageData(newImageData,0,0);
  }

  onCancel() {
    this.renderImage(this.initialArray);
    this.filter = undefined;
  }

  onApply() {
    if (this.filter && this.initialArray) {
      const w = this.initialArray.width;
      const h = this.initialArray.height;

      const resultArray = this.filter.filter(
        this.initialArray.array,
        w,
        h,
        this.currentMask
      );

      this.imageState.setImageState({
        width: w,
        height: h,
        array: resultArray
      });
    }
    this.closeEvent.emit(true);
  }
}
