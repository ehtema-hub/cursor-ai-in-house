import { useState } from 'react'
import { ProductCard } from '@/components'
import { sampleProducts } from '@/data/sampleProducts'

export function ProductCardDemo() {
  const [cart, setCart] = useState<string[]>([])

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

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-gray-900">Shop Collection</h2>
          <p className="mt-3 text-lg text-gray-600">
            Responsive product grid showcasing sale badges, ratings, stock
            states, and hover interactions.
          </p>
          {cart.length > 0 && (
            <p className="mt-2 text-sm font-medium text-emerald-700">
              {cart.length} item{cart.length !== 1 ? 's' : ''} in cart
            </p>
          )}
        </div>

        {/* 2-col mobile → 3-col tablet → 4-col desktop */}
        <section aria-label="Product catalog">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {sampleProducts.map((product) => (
              <ProductCard
                key={product.id}
                {...product}
                onAddToCart={handleAddToCart}
                onProductClick={handleProductClick}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
