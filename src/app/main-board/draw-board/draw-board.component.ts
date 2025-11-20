import {AfterViewInit, Component, ElementRef, OnDestroy,  ViewChild} from '@angular/core';
import {BehaviorSubject, Subscription} from 'rxjs';
import {ToolStateService} from '../services/tool-state.service';
import {ToolInterface} from '../models/tool.interface';
import {DrawingService} from '../services/drawing.service';
import {ColorsStateService} from '../services/colors-state.service';

@Component({
  selector: 'app-draw-board',
  imports: [],
  templateUrl: './draw-board.component.html',
  styleUrl: './draw-board.component.css'
})
export class DrawBoardComponent implements AfterViewInit, OnDestroy{
  @ViewChild("playground",{static: false}) board!: ElementRef<HTMLCanvasElement>;

  private ToolSub!: Subscription;
  private activeTool!: ToolInterface | null;
  private zoomFactor = 1.0;
  private camX = 0;
  private camY = 0;

  canvasRender!: CanvasRenderingContext2D;
  startHeight: number = 0;
  startWidth: number = 0;
  srcArray?: Uint8ClampedArray;
  private srcW = 0;
  private srcH = 0;


  constructor(private toolStateService: ToolStateService, private drawingService: DrawingService,private colorsState: ColorsStateService) {}

  ngAfterViewInit() {
    const canvas = this.board.nativeElement;
    this.canvasRender = canvas.getContext('2d',{ willReadFrequently: true})!;
    this.canvasRender.lineWidth = 3;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    this.startHeight = canvas.height;
    this.startWidth = canvas.width;
    this.ToolSub = this.toolStateService._activeTool.subscribe(tool => {
      this.activeTool = tool;
    })
  }
  ngOnDestroy(): void {
    this.ToolSub.unsubscribe();
  }
  onMouseClick(mouse: MouseEvent){
    this.activeTool?.onMouseClick(this.drawingService,mouse,this.canvasRender)
  }
  onMouseDown(mouse: MouseEvent){
    this.activeTool?.onMouseDown(this.drawingService,mouse,this.canvasRender);
  }
  onMouseMove(mouse: MouseEvent){
    this.activeTool?.onMouseMove(this.drawingService,mouse,this.canvasRender);
    this.colorsState.setRGB(this.getRGBAValue(mouse.offsetX,mouse.offsetY));
  }
  onMouseUp(mouse: MouseEvent){
    this.activeTool?.onMouseUp(this.drawingService,mouse,this.canvasRender);
  }
  zoomOut(): Uint8ClampedArray {
    if(!this.srcArray) return new Uint8ClampedArray(0);
    this.zoomFactor = Math.min(this.zoomFactor / 1.1, 3);
    return this.renderView(this.srcArray!, this.zoomFactor, this.camX, this.camY);
  }
  zoomIn(): Uint8ClampedArray {
    if(!this.srcArray) return new Uint8ClampedArray(0);
    this.zoomFactor = Math.max(this.zoomFactor * 1.1, 0.3);
    return this.renderView(this.srcArray!, this.zoomFactor, this.camX, this.camY);
  }
  onWheel(wheel: WheelEvent){
    wheel.preventDefault();
    if(!this.srcArray) return;
    if(wheel.ctrlKey){
      this.camX+=wheel.deltaY/2;
    }else{
      this.camY+=wheel.deltaY/2;
    }
    let arr = this.renderView(this.srcArray!,this.zoomFactor,this.camX,this.camY);
    let width = this.board.nativeElement.width;
    let height = this.board.nativeElement.height;
    let imageData = new ImageData(arr,width,height);
    this.canvasRender.putImageData(imageData,0,0);
  }
  drawInitImage(imageInfo: {width: number, height: number, array: Uint8ClampedArray}){
    if(imageInfo.width !== 0 && imageInfo.height !== 0) {
      this.srcW = imageInfo.width;
      this.srcH = imageInfo.height;
      this.srcArray = imageInfo.array;
      let canvas = this.canvasRender.canvas;
      if (this.startHeight > imageInfo.height && this.startWidth > imageInfo.width) {
        canvas.width = imageInfo.width;
        canvas.height = imageInfo.height;
        canvas.style.width = `${imageInfo.width}px`;
        canvas.style.height = `${imageInfo.height}px`;
      }
      let arr = this.renderView(this.srcArray,1,0,0);
      let imageData = new ImageData(arr,canvas.width,canvas.height)
      this.canvasRender.putImageData(imageData,0,0);
      return;
    }
    throw new Error('Invalid image info');
  }
  private  renderView(
    src: Uint8ClampedArray,
    scale: number,
    camX: number,
    camY: number,
  ): Uint8ClampedArray {
    const viewW = this.board.nativeElement.width;
    const viewH = this.board.nativeElement.height;
    const srcW = this.srcW;
    const srcH = this.srcH;
    const dst = new Uint8ClampedArray(viewW * viewH * 4);
    for (let y = 0; y < viewH; y++) {
      for (let x = 0; x < viewW; x++) {
        const worldX = camX + x / scale;
        const worldY = camY + y / scale;
        const sx = Math.floor(worldX);
        const sy = Math.floor(worldY);

        const dstIdx = (y * viewW + x) * 4;

        if (sx >= 0 && sx < srcW && sy >= 0 && sy < srcH) {
          const srcIdx = (sy * srcW + sx) * 4;
          dst[dstIdx] = src[srcIdx];       // R
          dst[dstIdx + 1] = src[srcIdx+1]; // G
          dst[dstIdx + 2] = src[srcIdx+2]; // B
          dst[dstIdx + 3] = src[srcIdx+3]; // A
        } else {
          dst[dstIdx] = 255 ;
          dst[dstIdx + 1] = 255;
          dst[dstIdx + 2] = 255;
          dst[dstIdx + 3] = 255;
        }
      }
    }
    return dst;
  }
  private getRGBAValue(posX: number, posY: number): {r: number, g: number, b:number}{
    let sw = this.board.nativeElement.width;
    let arr = this.canvasRender.getImageData(0,0,sw,this.board.nativeElement.height).data;
    let arrPos = ((sw * posY) + posX) * 4;
    let r = arr[arrPos];
    let g = arr[arrPos + 1];
    let b = arr[arrPos + 2];
    if(!r || !g || !b){
      return {r: 0,g: 0,b: 0};
    }
    return {r,g,b};
  }
  onClearBoard(){
    this.canvasRender.clearRect(0,0,this.board.nativeElement.width,this.board.nativeElement.height);
  }
}
