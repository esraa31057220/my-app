import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IReview } from '../models/ireview';

/** No Reviews paths in `swagger.json` — keep UI without remote calls. */
@Injectable({ providedIn: 'root' })
export class ReviewService {
  getReviewsByProductId(_productId: number): Observable<IReview[]> {
    return of([]);
  }

  getReviewsByUserId(_userId: unknown): Observable<IReview[]> {
    return of([]);
  }

  addReview(_review: IReview): Observable<IReview> {
    return of(_review);
  }

  deleteReview(_reviewId: unknown): Observable<void> {
    return of(undefined);
  }
}
