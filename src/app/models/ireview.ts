export interface IReview {
  id?: any;
  productId: number;
  userId: any;
  userName: string;
  rating: number;
  comment: string;
  reviewDate: Date | string;
}