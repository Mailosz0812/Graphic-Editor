// main-board/services/bezier-state.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface BezierPoint {
  x: number;
  y: number;
}

@Injectable({
  providedIn: 'root'
})
export class BezierStateService {
  private pointsSource = new BehaviorSubject<BezierPoint[]>([]);
  points$ = this.pointsSource.asObservable();

  private degreeSource = new BehaviorSubject<number>(3);
  degree$ = this.degreeSource.asObservable();

  updatePoints(points: BezierPoint[]) {
    this.pointsSource.next(points);
  }

  setDegree(degree: number) {
    this.degreeSource.next(degree);
  }

  getCurrentDegree(){
    return this.degreeSource.getValue();
  }
}
