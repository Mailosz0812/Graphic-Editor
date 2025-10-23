import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FormStateService {
  private stateSub =
    new BehaviorSubject<string>('brush');
  _stateSub = this.stateSub.asObservable();

  constructor() {}

  setToolName(toolName: string){
    this.stateSub.next(toolName);
  }
}
