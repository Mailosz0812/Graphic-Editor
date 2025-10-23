import { Injectable } from '@angular/core';
import {ShapeService} from './shape.service';
import {ShapeModel} from '../models/Shape.model';

@Injectable({
  providedIn: 'root'
})
export class SerializeService {

  constructor(private shapeService: ShapeService) { }

  serializeShapes(){
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
  deserializeShapes(event: Event,ctx: CanvasRenderingContext2D) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const json = reader.result as string;
        const shapes: ShapeModel[] = JSON.parse(json).map((data: any)=> Object.assign(new ShapeModel(),data));

        this.shapeService.shapes = shapes;
        this.shapeService.drawAll(ctx);

      } catch (error) {
        console.error("Błąd podczas deserializacji:", error);
      }
    };

    reader.readAsText(file);
  }
}
