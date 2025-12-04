import { Component, EventEmitter, Output } from '@angular/core';
import { ToolStateService } from '../services/tool-state.service';
import { BrushTool } from '../models/brush.tool';
import { LineTool } from '../models/line.tool';
import { RectTool } from '../models/rect.tool';
import { CircleTool } from '../models/circle.tool';
import { FormStateService } from '../services/form-state.service';
import { ShapeService } from '../services/shape.service';
import { HandTool } from '../models/hand.tool';
import { ResizeTool } from '../models/resize.tool';
import { ColorDialogComponent } from '../rgb-control/color-dialog/color-dialog.component';
import { NgIf } from '@angular/common';

import { SliceStateService } from '../services/slice-state.service';
import { BrushColorService } from '../services/brush-color.service';
import { ToolInterface } from '../models/tool.interface';
import {RgbCubeTool} from '../models/rgbCube.tool';
import {PointTransformTool} from '../models/pointTransform.tool';
import {FilterDialogComponent} from '../filters/filter-dialog/filter-dialog.component';
import {BezierTool} from '../models/bezier.tool';
import {BezierStateService} from '../services/bezier-state.service';

@Component({
  selector: 'app-buttons-interface',
  imports: [
    ColorDialogComponent,
    NgIf,
    FilterDialogComponent,
  ],
  templateUrl: './tools-buttons.component.html',
  styleUrl: './tools-buttons.component.css'
})
export class ToolsButtonsComponent {
  @Output() clearEvent = new EventEmitter<boolean>;
  @Output() zoomInEvent = new EventEmitter<boolean>;
  @Output() zoomOutEvent = new EventEmitter<boolean>;
  isColorDialog = false;
  isFilterDialog = false;
  isLineDialog = false;

  private activeTool: ToolInterface | null = null;

  constructor(private drawService: ToolStateService,
              private formState: FormStateService,
              private shapeService: ShapeService,
              private sliceState: SliceStateService,
              private brushColorService: BrushColorService,
              private bezierState: BezierStateService) {


    this.drawService._activeTool.subscribe(tool => {
      if (this.activeTool && this.activeTool instanceof BrushTool) {
        this.activeTool.destroy();
      }
      this.activeTool = tool;
    });
  }

  onBrush() {
    this.drawService.setTool(new BrushTool(this.brushColorService));
    this.formState.setToolName('brush');
  }

  onLineDialog(){
    this.isLineDialog = !this.isLineDialog;
  }
  onLine(){
    this.drawService.setTool(new LineTool(this.shapeService));
    this.formState.setToolName('line');
  }
  onBezier(){
    this.drawService.setTool(new BezierTool(this.shapeService, this.bezierState));
    this.formState.setToolName('bezier');
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
  onCube() {
    this.drawService.setTool(new RgbCubeTool(this.shapeService, this.sliceState));
    this.formState.setToolName('cube');
  }
  onResize(){
    this.drawService.setTool(new ResizeTool(this.shapeService))
    this.formState.setToolName('resize');
  }
  onPointTransform() {
    this.drawService.setTool(new PointTransformTool())
    this.formState.setToolName('pointTransform')
  }
  onFilterDialog(){
    this.isFilterDialog = true;
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
  onFilterClose(event: boolean){
    this.isFilterDialog = event;
  }
}
