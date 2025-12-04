import { Component, OnInit, Output, EventEmitter } from '@angular/core'; // Dodano Output, EventEmitter
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BezierStateService, BezierPoint } from '../services/bezier-state.service';

@Component({
  selector: 'app-bezier-control',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bezier-control.component.html',
  styleUrls: ['./bezier-control.component.css']
})
export class BezierControlComponent implements OnInit {
  degree: number = 3;
  points: BezierPoint[] = [];

  // Emitujemy zdarzenie do MainBoard
  @Output() pointsChanged = new EventEmitter<BezierPoint[]>();

  constructor(private bezierState: BezierStateService) {}

  ngOnInit(): void {
    this.bezierState.points$.subscribe(points => {
      this.points = points;
    });

    this.bezierState.degree$.subscribe(deg => {
      this.degree = deg;
    });
  }

  onDegreeChange() {
    this.bezierState.setDegree(this.degree);
  }

  onCoordinateChange() {
    // 1. Aktualizujemy stan w serwisie (dla spójności)
    this.bezierState.updatePoints(this.points);
    // 2. Emitujemy zdarzenie "Hej, przerysuj mnie!"
    this.pointsChanged.emit(this.points);
  }
}
