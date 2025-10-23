import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {MainBoardComponent} from './main-board/main-board.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MainBoardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Graphic-Editor';
}
