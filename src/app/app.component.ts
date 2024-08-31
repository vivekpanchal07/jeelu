import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SplashScreenComponent } from './splash-screen/splash-screen.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SplashScreenComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  title = 'jeelu';
  isLoading = true;

  ngOnInit() {
    this.initializeApp();
  }

  initializeApp() {
    // Simulate a delay for API call
    setTimeout(() => {
      this.isLoading = false;
    }, 3000); // Adjust the delay as needed
  }
}
