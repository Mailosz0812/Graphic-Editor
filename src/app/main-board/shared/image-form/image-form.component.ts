import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-image-form',
  templateUrl: './image-form.component.html',
  imports: [
    FormsModule
  ],
  styleUrl: './image-form.component.css'
})
export class ImageFormComponent {
  @Output() closeDialogEvent: EventEmitter<boolean> = new EventEmitter();
  @Input() canvas!: HTMLCanvasElement;

  closeDialog(){
    this.closeDialogEvent.emit(false);
  }

  private canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      }, type, quality);
    });
  }

  async saveAsJpeg(): Promise<void> {
    const nameEl = document.getElementById('file-name') as HTMLInputElement | null;
    const qualEl = document.getElementById('compression') as HTMLInputElement | null;

    const baseName = (nameEl?.value ?? '').trim() || 'image';
    let quality = parseFloat(qualEl?.value ?? '');
    if (Number.isNaN(quality)) quality = 0.92;
    quality = Math.min(1, Math.max(0, quality));

    if (!this.canvas) {
      console.error('Canvas is not provided to ImageFormComponent');
      return;
    }

    try {
      const blob = await this.canvasToBlob(this.canvas, 'image/jpeg', quality);

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = baseName.endsWith('.jpg') || baseName.endsWith('.jpeg')
        ? baseName
        : `${baseName}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.closeDialog();
    } catch (err) {
      console.error('Saving JPEG failed:', err);
    }
  }
}
