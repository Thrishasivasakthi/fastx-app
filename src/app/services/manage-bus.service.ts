import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Bus {
  id: number;
  busName: string;
  busNumber: string;
  busType: string;
  totalSeats: number;
  routeId: number;
  route?: {
    id: number;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    fare: number;
  };
  busOperatorId: number;
  seats?: any[];
  busAmenities?: any;
  bookings?: any;
}

export interface Route {
  id: number;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  fare: number;
}

export interface AddBusRequest {
  busName: string;
  busNumber: string;
  busType: string;
  totalSeats: number;
  routeId: number;
}

export interface EditBusRequest {
  id: number;
  busName: string;
  busNumber: string;
  busType: string;
  totalSeats: number;
  routeId: number;
}

@Injectable({
  providedIn: 'root'
})
export class ManageBusService {
  private apiUrl = 'http://localhost:5202/api/v1';
  
  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private getOperatorId(): number {
    const userId = localStorage.getItem('userId');
    return userId ? parseInt(userId) : 1; // Default to 1 if not found
  }

  // Get all buses for the operator
  getBuses(): Observable<{ $values: Bus[] }> {
    const operatorId = this.getOperatorId();
    const headers = this.getAuthHeaders();
    
    return this.http.get<{ $values: Bus[] }>(
      `${this.apiUrl}/BusOperator/buses/${operatorId}`,
      { headers }
    );
  }

  // Get all routes (you might need this for the dropdown)
  getRoutes(): Observable<Route[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Route[]>(`${this.apiUrl}/routes`, { headers });
  }

  // Add new bus
  addBus(busData: AddBusRequest): Observable<Bus> {
    const headers = this.getAuthHeaders();
    return this.http.post<Bus>(`${this.apiUrl}/BusOperator/add-bus`, busData, { headers });
  }

  // Edit bus
  editBus(busData: EditBusRequest): Observable<Bus> {
    const headers = this.getAuthHeaders();
    return this.http.put<Bus>(`${this.apiUrl}/BusOperator/edit-bus`, busData, { headers });
  }

  // Delete bus
  deleteBus(busId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/BusOperator/delete-bus/${busId}`, { headers });
  }
}