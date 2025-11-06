import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ColorsStateService {
  private _rgbSubject = new BehaviorSubject<{r: number, g: number, b: number} | null>(null);
  rgbSubject = this._rgbSubject.asObservable();


  setRGB(rgbInfo: {r:number, b:number,g:number}){
    this._rgbSubject.next(rgbInfo);
  }
  constructor() {}
}
