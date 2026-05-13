import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SellerStatsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/Seller`;

  salesStatus(): Observable<unknown> {
    return this.http.get<unknown>(`${this.base}/Sales_Status`).pipe(catchError(() => of(null)));
  }

  lowStockAlert(): Observable<unknown> {
    return this.http.get<unknown>(`${this.base}/LowStockAlert`).pipe(catchError(() => of(null)));
  }

  sellerMyOrders(): Observable<unknown> {
    return this.http.get<unknown>(`${this.base}/MyOrders`).pipe(catchError(() => of(null)));
  }

  topSelling(): Observable<unknown> {
    return this.http.get<unknown>(`${this.base}/TopSellingProducts`).pipe(catchError(() => of(null)));
  }

  allStates(): Observable<unknown> {
    return this.http
      .get<unknown>(`${environment.apiUrl}/Admin/AllStates`)
      .pipe(catchError(() => of(null)));
  }
}
