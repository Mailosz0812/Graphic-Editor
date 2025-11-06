import {Component, EventEmitter, Output} from '@angular/core';
import {ToolStateService} from '../services/tool-state.service';
import {BrushTool} from '../models/brush.tool';
import {LineTool} from '../models/line.tool';
import {RectTool} from '../models/rect.tool';
import {CircleTool} from '../models/circle.tool';
import {FormStateService} from '../services/form-state.service';
import {ShapeService} from '../services/shape.service';
import {HandTool} from '../models/hand.tool';
import {ResizeTool} from '../models/resize.tool';
import {ColorDialogComponent} from '../rgb-control/color-dialog/color-dialog.component';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-buttons-interface',
  imports: [
    ColorDialogComponent,
    NgIf
  ],
  templateUrl: './tools-buttons.component.html',
  styleUrl: './tools-buttons.component.css'
})
export class ToolsButtonsComponent {
  @Output() clearEvent = new EventEmitter<boolean>;
  @Output() zoomInEvent = new EventEmitter<boolean>;
  @Output() zoomOutEvent = new EventEmitter<boolean>;
  isColorDialog = false;


  constructor(private drawService: ToolStateService,
              private formState: FormStateService,
              private shapeService: ShapeService) {
  }

  onBrush(){
    this.drawService.setTool(new BrushTool());
    this.formState.setToolName('brush');
  }
  onLine(){
    this.drawService.setTool(new LineTool(this.shapeService));
    this.formState.setToolName('line');
  }
  onClear(){
    this.clearEvent.emit(true);
  }
  onRectangle(){
    this.drawService.setTool(new RectTool(this.shapeService));
    this.formState.setToolName('rectangle');

  }
  onCircle(){
    this.drawService.setTool(new CircleTool(this.shapeService));
    this.formState.setToolName('circle');
  }
  onHand(){
    this.drawService.setTool(new HandTool(this.shapeService));
    this.formState.setToolName('hand');
  }
  onResize(){
    this.drawService.setTool(new ResizeTool(this.shapeService))
    this.formState.setToolName('resize');
  }
  onZoomIn(){
    this.zoomInEvent.emit(true);
  }
  onZoomOut(){
    this.zoomOutEvent.emit(true);
  }
  onColorChoose(){
    this.isColorDialog = true;
  }
  onColorClose(event: boolean){
    this.isColorDialog = event;
  }

}
