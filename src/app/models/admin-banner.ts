export interface SiteBanner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  sortOrder: number;
  active: boolean;
}
