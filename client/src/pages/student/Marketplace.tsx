import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { useCategories, useListings, useCreateListing, useMarkListingSold } from '../../features/marketplace/hooks/useMarketplace';
import type { ListingCondition } from '../../features/marketplace/types';
import { ShoppingBag, Plus, Tag, IndianRupee, MapPin, Package, X, MessageSquare, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Marketplace() {
  const { profile } = useSelector((state: RootState) => state.auth);
  const collegeId = profile?.college_id || '';
  const navigate = useNavigate();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Queries
  const { data: categories } = useCategories();
  const { data: listings, isLoading } = useListings(collegeId, selectedCategory);
  
  // Mutations
  const createListing = useCreateListing(collegeId);
  const markAsSold = useMarkListingSold(collegeId);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState<ListingCondition>('good');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    await createListing.mutateAsync({
      title,
      description,
      price: parseFloat(price),
      condition,
      category_id: categoryId,
      college_id: collegeId,
      seller_id: profile.id,
      images: imageUrl.trim() ? [imageUrl.trim()] : []
    });
    
    // Reset form
    setTitle('');
    setDescription('');
    setPrice('');
    setCondition('good');
    setCategoryId('');
    setImageUrl('');
    setIsCreating(false);
  };

  const formatCondition = (c: string) => {
    return c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center">
            <ShoppingBag className="mr-3 text-primary-600 dark:text-primary-400" />
            Campus Marketplace
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Buy and sell items within your college</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center justify-center px-5 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors shadow-sm active:scale-[0.98]"
        >
          <Plus size={20} className="mr-2" />
          Sell an Item
        </button>
      </div>

      {/* Categories Filter */}
      <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            selectedCategory === null 
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' 
              : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          All Items
        </button>
        {categories?.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              selectedCategory === cat.id 
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' 
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Listings Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-800 h-80 rounded-3xl"></div>
          ))}
        </div>
      ) : listings?.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 border-dashed">
          <Package className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-700 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">No listings found</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">There are currently no active items for sale in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings?.map((listing) => (
            <div key={listing.id} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col hover:shadow-lg transition-shadow group">
              {/* Image */}
              <div className="h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-600 relative overflow-hidden">
                {listing.images && listing.images.length > 0 ? (
                  <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                  <Tag size={40} className="opacity-20" />
                )}
                <div className="absolute top-3 left-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur text-xs font-bold px-3 py-1.5 rounded-full text-gray-800 dark:text-gray-200 shadow-sm border border-white/20">
                  {listing.category?.name}
                </div>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {listing.title}
                  </h3>
                  <div className="text-lg font-black text-gray-900 dark:text-white flex items-center">
                    <IndianRupee size={16} className="mr-0.5" />
                    {listing.price}
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 flex-1">
                  {listing.description}
                </p>

                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-4 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl">
                  <span className="font-medium px-2 py-1 bg-white dark:bg-gray-700 rounded-lg shadow-sm mr-2 border border-gray-100 dark:border-gray-600">
                    {formatCondition(listing.condition)}
                  </span>
                  <span className="flex items-center">
                    <MapPin size={12} className="mr-1" /> Campus
                  </span>
                </div>
                
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-400 flex items-center justify-center font-bold text-xs mr-2">
                      {listing.seller?.full_name?.charAt(0) || 'U'}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[100px]">
                      {listing.seller?.full_name}
                    </span>
                  </div>

                  {listing.seller_id === profile?.id ? (
                    <button
                      onClick={() => markAsSold.mutate({ id: listing.id, sellerId: profile.id })}
                      disabled={markAsSold.isPending}
                      className="text-xs font-bold px-3 py-1.5 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors flex items-center"
                    >
                      <CheckCircle size={14} className="mr-1.5" /> Mark as Sold
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/chat?newUserId=${listing.seller_id}`)}
                      className="text-xs font-bold px-3 py-1.5 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-lg hover:opacity-90 transition-opacity flex items-center"
                    >
                      <MessageSquare size={14} className="mr-1.5" />
                      Contact Seller
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Listing Modal Overlay */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Listing</h2>
              <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-gray-50 dark:bg-gray-800 p-2 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
                <input
                  type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What are you selling?"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Image URL (Optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ImageIcon size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/image.jpg"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Price (₹)</label>
                  <input
                    type="number" required min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Condition</label>
                  <select
                    value={condition} onChange={(e) => setCondition(e.target.value as ListingCondition)}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                  >
                    <option value="new">Brand New</option>
                    <option value="like_new">Like New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
                <select
                  required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                >
                  <option value="" disabled>Select a category</option>
                  {categories?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                <textarea
                  required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your item, any flaws, why you are selling..."
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                />
              </div>
              
              <div className="pt-2">
                <button
                  type="submit" disabled={createListing.isPending}
                  className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-primary-500/20 disabled:opacity-50"
                >
                  {createListing.isPending ? 'Publishing...' : 'Post Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
