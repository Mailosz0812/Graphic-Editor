// project-buttons.component.ts
import {Component, ElementRef, EventEmitter, Output, ViewChild} from '@angular/core';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-project-buttons',
  templateUrl: './project-buttons.component.html',
  imports: [
    NgIf
  ],
  styleUrls: ['./project-buttons.component.css']
})
export class ProjectButtonsComponent {
  @ViewChild("fileInput") private fileInput!: ElementRef<HTMLInputElement>;
  @Output("openFile") fileEvent = new EventEmitter<HTMLInputElement>();
  @Output("exportFile") exportEvent = new EventEmitter<string>;
  uploadDropdown = false;
  isExportDropdown = false;

  onFileDropdown() {
    this.uploadDropdown = !this.uploadDropdown;
    this.isExportDropdown = false;
  }
  onOpen() {
    this.fileInput.nativeElement.click()
  }
  onExportDropdown() {
    this.isExportDropdown = !this.isExportDropdown;
  }
  onExport(type: string) {
    this.isExportDropdown = false;
    this.uploadDropdown = false;
    this.exportEvent.emit(type);
  }
  onChange(event: Event){
    const input = event.target as HTMLInputElement;
    if(input.files && input.files.length > 0){
      this.fileEvent.emit(input);
    }
  }
}
