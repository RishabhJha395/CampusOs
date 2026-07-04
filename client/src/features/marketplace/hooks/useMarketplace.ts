import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketplaceService } from '../services/marketplaceService';
import type { CreateListingDTO } from '../types';

const KEYS = {
  categories: ['marketplace_categories'] as const,
  listings: (collegeId: string, categoryId?: string | null) => ['marketplace_listings', collegeId, categoryId] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: KEYS.categories,
    queryFn: () => marketplaceService.getCategories(),
  });
}

export function useListings(collegeId: string, categoryId?: string | null) {
  return useQuery({
    queryKey: KEYS.listings(collegeId, categoryId),
    queryFn: () => marketplaceService.getListings(collegeId, categoryId),
    enabled: !!collegeId,
  });
}

export function useCreateListing(collegeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateListingDTO) => marketplaceService.createListing(data),
    onSuccess: () => {
      // Invalidate all listing queries for this college
      queryClient.invalidateQueries({ queryKey: ['marketplace_listings', collegeId] });
    },
  });
}

export function useMarkListingSold(collegeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sellerId }: { id: string; sellerId: string }) => 
      marketplaceService.markAsSold(id, sellerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace_listings', collegeId] });
    },
  });
}
