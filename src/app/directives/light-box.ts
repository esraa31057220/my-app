import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appLightBox]',
})
export class LightBox {

  constructor(private elementRef:ElementRef) {
    this.elementRef.nativeElement.style.border = "4px solid red"
  }

  @HostListener('click') click(){
    this.elementRef.nativeElement.style.border = "5px solid purple"
  }
  @HostListener('mouseover') mouseover(){
    this.elementRef.nativeElement.style.border = "5px solid blue"
  }
  @HostListener('mouseout') mouseout(){
    this.elementRef.nativeElement.style.border = "5px solid green"
  }
}
