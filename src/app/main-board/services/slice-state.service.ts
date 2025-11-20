import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface SliceState {
  axis: 'x' | 'y' | 'z';
  value: number; // 0.0 - 1.0
  enabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SliceStateService {
  private state = new BehaviorSubject<SliceState>({
    axis: 'x',
    value: 0.5,
    enabled: false
  });

  public state$ = this.state.asObservable();

  setState(axis: 'x' | 'y' | 'z', value: number) {
    const currentState = this.state.getValue();
    this.state.next({ ...currentState, axis, value });
  }

  setEnabled(enabled: boolean) {
    const currentState = this.state.getValue();
    this.state.next({ ...currentState, enabled });
  }

  getCurrentState(): SliceState {
    return this.state.getValue();
  }
}
