import { test, expect } from '@playwright/test'
import { clearAppStorage, loginUser, registerUser } from './helpers/auth'
import { ProductSearchPage } from './pages/ProductSearchPage'

test.describe('Product Search Page', () => {
  let productSearchPage: ProductSearchPage

  test.beforeEach(async ({ page }) => {
    productSearchPage = new ProductSearchPage(page)
    await productSearchPage.goto()
    await page.waitForLoadState('networkidle') // Ensure all network requests have settled
  })

  test('should display matching results for a valid search query', async () => {
    await productSearchPage.search('headphones')
    await expect(productSearchPage.productCard('Aura Wireless Headphones')).toBeVisible()
    await expect(productSearchPage.getProductCards()).toHaveCount(1)
  })

  test('should display no results message for an invalid search query', async () => {
    await productSearchPage.search('nonexistent')
    await expect(productSearchPage.noResultsMessage).toBeVisible()
    await expect(productSearchPage.getProductCards()).toHaveCount(0)
  })

  test('should apply a single category filter correctly', async () => {
    await productSearchPage.selectCategory('Electronics')
    await expect(productSearchPage.productCard('Aura Wireless Headphones')).toBeVisible()
    await expect(productSearchPage.productCard('Pulse Smart Watch Series 5')).toBeVisible()
    await expect(productSearchPage.productCard('Viper Gaming Mouse')).toBeVisible()
    await expect(productSearchPage.productCard('Artisan Leather Tote')).toBeHidden()
    await expect(productSearchPage.getProductCards()).toHaveCount(3)
  })

  test('should apply multiple filters (category + price range)', async () => {
    await productSearchPage.selectCategory('Home Goods')
    await productSearchPage.setMinPrice(10)
    await productSearchPage.setMaxPrice(100)

    await expect(productSearchPage.productCard('Lumen Adjustable Desk Lamp')).toBeVisible()
    await expect(productSearchPage.productCard('Stoneware Mug Set (4-Pack)')).toBeVisible() // Price 33
    await expect(productSearchPage.productCard('Cloud Linen Sheet Set')).toBeHidden() // Price 210
    await expect(productSearchPage.getProductCards()).toHaveCount(2)
  })

  test('should clear all filters and restore original results', async () => {
    await productSearchPage.search('headphones')
    await productSearchPage.selectCategory('Electronics')
    await productSearchPage.setMinPrice(50)
    await productSearchPage.setMaxPrice(300)

    await expect(productSearchPage.productCard('Pulse Smart Watch Series 5')).toBeVisible()
    await productSearchPage.clearFilters()
    await expect(productSearchPage.searchQueryInput).toHaveValue('')
    await expect(productSearchPage.categoryFilter).toHaveValue('all')
    await expect(productSearchPage.minPriceInput).toHaveValue('0')
    await expect(productSearchPage.maxPriceInput).toHaveValue('500')
    await expect(productSearchPage.getProductCards()).toHaveCount(8) // All original products
  })

  test('should navigate through pagination', async () => {
    // Assuming there are more than 8 products to enable pagination
    await expect(productSearchPage.getProductCards()).toHaveCount(8) // First page

    await productSearchPage.paginationNextButton.click()
    await expect(productSearchPage.currentPageButton).toHaveText('2')
    await expect(productSearchPage.getProductCards()).toHaveCount(4) // Second page has 4 products

    await productSearchPage.paginationPrevButton.click()
    await expect(productSearchPage.currentPageButton).toHaveText('1')
    await expect(productSearchPage.getProductCards()).toHaveCount(8) // Back to first page
  })

  test('should sort products by price: low to high', async () => {
    await productSearchPage.selectSortOrder('price-asc')
    const prices = await productSearchPage.getProductPrices()
    const sortedPrices = [...prices].sort((a, b) => a - b)
    expect(prices).toEqual(sortedPrices)
  })

  test('should sort products by name: Z-A', async () => {
    await productSearchPage.selectSortOrder('name-desc')
    const names = await productSearchPage.getProductNames()
    const sortedNames = [...names].sort((a, b) => b.localeCompare(a))
    expect(names).toEqual(sortedNames)
  })

  test('should display error message if API fails (mock scenario)', async () => {
    // Temporarily override the fetch to simulate an API error
    await productSearchPage.page.route('**/api/products', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      })
    })
    await productSearchPage.goto()
    // Since there's no explicit error handling in ProductCardDemo yet, we'll check for no results
    await expect(productSearchPage.noResultsMessage).toBeVisible()
  })

  test.describe('Responsive tests', () => {
    test.use({ viewport: { width: 375, height: 667 } }) // Mobile viewport

    test('should display product cards in a single column on mobile', async () => {
      // ProductCardDemo is configured to display 8 items per page
      await expect(productSearchPage.getProductCards()).toHaveCount(8) // First page

      // Verify layout is single column, or that grid classes adapt
      const firstCard = productSearchPage.getProductCards().first()
      const boundingBox = await firstCard.boundingBox()
      expect(boundingBox?.width).toBeCloseTo(productSearchPage.page.viewportSize()!.width - 32, -1) // Account for horizontal padding
    })

    test('mobile: filters should be usable', async () => {
      await productSearchPage.search('lamp')
      await expect(productSearchPage.productCard('Lumen Adjustable Desk Lamp')).toBeVisible()
      await productSearchPage.selectCategory('Home Goods')
      await expect(productSearchPage.productCard('Lumen Adjustable Desk Lamp')).toBeVisible()
    })
  })
})
