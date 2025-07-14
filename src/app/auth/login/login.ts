import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) return;

    const { email, password } = this.loginForm.value;

    this.auth.login({ email, password }).subscribe({
      next: (res: { token: string; role: string; id: number }) => {
        console.log("Login response:", res); 
        this.auth.storeLoginInfo(res);  // Store token, role, userId
        alert('Login successful!');

        // Route based on role
        switch (res.role) {
          case 'User':
            this.router.navigate(['/user/search']);
            break;
          case 'Admin':
            this.router.navigate(['/admin/dashboard']);
            break;
          case 'Operator':
            this.router.navigate(['/operator/dashboard']);
            break;
          default:
            alert('Unknown role!');
            break;
        }
      },
      error: (err) => {
        alert('Login failed: ' + (err.error?.message || 'Unknown error'));
      }
    });
  }
}
