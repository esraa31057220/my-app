import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-shared-button',
  imports: [FormsModule, CommonModule],
  templateUrl: './shared-button.html',
  styleUrl: './shared-button.css',
})
export class SharedButton {
  @Input() title: string = 'Click Me';
  @Input() color:string = 'primary' // default color;
  @Input() width:string = 'auto' // default width;
  @Input() height:string = 'auto' // default height;

  @Output() action = new EventEmitter<void>();

  onClick(): void {
    this.action.emit();
  }
}
