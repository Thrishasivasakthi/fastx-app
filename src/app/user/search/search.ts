import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-search',
  standalone: true,
  templateUrl: './search.html',
  styleUrls: ['./search.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatListModule,
  ],
})
export class SearchComponent {
  searchForm: FormGroup;
  buses: any[] = [];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.searchForm = this.fb.group({
      origin: ['', Validators.required],
      destination: ['', Validators.required],
      travelDate: ['', Validators.required],
    });
  }

  onSearch() {
    if (this.searchForm.invalid) return;

    const { origin, destination, travelDate } = this.searchForm.value;

    // ✅ Format date to match backend expectation (YYYY-MM-DD)
    const formattedDate = new Date(travelDate).toISOString().split('T')[0];

    this.http
      .get<any>(
        `http://localhost:5202/api/v1/route/search?origin=${origin}&destination=${destination}&date=${formattedDate}`
      )
      .subscribe((res) => {
        console.log('Raw route response:', res);

        this.buses = []; // clear previous

        // ✅ Loop through route → buses nested structure
        for (const route of res.$values ?? []) {
          for (const bus of route.buses?.$values ?? []) {
            this.buses.push({
              id: bus.id,
              busName: bus.busName,
              busType: bus.busType,
              totalSeats: bus.totalSeats,
              origin: route.origin,
              destination: route.destination,
              departureTime: route.departureTime,
              arrivalTime: route.arrivalTime,
              fare: route.fare,
            });
          }
        }

        console.log('Extracted buses:', this.buses);
      });
  }

  viewSeats(busId: number) {
    this.router.navigate([`/user/seats/${busId}`]);
  }
}
