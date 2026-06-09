import { type Page, expect, type Locator } from '@playwright/test'

export class ProductSearchPage {
  readonly page: Page
  readonly productCardDemoContainer: Locator
  readonly searchQueryInput: Locator
  readonly categoryFilter: Locator
  readonly materialFilter: Locator
  readonly minPriceInput: Locator
  readonly maxPriceInput: Locator
  readonly sortBySelect: Locator
  readonly clearFiltersButton: Locator
  readonly noResultsMessage: Locator
  readonly paginationPrevButton: Locator
  readonly paginationNextButton: Locator
  readonly currentPageButton: Locator

  constructor(page: Page) {
    this.page = page
    this.productCardDemoContainer = page.getByTestId('product-card-demo')
    this.searchQueryInput = this.productCardDemoContainer.getByTestId('product-search-input')
    this.categoryFilter = this.productCardDemoContainer.getByTestId('category-filter')
    this.materialFilter = this.productCardDemoContainer.getByTestId('material-filter')
    this.minPriceInput = this.productCardDemoContainer.getByTestId('price-min-input')
    this.maxPriceInput = this.productCardDemoContainer.getByTestId('price-max-input')
    this.sortBySelect = this.productCardDemoContainer.getByTestId('sort-by-select')
    this.clearFiltersButton = this.productCardDemoContainer.getByTestId('clear-filters-button')
    this.noResultsMessage = this.productCardDemoContainer.getByTestId('no-results-message')
    this.paginationPrevButton = this.productCardDemoContainer.getByTestId('pagination-prev')
    this.paginationNextButton = this.productCardDemoContainer.getByTestId('pagination-next')
    this.currentPageButton = this.productCardDemoContainer.locator('[data-testid^="pagination-page-"][aria-current="page"]')
  }

  async goto() {
    await this.page.goto('/#products')
    await this.productCardDemoContainer.waitFor({ state: 'visible' })
    // Use waitForFunction to check for at least one product card to be visible dynamically
    await this.page.waitForFunction(() => {
      return document.querySelector('[data-testid^="product-card-"]') !== null
    })
  }

  async search(query: string) {
    await this.searchQueryInput.fill(query)
    await this.page.waitForTimeout(500) // Allow UI to re-render
  }

  async selectCategory(category: string) {
    await this.categoryFilter.selectOption(category)
    await this.page.waitForTimeout(500) // Allow UI to re-render
  }

  async selectMaterial(material: string) {
    await this.materialFilter.selectOption(material)
    await this.page.waitForTimeout(500) // Allow UI to re-render
  }

  async setMinPrice(price: number) {
    await this.minPriceInput.fill(String(price))
    await this.page.waitForTimeout(500) // Allow UI to re-render
  }

  async setMaxPrice(price: number) {
    await this.maxPriceInput.fill(String(price))
    await this.page.waitForTimeout(500) // Allow UI to re-render
  }

  async selectSortOrder(order: string) {
    await this.sortBySelect.selectOption(order)
    await this.page.waitForTimeout(500) // Allow UI to re-render
  }

  async clearFilters() {
    await this.clearFiltersButton.click()
    await this.page.waitForTimeout(500) // Allow UI to re-render
  }

  getProductCards() {
    return this.productCardDemoContainer.locator('[data-testid^="product-card-"]')
  }

  productCard(name: string) {
    return this.productCardDemoContainer.locator('[data-testid^="product-card-"]', { hasText: name })
  }

  async getProductNames() {
    const names = await this.getProductCards().evaluateAll((cards) =>
      cards.map((card) => card.querySelector('h3')?.textContent?.trim() || ''),
    )
    return names.filter(Boolean) as string[]
  }

  async getProductPrices() {
    const prices = await this.getProductCards().evaluateAll((cards) =>
      cards.map((card) => {
        const priceText = card
          .querySelector('p.text-xl')
          ?.textContent?.replace('Current price: ', '')
          .replace('$', '')
        return priceText ? parseFloat(priceText) : 0
      }),
    )
    return prices
  }
}
