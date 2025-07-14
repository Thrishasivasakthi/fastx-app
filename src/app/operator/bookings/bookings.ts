import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';

interface User {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

interface Bus {
  id: number;
  busName: string;
  busNumber: string;
  busType: string;
  totalSeats: number;
}

interface Booking {
  id: number;
  userId: number;
  busId: number;
  seatNumbers: string | string[];
  bookingDate: string;
  totalAmount: number;
  status: string;
  user?: User;
  bus?: Bus;
}

@Component({
  selector: 'app-operator-bookings',
  standalone: true,
  imports: [ReactiveFormsModule, RouterOutlet, CommonModule],
  templateUrl: './bookings.html',
  styleUrls: ['./bookings.scss']
})
export class OperatorBookingsComponent implements OnInit {
  bookings: Booking[] = [];
  operatorId: number = 0;
  token: string = '';
  loading: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadAuth();
    if (this.isValidAuth()) {
      console.log("Fetching bookings...");
      this.fetchBookings();
    } else {
      alert('Invalid token or operator ID. Please login again.');
    }
  }

  loadAuth(): void {
    this.token = localStorage.getItem('jwt') || '';
    const storedId = localStorage.getItem('userId');
    this.operatorId = storedId ? +storedId : 0;
  }

  isValidAuth(): boolean {
    return this.token.trim() !== '' && this.operatorId > 0;
  }

  fetchBookings(): void {
    this.loading = true;
    console.log('Fetching bookings for operator:', this.operatorId);
    
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.token}`);
    
    this.http.get<any>(`http://localhost:5202/api/v1/BusOperator/bookings/${this.operatorId}`, { headers })
      .subscribe({
        next: (response) => {
          console.log('Raw API response:', response);
          
          // Handle the nested $values structure and resolve references
          const bookingsData = response?.$values || [];
          console.log('Extracted bookings data:', bookingsData);
          
          // Create a reference map to resolve $ref objects
          const refMap = this.createReferenceMap(response);
          console.log('Reference map:', refMap);
          
          // Process and flatten the bookings with reference resolution
          this.bookings = this.processBookingsWithReferences(bookingsData, refMap);
          
          console.log('Final processed bookings:', this.bookings);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error fetching bookings:', err);
          this.loading = false;
          alert('Failed to fetch bookings. Please try again.');
        }
      });
  }

  private createReferenceMap(obj: any, refMap: Map<string, any> = new Map()): Map<string, any> {
    if (obj && typeof obj === 'object') {
      if (obj.$id) {
        refMap.set(obj.$id, obj);
      }
      
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          this.createReferenceMap(obj[key], refMap);
        }
      }
    }
    
    return refMap;
  }

  private resolveReference(obj: any, refMap: Map<string, any>): any {
    if (obj && obj.$ref) {
      return refMap.get(obj.$ref) || null;
    }
    return obj;
  }

  private processBookingsWithReferences(bookingsData: any[], refMap: Map<string, any>): Booking[] {
    const processedBookings: Booking[] = [];
    
    bookingsData.forEach((bookingRaw: any, index: number) => {
  const booking = this.resolveReference(bookingRaw, refMap); // 🟢 handle $ref bookings here

  if (!booking) return;

  const resolvedUser = this.resolveReference(booking.user, refMap);
  const resolvedBus = this.resolveReference(booking.bus, refMap);

  const processedBooking: Booking = {
    id: booking.id || 0,
    userId: booking.userId || 0,
    busId: booking.busId || 0,
    seatNumbers: booking.seatNumbers || 'N/A',
    bookingDate: booking.bookingDate || new Date().toISOString(),
    totalAmount: booking.totalAmount || 0,
    status: booking.status || 'Unknown',
    user: this.extractUserInfo(resolvedUser),
    bus: this.extractBusInfo(resolvedBus)
  };

  processedBookings.push(processedBooking);
});

    
    return processedBookings;
  }



  private extractUserInfo(userObj: any): User | undefined {
    console.log('Extracting user info from:', userObj);
    
    if (!userObj) return undefined;
    
    // Skip if it's still a reference that wasn't resolved
    if (userObj.$ref) {
      console.log('User still has $ref, returning undefined');
      return undefined;
    }
    
    const user = {
      id: userObj.id || 0,
      fullName: userObj.fullName || 'Unknown User',
      email: userObj.email || 'N/A',
      role: userObj.role || 'User'
    };
    
    console.log('Extracted user:', user);
    return user;
  }

  private extractBusInfo(busObj: any): Bus | undefined {
    console.log('Extracting bus info from:', busObj);
    
    if (!busObj) return undefined;
    
    // Skip if it's still a reference that wasn't resolved
    if (busObj.$ref) {
      console.log('Bus still has $ref, returning undefined');
      return undefined;
    }
    
    const bus = {
      id: busObj.id || 0,
      busName: busObj.busName || 'Unknown Bus',
      busNumber: busObj.busNumber || 'N/A',
      busType: busObj.busType || 'N/A',
      totalSeats: busObj.totalSeats || 0
    };
    
    console.log('Extracted bus:', bus);
    return bus;
  }

  refreshData(): void {
    if (this.isValidAuth()) {
      this.fetchBookings();
    }
  }

  // Helper methods for template
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '--';
    }
  }

  getSeatNumbersDisplay(booking: Booking): string {
    if (!booking.seatNumbers) return 'N/A';
    
    if (Array.isArray(booking.seatNumbers)) {
      return booking.seatNumbers.join(', ');
    }
    
    if (typeof booking.seatNumbers === 'string') {
      // Handle comma-separated string
      return booking.seatNumbers.split(',').map(s => s.trim()).join(', ');
    }
    
    return 'N/A';
  }

  getSeatCount(booking: Booking): number {
    if (!booking.seatNumbers) return 0;
    
    if (Array.isArray(booking.seatNumbers)) {
      return booking.seatNumbers.length;
    }
    
    if (typeof booking.seatNumbers === 'string') {
      return booking.seatNumbers.split(',').length;
    }
    
    return 0;
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'booked':
        return 'status-booked';
      case 'cancelled':
        return 'status-cancelled';
      case 'pending':
        return 'status-pending';
      default:
        return 'status-pending';
    }
  }

  trackByBookingId(index: number, booking: Booking): number {
    return booking.id;
  }
}