import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {ToolInterface} from '../models/tool.interface';

@Injectable({
  providedIn: 'root'
})
export class ToolStateService {
  private activeTool = new BehaviorSubject<ToolInterface | null>(null);
  _activeTool = this.activeTool.asObservable();

  constructor() { }
  setTool(tool: ToolInterface){
    this.activeTool.next(tool);
  }

}
