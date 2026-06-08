import type { ProductCardProps } from '@/components'

type SampleProduct = Omit<
  ProductCardProps,
  'onAddToCart' | 'onProductClick' | 'className'
>

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
  },
  {
    id: 'ceramic-mug-set',
    name: 'Stoneware Mug Set (4-Pack)',
    description:
      'Microwave-safe glazed stoneware mugs in earthy neutral tones.',
    price: 38.0,
    originalPrice: 48.0,
    imageUrl: 'https://picsum.photos/seed/mugs/400/300',
    imageAlt: 'Set of four ceramic mugs in cream and terracotta',
    rating: 4.2,
    reviewCount: 89,
    badge: 'Sale',
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
  },
]
