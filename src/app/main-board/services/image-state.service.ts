import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ImageStateService {
  private imageState = new BehaviorSubject<{width: number, height: number, array: Uint8ClampedArray} | null>(null)
  _imageState = this.imageState.asObservable();

  setImageState(data: {width: number, height: number, array: Uint8ClampedArray}){
    this.imageState.next(data);
  }
}
