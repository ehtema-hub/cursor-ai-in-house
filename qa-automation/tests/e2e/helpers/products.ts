/** Known sample data values used for product search assertions. */
export const TOTAL_PRODUCTS = 11
export const PRODUCTS_PER_PAGE = 8

export const ELECTRONICS_PRODUCTS = [
  'Aura Wireless Headphones',
  'Pulse Smart Watch Series 5',
  'Viper Gaming Mouse',
]

export const SEARCH_MATCH = {
  query: 'Wireless',
  expectedName: 'Aura Wireless Headphones',
} as const

export const NO_RESULTS_QUERY = 'zzzz-no-products-zzzz'

/** Parses currency text such as "$149.99" into a number. */
export function parsePriceText(text: string): number {
  const match = text.match(/[\d,.]+/)
  return match ? parseFloat(match[0].replace(',', '')) : 0
}
