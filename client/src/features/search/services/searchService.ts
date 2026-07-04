import { supabase } from '../../../lib/supabaseClient';
import type { SearchResult } from '../types';

export const searchService = {
  async globalSearch(query: string, collegeId: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];

    const formattedQuery = `%${query}%`;
    const results: SearchResult[] = [];

    // Search People (Profiles)
    const { data: people } = await supabase
      .from('profiles')
      .select('id, full_name, role, avatar_url')
      .eq('college_id', collegeId)
      .ilike('full_name', formattedQuery)
      .limit(5);

    if (people) {
      results.push(...people.map(p => ({
        id: p.id,
        category: 'people' as const,
        title: p.full_name,
        subtitle: p.role?.replace('_', ' '),
        imageUrl: p.avatar_url,
        url: `/messages?userId=${p.id}` // Easiest action is to message them
      })));
    }

    // Search Courses
    const { data: courses } = await supabase
      .from('courses')
      .select('id, name, course_code')
      .eq('college_id', collegeId)
      .is('deleted_at', null)
      .or(`name.ilike.${formattedQuery},course_code.ilike.${formattedQuery}`)
      .limit(5);

    if (courses) {
      results.push(...courses.map(c => ({
        id: c.id,
        category: 'courses' as const,
        title: c.name,
        subtitle: c.course_code,
        url: `/student/academics` // Directing them to academics page
      })));
    }

    // Search Marketplace Items
    const { data: items } = await supabase
      .from('marketplace_items')
      .select('id, title, price')
      .eq('college_id', collegeId)
      .eq('status', 'available')
      .ilike('title', formattedQuery)
      .limit(5);

    if (items) {
      results.push(...items.map(i => ({
        id: i.id,
        category: 'marketplace' as const,
        title: i.title,
        subtitle: `₹${i.price}`,
        url: `/marketplace` 
      })));
    }

    return results;
  }
};
