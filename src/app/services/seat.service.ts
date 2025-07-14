import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Seat } from '../interfaces/seat.interface';

@Injectable({ providedIn: 'root' })
export class SeatService {
  private baseUrl = 'http://localhost:5202/api/v1/Bus';

  constructor(private http: HttpClient) {}

  getSeatsForBus(busId: number): Observable<Seat[]> {
    return this.http.get<Seat[]>(`${this.baseUrl}/seats/${busId}`);
  }
}
