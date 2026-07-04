import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';
import { useGlobalSearch } from '../features/search/hooks/useSearch';
import { Search, User, BookOpen, ShoppingBag, X } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { profile } = useSelector((state: RootState) => state.auth);

  const { data: results, isLoading } = useGlobalSearch(query, profile?.college_id || null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle keyboard shortcuts (Cmd+K / Ctrl+K) inside AppShell usually, but we handle Escape here
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (url: string) => {
    navigate(url);
    onClose();
  };

  const getIcon = (category: string) => {
    switch(category) {
      case 'people': return <User size={18} className="text-blue-500" />;
      case 'courses': return <BookOpen size={18} className="text-purple-500" />;
      case 'marketplace': return <ShoppingBag size={18} className="text-green-500" />;
      default: return <Search size={18} className="text-gray-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 sm:pt-32 px-4 backdrop-blur-sm bg-gray-900/40">
      
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Search Input */}
        <div className="flex items-center px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <Search size={24} className="text-primary-500 mr-4" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students, faculty, courses, or marketplace..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-lg text-gray-900 dark:text-white placeholder-gray-400 p-0"
          />
          {isLoading && query.length >= 2 && (
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin ml-4"></div>
          )}
          <button onClick={onClose} className="ml-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-96 overflow-y-auto p-2">
          {query.length < 2 ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              <p>Type at least 2 characters to search across CampusOS</p>
            </div>
          ) : results?.length === 0 && !isLoading ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              <p>No results found for "{query}"</p>
            </div>
          ) : (
            <div className="space-y-1">
              {results?.map((result) => (
                <button
                  key={`${result.category}-${result.id}`}
                  onClick={() => handleSelect(result.url)}
                  className="w-full flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-4 shrink-0 overflow-hidden">
                    {result.imageUrl ? (
                      <img src={result.imageUrl} alt={result.title} className="w-full h-full object-cover" />
                    ) : (
                      getIcon(result.category)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {result.title}
                    </h4>
                    {result.subtitle && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">
                        {result.subtitle}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                    {result.category}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Search powered by CampusOS</span>
          <span className="flex items-center">
            <kbd className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-0.5 mx-1 font-sans">esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}
