import { Directive, HostBinding, Input } from '@angular/core';

@Directive({
  selector: '[appHighLight]',
})
export class HighLight {
  // @HostBinding('style.color') txt = 'blue';
  @Input() appHighLight = false;
  @HostBinding ('class.active') 
  get Active(){
    return this.appHighLight;
  }



  constructor() {}
}
