import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/AuthServices/auth-service';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.css',
  imports: [CommonModule, ReactiveFormsModule, RouterLink]
})
export class LoginComponent implements OnInit {

  errorMsg = '';
  showPass = false;
  loginForm!: FormGroup;

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef // 👈 inject this
  ) {}

  ngOnInit() {
    this.loginForm = new FormGroup({
      email: new FormControl('', [
        Validators.required,
        Validators.email,
      ]),
      password: new FormControl('', [
        Validators.required,
      ]),
    });
  }

  get f() { return this.loginForm.controls; }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.errorMsg = '';

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password, (errMsg) => {
      this.errorMsg = errMsg;
      this.cdr.detectChanges(); // 👈 force Angular to update the view NOW
    });
  }
}