import { Directive, HostListener, Renderer2, ElementRef, OnInit } from '@angular/core';

@Directive({ selector: '[appDarkMode]' })
export class DarkModeDirective implements OnInit {
  
  private isDark = false;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit() { this.setIcon(); }

  @HostListener('click') onClick() {
    this.isDark = !this.isDark;
    if (this.isDark) {
      this.renderer.addClass(document.body, 'dark-mode');
    } else {
      this.renderer.removeClass(document.body, 'dark-mode');
    }
    this.setIcon();
  }

  private setIcon() {
    this.el.nativeElement.textContent = this.isDark ? '☀️' : '🌙';
  }
}