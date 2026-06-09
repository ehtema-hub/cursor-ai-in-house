import { test, expect } from '@playwright/test'
import { ProductSearchPage } from './pages/ProductSearchPage'
import {
  ELECTRONICS_PRODUCTS,
  NO_RESULTS_QUERY,
  PRODUCTS_PER_PAGE,
  SEARCH_MATCH,
  TOTAL_PRODUCTS,
} from './helpers/products'

const viewports = [
  { label: 'desktop', width: 1280, height: 720 },
  { label: 'mobile', width: 375, height: 667 },
] as const

for (const viewport of viewports) {
  test.describe(`Product Search — ${viewport.label}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    let productSearchPage: ProductSearchPage

    test.beforeEach(async ({ page }) => {
      page.on('dialog', (dialog) => dialog.dismiss())
      productSearchPage = new ProductSearchPage(page)
      await productSearchPage.goto()
    })

    test('search with a valid query returns matching results', async () => {
      await productSearchPage.search(SEARCH_MATCH.query)

      const names = await productSearchPage.getProductNames()
      expect(names).toContain(SEARCH_MATCH.expectedName)
      expect(await productSearchPage.getProductCount()).toBeGreaterThan(0)
    })

    test('search with no matches shows empty state', async () => {
      await productSearchPage.search(NO_RESULTS_QUERY)

      await expect(productSearchPage.noResultsMessage).toBeVisible()
      await expect(productSearchPage.noResultsMessage).toContainText('No products found')
      expect(await productSearchPage.getProductCount()).toBe(0)
    })

    test('category filter returns only matching products', async () => {
      await productSearchPage.selectCategory('Electronics')

      const names = await productSearchPage.getProductNames()
      expect(names).toHaveLength(ELECTRONICS_PRODUCTS.length)
      for (const expectedName of ELECTRONICS_PRODUCTS) {
        expect(names).toContain(expectedName)
      }
    })

    test('category and price range filters combine correctly', async () => {
      await productSearchPage.selectCategory('Electronics')
      await productSearchPage.setMinPrice(50)
      await productSearchPage.setMaxPrice(200)

      const names = await productSearchPage.getProductNames()
      const prices = await productSearchPage.getProductPrices()

      expect(names).toEqual(
        expect.arrayContaining(['Aura Wireless Headphones', 'Viper Gaming Mouse']),
      )
      expect(names).not.toContain('Pulse Smart Watch Series 5')
      expect(prices.every((price) => price >= 50 && price <= 200)).toBe(true)
      expect(await productSearchPage.getProductCount()).toBe(2)
    })

    test('clear filters restores the default product list', async () => {
      const initialCount = await productSearchPage.getProductCount()
      expect(initialCount).toBe(PRODUCTS_PER_PAGE)

      await productSearchPage.selectCategory('Kitchen')
      expect(await productSearchPage.getProductCount()).toBeLessThan(initialCount)

      await productSearchPage.clearFilters()

      await expect(productSearchPage.categoryFilter).toHaveValue('all')
      await expect(productSearchPage.minPriceInput).toHaveValue('0')
      await expect(productSearchPage.maxPriceInput).toHaveValue('500')
      expect(await productSearchPage.getProductCount()).toBe(PRODUCTS_PER_PAGE)
    })

    test('pagination navigates between result pages', async () => {
      expect(TOTAL_PRODUCTS).toBeGreaterThan(PRODUCTS_PER_PAGE)

      const firstPageNames = await productSearchPage.getProductNames()
      expect(firstPageNames).toHaveLength(PRODUCTS_PER_PAGE)
      await expect(productSearchPage.currentPageButton(1)).toHaveAttribute('aria-current', 'page')

      await productSearchPage.goToNextPage()

      const secondPageNames = await productSearchPage.getProductNames()
      expect(secondPageNames).toHaveLength(TOTAL_PRODUCTS - PRODUCTS_PER_PAGE)
      expect(secondPageNames).not.toEqual(firstPageNames)
      await expect(productSearchPage.currentPageButton(2)).toHaveAttribute('aria-current', 'page')

      await productSearchPage.goToPreviousPage()
      expect(await productSearchPage.getProductNames()).toEqual(firstPageNames)
    })

    test('sort options reorder visible results', async () => {
      await productSearchPage.selectSort('price-asc')
      await productSearchPage.expectSortedPrices('asc')

      await productSearchPage.selectSort('price-desc')
      await productSearchPage.expectSortedPrices('desc')
    })

    test('restrictive filters show empty results message', async () => {
      // Simulates a failed/narrow search outcome when no products match the criteria.
      await productSearchPage.setMinPrice(1000)

      await expect(productSearchPage.noResultsMessage).toBeVisible()
      await expect(productSearchPage.noResultsMessage).toContainText('No products found')
      expect(await productSearchPage.getProductCount()).toBe(0)
    })
  })
}
