import type { Profile } from '../auth/types';

export interface Category {
  id: string;
  name: string;
  icon: string | null;
}

export type ListingCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';
export type ListingStatus = 'active' | 'sold' | 'archived';

export interface Listing {
  id: string;
  college_id: string;
  seller_id: string;
  category_id: string;
  title: string;
  description: string;
  price: number;
  condition: ListingCondition;
  images: string[] | null;
  status: ListingStatus;
  created_at: string;
  
  // Joined fields
  seller?: Profile;
  category?: Category;
}

export type CreateListingDTO = Pick<Listing, 'title' | 'description' | 'price' | 'condition' | 'category_id' | 'college_id' | 'seller_id' | 'images'>;
