import {AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {ImageStateService} from '../../services/image-state.service';
import {Filter} from '../tools/Filter';
import {BoxBlur} from '../tools/BoxBlur';
import {MedianFilter} from '../tools/MedianFilter';
import {SobelFilter} from '../tools/Sobel';
import {HighPassFilter} from '../tools/HighPassFilter';
import {GaussianFilter} from '../tools/GaussianFilter';

@Component({
  selector: 'app-filter-dialog',
  imports: [],
  templateUrl: './filter-dialog.component.html',
  styleUrl: './filter-dialog.component.css'
})
export class FilterDialogComponent implements AfterViewInit{
  @Output() closeEvent = new EventEmitter<boolean>()
  @ViewChild('playground') canvasView!: ElementRef<HTMLCanvasElement>;
  private filter?: Filter;
  private initialArray!: {width: number, height: number, array: Uint8ClampedArray}

  constructor(private imageState: ImageStateService) {}
  onClose(){
    this.closeEvent.emit(false);
  }

  ngAfterViewInit(): void {
    this.imageState._imageState.subscribe(imgInfo => {
      if(imgInfo){
        this.initialArray = imgInfo
        this.renderImage(imgInfo);
      }
    })
  }

  renderImage(imgInfo: {width: number, height: number, array: Uint8ClampedArray}) {
    if (!imgInfo.array || !imgInfo.width || !imgInfo.height) return;

    this.initialArray = imgInfo;
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
  onBoxBlur(){
    this.filter = new BoxBlur();
    this.renderFilteredImage();
  }
  onMedian(){
    this.filter = new MedianFilter();
    this.renderFilteredImage();
  }
  onSobel(){
    this.filter = new SobelFilter();
    this.renderFilteredImage()
  }
  onHigh(){
    this.filter = new HighPassFilter();
    this.renderFilteredImage();
  }
  onGaussian(){
    this.filter = new GaussianFilter();
    this.renderFilteredImage();
  }
  renderFilteredImage(){
    const canvas = this.canvasView.nativeElement;
    const imageData = canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height)
    const oldArray = imageData.data;
    const imgW = imageData.width;
    const imgH = imageData.height;
    const newArray = this.filter!.filter(oldArray,imgW,imgH,9);
    let newImageData = new ImageData(newArray,imgW,imgH);
    canvas.getContext('2d')!.putImageData(newImageData,0,0);

  }
  onCancel() {
    this.renderImage(this.initialArray);
  }
}
