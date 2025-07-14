import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';


@Component({
  selector: 'app-seat-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seat-selection.html',
  styleUrls: ['./seat-selection.scss']
})
export class SeatSelectionComponent implements OnInit {
  busId!: number;
  seats: any[] = [];
  seatMap: any[] = [];
  selectedSeats: string[] = [];
  seatPrice = 50;

 constructor(
  private route: ActivatedRoute,
  private http: HttpClient,
  private router: Router  // ✅ Add this line
) {}

  ngOnInit(): void {
    this.busId = +this.route.snapshot.paramMap.get('busId')!;
    this.loadSeats();
  }

  loadSeats() {
    this.http.get<any>(`http://localhost:5202/api/v1/Bus/seats/${this.busId}`)
      .subscribe((res) => {
        this.seats = res.$values ?? [];

        // ✅ Group seats by row: A1,A2 | B1,B2 then A3,A4 | B3,B4, etc.
        this.seatMap = [];
        
        // Assuming you have seats A1-A20 and B1-B20 (total 40 seats)
        // Group them as: (A1,A2,B1,B2), (A3,A4,B3,B4), etc.
        for (let i = 1; i <= 10; i++) {
          const rowNumber = (i - 1) * 2 + 1; // 1, 3, 5, 7, 9, 11, 13, 15, 17, 19
          
          const row = {
            A1: this.seats.find(s => s.seatNumber === `A${rowNumber}`),     // A1, A3, A5, A7, A9, A11, A13, A15, A17, A19
            A2: this.seats.find(s => s.seatNumber === `A${rowNumber + 1}`), // A2, A4, A6, A8, A10, A12, A14, A16, A18, A20
            B1: this.seats.find(s => s.seatNumber === `B${rowNumber}`),     // B1, B3, B5, B7, B9, B11, B13, B15, B17, B19
            B2: this.seats.find(s => s.seatNumber === `B${rowNumber + 1}`)  // B2, B4, B6, B8, B10, B12, B14, B16, B18, B20
          };
          
          // Only add row if at least one seat exists
          if (row.A1 || row.A2 || row.B1 || row.B2) {
            this.seatMap.push(row);
          }
        }
        
        console.log('Seat Map:', this.seatMap); // Debug: Check the structure
      });
  }

  toggleSeat(seat: any) {
    if (!seat || seat.isBooked) return;

    const index = this.selectedSeats.indexOf(seat.seatNumber);
    if (index > -1) {
      this.selectedSeats.splice(index, 1);
    } else {
      this.selectedSeats.push(seat.seatNumber);
    }
  }

  isSelected(seatNumber: string): boolean {
    return this.selectedSeats.includes(seatNumber);
  }

  get totalPrice(): number {
    return this.selectedSeats.length * this.seatPrice;
  }

  
proceedToPayment() {
  const userId = Number(localStorage.getItem('userId'));
  const token = localStorage.getItem('jwt');

  if (!userId || !this.busId || this.selectedSeats.length === 0) {
    alert("Missing required booking details.");
    return;
  }

  this.http.post(`http://localhost:5202/api/v1/Booking/book?userId=${userId}&busId=${this.busId}`, this.selectedSeats)
    .subscribe({
      next: (bookingRes: any) => {
        const bookingId = bookingRes.id; // ensure backend returns booking id
        const paymentBody = {
          bookingId: bookingId,
          paymentMode: 'card',
          paymentStatus: 'success',
          paymentDate: new Date().toISOString()
        };

        this.http.post(`http://localhost:5202/api/v1/Payment/process`, paymentBody, {
          headers: { Authorization: `Bearer ${token}` }
        }).subscribe({
          next: () => {
            alert("✅ Booking & Payment successful!");
            this.selectedSeats = [];
            this.loadSeats();
            this.router.navigate(['/user/bookings']);
          },
          error: (err) => {
            alert("Booking successful, but payment failed: " + err.error?.message || 'Unknown error');
          }
        });
      },
      error: (err) => {
        alert("Booking failed: " + err.error?.message || 'Unknown error');
      }
    });
}


}