import {Component, EventEmitter, Output} from '@angular/core';
import {SerializeService} from '../services/serialize.service';

@Component({
  selector: 'app-project-buttons',
  imports: [],
  templateUrl: './project-buttons.component.html',
  styleUrl: './project-buttons.component.css'
})
export class ProjectButtonsComponent {
  @Output() importEvent = new EventEmitter<Event>;

  constructor(private serializeService: SerializeService) {}

  onDownload(){
    this.serializeService.serializeShapes();
  }
  onChanges(event: Event){
    this.importEvent.emit(event);
  }

}
