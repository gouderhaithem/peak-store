export interface Product {
  id: string;
  name: string;
  category: string;
  gender: "men" | "women" | "kids" | "unisex";
  type: "running" | "basketball" | "casual" | "training" | "apparel";
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  // Optional full gallery (primary first, then secondary images). Populated
  // by detail-fetches like productsRepo.findById; list endpoints omit this
  // for payload size and only fill `image`.
  images?: string[];
  isNew?: boolean;
  // Detail-only fields. List endpoints omit them; findById populates them.
  // These let the edit form round-trip the saved values instead of falling
  // back to hardcoded defaults.
  description?: string;
  isActive?: boolean;
  stock?: number;
}

export interface LifestyleSection {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  bgClass: string;
  reverse: boolean;
  imagePlaceholder: string;
  products: CompactProduct[];
}

export interface CompactProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
}

export const featuredProducts: Product[] = [
  {
    id: "feat-1",
    name: "Peak Lightning VII",
    category: "Running",
    gender: "men",
    type: "running",
    price: 12500,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    isNew: true,
  },
  {
    id: "feat-2",
    name: "Peak Tony Parker IX",
    category: "Basketball",
    gender: "men",
    type: "basketball",
    price: 15800,
    image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80",
    isNew: true,
  },
  {
    id: "feat-3",
    name: "Peak Classic Low",
    category: "Lifestyle",
    gender: "unisex",
    type: "casual",
    price: 9800,
    image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80",
  },
  {
    id: "feat-4",
    name: "Peak Performance Trainer",
    category: "Training",
    gender: "men",
    type: "training",
    price: 11200,
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80",
  },
];

export const lifestyleSections: LifestyleSection[] = [
  {
    id: "apparel",
    title: "Peak Apparel — Comfort Meets Style",
    description: "Premium sportswear collection for every athlete",
    ctaLabel: "Explore Collection",
    bgClass: "bg-gradient-to-br from-[#FDE2E4] to-[#FFC2D1]",
    reverse: false,
    imagePlaceholder: "Peak Apparel Lifestyle",
    products: [
      { id: "a1", name: "Peak Hoodie", price: 6500, image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80" },
      { id: "a2", name: "Peak T-Shirt", price: 3200, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80" },
      { id: "a3", name: "Peak Jersey", price: 4800, image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80" },
      { id: "a4", name: "Peak Jacket", price: 8900, image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80" },
    ],
  },
  {
    id: "performance",
    title: "Performance Innovation",
    description: "Engineered for athletes who demand excellence",
    ctaLabel: "Discover More",
    bgClass: "bg-[#F5F5F5]",
    reverse: true,
    imagePlaceholder: "Performance Action Shot",
    products: [
      { id: "p1", name: "Peak Pro Runner", price: 13500, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80" },
      { id: "p2", name: "Peak Court Master", price: 14800, image: "https://images.unsplash.com/photo-1597248881519-db089d3744a5?w=800&q=80" },
      { id: "p3", name: "Peak Trainer", price: 11200, image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80" },
      { id: "p4", name: "Peak Speed", price: 12900, image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80" },
    ],
  },
  {
    id: "kids",
    title: "Peak Kids Collection",
    description: "Quality footwear and apparel for young champions",
    ctaLabel: "Shop Kids",
    bgClass: "bg-gradient-to-br from-[#A7D4F5] to-[#7EC8E3]",
    reverse: false,
    imagePlaceholder: "Kids Collection",
    products: [
      { id: "k1", name: "Kids Runner", price: 7500, image: "https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800&q=80" },
      { id: "k2", name: "Kids Hoodie", price: 4200, image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&q=80" },
      { id: "k3", name: "Kids Shorts", price: 2800, image: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&q=80" },
      { id: "k4", name: "Kids Cap", price: 1500, image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=80" },
    ],
  },
  {
    id: "promotion",
    title: "Limited Time Offers",
    description: "Up to 30% off on selected items — while stocks last",
    ctaLabel: "Shop Sale Now",
    bgClass: "bg-gradient-to-br from-[#C8E6C9] to-[#A5D6A7]",
    reverse: true,
    imagePlaceholder: "Sale Products Showcase",
    products: [
      { id: "s1", name: "Peak Classic", price: 8400, originalPrice: 12000, image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80" },
      { id: "s2", name: "Peak Sport", price: 7350, originalPrice: 10500, image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80" },
      { id: "s3", name: "Peak Casual", price: 6860, originalPrice: 9800, image: "https://images.unsplash.com/photo-1543508282-6319a3e2621f?w=800&q=80" },
      { id: "s4", name: "Peak Urban", price: 7840, originalPrice: 11200, image: "https://images.unsplash.com/photo-1512374382149-233c42b6a83b?w=800&q=80" },
    ],
  },
];

export const shopProducts: Product[] = [
  {
    id: "shop-1",
    name: "Peak Lightning VII",
    category: "Running",
    gender: "men",
    type: "running",
    price: 12500,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
  },
  {
    id: "shop-2",
    name: "Peak Tony Parker IX",
    category: "Basketball",
    gender: "men",
    type: "basketball",
    price: 13500,
    originalPrice: 18000,
    discount: 25,
    image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80",
  },
  {
    id: "shop-3",
    name: "Peak Classic Low",
    category: "Casual",
    gender: "unisex",
    type: "casual",
    price: 9800,
    image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80",
  },
  {
    id: "shop-4",
    name: "Peak Performance Trainer",
    category: "Training",
    gender: "men",
    type: "training",
    price: 11200,
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80",
  },
  {
    id: "shop-5",
    name: "Peak Hoodie Pro",
    category: "Apparel",
    gender: "men",
    type: "apparel",
    price: 5950,
    originalPrice: 8500,
    discount: 30,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80",
  },
  {
    id: "shop-6",
    name: "Peak Kids Runner",
    category: "Kids",
    gender: "kids",
    type: "running",
    price: 7500,
    image: "https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800&q=80",
  },
  {
    id: "shop-7",
    name: "Peak Court Master",
    category: "Basketball",
    gender: "men",
    type: "basketball",
    price: 14800,
    image: "https://images.unsplash.com/photo-1597248881519-db089d3744a5?w=800&q=80",
  },
  {
    id: "shop-8",
    name: "Peak T-Shirt Essential",
    category: "Apparel",
    gender: "unisex",
    type: "apparel",
    price: 3200,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
  },
  {
    id: "shop-9",
    name: "Peak Speed Runner",
    category: "Running",
    gender: "men",
    type: "running",
    price: 10800,
    originalPrice: 13500,
    discount: 20,
    image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80",
  },
  {
    id: "shop-10",
    name: "Peak Women Hoodie",
    category: "Apparel",
    gender: "women",
    type: "apparel",
    price: 6200,
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80",
  },
  {
    id: "shop-11",
    name: "Peak Women Runner",
    category: "Running",
    gender: "women",
    type: "running",
    price: 11800,
    image: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&q=80",
  },
  {
    id: "shop-12",
    name: "Peak Kids Hoodie",
    category: "Kids",
    gender: "kids",
    type: "apparel",
    price: 4200,
    image: "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&q=80",
  },
];

export function formatPrice(price: number): string {
  return price.toLocaleString("fr-DZ") + " DZD";
}
