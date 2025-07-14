import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMsg: string = '';
  successMsg: string = '';

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {
    this.registerForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      passwordHash: ['', Validators.required],
      role: ['User', Validators.required] // default to User
    });
  }

  onSubmit(): void {
    this.errorMsg = '';
    this.successMsg = '';
    if (this.registerForm.valid) {
      const formData = this.registerForm.value;

      this.http.post('http://localhost:5202/api/v1/User/register', formData)
        .subscribe({
          next: (res: any) => {
            this.successMsg = 'Registration successful! Redirecting to login...';
            setTimeout(() => this.router.navigate(['/login']), 1500);
          },
          error: (err) => {
            console.error('Registration error:', err);
            this.errorMsg = err.error?.message || 'Registration failed. Try again.';
          }
        });
    } else {
      this.errorMsg = 'Please fill all fields correctly.';
    }
  }
}
