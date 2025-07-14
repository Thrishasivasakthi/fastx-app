import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = 'http://localhost:5202/api/v1/user';

  constructor(private http: HttpClient) {}

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, credentials);
  }

  storeLoginInfo(response: { token: string; role: string; id: number }): void {
    if (response?.id) {
      localStorage.setItem('userId', response.id.toString());
    }
    if (response?.token) {
      localStorage.setItem('jwt', response.token);
    }
    if (response?.role) {
      localStorage.setItem('role', response.role);
    }
    
  }

  getToken(): string | null {
    return localStorage.getItem('jwt');
  }

  getUserId(): number | null {
    const id = localStorage.getItem('userId');
    return id ? parseInt(id, 10) : null;
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  logout(): void {
    localStorage.removeItem('jwt');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
  }
}
