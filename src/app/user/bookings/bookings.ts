import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface Booking {
  id: number;
  busName: string;
  busNumber: string;
  busType: string;
  origin: string;
  destination: string;
  departure: string;
  arrival: string;
  seats: string[];
  fare: number;
  status: string;
  bookingDate: string;
  route: string;
}

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bookings.html',
  styleUrls: ['./bookings.scss']
})
export class BookingsComponent implements OnInit {
  bookings: Booking[] = [];
  allBuses: any[] = []; // Flattened buses from API
  loading = false;
  error: string | null = null;

  selectedStatus = 'all';
  statusOptions = [
    { value: 'all', label: 'All Bookings' },
    { value: 'Booked', label: 'Active Bookings' },
    { value: 'Cancelled', label: 'Cancelled Bookings' }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    const userId = Number(localStorage.getItem('userId'));
    if (!userId) {
      this.error = 'User not logged in. Please log in to view your bookings.';
      return;
    }

    this.loading = true;
    this.error = null;

    this.http.get<any>(`http://localhost:5202/api/v1/Booking/user/${userId}`)
      .subscribe({
        next: (res) => {
          this.allBuses = this.extractAllBuses(res);
          this.bookings = this.extractAllBookings(res);
          this.loading = false;
        },
        error: (err) => {
          this.error = `Failed to load bookings: ${err.error?.message || err.message || 'Unknown error'}`;
          this.loading = false;
        }
      });
  }

  private extractAllBuses(response: any): any[] {
    const buses: any[] = [];
    const visited = new Set<number>();

    const findBuses = (obj: any): void => {
      if (!obj || typeof obj !== 'object') return;

      if (obj.id && obj.busName && !visited.has(obj.id)) {
        buses.push(obj);
        visited.add(obj.id);
      }

      if (Array.isArray(obj.$values)) {
        obj.$values.forEach((v: any) => {
          if (!v?.$ref) findBuses(v);
        });
      }

      Object.keys(obj).forEach(key => {
        const val = obj[key];
        if (typeof val === 'object') {
          findBuses(val);
        }
      });
    };

    findBuses(response);
    return buses;
  }

  private extractAllBookings(response: any): Booking[] {
    const allBookings: Booking[] = [];
    const visitedIds = new Set<number>();

    const findBookings = (obj: any): void => {
      if (!obj || typeof obj !== 'object') return;

      if (this.isBookingObject(obj) && !visitedIds.has(obj.id)) {
        const resolvedBus = this.allBuses.find(b => b.id === obj.busId);
        const transformed = this.transformBooking(obj, resolvedBus);
        if (transformed) {
          allBookings.push(transformed);
          visitedIds.add(obj.id);
        }
      }

      if (Array.isArray(obj.$values)) {
        obj.$values.forEach((item: any) => {
          if (!item?.$ref) findBookings(item);
        });
      }

      Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'object') {
          findBookings(obj[key]);
        }
      });
    };

    findBookings(response);
    return allBookings.sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());
  }

  private isBookingObject(obj: any): boolean {
    return obj && typeof obj.id === 'number' && typeof obj.userId === 'number' && typeof obj.busId === 'number' && obj.seatNumbers;
  }

  private transformBooking(bookingData: any, resolvedBus: any): Booking | null {
    return {
      id: bookingData.id,
      busName: resolvedBus?.busName || 'Unknown Bus',
      busNumber: resolvedBus?.busNumber || 'N/A',
      busType: resolvedBus?.busType || 'Standard',
      origin: resolvedBus?.route?.origin || 'Unknown',
      destination: resolvedBus?.route?.destination || 'Unknown',
      departure: resolvedBus?.route?.departureTime || '',
      arrival: resolvedBus?.route?.arrivalTime || '',
      seats: bookingData.seatNumbers ? bookingData.seatNumbers.split(',').map((s: string) => s.trim()) : [],
      fare: bookingData.totalAmount || 0,
      status: bookingData.status || 'Unknown',
      bookingDate: bookingData.bookingDate || '',
      route: `${resolvedBus?.route?.origin || 'Unknown'} → ${resolvedBus?.route?.destination || 'Unknown'}`
    };
  }

  get filteredBookings(): Booking[] {
    return this.selectedStatus === 'all' ? this.bookings : this.bookings.filter(b => b.status === this.selectedStatus);
  }

  get bookingStats() {
    const total = this.bookings.length;
    const active = this.bookings.filter(b => b.status === 'Booked').length;
    const cancelled = this.bookings.filter(b => b.status === 'Cancelled').length;
    const totalAmount = this.bookings.filter(b => b.status === 'Booked').reduce((sum, b) => sum + b.fare, 0);
    return { total, active, cancelled, totalAmount };
  }

  cancelBooking(bookingId: number): void {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking || booking.status === 'Cancelled') {
      alert('This booking is already cancelled.');
      return;
    }

    const reason = prompt('Enter a reason for cancellation (optional):') || 'User requested';
    if (reason === null) return;

    this.loading = true;
    this.http.put(`http://localhost:5202/api/v1/Booking/cancel/${bookingId}?reason=${encodeURIComponent(reason)}`, null)
      .subscribe({
        next: () => {
          alert('Booking cancelled successfully.');
          this.loadBookings();
        },
        error: (err) => {
          this.loading = false;
          alert(`Cancellation failed: ${err.error?.message || 'Unknown error'}`);
        }
      });
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  }

  formatTime(timeString: string): string {
    if (!timeString) return 'N/A';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return 'Invalid Time';
    }
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'booked': return 'status-booked';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-unknown';
    }
  }

  onStatusFilterChange(event: any): void {
    this.selectedStatus = event.target.value;
  }

  refreshBookings(): void {
    this.loadBookings();
  }

  trackByBookingId(index: number, booking: Booking): number {
    return booking.id;
  }
}
