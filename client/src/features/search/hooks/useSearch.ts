import { useQuery } from '@tanstack/react-query';
import { searchService } from '../services/searchService';
import { useState, useEffect } from 'react';

// Custom hook to debounce the search query input
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export function useGlobalSearch(query: string, collegeId: string | null) {
  const debouncedQuery = useDebounce(query, 300);

  return useQuery({
    queryKey: ['global_search', debouncedQuery, collegeId],
    queryFn: () => searchService.globalSearch(debouncedQuery, collegeId!),
    enabled: !!collegeId && debouncedQuery.length >= 2,
    staleTime: 1000 * 60, // Cache results for a minute
  });
}
