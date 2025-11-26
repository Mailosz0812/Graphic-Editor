import {AfterViewInit, Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';
import {ColorsStateService} from '../services/colors-state.service';
import {Subscription} from 'rxjs';
import {ReactiveFormsModule} from '@angular/forms';

@Component({
  selector: 'app-rgb-control',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './rgb-control.component.html',
  styleUrl: './rgb-control.component.css'
})
export class RgbControlComponent implements AfterViewInit, OnDestroy{
  @ViewChild('r', { read: ElementRef }) private rInput!: ElementRef<HTMLInputElement>;
  @ViewChild('g', { read: ElementRef }) private gInput!: ElementRef<HTMLInputElement>;
  @ViewChild('b', { read: ElementRef }) private bInput!: ElementRef<HTMLInputElement>;

  private colorsSub!: Subscription;
  constructor(private colorsState: ColorsStateService) {}

  ngAfterViewInit() {
    this.colorsSub = this.colorsState.rgbSubject.subscribe(info => {
      if (
        info == null ||
        info.r == null ||
        info.g == null ||
        info.b == null
      ) {
        this.rInput.nativeElement.value = '0';
        this.gInput.nativeElement.value = '0';
        this.bInput.nativeElement.value = '0';
        return;
      }
      this.rInput.nativeElement.value = String(info.r);
      this.gInput.nativeElement.value = String(info.g);
      this.bInput.nativeElement.value = String(info.b);
    });
  }
  ngOnDestroy(): void {
    this.colorsSub.unsubscribe();
  }

}
