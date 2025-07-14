import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';





@Component({
  selector: 'app-profile',
  standalone: true,
  imports:[CommonModule,
    ReactiveFormsModule,
    FormsModule,MatFormFieldModule,
    MatInputModule,
    MatButtonModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  loading = false;
  message = '';
  isEditing = false;

  userDetails = {
    id: 0,
    fullName: '',
    email: '',
  };

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('jwt');

    if (!userId || !token) {
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get<any>(`http://localhost:5202/api/v1/User/profile/${userId}`, { headers }).subscribe({
      next: (data) => {
        this.userDetails = {
          id: data.id,
          fullName: data.fullName,
          email: data.email
        };

        this.profileForm = this.fb.group({
          id: [data.id],
          fullName: [data.fullName, Validators.required],
          email: [data.email, [Validators.required, Validators.email]],
          passwordHash: ['', Validators.required],
          role: [data.role || 'User']
        });
      },
      error: (err) => {
        this.message = 'Failed to load profile: ' + (err.error?.message || err.message);
      }
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    this.message = '';
  }

  updateProfile(): void {
    if (this.profileForm.invalid) return;

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.loading = true;
    this.http.put('http://localhost:5202/api/v1/User/profile', this.profileForm.value, { headers })
      .subscribe({
        next: () => {
          this.message = '✅ Profile updated successfully!';
          this.isEditing = false;
          this.userDetails.fullName = this.profileForm.value.fullName;
          this.userDetails.email = this.profileForm.value.email;
          this.loading = false;
        },
        error: (err) => {
          this.message = 'Update failed: ' + (err.error?.message || err.message);
          this.loading = false;
        }
      });
  }
}
