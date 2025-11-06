import {AfterViewInit, Component, ElementRef, EventEmitter, Output, ViewChild} from '@angular/core';
import {NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-color-dialog',
  imports: [
    NgIf,
    FormsModule
  ],
  templateUrl: './color-dialog.component.html',
  styleUrl: './color-dialog.component.css'
})
export class ColorDialogComponent implements AfterViewInit{
  @Output() closeEvent = new EventEmitter<boolean>
  @ViewChild('board') private board!: ElementRef<HTMLCanvasElement>
  mode: 'rgb' | 'cmyk' = 'rgb';
  private palletData!: {data: Uint8ClampedArray, width: number, height: number};
  rgb: {r:number,g:number,b:number} = {r:0,g:0,b:0};
  cmyk: {c:number,m:number,y:number,k:number} = {c:0,m: 0,k: 0,y:0}

  private hsvToRgb(h: number, s: number, v: number) {
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;
    let r=0, g=0, b=0;
    if (h < 60)      [r,g,b] = [c,x,0];
    else if (h <120) [r,g,b] = [x,c,0];
    else if (h <180) [r,g,b] = [0,c,x];
    else if (h <240) [r,g,b] = [0,x,c];
    else if (h <300) [r,g,b] = [x,0,c];
    else             [r,g,b] = [c,0,x];
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    };
  }

  /**
   * Tworzy obraz palety: góra żywe barwy (R→G→B),
   * dół jaśniejszy (w stronę bieli), prawa strona przyciemniona (aż do czerni).
   * Zwraca {data,width,height}, gdzie data to Uint8ClampedArray RGBA.
   */
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
        data[i]     = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      }
    }

    return { data, width, height };
  }
  ngAfterViewInit(): void {
    const canvas = this.board.nativeElement;
    const canvasRender = canvas.getContext('2d',{ willReadFrequently: true})!;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight
    this.palletData  = this.makePaletteLike(canvas.width,canvas.height);
    const data =  new ImageData(this.palletData.data,this.palletData.width,this.palletData.height);
    canvasRender.putImageData(data,0,0);
  }
  onCloseEvent(){
    this.closeEvent.emit(false);
  }
  onColorChoose(mouse: MouseEvent){
    let posY: number = mouse.offsetY;
    let posX: number = mouse.offsetX;
    let pos: number = (this.palletData.width * posY + posX) * 4;
    let r: number = this.palletData.data[pos];
    let g: number = this.palletData.data[pos + 1];
    let b: number = this.palletData.data[pos + 2];
    this.setInputValues(r,g,b);
  }
  private setInputValues(r:number,g:number,b:number){
    this.cmyk = this.rgbToCmyk(r,g,b);
    this.rgb = {r,g,b};
  }

  private rgbToCmyk(r: number, g: number, b: number) {
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


}
