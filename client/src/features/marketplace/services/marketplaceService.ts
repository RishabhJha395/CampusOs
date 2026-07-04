import { supabase } from '../../../lib/supabaseClient';
import type { Listing, Category, CreateListingDTO } from '../types';

export const marketplaceService = {
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('marketplace_categories')
      .select('*')
      .is('deleted_at', null)
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async getListings(collegeId: string, categoryId?: string | null): Promise<Listing[]> {
    let query = supabase
      .from('marketplace_listings')
      .select(`
        *,
        seller:profiles(*),
        category:marketplace_categories(*)
      `)
      .eq('college_id', collegeId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as unknown as Listing[]; // Suppress Postgrest typing differences
  },

  async createListing(payload: CreateListingDTO): Promise<Listing> {
    const { data, error } = await supabase
      .from('marketplace_listings')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as Listing;
  },

  async markAsSold(listingId: string, sellerId: string): Promise<void> {
    const { error } = await supabase
      .from('marketplace_listings')
      .update({ status: 'sold' })
      .eq('id', listingId)
      .eq('seller_id', sellerId); // extra security check
    if (error) throw error;
  }
};
