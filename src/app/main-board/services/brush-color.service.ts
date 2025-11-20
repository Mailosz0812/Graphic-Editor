import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

@Injectable({
  providedIn: 'root'
})
export class BrushColorService {
  private colorSubject = new BehaviorSubject<RgbColor>({ r: 189, g: 168, b: 168 });

  public color$ = this.colorSubject.asObservable();

  constructor() { }

  setColor(color: RgbColor): void {
    this.colorSubject.next(color);
  }

  getColor(): RgbColor {
    return this.colorSubject.getValue();
  }
}
