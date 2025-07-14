import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
interface Route {
  id: number;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  fare: number;
}

interface Seat {
  id: number;
  busId: number;
  seatNumber: string;
  isBooked: boolean;
}

interface Bus {
  id: number;
  busName: string;
  busNumber: string;
  busType: string;
  totalSeats: number;
  routeId: number;
  route: Route;
  seats: {
    $values: Seat[];
  };
  busOperatorId: number;
}

@Component({
  selector: 'app-manage-buses',
  standalone:true,
  imports:[CommonModule,ReactiveFormsModule],
  templateUrl: './manage-bus.html',
  styleUrls: ['./manage-bus.scss']
})
export class ManageBusComponent implements OnInit {
  buses: Bus[] = [];
  token: string = '';
  operatorId: number = 0;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const storedToken = localStorage.getItem('jwt');
    const storedUserId = localStorage.getItem('userId');
    this.token = storedToken || '';
    this.operatorId = storedUserId ? Number(storedUserId) : 0;

    if (!this.token || !this.operatorId) {
      alert('Authentication failed. Please login again.');
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    });

    this.http.get<any>(`http://localhost:5202/api/v1/BusOperator/buses/${this.operatorId}`, { headers })
      .subscribe({
        next: (res) => {
          this.buses = res?.$values || [];
          console.log('✅ Fetched buses:', this.buses);
        },
        error: (err) => {
          console.error('❌ Error fetching buses:', err);
        }
      });
  }
  // Fixed formatTime method to handle undefined values
  formatTime(dateString: string | undefined): string {
    if (!dateString) return '--:--';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '--:--';
      
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '--:--';
    }
  }
  getBookedSeats(bus: Bus): number {
    return bus.seats?.$values?.filter(s => s.isBooked).length || 0;
  }
  // Add trackBy functions for better performance
  trackByBusId(index: number, bus: Bus): number {
    return bus.id;
  }
  getAvailableSeats(bus: Bus): number {
    return bus.totalSeats - this.getBookedSeats(bus);
  }

  getOccupancyPercentage(bus: Bus): number {
    if (!bus.seats?.$values?.length) return 0;
    return Math.round((this.getBookedSeats(bus) / bus.totalSeats) * 100);
  }
}
