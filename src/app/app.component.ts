import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,RouterModule,MatToolbarModule,MatButtonModule,CommonModule],
  templateUrl: './app.component.html',
  styleUrls:['./app.component.scss']
})
export class AppComponent {
  logout() {
    localStorage.clear();
    location.href = '/login'; // or route to login
  }
  

get role(): string {
    return localStorage.getItem('role') || '';
  }

}
