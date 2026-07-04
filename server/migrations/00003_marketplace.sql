-- Marketplace Categories
CREATE TABLE public.marketplace_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    icon text, -- e.g. a lucide icon name or emoji
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz NULL
);

-- Initial Categories
INSERT INTO public.marketplace_categories (name, icon) VALUES 
('Books & Study Material', 'book'),
('Electronics', 'laptop'),
('Vehicles', 'bike'),
('Furniture', 'sofa'),
('Stationery', 'pen'),
('Other', 'package');

-- Marketplace Listings
CREATE TABLE public.marketplace_listings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id uuid NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
    seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.marketplace_categories(id) ON DELETE RESTRICT,
    title text NOT NULL,
    description text NOT NULL,
    price numeric(10, 2) NOT NULL,
    condition text CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
    images text[],
    status text CHECK (status IN ('active', 'sold', 'archived')) DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz NULL
);

CREATE TRIGGER set_marketplace_listings_updated_at
BEFORE UPDATE ON public.marketplace_listings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are readable by everyone" ON public.marketplace_categories
FOR SELECT USING (deleted_at IS NULL);

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Listings readable by same college" ON public.marketplace_listings
FOR SELECT USING (college_id = auth_college_id() AND deleted_at IS NULL);

CREATE POLICY "Users can create their own listings" ON public.marketplace_listings
FOR INSERT WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Users can update their own listings" ON public.marketplace_listings
FOR UPDATE USING (seller_id = auth.uid());
