import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';

interface Seat {
  id: number;
  busId: number;
  seatNumber: string;
  isBooked: boolean;
}

interface Route {
  id: number;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  fare: number;
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

interface Booking {
  id: number;
  userId: number;
  busId: number;
  seatNumbers: string[] | string;
  bookingDate: string;
  totalAmount: number;
  status: string;
  user?: {
    fullName: string;
    email: string;
  };
  bus?: {
    busName: string;
    busNumber: string;
  };
}

@Component({
  selector: 'app-operator-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './operator-dashboard.html',
  styleUrls: ['./operator-dashboard.scss']
})
export class OperatorDashboardComponent implements OnInit {
  buses: Bus[] = [];
  bookings: Booking[] = [];
  loading: boolean = false;
  operatorId: number = 0;
  token: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.initializeAuth();
    if (this.isValidAuth()) {
      this.loadDashboardData();
    } else {
      this.handleAuthError();
    }
  }

  private initializeAuth(): void {
    const storedToken = localStorage.getItem('jwt');
    this.token = storedToken || '';
    const storedUserId = localStorage.getItem('userId');
    this.operatorId = storedUserId ? Number(storedUserId) : 0;
  }

  private isValidAuth(): boolean {
    return !!(this.token && this.operatorId);
  }

  private handleAuthError(): void {
    localStorage.removeItem('jwt');
    localStorage.removeItem('userId');
    alert('Authentication failed. Please login again.');
    this.loading = false;
  }

  loadDashboardData(): void {
    if (!this.isValidAuth()) {
      this.handleAuthError();
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    });

    this.loading = true;

    this.http.get<any>(`http://localhost:5202/api/v1/BusOperator/buses/${this.operatorId}`, { headers })
      .subscribe({
        next: (res) => {
          this.buses = res?.$values || res || [];
        },
        error: (err) => {
          if (err.status === 401) this.handleAuthError();
        }
      });

    this.http.get<any>(`http://localhost:5202/api/v1/BusOperator/bookings/${this.operatorId}`, { headers })
      .subscribe({
        next: (response) => {
          const bookingsData = response?.$values || [];
          const refMap = this.createReferenceMap(response);
          this.bookings = this.processBookingsWithReferences(bookingsData, refMap);
        },
        error: (err) => {
          if (err.status === 401) this.handleAuthError();
        },
        complete: () => {
          this.loading = false;
        }
      });
  }

  private createReferenceMap(obj: any, refMap: Map<string, any> = new Map()): Map<string, any> {
    if (obj && typeof obj === 'object') {
      if (obj.$id) refMap.set(obj.$id, obj);
      for (const key in obj) if (obj.hasOwnProperty(key)) this.createReferenceMap(obj[key], refMap);
    }
    return refMap;
  }

  private resolveReference(obj: any, refMap: Map<string, any>): any {
    return obj?.$ref ? refMap.get(obj.$ref) || null : obj;
  }

  private processBookingsWithReferences(bookingsData: any[], refMap: Map<string, any>): Booking[] {
  return bookingsData
    .map(bookingRaw => {
      // Step 1: Resolve the main booking object (in case it's a $ref)
      const booking = this.resolveReference(bookingRaw, refMap);
      if (!booking) return null;

      // Step 2: Resolve nested user and bus objects (in case they are $ref too)
      const resolvedUser = this.resolveReference(booking.user, refMap);
      const resolvedBus = this.resolveReference(booking.bus, refMap);

      // Step 3: Return processed booking object
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

      return processedBooking;
    })
    // Step 4: Filter out any nulls (type guard ensures final array is Booking[])
    .filter((b): b is Booking => b !== null);
}


  private extractUserInfo(userObj: any): any {
    if (!userObj || userObj.$ref) return undefined;
    return {
      fullName: userObj.fullName || 'Unknown User',
      email: userObj.email || 'N/A'
    };
  }

  private extractBusInfo(busObj: any): any {
    if (!busObj || busObj.$ref) return undefined;
    return {
      busName: busObj.busName || 'Unknown Bus',
      busNumber: busObj.busNumber || 'N/A'
    };
  }

  getAvailableSeats(bus: Bus): number {
    return bus.seats?.$values?.filter(seat => !seat.isBooked).length || 0;
  }

  getBookedSeats(bus: Bus): number {
    return bus.seats?.$values?.filter(seat => seat.isBooked).length || 0;
  }

  getOccupancyPercentage(bus: Bus): number {
    const total = bus.totalSeats || 0;
    return total ? Math.round((this.getBookedSeats(bus) / total) * 100) : 0;
  }

  get avgOccupancy(): number {
    return this.buses.length ? this.buses.reduce((acc, bus) => acc + this.getOccupancyPercentage(bus), 0) / this.buses.length : 0;
  }

  formatTime(dateString: string | undefined): string {
    if (!dateString) return '--:--';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '--:--' : date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '--' : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getSeatNumbersDisplay(booking: Booking): string {
    if (!booking.seatNumbers) return '';
    if (Array.isArray(booking.seatNumbers)) return booking.seatNumbers.join(', ');
    try {
      const parsed = JSON.parse(booking.seatNumbers);
      return Array.isArray(parsed) ? parsed.join(', ') : booking.seatNumbers;
    } catch {
      return booking.seatNumbers;
    }
  }

  getSeatCount(booking: Booking): number {
    if (!booking.seatNumbers) return 0;
    if (Array.isArray(booking.seatNumbers)) return booking.seatNumbers.length;
    try {
      const parsed = JSON.parse(booking.seatNumbers);
      return Array.isArray(parsed) ? parsed.length : 1;
    } catch {
      return 1;
    }
  }

  getTotalRevenue(): number {
    return this.bookings.reduce((total, b) => total + (b.totalAmount || 0), 0);
  }

  getBookingStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'booked': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-gray-400';
    }
  }

  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'booked': return 'status-booked';
      case 'cancelled': return 'status-cancelled';
      case 'pending': return 'status-pending';
      default: return 'status-pending';
    }
  }
    getRecentBookings(): Booking[] {
    return this.bookings.slice(0, 5); // Show only recent 5 bookings
  }

  refreshData(): void {
    if (this.isValidAuth()) {
      this.loadDashboardData();
    } else {
      this.handleAuthError();
    }
  }

  trackByBusId(index: number, bus: Bus): number {
    return bus.id;
  }

  trackByBookingId(index: number, booking: Booking): number {
    return booking.id;
  }
}
