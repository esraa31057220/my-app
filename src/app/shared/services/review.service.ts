import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IReview } from '../../models/ireview';

/** No Reviews paths in `swagger.json` — use mock data for UI. [NO ENDPOINT] */
@Injectable({ providedIn: 'root' })
export class ReviewService {
  private mockReviews: IReview[] = [
    {
      id: 1,
      productId: 1,
      userId: 1,
      userName: 'John Doe',
      rating: 5,
      comment: 'Excellent product! Very satisfied with the quality.',
      reviewDate: '2024-01-15',
    },
    {
      id: 2,
      productId: 1,
      userId: 2,
      userName: 'Jane Smith',
      rating: 4,
      comment: 'Good value for money. Would recommend.',
      reviewDate: '2024-01-10',
    },
    {
      id: 3,
      productId: 2,
      userId: 3,
      userName: 'Mike Johnson',
      rating: 5,
      comment: 'Amazing! Exceeded my expectations.',
      reviewDate: '2024-01-08',
    },
    {
      id: 4,
      productId: 2,
      userId: 4,
      userName: 'Sarah Wilson',
      rating: 3,
      comment: 'Decent product, but shipping took longer than expected.',
      reviewDate: '2024-01-05',
    },
  ];

  getReviewsByProductId(productId: number): Observable<IReview[]> {
    // [NO ENDPOINT] Return mock reviews for the product
    return of(this.mockReviews.filter((r) => r.productId === productId));
  }

  getReviewsByUserId(userId: unknown): Observable<IReview[]> {
    // [NO ENDPOINT] Return mock reviews for the user
    return of(this.mockReviews.filter((r) => r.userId === userId));
  }

  addReview(review: IReview): Observable<IReview> {
    // [NO ENDPOINT] Add to mock data
    const newReview: IReview = {
      ...review,
      id: Date.now(),
      reviewDate: new Date().toISOString().split('T')[0],
    };
    this.mockReviews.push(newReview);
    return of(newReview);
  }

  deleteReview(reviewId: unknown): Observable<void> {
    // [NO ENDPOINT] Remove from mock data
    this.mockReviews = this.mockReviews.filter((r) => r.id !== reviewId);
    return of(undefined);
  }
}
