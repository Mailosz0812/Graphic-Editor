import {AfterViewInit, Component, OnInit, ViewChild, viewChild} from '@angular/core';
import {DrawBoardComponent} from './draw-board/draw-board.component';
import {ToolsButtonsComponent} from './tools-buttons/tools-buttons.component';
import {DynamicFormComponent} from './shared/dynamic-form/dynamic-form.component';
import {FormFieldModel} from './shared/formField.model';
import {NgIf} from '@angular/common';
import {FormStateService} from './services/form-state.service';
import {ToolStateService} from './services/tool-state.service';
import {ToolInterface} from './models/tool.interface';
import {Validators} from '@angular/forms';
import {DrawingService} from './services/drawing.service';
import {ShapeService} from './services/shape.service';
import {SerializeService} from './services/serialize.service';
import {ProjectButtonsComponent} from './project-buttons/project-buttons.component';
import {ImageFormComponent} from './shared/image-form/image-form.component';
import {RgbControlComponent} from './rgb-control/rgb-control.component';
import {ErrorBusService, UIError} from './errorHandling/error-bus.service';
import {Subscription, throttleTime} from 'rxjs';
import {ErrDialogComponent} from './errorHandling/err-dialog/err-dialog.component';
import {CubeSliceViewerComponent} from './cube-slice-viewer/cube-slice-viewer.component';
import {SliceStateService} from './services/slice-state.service';

@Component({
  selector: 'app-main-board',
  imports: [
    DrawBoardComponent,
    ToolsButtonsComponent,
    DynamicFormComponent,
    NgIf,
    ProjectButtonsComponent,
    ImageFormComponent,
    RgbControlComponent,
    ErrDialogComponent,
    CubeSliceViewerComponent
  ],
  templateUrl: './main-board.component.html',
  styleUrl: './main-board.component.css'
})
export class MainBoardComponent implements OnInit{
  @ViewChild("playground") board!: DrawBoardComponent;
  isDialog: boolean = false;
  statesMap: {tool: string, formState: boolean}[]=[
    {
      tool: 'brush',
      formState: false
    },
    {
      tool: 'line',
      formState: false
    },
    {
      tool: 'rectangle',
      formState: false
    },
    {
      tool: 'circle',
      formState: false
    },
    {
      tool: 'hand',
      formState: false
    },
    {
      tool: 'resize',
      formState: false
    },
    {
      tool: 'cube',
      formState: false
    }
  ];

  rectFormFields: FormFieldModel[] = [
    {
      fieldName: 'startX',
      fieldType: 'number',
      label: 'Pos x of start point',
      validators: [Validators.required,Validators.min(0),Validators.max(1000)]
    },
    {
      fieldName: 'startY',
      fieldType: 'number',
      label: 'Pos y of start point',
      validators: [Validators.required,Validators.min(0),Validators.max(1000)]
    },
    {
      fieldName: 'Width',
      fieldType: 'number',
      label: 'Width'
    },
    {
      fieldName: 'Height',
      fieldType: 'number',
      label: 'Height'
    }
  ];
  circleFormFields: FormFieldModel[] = [
    {
      fieldName: 'centerX',
      fieldType: 'number',
      label: 'Pos x of the center',
      validators: [Validators.required,Validators.min(0),Validators.max(1000)]
    },
    {
      fieldName: 'centerY',
      fieldType: 'number',
      label: 'Pos y of the center',
      validators: [Validators.required,Validators.min(0),Validators.max(1000)]
    },
    {
      fieldName: 'radius',
      fieldType: 'number',
      label: 'Radius'
    }
  ];
  lineFormFields: FormFieldModel[] = [
    {
      fieldName: 'startX',
      fieldType: 'number',
      label: 'Pos X of start point',
      validators: [Validators.required,Validators.min(0),Validators.max(1000)]
    },
    {
      fieldName: 'startY',
      fieldType: 'number',
      label: 'Pos Y of start point',
      validators: [Validators.required,Validators.min(0),Validators.max(1000)]
    },
    {
      fieldName: 'endX',
      fieldType: 'number',
      label: 'Pos X of end point',
      validators: [Validators.required,Validators.min(0),Validators.max(1000)]
    },
    {
      fieldName: 'endY',
      fieldType: 'number',
      label: 'Pos Y of end point',
      validators: [Validators.required,Validators.min(0),Validators.max(1000)]
    }
  ]
  handFormFields: FormFieldModel[] = [
    {
      fieldName: 'dx',
      fieldType: 'number',
      label: 'Distance to move on X axis'
    },
    {
      fieldName: 'dy',
      fieldType: 'number',
      label: 'Distance to move on Y axis'
    }
  ]
  resizeFormFields: FormFieldModel[] = [
    {
      fieldName: 'percent',
      fieldType: 'number',
      label: 'Increase or decrease size'
    }
  ]
  private activeTool!: ToolInterface | null;
  private errSub!: Subscription;
  lastError: UIError | null = null;
  isErrOpen: boolean = false;
  isColorDialog: boolean = false;
  constructor(private formState: FormStateService,private toolStateService: ToolStateService
              ,private drawService: DrawingService
              ,private shapeService: ShapeService
              ,private serializeService: SerializeService
              ,private errBus: ErrorBusService
              ,private sliceState: SliceStateService) {
    this.toolStateService._activeTool.subscribe(tool => {
      this.activeTool = tool;
    })
  }
  private openErrorDialog(error: UIError){
    if(this.isErrOpen) return;
    if(!error){
      return;
    }
    this.lastError = error;
    this.isErrOpen = true;
  }
  ngOnInit(): void {
    this.formState._stateSub.subscribe(toolName => {
      this.statesMap.forEach(state => {
        state.formState = state.tool === toolName;
      })
      this.sliceState.setEnabled(toolName === 'cube');
    });
    this.errSub = this.errBus.errors
      .pipe(throttleTime(300, undefined, { leading: true, trailing: true }))
      .subscribe(err => this.openErrorDialog(err));
  }
  onCloseErr(event: boolean){
    this.isErrOpen = false;
  }
  onClear(event: boolean){
    this.board.onClearBoard();
    this.shapeService.deleteShapes();
  }
  onZoomIn(event: boolean){
    let arr = this.board.zoomIn();
    let ctx = this.board.canvasRender;
    let width = this.board.board.nativeElement.width
    let height = this.board.board.nativeElement.height
    let imageData = new ImageData(arr,width,height);
    ctx.putImageData(imageData,0,0);
  }
  onZoomOut(event: boolean){
    let arr = this.board.zoomOut();
    let ctx = this.board.canvasRender;
    let width = this.board.board.nativeElement.width
    let height = this.board.board.nativeElement.height
    let imageData = new ImageData(arr,width,height);
    ctx.putImageData(imageData,0,0);
  }
  async onImport(event: HTMLInputElement){
    let imageInfo: {width: number, height: number, array: Uint8ClampedArray} = await this.serializeService.deserializeShapes(event,this.board.canvasRender);
    if(imageInfo.array) {
      this.board.drawInitImage(imageInfo);
    }
  }
  onExport(event: String){
    if(event === 'jpeg'){
      this.isDialog = true;
    }
    else {
      this.serializeService.serializeShapes(event);
    }
  }
  onSubmit(params: any){
    const ctx = this.board.canvasRender;
    this.activeTool?.draw(params,ctx,this.drawService);
  }
  onCloseDialog(event: boolean){
    this.isDialog = event;
  }
  onColorChoose(event: boolean){
    this.isColorDialog = event;
  }
  onColorClose(event: boolean){
    this.isColorDialog = event;
  }

  getStateByToolName(toolName: string): boolean{
    const state = this.statesMap.find(s => s.tool === toolName);
    return state ? state.formState : false;
  }
}
