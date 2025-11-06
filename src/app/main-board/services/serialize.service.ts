import { Injectable } from '@angular/core';
import {ShapeService} from './shape.service';
import {ShapeModel} from '../models/Shape.model';
import {AppFileReader} from './app-file.reader';
import {PpmReaderFileReader} from './ppmReader.file-reader';

@Injectable({
  providedIn: 'root'
})
export class SerializeService {
  private fileReader?: AppFileReader;

  constructor(private shapeService: ShapeService) { }

  serializeShapes(type: String){
    if(type === 'json'){
      const shapes: ShapeModel[] = this.shapeService.shapes;
      const json = JSON.stringify(shapes);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'data.json';

      a.click();

      URL.revokeObjectURL(url);
    }
  }
  async deserializeShapes(event: HTMLInputElement, ctx: CanvasRenderingContext2D):Promise<{width: number, height: number,array: Uint8ClampedArray}> {
    const input = event.files;
    let height = 0;
    let width = 0;
    if (!input || input.length === 0) throw new Error('Invalid input file');

    const file = input.item(0)!;
    if (file.name.toLowerCase().endsWith('.ppm')) {
      this.fileReader = new PpmReaderFileReader();
        const ppmInfo = await this.fileReader.readFile(file);
        let shape: ShapeModel = new ShapeModel();
        shape.pixelBuffer = ppmInfo.array;
        shape.startX = 0;
        shape.startY = 0;
        shape.type = 'image';
        shape.width = ppmInfo.width;
        shape.height = ppmInfo.height;
        height = ppmInfo.height;
        width = ppmInfo.width;
        this.shapeService.shapes = [];
        this.shapeService.shapes.push(shape);
        return {width: width, height: height,array: ppmInfo.array!};

    }
    else if(file.name.toLowerCase().endsWith('.json')){
        const reader = new FileReader();
        let imageData: ImageData;
        let canvas: HTMLCanvasElement;
        reader.onload = () => {
          const json = reader.result as string;
          const shapes: ShapeModel[] = JSON.parse(json).map((data: any) => Object.assign(new ShapeModel(), data));

          this.shapeService.shapes = shapes;
          this.shapeService.drawAll(ctx);
        };
        reader.readAsText(file);
        canvas = ctx.canvas;
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return {array: imageData!.data || new Uint8ClampedArray(0), height: canvas!.height, width: canvas!.width}
    }
    else if(file.type.startsWith("image/")){
        const bitmap = await createImageBitmap(file);
        const offscreen = document.createElement('canvas');
        offscreen.width = bitmap.width;
        offscreen.height = bitmap.height;
        const ctx = offscreen.getContext('2d')!;
        ctx.drawImage(bitmap, 0, 0);
        const { data } = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
        let shape: ShapeModel = new ShapeModel();
        shape.pixelBuffer = data;
        shape.startX = 0;
        shape.startY = 0;
        shape.width = bitmap.width;
        shape.height = bitmap.height;
        shape.type = "image";
        this.shapeService.shapes = [];
        this.shapeService.shapes.push(shape);
        return {width: bitmap.width, height: bitmap.height,array: data}
    }
    throw new Error('Invalid file format');
  }
}
