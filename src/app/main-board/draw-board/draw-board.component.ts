import {AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild} from '@angular/core';
import {BehaviorSubject, Subscription} from 'rxjs';
import {ToolStateService} from '../services/tool-state.service';
import {ToolInterface} from '../models/tool.interface';
import {DrawingService} from '../services/drawing.service';

@Component({
  selector: 'app-draw-board',
  imports: [],
  templateUrl: './draw-board.component.html',
  styleUrl: './draw-board.component.css'
})
export class DrawBoardComponent implements AfterViewInit, OnDestroy{
  @ViewChild("playground",{static: false}) private board!: ElementRef<HTMLCanvasElement>;
   canvasRender!: CanvasRenderingContext2D;
  private ToolSub!: Subscription;
  private activeTool!: ToolInterface | null;

  constructor(private toolStateService: ToolStateService, private drawingService: DrawingService) {}

  ngAfterViewInit() {
    const canvas = this.board.nativeElement;
    this.canvasRender = canvas.getContext('2d',{ willReadFrequently: true})!;
    this.canvasRender.lineWidth = 3;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    this.ToolSub = this.toolStateService._activeTool.subscribe(tool => {
      this.activeTool = tool;
    })
  }
  ngOnDestroy(): void {
    this.ToolSub.unsubscribe();
  }
  onMouseClick(mouse: MouseEvent){
    this.activeTool?.onMouseClick(this.drawingService,mouse,this.canvasRender)
  }
  onMouseDown(mouse: MouseEvent){
    this.activeTool?.onMouseDown(this.drawingService,mouse,this.canvasRender);
  }
  onMouseMove(mouse: MouseEvent){
    this.activeTool?.onMouseMove(this.drawingService,mouse,this.canvasRender);
  }
  onMouseUp(mouse: MouseEvent){
    this.activeTool?.onMouseUp(this.drawingService,mouse,this.canvasRender);
  }
  onClearBoard(){
    this.canvasRender.clearRect(0,0,this.board.nativeElement.width,this.board.nativeElement.height);
  }
}
