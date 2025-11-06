import {Component, EventEmitter, Input, Output} from '@angular/core';
import {UIError} from '../error-bus.service';

@Component({
  selector: 'app-err-dialog',
  imports: [],
  templateUrl: './err-dialog.component.html',
  styleUrl: './err-dialog.component.css'
})
export class ErrDialogComponent {
  @Output() closeEvent = new EventEmitter<boolean>();
  @Input() rawError!: UIError | null;

  onClose(event: boolean){
    this.closeEvent.emit(event);
  }
}
