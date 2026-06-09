import { useState, useMemo, useCallback, useEffect } from 'react'
import { ProductCard } from '@/components'
import {
  sampleProducts,
  ALL_CATEGORIES,
  ALL_MATERIALS,
  SORT_OPTIONS,
} from '@/data/sampleProducts'
import { Search, RotateCcw } from 'lucide-react'

const ITEMS_PER_PAGE = 8

export function ProductCardDemo() {
  const [cart, setCart] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedMaterial, setSelectedMaterial] = useState('all')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500])
  const [sortOrder, setSortOrder] = useState('name-asc')
  const [currentPage, setCurrentPage] = useState(1)

  const handleAddToCart = (id: string) => {
    setCart((prev) => [...prev, id])
    const product = sampleProducts.find((item) => item.id === id)
    if (product) {
      alert(`Added "${product.name}" to cart`)
    }
  }

  const handleProductClick = (id: string) => {
    const product = sampleProducts.find((item) => item.id === id)
    if (product) {
      alert(`Opening product page for "${product.name}"…`)
    }
  }

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...sampleProducts]

    // Apply search filter
    if (searchQuery) {
      result = result.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter((product) => product.category === selectedCategory)
    }

    // Apply material filter
    if (selectedMaterial !== 'all') {
      result = result.filter((product) => product.material === selectedMaterial)
    }

    // Apply price range filter
    result = result.filter(
      (product) => product.price >= priceRange[0] && product.price <= priceRange[1],
    )

    // Apply sorting
    result.sort((a, b) => {
      switch (sortOrder) {
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'rating-desc':
          return (b.rating ?? 0) - (a.rating ?? 0)
        default:
          return 0
      }
    })

    return result
  }, [searchQuery, selectedCategory, selectedMaterial, priceRange, sortOrder])

  useEffect(() => {
    // Reset current page when filters or search change
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, selectedMaterial, priceRange, sortOrder])

  const totalPages = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE)
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredAndSortedProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredAndSortedProducts, currentPage])

  const handleClearFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedMaterial('all')
    setPriceRange([0, 500])
    setSortOrder('name-asc')
    setCurrentPage(1)
  }, [])

  return (
    <div data-testid="product-card-demo" className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Shop Collection</h2>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
            Browse our curated selection of products.
          </p>
          {cart.length > 0 && (
            <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {cart.length} item{cart.length !== 1 ? 's' : ''} in cart
            </p>
          )}
        </div>

        {/* Filters and Sorting */}
        <section aria-label="Product filters and sorting" className="mb-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search Input */}
            <div className="relative sm:col-span-2">
              <label htmlFor="product-search" className="sr-only">Search products</label>
              <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="product-search"
                type="search"
                data-testid="product-search-input"
                placeholder="Search by name…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pl-10 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label htmlFor="category-filter" className="sr-only">Filter by Category</label>
              <select
                id="category-filter"
                data-testid="category-filter"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                {ALL_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Material Filter */}
            <div>
              <label htmlFor="material-filter" className="sr-only">Filter by Material</label>
              <select
                id="material-filter"
                data-testid="material-filter"
                value={selectedMaterial}
                onChange={(e) => {
                  setSelectedMaterial(e.target.value)
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                {ALL_MATERIALS.map((mat) => (
                  <option key={mat.value} value={mat.value}>{mat.label}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label htmlFor="price-min" className="sr-only">Price Range</label>
              <div className="flex items-center gap-2">
                <input
                  id="price-min"
                  type="number"
                  data-testid="price-min-input"
                  placeholder="Min Price"
                  value={priceRange[0]}
                  onChange={(e) => {
                    setPriceRange([Number(e.target.value), priceRange[1]])
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                />
                <span className="text-gray-500 dark:text-gray-400">-</span>
                <input
                  id="price-max"
                  type="number"
                  data-testid="price-max-input"
                  placeholder="Max Price"
                  value={priceRange[1]}
                  onChange={(e) => {
                    setPriceRange([priceRange[0], Number(e.target.value)])
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label htmlFor="sort-by" className="sr-only">Sort by</label>
              <select
                id="sort-by"
                data-testid="sort-by-select"
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value)
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            <div className="sm:col-span-2 lg:col-span-1">
              <button
                type="button"
                data-testid="clear-filters-button"
                onClick={handleClearFilters}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:ring-offset-gray-900"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Clear Filters
              </button>
            </div>
          </div>
        </section>

        {/* Product Grid */}
        <section aria-label="Product catalog">
          {paginatedProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
              {paginatedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  {...product}
                  onAddToCart={handleAddToCart}
                  onProductClick={handleProductClick}
                />
              ))}
            </div>
          ) : (
            <div data-testid="no-results-message" className="py-12 text-center text-gray-500 dark:text-gray-400">
              <p className="text-lg font-medium">No products found</p>
              <p className="mt-2 text-sm">Try adjusting your filters or search query.</p>
            </div>
          )}
        </section>

        {/* Pagination */}
        {totalPages > 1 && (
          <nav aria-label="Pagination" className="mt-8 flex justify-center">
            <ul className="flex items-center -space-x-px" data-testid="pagination-controls">
              <li>
                <button
                  type="button"
                  data-testid="pagination-prev"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                  className="rounded-l-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
              </li>
              {Array.from({ length: totalPages }).map((_, index) => (
                <li key={index}>
                  <button
                    type="button"
                    data-testid={`pagination-page-${index + 1}`}
                    onClick={() => setCurrentPage(index + 1)}
                    aria-current={currentPage === index + 1 ? 'page' : undefined}
                    className={`border px-3 py-2 text-sm font-medium transition-colors ${currentPage === index + 1 ? 'border-indigo-500 bg-indigo-50 text-indigo-600 dark:border-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300' : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}
                  >
                    {index + 1}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  data-testid="pagination-next"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                  className="rounded-r-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        )}
      </main>
    </div>
  )
}
