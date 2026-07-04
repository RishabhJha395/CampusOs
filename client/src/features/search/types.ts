export type SearchCategory = 'people' | 'courses' | 'marketplace';

export interface SearchResult {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  url: string; // The internal route to navigate to when clicked
}
