import { type Page, expect, type Locator } from '@playwright/test'
import { parsePriceText } from '../helpers/products'

export class ProductSearchPage {
  readonly page: Page
  readonly container: Locator
  readonly catalogSection: Locator
  readonly searchInput: Locator
  readonly categoryFilter: Locator
  readonly materialFilter: Locator
  readonly minPriceInput: Locator
  readonly maxPriceInput: Locator
  readonly sortSelect: Locator
  readonly clearFiltersButton: Locator
  readonly noResultsMessage: Locator
  readonly paginationControls: Locator
  readonly paginationPrev: Locator
  readonly paginationNext: Locator
  readonly productCards: Locator

  constructor(page: Page) {
    this.page = page
    this.container = page.getByTestId('product-card-demo')
    this.catalogSection = this.container.locator('section[aria-label="Product catalog"]')
    this.searchInput = this.container.getByTestId('product-search-input')
    this.categoryFilter = this.container.getByTestId('category-filter')
    this.materialFilter = this.container.getByTestId('material-filter')
    this.minPriceInput = this.container.getByTestId('price-min-input')
    this.maxPriceInput = this.container.getByTestId('price-max-input')
    this.sortSelect = this.container.getByTestId('sort-by-select')
    this.clearFiltersButton = this.container.getByTestId('clear-filters-button')
    this.noResultsMessage = this.container.getByTestId('no-results-message')
    this.paginationControls = this.container.getByTestId('pagination-controls')
    this.paginationPrev = this.container.getByTestId('pagination-prev')
    this.paginationNext = this.container.getByTestId('pagination-next')
    this.productCards = this.catalogSection.locator('article')
  }

  async goto() {
    await this.page.goto('/#products')
    await expect(this.container).toBeVisible()
    await this.waitForResults()
  }

  /** Waits until either product cards or the empty-state message is shown. */
  async waitForResults() {
    await expect(this.productCards.first().or(this.noResultsMessage)).toBeVisible()
  }

  async search(query: string) {
    await this.searchInput.fill(query)
    await this.waitForResults()
  }

  async selectCategory(category: string) {
    await this.categoryFilter.selectOption(category)
    await this.waitForResults()
  }

  async selectMaterial(material: string) {
    await this.materialFilter.selectOption(material)
    await this.waitForResults()
  }

  async setMinPrice(price: number) {
    await this.minPriceInput.fill(String(price))
    await this.waitForResults()
  }

  async setMaxPrice(price: number) {
    await this.maxPriceInput.fill(String(price))
    await this.waitForResults()
  }

  async selectSort(order: string) {
    await this.sortSelect.selectOption(order)
    await this.waitForResults()
  }

  async clearFilters() {
    await this.clearFiltersButton.click()
    await this.waitForResults()
  }

  async goToNextPage() {
    await this.paginationNext.click()
    await this.waitForResults()
  }

  async goToPreviousPage() {
    await this.paginationPrev.click()
    await this.waitForResults()
  }

  currentPageButton(pageNumber: number) {
    return this.container.getByTestId(`pagination-page-${pageNumber}`)
  }

  async getProductNames() {
    const names = await this.productCards.locator('h3').allTextContents()
    return names.map((name) => name.trim()).filter(Boolean)
  }

  async getProductPrices() {
    const priceTexts = await this.productCards.locator('p.text-xl').allTextContents()
    return priceTexts.map(parsePriceText)
  }

  async getProductCount() {
    return this.productCards.count()
  }

  async expectSortedPrices(order: 'asc' | 'desc') {
    const prices = await this.getProductPrices()
    const sorted = [...prices].sort((a, b) => (order === 'asc' ? a - b : b - a))
    expect(prices).toEqual(sorted)
  }
}
