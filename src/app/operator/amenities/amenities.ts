import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

interface Amenity {
  id: number;
  name: string;
  busAmenities?: any;
}

interface Bus {
  id: number;
  busName: string;
  amenities: number[]; // Store amenity IDs instead of names
}

@Component({
  selector: 'app-operator-bus-amenities',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './amenities.html',
  styleUrls: ['./amenities.scss'],
  standalone: true,
})
export class OperatorBusAmenitiesComponent implements OnInit {
  operatorId: number = 0;
  token: string = '';
  buses: Bus[] = [];
  allAmenities: Amenity[] = []; // Store full amenity objects

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.token = localStorage.getItem('jwt') || '';
    this.operatorId = +(localStorage.getItem('userId') || 0);

    if (this.token && this.operatorId) {
      this.fetchAllAmenities();
      this.fetchBuses();
    }
  }

  get authHeaders() {
    return new HttpHeaders().set('Authorization', `Bearer ${this.token}`);
  }

  fetchAllAmenities() {
    this.http.get<any>('http://localhost:5202/api/v1/amenity/all', { headers: this.authHeaders })
      .subscribe((res) => {
        // Handle the $values wrapper from the API
        this.allAmenities = res?.$values || [];
      });
  }

  fetchBuses() {
    this.http.get<any>(`http://localhost:5202/api/v1/BusOperator/buses/${this.operatorId}`, { headers: this.authHeaders })
      .subscribe((res) => {
        const rawBuses = res?.$values || [];

        this.buses = rawBuses
          .filter((bus: any) => bus?.id) // Ensure valid ID
          .map((bus: any) => ({
            id: bus.id,
            busName: bus.busName,
            amenities: []
          }));

        this.buses.forEach((bus) => {
          if (bus.id) {
            this.http.get<any>(`http://localhost:5202/api/v1/amenity/bus/${bus.id}`, { headers: this.authHeaders })
              .subscribe((res) => {
                // Extract amenity IDs from the response
                const amenityObjects = res?.$values || [];
                bus.amenities = amenityObjects.map((amenity: Amenity) => amenity.id);
              }, err => {
                console.warn(`Amenity fetch failed for bus ID ${bus.id}`, err);
              });
          }
        });
      });
  }

  toggleAmenity(bus: Bus, amenityId: number) {
    if (bus.amenities.includes(amenityId)) {
      bus.amenities = bus.amenities.filter(id => id !== amenityId);
    } else {
      bus.amenities.push(amenityId);
    }
  }

  saveAmenities(bus: Bus) {
    this.http.post(`http://localhost:5202/api/v1/amenity/assign?busId=${bus.id}`, bus.amenities, {
      headers: this.authHeaders
    }).subscribe(() => {
      alert(`Amenities updated for bus: ${bus.busName}`);
    }, err => {
      alert(`Failed to update amenities for bus: ${bus.busName}`);
    });
  }

  isAmenitySelected(bus: Bus, amenityId: number): boolean {
    return bus.amenities.includes(amenityId);
  }

  // Helper method to get amenity name by ID
  getAmenityName(amenityId: number): string {
    const amenity = this.allAmenities.find(a => a.id === amenityId);
    return amenity ? amenity.name : '';
  }
}