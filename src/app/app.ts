import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './shared/components/footer/footer';
import { Navbar } from './shared/components/navbar/navbar';
import { NotificationToast } from './shared/components/notification-toast/notification-toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer, NotificationToast],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('my-app');
}
