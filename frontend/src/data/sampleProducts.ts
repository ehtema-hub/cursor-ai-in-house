import type { ProductCardProps } from '@/components'

type SampleProduct = Omit<
  ProductCardProps,
  'onAddToCart' | 'onProductClick' | 'className'
> & {
  category: string
  material?: string
}

export const sampleProducts: SampleProduct[] = [
  {
    id: 'wireless-headphones',
    name: 'Aura Wireless Headphones',
    description:
      'Premium noise-cancelling over-ear headphones with 30-hour battery life.',
    price: 149.99,
    originalPrice: 199.99,
    imageUrl: 'https://picsum.photos/seed/headphones/400/300',
    imageAlt: 'Matte black wireless over-ear headphones',
    rating: 4.5,
    reviewCount: 1284,
    badge: 'Sale',
    category: 'Electronics',
  },
  {
    id: 'smart-watch',
    name: 'Pulse Smart Watch Series 5',
    description:
      'Health tracking, GPS, and a vibrant always-on AMOLED display.',
    price: 299.0,
    imageUrl: 'https://picsum.photos/seed/smartwatch/400/300',
    imageAlt: 'Silver smart watch with black band',
    rating: 4.8,
    reviewCount: 3421,
    badge: 'New',
    category: 'Electronics',
  },
  {
    id: 'leather-tote',
    name: 'Artisan Leather Tote',
    description:
      'Hand-stitched full-grain leather tote with interior laptop sleeve.',
    price: 185.0,
    imageUrl: 'https://picsum.photos/seed/tote/400/300',
    imageAlt: 'Cognac brown leather tote bag',
    rating: 4.6,
    reviewCount: 512,
    category: 'Bags',
    material: 'Leather',
  },
  {
    id: 'ceramic-mug-set',
    name: 'Stoneware Mug Set (4-Pack)',
    description:
      'Microwave-safe glazed stoneware mugs in earthy neutral tones.',
    price: 33.0,
    originalPrice: 38.0,
    imageUrl: 'https://picsum.photos/seed/mugs/400/300',
    imageAlt: 'Set of four ceramic mugs in cream and terracotta',
    rating: 4.2,
    reviewCount: 89,
    badge: 'Sale',
    category: 'Home Goods',
    material: 'Ceramic',
  },
  {
    id: 'desk-lamp',
    name: 'Lumen Adjustable Desk Lamp',
    description:
      'Warm-dim LED desk lamp with touch controls and USB-C charging port.',
    price: 64.99,
    imageUrl: 'https://picsum.photos/seed/lamp/400/300',
    imageAlt: 'Minimal white adjustable desk lamp',
    rating: 4.4,
    reviewCount: 276,
    category: 'Home Goods',
  },
  {
    id: 'yoga-mat',
    name: 'Flow Pro Yoga Mat',
    description:
      'Extra-thick non-slip mat made from recycled materials. Includes carry strap.',
    price: 54.0,
    imageUrl: 'https://picsum.photos/seed/yogamat/400/300',
    imageAlt: 'Deep teal yoga mat rolled partially',
    rating: 4.7,
    reviewCount: 903,
    inStock: false,
    category: 'Fitness',
  },
  {
    id: 'espresso-machine',
    name: 'Brew Master Espresso Machine',
    description:
      'Semi-automatic espresso maker with built-in grinder and steam wand.',
    price: 449.0,
    originalPrice: 529.0,
    imageUrl: 'https://picsum.photos/seed/espresso/400/300',
    imageAlt: 'Stainless steel espresso machine on kitchen counter',
    rating: 4.9,
    reviewCount: 1876,
    badge: 'Sale',
    category: 'Kitchen',
  },
  {
    id: 'linen-sheets',
    name: 'Cloud Linen Sheet Set',
    description:
      'Breathable European flax linen sheets — queen size, stone white.',
    price: 210.0,
    imageUrl: 'https://picsum.photos/seed/linen/400/300',
    imageAlt: 'Folded white linen bed sheets',
    rating: 4.3,
    reviewCount: 445,
    category: 'Home Goods',
    material: 'Linen',
  },
  {
    id: 'gaming-mouse',
    name: 'Viper Gaming Mouse',
    description: 'Ultra-lightweight gaming mouse with customizable RGB lighting.',
    price: 79.99,
    imageUrl: 'https://picsum.photos/seed/gaming-mouse/400/300',
    imageAlt: 'Black gaming mouse with glowing lights',
    rating: 4.7,
    reviewCount: 2100,
    category: 'Electronics',
  },
  {
    id: 'cookware-set',
    name: 'Premium Non-stick Cookware Set',
    description: '7-piece non-stick cookware set for all stove types.',
    price: 249.99,
    imageUrl: 'https://picsum.photos/seed/cookware/400/300',
    imageAlt: 'Set of non-stick pots and pans',
    rating: 4.6,
    reviewCount: 850,
    category: 'Kitchen',
  },
  {
    id: 'backpack',
    name: 'Voyager Travel Backpack',
    description: 'Water-resistant travel backpack with laptop compartment.',
    price: 99.0,
    imageUrl: 'https://picsum.photos/seed/backpack/400/300',
    imageAlt: 'Stylish grey travel backpack',
    rating: 4.5,
    reviewCount: 620,
    category: 'Bags',
  },
]

export const ALL_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Bags', label: 'Bags' },
  { value: 'Home Goods', label: 'Home Goods' },
  { value: 'Fitness', label: 'Fitness' },
  { value: 'Kitchen', label: 'Kitchen' },
]

export const ALL_MATERIALS = [
  { value: 'all', label: 'All Materials' },
  { value: 'Leather', label: 'Leather' },
  { value: 'Ceramic', label: 'Ceramic' },
  { value: 'Linen', label: 'Linen' },
]

export const SORT_OPTIONS = [
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A-Z' },
  { value: 'name-desc', label: 'Name: Z-A' },
  { value: 'rating-desc', label: 'Rating: High to Low' },
]
