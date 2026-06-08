import type { MouseEvent } from 'react'

export interface ProductCardProps {
  id: string
  name: string
  price: number
  imageUrl: string
  imageAlt: string
  description?: string
  originalPrice?: number
  rating?: number
  reviewCount?: number
  badge?: string
  inStock?: boolean
  currency?: string
  onAddToCart?: (id: string) => void
  onProductClick?: (id: string) => void
  className?: string
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

function StarRating({ rating, reviewCount }: { rating: number; reviewCount?: number }) {
  const clamped = Math.min(5, Math.max(0, rating))
  const fullStars = Math.floor(clamped)
  const hasHalfStar = clamped - fullStars >= 0.5

  return (
    <div
      className="flex items-center gap-1.5"
      aria-label={`Rated ${clamped} out of 5 stars${reviewCount ? `, ${reviewCount} reviews` : ''}`}
    >
      <div className="flex gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => {
          const filled = index < fullStars || (index === fullStars && hasHalfStar)
          return (
            <svg
              key={index}
              viewBox="0 0 20 20"
              className={`h-4 w-4 ${filled ? 'text-amber-400' : 'text-gray-200'}`}
              fill="currentColor"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          )
        })}
      </div>
      {reviewCount !== undefined && (
        <span className="text-sm text-gray-500">({reviewCount.toLocaleString()})</span>
      )}
    </div>
  )
}

interface ProductImageProps {
  imageUrl: string
  imageAlt: string
  name: string
  badge?: string
  inStock: boolean
  onProductClick?: (id: string) => void
  productId: string
}

function ProductImage({
  imageUrl,
  imageAlt,
  name,
  badge,
  inStock,
  onProductClick,
  productId,
}: ProductImageProps) {
  const content = (
    <>
      <img
        src={imageUrl}
        alt={imageAlt}
        loading="lazy"
        width={400}
        height={300}
        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />

      {badge && (
        <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
          {badge}
        </span>
      )}

      {!inStock && (
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center bg-gray-900/40 text-sm font-semibold uppercase tracking-wider text-white"
        >
          Out of Stock
        </span>
      )}
    </>
  )

  // Clickable image only when a handler is provided — avoids inert disabled buttons
  if (onProductClick) {
    return (
      <button
        type="button"
        onClick={() => onProductClick(productId)}
        aria-label={`View details for ${name}`}
        className="relative aspect-[4/3] w-full cursor-pointer overflow-hidden bg-white"
      >
        {content}
      </button>
    )
  }

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-white">
      {content}
    </div>
  )
}

interface ProductTitleProps {
  name: string
  onProductClick?: (id: string) => void
  productId: string
}

function ProductTitle({ name, onProductClick, productId }: ProductTitleProps) {
  if (!onProductClick) {
    return (
      <h3 className="line-clamp-2 text-base font-semibold leading-snug text-gray-900 sm:text-lg">
        {name}
      </h3>
    )
  }

  return (
    <h3 className="line-clamp-2 text-base font-semibold leading-snug text-gray-900 sm:text-lg">
      <button
        type="button"
        onClick={() => onProductClick(productId)}
        className="text-left transition-colors duration-200 hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
      >
        {name}
      </button>
    </h3>
  )
}

interface AddToCartButtonProps {
  name: string
  formattedPrice: string
  inStock: boolean
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
}

function AddToCartButton({
  name,
  formattedPrice,
  inStock,
  onClick,
}: AddToCartButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!inStock}
      aria-label={
        inStock ? `Add ${name} to cart for ${formattedPrice}` : `${name} is out of stock`
      }
      className="mt-auto w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 ease-out hover:scale-[1.02] hover:bg-emerald-500 hover:shadow-md focus-visible:scale-[1.02] focus-visible:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:focus-visible:scale-100 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none disabled:hover:scale-100"
    >
      {inStock ? 'Add to Cart' : 'Unavailable'}
    </button>
  )
}

export function ProductCard({
  id,
  name,
  price,
  imageUrl,
  imageAlt,
  description,
  originalPrice,
  rating,
  reviewCount,
  badge,
  inStock = true,
  currency = 'USD',
  onAddToCart,
  onProductClick,
  className = '',
}: ProductCardProps) {
  const formattedPrice = formatPrice(price, currency)
  const formattedOriginalPrice =
    originalPrice !== undefined ? formatPrice(originalPrice, currency) : undefined
  const isOnSale = originalPrice !== undefined && originalPrice > price

  const handleAddToCart = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (inStock) {
      onAddToCart?.(id)
    }
  }

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-neutral-50 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:border-gray-300 hover:shadow-xl motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:scale-100 ${className}`}
    >
      {/* Fixed 4:3 image box — equal heights across grid columns */}
      <ProductImage
        imageUrl={imageUrl}
        imageAlt={imageAlt}
        name={name}
        badge={badge}
        inStock={inStock}
        onProductClick={onProductClick}
        productId={id}
      />

      {/* flex-1 stretches content; mt-auto on CTA anchors buttons to card foot */}
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="space-y-2">
          <ProductTitle
            name={name}
            onProductClick={onProductClick}
            productId={id}
          />

          {description && (
            <p className="line-clamp-2 text-sm leading-relaxed text-gray-600">
              {description}
            </p>
          )}

          {rating !== undefined && (
            <StarRating rating={rating} reviewCount={reviewCount} />
          )}
        </div>

        {/* Price hierarchy: bold current price, muted strikethrough for sales */}
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            <span className="sr-only">Current price: </span>
            {formattedPrice}
          </p>
          {isOnSale && formattedOriginalPrice && (
            <p className="text-sm font-medium text-gray-400 line-through">
              <span className="sr-only">Original price: </span>
              {formattedOriginalPrice}
            </p>
          )}
        </div>

        <AddToCartButton
          name={name}
          formattedPrice={formattedPrice}
          inStock={inStock}
          onClick={handleAddToCart}
        />
      </div>
    </article>
  )
}
