import type { Page } from '@playwright/test'

export async function createTask(
  page: Page,
  {
    title,
    description = 'E2E test task description',
    dueDate = '2026-12-31',
    priority = 'high',
  }: {
    title: string
    description?: string
    dueDate?: string
    priority?: 'low' | 'medium' | 'high'
  },
) {
  await page.getByTestId('new-task-button').click()
  await page.getByTestId('create-task-modal').waitFor({ state: 'visible' })
  await page.getByTestId('task-title-input').fill(title)
  await page.getByTestId('task-description-input').fill(description)
  await page.getByTestId('task-priority-select').selectOption(priority)
  await page.getByTestId('task-due-date-input').fill(dueDate)
  await page.getByTestId('submit-create-task').click()
  await page.getByTestId('create-task-modal').waitFor({ state: 'hidden' })
  await page.getByRole('heading', { name: title }).waitFor({ state: 'visible' })
}

export async function getTaskCard(page: Page, title: string) {
  return page.locator('[data-testid^="task-card-"]', {
    has: page.getByRole('heading', { name: title }),
  })
}

export async function completeTask(page: Page, title: string) {
  const card = await getTaskCard(page, title)
  const testId = await card.getAttribute('data-testid')
  const taskId = testId?.replace('task-card-', '') ?? ''
  const statusButton = page.getByTestId(`status-task-${taskId}`)

  // Todo -> In Progress
  if (await statusButton.isVisible()) {
    const label = await statusButton.textContent()
    if (label === 'Start') {
      await statusButton.click()
    }
  }

  // In Progress -> Done
  const completeButton = page.getByTestId(`status-task-${taskId}`)
  if (await completeButton.isVisible()) {
    await completeButton.click()
  }

  await card.getByText('Done').waitFor({ state: 'visible' })
}

export async function deleteTask(page: Page, title: string) {
  const card = await getTaskCard(page, title)
  const testId = await card.getAttribute('data-testid')
  const taskId = testId?.replace('task-card-', '') ?? ''
  await page.getByTestId(`delete-task-${taskId}`).click()
  await page.getByRole('heading', { name: title }).waitFor({ state: 'hidden' })
}
